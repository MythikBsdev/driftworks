import { revalidatePath } from "next/cache";

import ClearAllButton from "@/components/parts/clear-all-button";
import PartsList from "@/components/parts/parts-list";
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

  const deletePurchase = async (formData: FormData) => {
    "use server";
    const id = formData.get("purchaseId")?.toString();
    if (!id) return;

    const supabase = createSupabaseServerClient();
    await supabase.from("discord_purchases").delete().eq("id", id);
    revalidatePath("/parts");
  };

  const clearAllPurchases = async (_formData: FormData) => {
    "use server";
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("discord_purchases").delete();
    if (error) {
      console.error("[parts] Failed to clear purchases", error);
      throw new Error("Unable to clear purchases right now.");
    }
    revalidatePath("/parts");
  };

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
          <PartsHeader count={purchases.length} />
        </div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm text-white/60">
            {purchases.length ? "Manage Discord parts purchases." : "No purchases recorded yet."}
          </p>
          {purchases.length ? (
            <ClearAllButton action={clearAllPurchases} />
          ) : null}
        </div>
        <PartsList purchases={purchases} formatterCurrency={CURRENCY} deleteAction={deletePurchase} />
      </div>
    </div>
  );
};

export default PartsPage;

const PartsHeader = ({ count }: { count: number }) => (
  <div>
    <h2 className="text-xl font-semibold text-white">Recent parts purchases</h2>
    <p className="text-sm text-white/60">
      Showing {count} entr{count === 1 ? "y" : "ies"} from the bot.
    </p>
  </div>
);
