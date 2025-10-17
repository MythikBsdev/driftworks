"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

export const resetAllSales = async () => {
  const session = await getSession();
  if (!session || session.user.role !== "owner") {
    return;
  }

  const supabase = createSupabaseServerActionClient();

  await supabase.from("sales_order_items").delete().neq("id", "");
  await supabase.from("sales_orders").delete().neq("id", "");
  await supabase.from("employee_sales").delete().neq("id", "");

  revalidatePath("/sales");
  revalidatePath("/sales-register");
};
