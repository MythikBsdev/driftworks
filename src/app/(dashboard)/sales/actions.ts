"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const deleteOrderItemsInChunks = async (
  supabase: ReturnType<typeof createSupabaseServerActionClient>,
  orderIds: string[],
) => {
  if (!orderIds.length) {
    return true;
  }

  const chunkSize = 99;
  const chunks: string[][] = [];
  for (let index = 0; index < orderIds.length; index += chunkSize) {
    chunks.push(orderIds.slice(index, index + chunkSize));
  }

  for (const chunk of chunks) {
    const { error } = await supabase
      .from("sales_order_items")
      .delete()
      .in("order_id", chunk);

    if (error) {
      console.error("Failed to delete sales order items", error);
      return false;
    }
  }

  return true;
};

const removeUserSales = async (
  supabase: ReturnType<typeof createSupabaseServerActionClient>,
  userId: string,
) => {
  const { data: orderRows, error: orderSelectError } = await supabase
    .from("sales_orders")
    .select("id")
    .eq("owner_id", userId);

  if (orderSelectError) {
    console.error("Failed to fetch sales orders for reset", orderSelectError);
    return false;
  }

  const typedOrders =
    (orderRows ?? []) as Database["public"]["Tables"]["sales_orders"]["Row"][];
  const orderIds = typedOrders
    .map((order) => order.id)
    .filter((id): id is string => Boolean(id));

  const itemsDeleted = await deleteOrderItemsInChunks(supabase, orderIds);
  if (!itemsDeleted) {
    return false;
  }

  const { error: salesOrdersError } = await supabase
    .from("sales_orders")
    .delete()
    .eq("owner_id", userId);
  if (salesOrdersError) {
    console.error("Failed to delete sales orders", salesOrdersError);
    return false;
  }

  const { error: employeeSalesError } = await supabase
    .from("employee_sales")
    .delete()
    .or(`employee_id.eq.${userId},owner_id.eq.${userId}`);
  if (employeeSalesError) {
    console.error("Failed to delete employee sales", employeeSalesError);
    return false;
  }

  return true;
};

export const resetAllSales = async () => {
  const session = await getSession();
  if (!session || session.user.role !== "owner") {
    return;
  }

  const supabase = createSupabaseServerActionClient();

  const { data: userRows, error: userSelectError } = await supabase
    .from("app_users")
    .select("id");

  if (userSelectError) {
    console.error("Failed to fetch users for reset", userSelectError);
    return;
  }

  const userIds = (userRows ?? [])
    .map((row) => (row as Database["public"]["Tables"]["app_users"]["Row"]).id)
    .filter((id): id is string => Boolean(id));

  for (const userId of userIds) {
    const success = await removeUserSales(supabase, userId);
    if (!success) {
      return;
    }
  }

  revalidatePath("/sales");
  revalidatePath("/sales-register");
  redirect("/sales");
};

export const resetUserSales = async (formData: FormData) => {
  const session = await getSession();
  if (!session || session.user.role !== "owner") {
    return;
  }

  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId.length) {
    return;
  }

  const supabase = createSupabaseServerActionClient();
  const success = await removeUserSales(supabase, userId);
  if (!success) {
    return;
  }

  revalidatePath("/sales");
  revalidatePath("/sales-register");
  redirect("/sales");
};
