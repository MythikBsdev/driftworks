import { NextResponse } from "next/server";

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createSupabaseRouteHandlerClient();
  // Supabase requires a filter on delete; use a safe always-true filter.
  const { error } = await supabase.from("discord_purchases").delete().neq("id", "");
  if (error) {
    console.error("[parts] Failed to clear purchases", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
