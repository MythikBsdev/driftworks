import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { currencyFormatter, sum } from "@/lib/utils";

type DiscordPurchase = Database["public"]["Tables"]["discord_purchases"]["Row"];

const CURRENCY = "USD";

const PartsPage = async () => {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("discord_purchases")
    .select("id, amount, user_id, guild_id, channel_id, message_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="glass-panel border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-100">
        Failed to load parts purchases: {error.message}
      </div>
    );
  }

  const purchases = (data ?? []) as DiscordPurchase[];
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));

  const normalizeAmount = (value: DiscordPurchase["amount"]) => Number(value ?? 0);
  const monthlyTotal = purchases
    .filter((purchase) => new Date(purchase.created_at) >= monthStart)
    .reduce((acc, purchase) => acc + normalizeAmount(purchase.amount), 0);
  const allTimeTotal = sum(purchases.map((purchase) => normalizeAmount(purchase.amount)));

  const formatter = currencyFormatter(CURRENCY);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="muted-label">Parts</p>
        <h1 className="text-3xl font-semibold tracking-tight">Parts spending from Discord</h1>
        <p className="text-sm text-white/60">
          Aggregated from the `!buy` Discord bot. Totals are global and refreshed on page load.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="glass-panel p-6">
          <p className="muted-label">Monthly parts total</p>
          <p className="mt-2 text-3xl font-semibold">{formatter.format(monthlyTotal)}</p>
          <p className="mt-1 text-xs text-white/50">
            From {monthStart.toLocaleDateString()} to today.
          </p>
        </div>
        <div className="glass-panel p-6">
          <p className="muted-label">All-time parts total</p>
          <p className="mt-2 text-3xl font-semibold">{formatter.format(allTimeTotal)}</p>
          <p className="mt-1 text-xs text-white/50">Includes every recorded Discord purchase.</p>
        </div>
      </div>

      <div className="glass-panel p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Recent parts purchases</h2>
            <p className="text-sm text-white/60">
              Showing {purchases.length} entr{purchases.length === 1 ? "y" : "ies"} from the bot.
            </p>
          </div>
        </div>
        <div className="mt-4 divide-y divide-white/5 border-t border-white/10">
          {purchases.length === 0 ? (
            <p className="py-6 text-sm text-white/60">No purchases recorded yet.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {purchases.map((purchase) => (
                <li key={purchase.id} className="py-3 text-sm">
                  <div className="flex flex-col gap-2 md:grid md:grid-cols-[1.1fr_1fr_1fr_1fr] md:items-center md:gap-3">
                    <div className="font-medium text-white">
                      {formatter.format(normalizeAmount(purchase.amount))}
                    </div>
                    <div className="text-white/70">
                      {new Date(purchase.created_at).toLocaleString()}
                    </div>
                    <div className="text-white/50">
                      User: <span className="text-white/80">{purchase.user_id ?? "Unknown"}</span>
                    </div>
                    <div className="text-white/40">
                      {purchase.guild_id ? `Guild ${purchase.guild_id}` : "DM/Unknown"}
                      {purchase.channel_id ? ` · #${purchase.channel_id}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartsPage;
