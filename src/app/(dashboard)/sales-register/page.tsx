import { redirect } from "next/navigation";

import SalesRegisterBoard from "@/components/sales/sales-register-board";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SalesRegisterPage = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();
  const { data: items } = await supabase
    .from("inventory_items")
    .select("id, name, category, price")
    .eq("owner_id", session.user.id)
    .order("name", { ascending: true });

  return <SalesRegisterBoard items={items ?? []} />;
};

export default SalesRegisterPage;
