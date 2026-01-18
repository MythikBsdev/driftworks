"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSession } from "@/lib/auth/session";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { commissionUsesProfit } from "@/config/brand-overrides";

const cartItemSchema = z.object({
  itemId: z.string().uuid(),
  name: z.string(),
  price: z.number(),
  profit: z.number().nonnegative().default(0),
  quantity: z.number().min(1),
  commissionFlatOverride: z.number().nonnegative().nullable().optional(),
});

const employeeSaleSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  employeeId: z.string().uuid("Select a valid employee"),
  items: z.array(cartItemSchema).min(1, "Add at least one item"),
  discountId: z.string().uuid().nullable(),
  notes: z.string().optional().or(z.literal("")),
});

const roundCurrency = (amount: number) =>
  Math.round((amount + Number.EPSILON) * 100) / 100;
const profitNoteKey = "profit_total";
const commissionNoteKey = "commission_total";
const commissionBaseNoteKey = "commission_base";

export type EmployeeSaleFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export const addEmployeeSale = async (
  _prev: EmployeeSaleFormState,
  formData: FormData,
): Promise<EmployeeSaleFormState> => {
  const session = await getSession();
  if (!session) {
    return { status: "error", message: "You must be signed in" };
  }

  const parsed = employeeSaleSchema.safeParse({
    invoiceNumber: formData.get("invoiceNumber")?.toString().trim(),
    employeeId: formData.get("employeeId"),
    items: (() => {
      try {
        return JSON.parse(formData.get("items")?.toString() ?? "[]");
      } catch {
        return [];
      }
    })(),
    discountId: (() => {
      const raw = formData.get("discountId");
      if (!raw) {
        return null;
      }
      const value = raw.toString().trim();
      return value.length ? value : null;
    })(),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Unable to record sale",
    };
  }

  const supabase = createSupabaseServerActionClient();

  const subtotal = roundCurrency(
    parsed.data.items.reduce((acc, item) => acc + item.price * item.quantity, 0),
  );
  const profitSubtotal = roundCurrency(
    parsed.data.items.reduce((acc, item) => acc + (item.profit ?? 0) * item.quantity, 0),
  );

  let discountAmount = 0;
  if (parsed.data.discountId) {
    const { data: discountRecord } = await supabase
      .from("discounts")
      .select("percentage")
      .eq("id", parsed.data.discountId)
      .maybeSingle();

    const discountRow =
      discountRecord as Database["public"]["Tables"]["discounts"]["Row"] | null;

    if (!discountRow) {
      return {
        status: "error",
        message: "Selected discount could not be found",
      };
    }

    discountAmount = roundCurrency(subtotal * (discountRow.percentage ?? 0));
  }

  const total = roundCurrency(Math.max(subtotal - discountAmount, 0));
  const discountMultiplier = subtotal > 0 ? Math.max(total / subtotal, 0) : 0;
  const profitTotal = roundCurrency(Math.max(profitSubtotal * discountMultiplier, 0));

  const { data: employeeRecord } = await supabase
    .from("app_users")
    .select("role")
    .eq("id", parsed.data.employeeId)
    .maybeSingle();

  const employeeRow =
    employeeRecord as Database["public"]["Tables"]["app_users"]["Row"] | null;

  const { data: commissionRates } = await supabase
    .from("commission_rates")
    .select("role, rate");

  const commissionMap = new Map<string, number>();
  (commissionRates ?? []).forEach((entry) => {
    commissionMap.set(entry.role, entry.rate ?? 0);
  });

  const roleRate = employeeRow ? commissionMap.get(employeeRow.role) ?? 0 : 0;
  const useProfitBase = commissionUsesProfit;

  const commissionBase = roundCurrency(
    parsed.data.items.reduce((acc, item) => {
      if (!useProfitBase) {
        return acc + item.price * item.quantity * discountMultiplier;
      }
      return acc + (item.profit ?? 0) * item.quantity * discountMultiplier;
    }, 0),
  );

  const commissionTotal = roundCurrency(
    parsed.data.items.reduce((acc, item) => {
      if (item.commissionFlatOverride != null) {
        return (
          acc + item.commissionFlatOverride * item.quantity * discountMultiplier
        );
      }
      const base = useProfitBase
        ? (item.profit ?? 0) * item.quantity * discountMultiplier
        : item.price * item.quantity * discountMultiplier;
      return acc + base * roleRate;
    }, 0),
  );

  const existingInvoice = await supabase
    .from("employee_sales")
    .select("id")
    .eq("invoice_number", parsed.data.invoiceNumber)
    .maybeSingle();

  if (existingInvoice.data) {
    return { status: "error", message: "Invoice number already exists" };
  }

  const userNotes = parsed.data.notes?.toString().trim() ?? "";
  const metadata = [
    `${profitNoteKey}=${profitTotal.toFixed(2)}`,
    `${commissionNoteKey}=${commissionTotal.toFixed(2)}`,
    `${commissionBaseNoteKey}=${commissionBase.toFixed(2)}`,
  ];
  const combinedNotes = [...metadata, userNotes].filter(Boolean).join(" | ");

  const { error } = await supabase.from("employee_sales").insert(
    // Supabase type inference fails for this insert payload; cast to preserve runtime behaviour.
    {
      owner_id: session.user.id,
      employee_id: parsed.data.employeeId,
      invoice_number: parsed.data.invoiceNumber,
      amount: total,
      notes: combinedNotes.length ? combinedNotes : null,
    } as never,
  );

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/employee-sales");
  revalidatePath("/sales");

  return { status: "success" };
};
