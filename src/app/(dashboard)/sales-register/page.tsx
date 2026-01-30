import { redirect } from "next/navigation";

import SalesRegisterBoard from "@/components/sales/sales-register-board";
import { isMosleys } from "@/config/brand-overrides";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const SalesRegisterPage = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();
  const [{ data: items }, { data: discountRows }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id, name, category, price, profit, commission_flat_override")
      .order("price", { ascending: false }),
    supabase
      .from("discounts")
      .select("id, name, percentage")
      .order("name", { ascending: true }),
  ]);

  const inventoryItems =
    (items ?? []) as Database["public"]["Tables"]["inventory_items"]["Row"][];
  const visibleItems = isMosleys
    ? inventoryItems.filter((item) => (item.category ?? "").toLowerCase() !== "leo")
    : inventoryItems;
  const discounts =
    (discountRows ?? []) as Database["public"]["Tables"]["discounts"]["Row"][];

  return <SalesRegisterBoard items={visibleItems} discounts={discounts} />;
};

export default SalesRegisterPage;


