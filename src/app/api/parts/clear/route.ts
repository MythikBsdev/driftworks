import { NextResponse } from "next/server";

import { brand } from "@/config/brands";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

const guildIds =
  process.env.DISCORD_BRAND_GUILD_IDS
    ?.split(",")
    .map((id) => id.trim())
    .filter(Boolean) ?? [];

export async function POST() {
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

  let { error } = await buildDelete(true);

  if (error && error.code === "42703") {
    ({ error } = await buildDelete(false));
  }

  if (error) {
    console.error("[parts] Failed to clear purchases", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
