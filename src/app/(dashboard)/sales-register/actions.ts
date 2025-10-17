"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSession } from "@/lib/auth/session";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const cartItemSchema = z.object({
  itemId: z.string().uuid(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().min(1),
});

const saleSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  items: z.array(cartItemSchema).min(1, "Add at least one item"),
  discountId: z.string().uuid().nullable(),
});

export type CompleteSaleState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export const completeSale = async (
  _prev: CompleteSaleState,
  formData: FormData,
): Promise<CompleteSaleState> => {
  const session = await getSession();
  if (!session) {
    return { status: "error", message: "You must be signed in" };
  }

  const parsed = saleSchema.safeParse({
    invoiceNumber: formData.get("invoiceNumber")?.toString().trim(),
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
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Unable to process sale",
    };
  }

  const { invoiceNumber, items, discountId } = parsed.data;
  const roundCurrency = (amount: number) =>
    Math.round((amount + Number.EPSILON) * 100) / 100;

  const subtotal = roundCurrency(
    items.reduce((acc, item) => acc + item.price * item.quantity, 0),
  );

  const supabase = createSupabaseServerActionClient();

  let discountAmount = 0;
  if (discountId) {
    const { data: discountRecord } = await supabase
      .from("discounts")
      .select("percentage")
      .eq("owner_id", session.user.id)
      .eq("id", discountId)
      .maybeSingle();

    if (!discountRecord) {
      return {
        status: "error",
        message: "Selected discount could not be found",
      };
    }

    discountAmount = roundCurrency(
      subtotal * (discountRecord.percentage ?? 0),
    );
  }

  const total = roundCurrency(Math.max(subtotal - discountAmount, 0));

  const { data: existing } = await supabase
    .from("sales_orders")
    .select("id")
    .eq("invoice_number", invoiceNumber)
    .maybeSingle();

  if (existing) {
    return { status: "error", message: "Invoice number already exists" };
  }

  const { data: inserted, error } = await supabase
    .from("sales_orders")
    .insert(
      {
        owner_id: session.user.id,
        invoice_number: invoiceNumber,
        subtotal,
        discount: discountAmount,
        total,
        status: "completed",
      } as never,
    )
    .select("id")
    .single();

  const orderRecord =
    inserted as Database["public"]["Tables"]["sales_orders"]["Row"] | null;

  if (error || !orderRecord) {
    return { status: "error", message: error?.message ?? "Unable to create sale" };
  }

  const { error: itemsError } = await supabase
    .from("sales_order_items")
    .insert(
      items.map((item) => ({
        order_id: orderRecord.id,
        item_name: item.name,
        catalog_item_id: item.itemId,
        quantity: item.quantity,
        unit_price: item.price,
        total: item.price * item.quantity,
      })) as never,
    );

  if (itemsError) {
    return { status: "error", message: itemsError.message };
  }

  revalidatePath("/sales");
  revalidatePath("/sales-register");

  return { status: "success" };
};
