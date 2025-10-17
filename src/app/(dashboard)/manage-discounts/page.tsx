import { redirect } from "next/navigation";

import { createDiscount, deleteDiscount } from "./actions";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const ManageDiscountsPage = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();
  const { data: discounts } = await supabase
    .from("discounts")
    .select("id, name, percentage, updated_at")
    .eq("owner_id", session.user.id)
    .order("updated_at", { ascending: false });

  const discountRows =
    (discounts ?? []) as Database["public"]["Tables"]["discounts"]["Row"][];

  const create = async (formData: FormData) => {
    "use server";
    await createDiscount({ status: "idle" }, formData);
  };

  const remove = async (formData: FormData) => {
    "use server";
    await deleteDiscount(formData);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <section className="rounded-3xl border border-white/10 bg-[#0f0f0f]/90 p-6 shadow-[0_20px_60px_-45px_rgba(255,22,22,0.6)]">
        <h2 className="text-xl font-semibold text-white">Add New Discount</h2>
        <p className="mt-1 text-sm text-white/60">
          Define a new percentage-based discount.
        </p>
        <form action={create} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label
              className="text-xs uppercase tracking-[0.3em] text-white/40"
              htmlFor="name"
            >
              Discount Name
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="e.g., Black Friday Sale"
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-xs uppercase tracking-[0.3em] text-white/40"
              htmlFor="percentage"
            >
              Percentage (0.00 - 1.00)
            </label>
            <input
              id="percentage"
              name="percentage"
              type="number"
              step="0.01"
              min="0"
              max="1"
              required
              placeholder="e.g., 0.10 for 10%"
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Add Discount
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0f0f0f]/85 p-6">
        <h2 className="text-xl font-semibold text-white">Current Discounts</h2>
        <p className="text-sm text-white/60">
          View, edit, or delete existing discount percentages.
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#101010]/90">
          <table className="w-full text-sm text-white/70">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.3em] text-white/40">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Percentage</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {discountRows.length ? (
                discountRows.map((discount) => (
                  <tr key={discount.id} className="border-t border-white/5">
                    <td className="px-4 py-3 text-white">{discount.name}</td>
                    <td className="px-4 py-3 text-white/70">
                      {(discount.percentage * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-white/60">
                      {discount.updated_at
                        ? new Date(discount.updated_at).toLocaleString()
                        : "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={remove}>
                        <input
                          type="hidden"
                          name="discountId"
                          value={discount.id}
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
                    No discounts defined.
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

export default ManageDiscountsPage;





