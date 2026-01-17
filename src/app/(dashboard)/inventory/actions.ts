"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { hasManagerLikeAccess, hasOwnerLikeAccess, isLscustoms } from "@/config/brand-overrides";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

const itemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional().or(z.literal("")),
  price: z.coerce.number().nonnegative("Price must be zero or greater"),
  profit: z.coerce.number().nonnegative("Profit must be zero or greater").default(0),
});

const updateSchema = itemSchema.extend({
  itemId: z.string().uuid("Invalid inventory item"),
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
    profit: formData.get("profit"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid inventory item",
    };
  }

  const supabase = createSupabaseServerActionClient();
  const { error } = await supabase.from("inventory_items").insert(
    // Cast keeps Supabase from collapsing the payload type to never.
    {
      owner_id: session.user.id,
      name: parsed.data.name,
      category: parsed.data.category,
      description: parsed.data.description || null,
      price: parsed.data.price,
      profit: parsed.data.profit ?? 0,
    } as never,
  );

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
  if (!hasManagerLikeAccess(session.user.role)) {
    return;
  }

  // Drop catalog references so sales history stays intact and the FK constraint doesn't block deletion.
  const { error: detachError } = await supabase
    .from("sales_order_items")
    .update({ catalog_item_id: null } as never)
    .eq("catalog_item_id", itemId);

  if (detachError) {
    console.error("Failed to detach inventory item from sales order items", detachError);
    return;
  }

  const canDeleteAny = hasOwnerLikeAccess(session.user.role) || session.user.role === "manager";

  let deleteQuery = supabase.from("inventory_items").delete().eq("id", itemId);
  if (!canDeleteAny) {
    deleteQuery = deleteQuery.eq("owner_id", session.user.id);
  }

  const { error: deleteError } = await deleteQuery;
  if (deleteError) {
    console.error("Failed to delete inventory item", deleteError);
    return;
  }

  revalidatePath("/inventory");
  revalidatePath("/sales-register");
};

export const updateInventoryItem = async (
  _prev: InventoryFormState,
  formData: FormData,
): Promise<InventoryFormState> => {
  const session = await getSession();
  if (!session) {
    return { status: "error", message: "You must be signed in" };
  }

  const parsed = updateSchema.safeParse({
    itemId: formData.get("itemId"),
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description"),
    price: formData.get("price"),
    profit: formData.get("profit"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid inventory item",
    };
  }

  const supabase = createSupabaseServerActionClient();
  const { itemId, ...payload } = parsed.data;

  let query = supabase
    .from("inventory_items")
    .update({
      name: payload.name,
      category: payload.category,
      description: payload.description || null,
      price: payload.price,
      profit: payload.profit ?? 0,
    } as never)
    .eq("id", itemId);

  const isElevatedManager =
    isLscustoms && (session.user.role === "manager" || session.user.role === "shop_foreman");
  if (!hasOwnerLikeAccess(session.user.role) && !isElevatedManager) {
    query = query.eq("owner_id", session.user.id);
  }

  const { error } = await query;
  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/inventory");
  revalidatePath("/sales-register");

  return { status: "success" };
};
