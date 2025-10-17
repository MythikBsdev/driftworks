"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

export const resetAllSales = async () => {
  const session = await getSession();
  if (!session || session.user.role !== "owner") {
    return;
  }

  const supabase = createSupabaseServerActionClient();

  const { error: orderItemsError } = await supabase
    .from("sales_order_items")
    .delete()
    .neq("id", "");
  if (orderItemsError) {
    throw new Error(orderItemsError.message);
  }

  const { error: salesOrdersError } = await supabase
    .from("sales_orders")
    .delete()
    .neq("id", "");
  if (salesOrdersError) {
    throw new Error(salesOrdersError.message);
  }

  const { error: employeeSalesError } = await supabase
    .from("employee_sales")
    .delete()
    .neq("id", "");
  if (employeeSalesError) {
    throw new Error(employeeSalesError.message);
  }

  revalidatePath("/sales");
  revalidatePath("/sales-register");
  redirect("/sales");
};
