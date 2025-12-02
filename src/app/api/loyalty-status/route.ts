import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cidParam = url.searchParams.get("cid")?.trim().toUpperCase();

  if (!cidParam) {
    return NextResponse.json(
      { error: "Missing CID" },
      { status: 400 },
    );
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const supabase = createSupabaseRouteHandlerClient();
  const { data: loyaltyRow, error } = await supabase
    .from("loyalty_accounts")
    .select("stamp_count")
    .eq("owner_id", session.user.id)
    .eq("cid", cidParam)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  const stampCount = loyaltyRow?.stamp_count ?? 0;
  const ready = stampCount >= 9;

  return NextResponse.json({
    cid: cidParam,
    stampCount,
    ready,
  });
}
