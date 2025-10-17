import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ArrowUpRight, Coins, PackageCheck, UsersRound } from "lucide-react";

import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { currencyFormatter, sum } from "@/lib/utils";

const DashboardPage = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();

  const [salesResult, inventoryResult, discountsResult, usersResult] =
    await Promise.all([
      supabase
        .from("sales_orders")
        .select("id, total, created_at")
        .eq("owner_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("inventory_items")
        .select("id, name, category, price, updated_at")
        .eq("owner_id", session.user.id)
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("discounts")
        .select("id, name, percentage, updated_at")
        .eq("owner_id", session.user.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("app_users")
        .select("id, username, role, created_at")
        .order("created_at", { ascending: true }),
    ]);

  const sales =
    (salesResult.data ?? []) as Database["public"]["Tables"]["sales_orders"]["Row"][];
  const inventory =
    (inventoryResult.data ?? []) as Database["public"]["Tables"]["inventory_items"]["Row"][];
  const discounts =
    (discountsResult.data ?? []) as Database["public"]["Tables"]["discounts"]["Row"][];
  const team =
    (usersResult.data ?? []) as Database["public"]["Tables"]["app_users"]["Row"][];

  const totalRevenue = sum(sales.map((sale) => sale.total ?? 0));
  const formatter = currencyFormatter("GBP");

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#111]/90 p-5 shadow-[0_20px_50px_-35px_rgba(255,22,22,0.9)]">
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">
            Revenue
          </p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-3xl font-semibold text-white">
              {formatter.format(totalRevenue)}
            </p>
            <Coins className="h-10 w-10 rounded-2xl bg-brand-primary/20 p-2 text-brand-primary" />
          </div>
          <p className="mt-2 text-xs text-white/45">
            {sales.length
              ? `Last sale ${formatDistanceToNow(new Date(sales[0]!.created_at), { addSuffix: true })}`
              : "No sales yet"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111]/90 p-5">
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">
            Inventory
          </p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-3xl font-semibold text-white">
              {inventory.length}
            </p>
            <PackageCheck className="h-10 w-10 rounded-2xl bg-emerald-500/20 p-2 text-emerald-300" />
          </div>
          <p className="mt-2 text-xs text-white/45">
            Recent additions appear here.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111]/90 p-5">
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">
            Discounts
          </p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-3xl font-semibold text-white">
              {discounts.length}
            </p>
            <ArrowUpRight className="h-10 w-10 rounded-2xl bg-sky-500/20 p-2 text-sky-300" />
          </div>
          <p className="mt-2 text-xs text-white/45">Active percentage deals.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111]/90 p-5">
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">
            Team
          </p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-3xl font-semibold text-white">{team.length}</p>
            <UsersRound className="h-10 w-10 rounded-2xl bg-purple-500/20 p-2 text-purple-300" />
          </div>
          <p className="mt-2 text-xs text-white/45">Admins included.</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-[#0f0f0f]/85 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Latest sales</h2>
            <span className="text-xs uppercase tracking-[0.35em] text-white/40">
              Recent 6
            </span>
          </div>
          <ul className="space-y-3 text-sm">
            {sales.length ? (
              sales.map((sale) => (
                <li
                  key={sale.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">
                      {sale.invoice_number ?? sale.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-white/45">
                      {formatDistanceToNow(new Date(sale.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {formatter.format(sale.total ?? 0)}
                  </p>
                </li>
              ))
            ) : (
              <li className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-12 text-center text-sm text-white/50">
                No sales recorded yet. Complete a sale from the register to see
                activity here.
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-[#0f0f0f]/85 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Recent inventory updates
            </h2>
            <span className="text-xs uppercase tracking-[0.35em] text-white/40">
              Newest first
            </span>
          </div>
          <ul className="space-y-3 text-sm">
            {inventory.length ? (
              inventory.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-xs text-white/45">{item.category}</p>
                  </div>
                  <div className="text-right text-xs text-white/45">
                    <p className="text-sm font-semibold text-white">
                      {formatter.format(item.price ?? 0)}
                    </p>
                    <p>
                      {formatDistanceToNow(new Date(item.updated_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </li>
              ))
            ) : (
              <li className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-12 text-center text-sm text-white/50">
                Add your first catalog item from the Inventory tab.
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;


