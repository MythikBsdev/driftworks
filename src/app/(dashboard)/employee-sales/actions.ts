"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSession } from "@/lib/auth/session";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const employeeSaleSchema = z
  .object({
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    amount: z.preprocess((value) => {
      const asString = value?.toString().trim();
      if (!asString?.length) {
        return undefined;
      }
      return asString;
    }, z.coerce.number().nonnegative("Amount must be zero or more").optional()),
    employeeId: z.string().uuid("Select a valid employee"),
    catalogItemIds: z.array(z.string().uuid("Select a valid catalogue item")).optional(),
    notes: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => data.amount !== undefined || (data.catalogItemIds?.length ?? 0) > 0,
    { message: "Enter an amount or select at least one catalogue item", path: ["amount"] },
  );

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
    invoiceNumber: formData.get("invoiceNumber"),
    amount: formData.get("amount"),
    employeeId: formData.get("employeeId"),
    catalogItemIds: formData.getAll("catalogItemIds"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Unable to record sale",
    };
  }

  const supabase = createSupabaseServerActionClient();

  let amount = parsed.data.amount ?? null;
  let notes = parsed.data.notes?.toString().trim() ?? "";

  if (parsed.data.catalogItemIds?.length) {
    const requestedIds = Array.from(new Set(parsed.data.catalogItemIds));
    const { data: catalogItems, error: catalogError } = await supabase
      .from("inventory_items")
      .select("id, name, price")
      .in("id", requestedIds);

    if (catalogError) {
      return { status: "error", message: "Unable to load catalogue items" };
    }

    const typedCatalog =
      (catalogItems ?? []) as Database["public"]["Tables"]["inventory_items"]["Row"][];

    if (!typedCatalog.length || typedCatalog.length !== requestedIds.length) {
      return { status: "error", message: "Selected catalogue items could not be found" };
    }

    amount = typedCatalog.reduce((total, item) => total + (item.price ?? 0), 0);

    if (!notes.length) {
      const itemNames = typedCatalog.map((item) => item.name).join(", ");
      notes = `Catalogue: ${itemNames}`;
    }
  }

  if (amount === null || Number.isNaN(amount)) {
    return { status: "error", message: "Amount is required" };
  }

  const { error } = await supabase.from("employee_sales").insert(
    // Supabase type inference fails for this insert payload; cast to preserve runtime behaviour.
    {
      owner_id: session.user.id,
      employee_id: parsed.data.employeeId,
      invoice_number: parsed.data.invoiceNumber,
      amount,
      notes: notes.length ? notes : null,
    } as never,
  );

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/employee-sales");
  revalidatePath("/sales");

  return { status: "success" };
};
