import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const MAX_STAMPS = 9;

const LoyaltyPage = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("loyalty_accounts")
    .select(
      "id, cid, stamp_count, total_stamps, total_redemptions, created_at, updated_at",
    )
    .eq("owner_id", session.user.id)
    .order("updated_at", { ascending: false });

  const accounts =
    (data ?? []) as Database["public"]["Tables"]["loyalty_accounts"]["Row"][];

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
        <div>
          <h2 className="text-xl font-semibold text-white">CID stamp balances</h2>
          <p className="text-sm text-white/60">
            {accounts.length
              ? `${totalTrackedStamps} total stamps logged · ${readyForReward} customers can redeem now`
              : "Add a CID while completing a sale to start tracking loyalty stamps."}
          </p>
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
              {accounts.length ? (
                accounts.map((account) => {
                  const progress = Math.min(account.stamp_count, MAX_STAMPS);
                  const percent = Math.round((progress / MAX_STAMPS) * 100);
                  const rewardReady = account.stamp_count >= MAX_STAMPS;
                  const updatedAt = account.updated_at ?? account.created_at;

                  return (
                    <tr key={account.id} className="border-t border-white/10">
                      <td className="px-4 py-3 font-semibold text-white">{account.cid}</td>
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
    </div>
  );
};

export default LoyaltyPage;
