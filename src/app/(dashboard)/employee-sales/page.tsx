import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { brandCurrency } from "@/config/brand-overrides";
import EmployeeSaleForm from "@/components/employee-sales/employee-sale-form";

const EmployeeSalesPage = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();
  const { data: employees } = await supabase
    .from("app_users")
    .select("id, username, full_name")
    .order("username", { ascending: true });
  const { data: catalogItemsRaw } = await supabase
    .from("inventory_items")
    .select("id, name, price")
    .order("name", { ascending: true });

  const employeeRecords =
    (employees ?? []) as Database["public"]["Tables"]["app_users"]["Row"][];
  const catalogItems =
    (catalogItemsRaw ?? []) as Database["public"]["Tables"]["inventory_items"]["Row"][];

  return (
    <section className="glass-card">
      <h2 className="text-xl font-semibold text-white">Add Employee Sale</h2>
      <p className="text-sm text-white/60">
        Manually add a sale record associated with an employee.
      </p>
      <EmployeeSaleForm
        employees={employeeRecords}
        catalogItems={catalogItems}
        currency={brandCurrency}
      />
    </section>
  );
};

export default EmployeeSalesPage;
