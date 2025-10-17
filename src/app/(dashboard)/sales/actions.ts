"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export const resetAllSales = async () => {
  const session = await getSession();
  if (!session || session.user.role !== "owner") {
    return;
  }

  const supabase = createSupabaseServerActionClient();

  const { data: orderRows, error: orderSelectError } = await supabase
    .from("sales_orders")
    .select("id")
    .eq("owner_id", session.user.id);

  if (orderSelectError) {
    console.error("Failed to fetch sales orders for reset", orderSelectError);
    return;
  }

  const typedOrders =
    (orderRows ?? []) as Database["public"]["Tables"]["sales_orders"]["Row"][];
  const orderIds = typedOrders
    .map((order) => order.id)
    .filter((id): id is string => Boolean(id));

  if (orderIds.length) {
    const deleteChunks: string[][] = [];
    const chunkSize = 99;
    for (let i = 0; i < orderIds.length; i += chunkSize) {
      deleteChunks.push(orderIds.slice(i, i + chunkSize));
    }

    for (const chunk of deleteChunks) {
      const { error: itemsError } = await supabase
        .from("sales_order_items")
        .delete()
        .in("order_id", chunk);

      if (itemsError) {
        console.error("Failed to delete sales order items", itemsError);
        return;
      }
    }
  }

  const { error: salesOrdersError } = await supabase
    .from("sales_orders")
    .delete()
    .eq("owner_id", session.user.id);
  if (salesOrdersError) {
    console.error("Failed to delete sales orders", salesOrdersError);
    return;
  }

  const { error: employeeSalesError } = await supabase
    .from("employee_sales")
    .delete()
    .eq("owner_id", session.user.id);
  if (employeeSalesError) {
    console.error("Failed to delete employee sales", employeeSalesError);
    return;
  }

  revalidatePath("/sales");
  revalidatePath("/sales-register");
  redirect("/sales");
};
