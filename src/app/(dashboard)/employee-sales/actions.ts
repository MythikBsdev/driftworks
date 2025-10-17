"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSession } from "@/lib/auth/session";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

const employeeSaleSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  amount: z.coerce.number().nonnegative("Amount must be zero or more"),
  employeeId: z.string().uuid("Select a valid employee"),
  notes: z.string().optional().or(z.literal("")),
});

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
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Unable to record sale",
    };
  }

  const supabase = createSupabaseServerActionClient();
  const { error } = await supabase.from("employee_sales").insert(
    // Supabase type inference fails for this insert payload; cast to preserve runtime behaviour.
    {
      owner_id: session.user.id,
      employee_id: parsed.data.employeeId,
      invoice_number: parsed.data.invoiceNumber,
      amount: parsed.data.amount,
      notes: parsed.data.notes || null,
    } as never,
  );

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/employee-sales");
  revalidatePath("/sales");

  return { status: "success" };
};
