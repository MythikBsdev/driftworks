"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSession } from "@/lib/auth/session";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

const commissionSchema = z.object({
  role: z.string().min(1, "Role is required"),
  rate: z.coerce.number().min(0, "Minimum 0").max(1, "Maximum 1.0"),
});

export type CommissionFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export const createCommission = async (
  _prev: CommissionFormState,
  formData: FormData,
): Promise<CommissionFormState> => {
  const session = await getSession();
  if (!session || session.user.role !== "owner") {
    return {
      status: "error",
      message: "Only owners can create commission rates",
    };
  }

  const parsed = commissionSchema.safeParse({
    role: formData.get("role")?.toString(),
    rate: formData.get("rate"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid commission",
    };
  }

  const supabase = createSupabaseServerActionClient();
  const { error } = await supabase
    .from("commission_rates")
    .insert(
      // Cast keeps Supabase from collapsing the payload type.
      {
        owner_id: session.user.id,
        role: parsed.data.role,
        rate: parsed.data.rate,
      } as never,
    );

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/manage-commissions");

  return { status: "success" };
};

export const deleteCommission = async (formData: FormData) => {
  const session = await getSession();
  if (!session || session.user.role !== "owner") {
    return;
  }

  const id = formData.get("commissionId")?.toString();
  if (!id) {
    return;
  }

  const supabase = createSupabaseServerActionClient();
  await supabase
    .from("commission_rates")
    .delete()
    .eq("id", id)
    .eq("owner_id", session.user.id);

  revalidatePath("/manage-commissions");
};

