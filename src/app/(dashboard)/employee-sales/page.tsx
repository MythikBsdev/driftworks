import { redirect } from "next/navigation";

import { addEmployeeSale } from "./actions";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { brandCurrency } from "@/config/brand-overrides";

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

  const employeeRecords =
    (employees ?? []) as Database["public"]["Tables"]["app_users"]["Row"][];

  const addSale = async (formData: FormData) => {
    "use server";
    await addEmployeeSale({ status: "idle" }, formData);
  };

  return (
    <section className="glass-card">
      <h2 className="text-xl font-semibold text-white">Add Employee Sale</h2>
      <p className="text-sm text-white/60">
        Manually add a sale record associated with an employee.
      </p>
      <form action={addSale} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label
            className="muted-label"
            htmlFor="invoiceNumber"
          >
            Invoice Number
          </label>
          <input
            id="invoiceNumber"
            name="invoiceNumber"
            required
            placeholder="e.g., #EMP001"
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-2">
          <label
            className="muted-label"
            htmlFor="amount"
          >
            Amount ({brandCurrency})
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="e.g., 150.00"
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-2">
          <label
            className="muted-label"
            htmlFor="employeeId"
          >
            Employee
          </label>
          <select
            id="employeeId"
            name="employeeId"
            required
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          >
            <option value="" disabled>
              Select an employee
            </option>
            {employeeRecords.map((employee) => (
              <option
                key={employee.id}
                value={employee.id}
                className="bg-[#101010]"
              >
                {employee.full_name ?? employee.username}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label
            className="muted-label"
            htmlFor="notes"
          >
            Notes (optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Additional details..."
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
        >
          Add Sale
        </button>
      </form>
    </section>
  );
};

export default EmployeeSalesPage;




