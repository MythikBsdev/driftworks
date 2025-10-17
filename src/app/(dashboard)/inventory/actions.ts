"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSession } from "@/lib/auth/session";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

const itemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional().or(z.literal("")),
  price: z.coerce.number().nonnegative("Price must be zero or greater"),
});

export type InventoryFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export const createInventoryItem = async (
  _prev: InventoryFormState,
  formData: FormData,
): Promise<InventoryFormState> => {
  const session = await getSession();
  if (!session) {
    return { status: "error", message: "You must be signed in" };
  }

  const parsed = itemSchema.safeParse({
    name: formData.get("name")?.toString(),
    category: formData.get("category")?.toString(),
    description: formData.get("description")?.toString(),
    price: formData.get("price"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid inventory item",
    };
  }

  const supabase = createSupabaseServerActionClient();
  const { error } = await supabase.from("inventory_items").insert({
    owner_id: session.user.id,
    name: parsed.data.name,
    category: parsed.data.category,
    description: parsed.data.description || null,
    price: parsed.data.price,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/inventory");
  revalidatePath("/sales-register");

  return { status: "success" };
};

export const deleteInventoryItem = async (formData: FormData) => {
  const session = await getSession();
  if (!session) {
    return;
  }

  const itemId = formData.get("itemId")?.toString();
  if (!itemId) {
    return;
  }

  const supabase = createSupabaseServerActionClient();
  await supabase
    .from("inventory_items")
    .delete()
    .eq("id", itemId)
    .eq("owner_id", session.user.id);

  revalidatePath("/inventory");
  revalidatePath("/sales-register");
};
