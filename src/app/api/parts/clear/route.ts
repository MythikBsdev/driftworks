import { NextResponse } from "next/server";

import { brand } from "@/config/brands";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

const guildIds =
  process.env.DISCORD_BRAND_GUILD_IDS
    ?.split(",")
    .map((id) => id.trim())
    .filter(Boolean) ?? [];

export async function POST() {
  const session = await getSession();
  const supabase = createSupabaseRouteHandlerClient();
  // Supabase requires a filter on delete; scope by brand (preferred) or guild(s) when available.
  const buildDelete = (filterByBrand: boolean) => {
    let query = supabase.from("discord_purchases").delete();

    if (guildIds.length) {
      query = query.in("guild_id", guildIds);
    }

    if (filterByBrand) {
      query = query.eq("brand_slug", brand.slug);
    }

    return query;
  };

  const buildSum = async (filterByBrand: boolean) => {
    let query = supabase.from("discord_purchases").select("amount");
    if (guildIds.length) {
      query = query.in("guild_id", guildIds);
    }
    if (filterByBrand) {
      query = query.eq("brand_slug", brand.slug);
    }
    return query;
  };

  let clearedAmount = 0;
  const { data: sumRows, error: sumError } = await buildSum(true);
  if (sumError && sumError.code === "42703") {
    const { data: fallbackRows, error: fallbackError } = await buildSum(false);
    if (!fallbackError && fallbackRows) {
      clearedAmount = (fallbackRows as { amount: number | null }[]).reduce(
        (acc, row) => acc + Number(row.amount ?? 0),
        0,
      );
    }
  } else if (!sumError && sumRows) {
    clearedAmount = (sumRows as { amount: number | null }[]).reduce(
      (acc, row) => acc + Number(row.amount ?? 0),
      0,
    );
  }

  let { error } = await buildDelete(true);

  if (error && error.code === "42703") {
    ({ error } = await buildDelete(false));
  }

  if (error) {
    console.error("[parts] Failed to clear purchases", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Best-effort audit log
  const logPayload = {
    brand_slug: brand.slug,
    guild_scope: guildIds.join(",") || null,
    triggered_by_id: session?.user.id ?? null,
    triggered_by_username: session?.user.username ?? null,
    cleared_amount: clearedAmount,
  };
  const { error: logError } = await supabase.from("parts_clear_logs").insert(logPayload as never);
  if (logError) {
    console.warn("[parts] Failed to log clear action", logError);
  }

  return NextResponse.json({ ok: true });
}
