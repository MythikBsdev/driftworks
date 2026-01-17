import { NextResponse } from "next/server";

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { env } from "@/env";

const HEADER_KEY = "x-debug-token";

export async function GET(request: Request) {
  if (!env.DEBUG_HEALTH_TOKEN) {
    return NextResponse.json(
      { error: "Debug token not configured on server." },
      { status: 403 },
    );
  }

  const provided = request.headers.get(HEADER_KEY);
  if (!provided || provided !== env.DEBUG_HEALTH_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseRouteHandlerClient();

  const tableCounts = async (table: string) => {
    const { count, error } = await supabase.from(table).select("*", { head: true, count: "exact" });
    if (error) return { table, error: error.message };
    return { table, count: count ?? 0 };
  };

  const sample = async (table: string, columns: string, limit = 5) => {
    const { data, error } = await supabase.from(table).select(columns).limit(limit);
    if (error) return { table, error: error.message };
    return { table, sample: data };
  };

  const [counts, users, inventory, sales] = await Promise.all([
    Promise.all([
      tableCounts("app_users"),
      tableCounts("inventory_items"),
      tableCounts("sales_orders"),
      tableCounts("sales_order_items"),
      tableCounts("discord_purchases"),
      tableCounts("discounts"),
      tableCounts("commission_rates"),
    ]),
    sample("app_users", "username, role", 3),
    sample("inventory_items", "name, price", 3),
    sample("sales_orders", "invoice_number, total", 3),
  ]);

  return NextResponse.json({
    counts,
    samples: {
      users,
      inventory,
      sales,
    },
  });
}
