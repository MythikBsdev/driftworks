import { redirect } from "next/navigation";

import { createCommission, deleteCommission } from "./actions";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "shop_foreman", label: "Shop Foreman" },
  { value: "master_tech", label: "Master Tech" },
  { value: "mechanic", label: "Mechanic" },
  { value: "apprentice", label: "Apprentice" },
];

const formatRole = (role: string) =>
  ROLE_OPTIONS.find((option) => option.value === role)?.label ??
  role.charAt(0).toUpperCase() + role.slice(1);

const ManageCommissionsPage = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();
  const { data: commissions } = await supabase
    .from("commission_rates")
    .select("id, role, rate, updated_at")
    .eq("owner_id", session.user.id)
    .order("updated_at", { ascending: false });

  const commissionRows =
    (commissions ?? []) as Database["public"]["Tables"]["commission_rates"]["Row"][];

  const create = async (formData: FormData) => {
    "use server";
    await createCommission({ status: "idle" }, formData);
  };

  const remove = async (formData: FormData) => {
    "use server";
    await deleteCommission(formData);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <section className="rounded-3xl border border-white/10 bg-[#0f0f0f]/90 p-6 shadow-[0_20px_60px_-45px_rgba(255,22,22,0.6)]">
        <h2 className="text-xl font-semibold text-white">
          Add New Commission Rate
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Define a commission rate for a specific user role.
        </p>
        <form action={create} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label
              className="muted-label"
              htmlFor="role"
            >
              Role
            </label>
            <select
              id="role"
              name="role"
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#101010]">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label
              className="muted-label"
              htmlFor="rate"
            >
              Commission Rate (0.00 - 1.00)
            </label>
            <input
              id="rate"
              name="rate"
              type="number"
              step="0.01"
              min="0"
              max="1"
              required
              placeholder="e.g., 0.05 for 5%"
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Add Commission
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0f0f0f]/85 p-6">
        <h2 className="text-xl font-semibold text-white">
          Current Commission Rates
        </h2>
        <p className="text-sm text-white/60">
          View, edit, or delete commission rates per role.
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#101010]/90">
          <table className="w-full text-sm text-white/70">
            <thead className="bg-white/5 muted-label">
              <tr>
                <th className="px-4 py-3 font-medium text-left">Role</th>
                <th className="px-4 py-3 font-medium text-left">Rate</th>
                <th className="px-4 py-3 font-medium text-left">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {commissionRows.length ? (
                commissionRows.map((commission) => (
                  <tr key={commission.id} className="border-t border-white/5">
                    <td className="px-4 py-3 text-white">
                      {formatRole(commission.role)}
                    </td>
                    <td className="px-4 py-3 text-white/60">
                      {(commission.rate * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-white/60">
                      {commission.updated_at
                        ? new Date(commission.updated_at).toLocaleString("en-GB")
                        : "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={remove}>
                        <input
                          type="hidden"
                          name="commissionId"
                          value={commission.id}
                        />
                        <button
                          type="submit"
                          className="text-xs uppercase tracking-[0.3em] text-red-400 transition hover:text-red-300"
                        >
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-4 py-12 text-center text-sm text-white/50"
                    colSpan={4}
                  >
                    No commission rates defined.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ManageCommissionsPage;





