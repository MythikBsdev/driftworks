"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSession } from "@/lib/auth/session";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

const discountSchema = z.object({
  name: z.string().min(1, "Discount name is required"),
  percentage: z.coerce
    .number()
    .min(0, "Must be at least 0")
    .max(1, "Maximum 1.0"),
});

export type DiscountFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export const createDiscount = async (
  _prev: DiscountFormState,
  formData: FormData,
): Promise<DiscountFormState> => {
  const session = await getSession();
  if (!session) {
    return { status: "error", message: "You must be signed in" };
  }

  const parsed = discountSchema.safeParse({
    name: formData.get("name")?.toString(),
    percentage: formData.get("percentage"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid discount",
    };
  }

  const supabase = createSupabaseServerActionClient();
  const { error } = await supabase.from("discounts").insert({
    owner_id: session.user.id,
    name: parsed.data.name,
    percentage: parsed.data.percentage,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/manage-discounts");
  revalidatePath("/sales-register");

  return { status: "success" };
};

export const deleteDiscount = async (formData: FormData) => {
  const session = await getSession();
  if (!session) {
    return;
  }

  const id = formData.get("discountId")?.toString();
  if (!id) {
    return;
  }

  const supabase = createSupabaseServerActionClient();
  await supabase
    .from("discounts")
    .delete()
    .eq("id", id)
    .eq("owner_id", session.user.id);

  revalidatePath("/manage-discounts");
};
