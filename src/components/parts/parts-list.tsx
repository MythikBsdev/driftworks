"use client";

import { useMemo, useState } from "react";

import type { Database } from "@/lib/supabase/types";
import { currencyFormatter } from "@/lib/utils";

type DiscordPurchase = Database["public"]["Tables"]["discord_purchases"]["Row"];

type PartsListProps = {
  purchases: DiscordPurchase[];
  formatterCurrency: string;
  deleteAction: (formData: FormData) => Promise<void>;
};

const PartsList = ({ purchases, formatterCurrency, deleteAction }: PartsListProps) => {
  const [showAll, setShowAll] = useState(false);
  const formatter = useMemo(() => currencyFormatter(formatterCurrency), [formatterCurrency]);

  const entries = showAll ? purchases : purchases.slice(0, 5);

  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-white/60">
          {showAll ? "Showing all purchases" : "Showing last 5 purchases"}
        </p>
        <button
          type="button"
          className="btn-ghost px-3 py-2 text-sm"
          onClick={() => setShowAll((prev) => !prev)}
        >
          {showAll ? "Show last 5" : "See all"}
        </button>
      </div>

      <div className="divide-y divide-white/5 border-t border-white/10">
        {entries.length === 0 ? (
          <p className="py-6 text-sm text-white/60">No purchases recorded yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {entries.map((purchase) => (
              <li key={purchase.id} className="py-3 text-sm">
                <div className="flex flex-col gap-2 md:grid md:grid-cols-[1.1fr_1fr_1fr_1fr_auto] md:items-center md:gap-3">
                  <div className="font-medium text-white">
                    {formatter.format(Number(purchase.amount ?? 0))}
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
                  <form action={deleteAction}>
                    <input type="hidden" name="purchaseId" value={purchase.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PartsList;
