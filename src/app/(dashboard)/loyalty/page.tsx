import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { currencyFormatter } from "@/lib/utils";

const MAX_STAMPS = 9;

type SalesOrderWithOwner = Database["public"]["Tables"]["sales_orders"]["Row"] & {
  owner_display?: string;
};

type LoyaltyPageProps = {
  searchParams?: {
    q?: string;
    cid?: string;
  };
};

const LoyaltyPage = async ({ searchParams }: LoyaltyPageProps) => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();
  const { data: loyaltyData } = await supabase
    .from("loyalty_accounts")
    .select(
      "id, cid, stamp_count, total_stamps, total_redemptions, created_at, updated_at",
    )
    .eq("owner_id", session.user.id)
    .order("updated_at", { ascending: false });

  const accounts =
    (loyaltyData ?? []) as Database["public"]["Tables"]["loyalty_accounts"]["Row"][];

  const searchValue =
    typeof searchParams?.q === "string" ? searchParams.q.trim().toUpperCase() : "";
  const selectedCid =
    typeof searchParams?.cid === "string" && searchParams.cid.trim().length
      ? searchParams.cid.trim().toUpperCase()
      : "";

  const filteredAccounts = searchValue.length
    ? accounts.filter((account) => account.cid.toUpperCase().includes(searchValue))
    : accounts;

  let relatedSales: SalesOrderWithOwner[] = [];
  if (selectedCid.length) {
    const { data: salesData } = await supabase
      .from("sales_orders")
      .select(
        "id, invoice_number, subtotal, discount, total, created_at, loyalty_action, owner_id",
      )
      .eq("owner_id", session.user.id)
      .eq("cid", selectedCid)
      .order("created_at", { ascending: false });

    relatedSales = (salesData ?? []) as SalesOrderWithOwner[];

    const ownerIds = Array.from(
      new Set(
        relatedSales
          .map((sale) => sale.owner_id)
          .filter((value): value is string => typeof value === "string" && value.length),
      ),
    );

    if (ownerIds.length) {
      const { data: ownerData } = await supabase
        .from("app_users")
        .select("id, username, full_name")
        .in("id", ownerIds);

      const ownerRows =
        (ownerData ?? []) as Database["public"]["Tables"]["app_users"]["Row"][];

      const ownerMap = new Map(
        ownerRows.map((user) => [user.id, user.full_name ?? user.username]),
      );

      relatedSales = relatedSales.map((sale) => ({
        ...sale,
        owner_display: sale.owner_id ? ownerMap.get(sale.owner_id) ?? "User" : "User",
      }));
    }
  }

  const readyForReward = accounts.filter(
    (account) => account.stamp_count >= MAX_STAMPS,
  ).length;
  const totalRedemptions = accounts.reduce(
    (acc, account) => acc + account.total_redemptions,
    0,
  );
  const totalTrackedStamps = accounts.reduce(
    (acc, account) => acc + account.total_stamps,
    0,
  );

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-[#0f0f0f]/85 p-8 shadow-[0_25px_60px_-45px_rgba(255,22,22,0.6)]">
        <p className="text-xs uppercase tracking-[0.4em] text-white/40">Loyalty</p>
        <h1 className="text-3xl font-semibold text-white">Customer loyalty tracker</h1>
        <p className="mt-2 text-sm text-white/60">
          Track CID stamp balances and see who is ready for a free 10th purchase.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">Active CIDs</p>
            <p className="mt-2 text-3xl font-semibold text-white">{accounts.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">Ready For Reward</p>
            <p className="mt-2 text-3xl font-semibold text-white">{readyForReward}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">Free Sales Redeemed</p>
            <p className="mt-2 text-3xl font-semibold text-white">{totalRedemptions}</p>
          </div>
        </div>
      </section>

      <section className="glass-card space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">CID stamp balances</h2>
          <p className="text-sm text-white/60">
            {filteredAccounts.length
              ? `${totalTrackedStamps} total stamps logged · ${readyForReward} customers can redeem now`
              : "Add a CID while completing a sale to start tracking loyalty stamps."}
          </p>
          <form className="w-full max-w-sm" method="get">
            {selectedCid ? <input type="hidden" name="cid" value={selectedCid} /> : null}
            <input
              type="search"
              name="q"
              defaultValue={searchParams?.q ?? ""}
              placeholder="Search by CID..."
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/40"
            />
          </form>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <table className="w-full text-left text-sm text-white/80">
            <thead className="bg-white/10 text-xs uppercase tracking-[0.3em] text-white/50">
              <tr>
                <th className="px-4 py-3 font-medium">CID</th>
                <th className="px-4 py-3 font-medium">Current stamps</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Lifetime stamps</th>
                <th className="px-4 py-3 font-medium">Free sales</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length ? (
                filteredAccounts.map((account) => {
                  const progress = Math.min(account.stamp_count, MAX_STAMPS);
                  const percent = Math.round((progress / MAX_STAMPS) * 100);
                  const rewardReady = account.stamp_count >= MAX_STAMPS;
                  const updatedAt = account.updated_at ?? account.created_at;
                  const isSelected = selectedCid === account.cid.toUpperCase();

                  const query = new URLSearchParams();
                  if (searchValue.length) {
                    query.set("q", searchValue);
                  }
                  query.set("cid", account.cid);

                  const clearQuery = new URLSearchParams();
                  if (searchValue.length) {
                    clearQuery.set("q", searchValue);
                  }

                  return (
                    <tr
                      key={account.id}
                      className={`border-t border-white/10 ${isSelected ? "bg-white/10" : ""}`}
                    >
                      <td className="px-4 py-3 font-semibold text-white">
                        <Link
                          href={`?${isSelected ? clearQuery.toString() : query.toString()}`}
                          className="transition hover:text-brand-accent"
                        >
                          {account.cid}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-white/80">
                        <div className="flex items-center gap-3">
                          <span>
                            {progress}/{MAX_STAMPS}
                          </span>
                          <div className="h-1.5 flex-1 rounded-full bg-white/10">
                            <div
                              className={`h-full rounded-full ${rewardReady ? "bg-emerald-400" : "bg-brand-primary"}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            rewardReady
                              ? "bg-emerald-500/20 text-emerald-200"
                              : "bg-white/10 text-white/70"
                          }`}
                        >
                          {rewardReady ? "Free 10th sale ready" : "Collecting"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/70">{account.total_stamps}</td>
                      <td className="px-4 py-3 text-white/70">{account.total_redemptions}</td>
                      <td className="px-4 py-3 text-white/60">
                        {updatedAt
                          ? new Date(updatedAt).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-white/60" colSpan={6}>
                    No loyalty activity yet. Start by adding a CID to a sale from the sales register.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedCid.length ? (
        <section className="glass-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/40">CID detail</p>
              <h3 className="text-2xl font-semibold text-white">{selectedCid}</h3>
              <p className="text-sm text-white/60">
                Showing invoices that contributed to this loyalty account.
              </p>
            </div>
            <Link
              href={searchValue.length ? `?q=${encodeURIComponent(searchValue)}` : "."}
              className="text-sm text-brand-accent transition hover:underline"
            >
              Clear selection
            </Link>
          </div>
          {relatedSales.length ? (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <table className="w-full text-left text-sm text-white/80">
                <thead className="bg-white/10 text-xs uppercase tracking-[0.3em] text-white/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Invoice #</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Created by</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedSales.map((sale) => (
                    <tr key={sale.id} className="border-t border-white/10">
                      <td className="px-4 py-3 text-white">{sale.invoice_number ?? sale.id}</td>
                      <td className="px-4 py-3 text-white/60">
                        {sale.created_at
                          ? new Date(sale.created_at).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-white/70">
                        {sale.owner_display ?? "User"}
                      </td>
                      <td className="px-4 py-3 text-white/60 capitalize">
                        {sale.loyalty_action ?? "none"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-white">
                        {currencyFormatter("GBP").format(sale.total ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              No sales have been logged for this CID yet.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
};

export default LoyaltyPage;
