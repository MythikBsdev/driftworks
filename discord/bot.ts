import { config as loadEnv } from "dotenv";

// Load variables from .env.local (Next-style) first, then fall back to .env.
loadEnv({ path: ".env.local" });
loadEnv();

import { Client, EmbedBuilder, GatewayIntentBits } from "discord.js";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CART_PREVIEW_IMAGE = process.env.DISCORD_CART_IMAGE;
const CURRENCY_CODE = process.env.DISCORD_CURRENCY ?? "USD";
const BRAND_SLUG = process.env.DISCORD_BRAND_SLUG ?? process.env.NEXT_PUBLIC_BRAND ?? "driftworks";

if (!DISCORD_BOT_TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN is required to start the bot.");
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

// Use a loosely typed client here to avoid build-time type mismatches if the generated Supabase types lag schema changes.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
}) as SupabaseClient;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY_CODE }).format(value);

client.once("ready", () => {
  console.log(`[discord-bot] Logged in as ${client.user?.tag ?? "unknown user"}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const content = message.content.trim();
  if (!content.toLowerCase().startsWith("!buy")) return;

  const [, amountRaw] = content.split(/\s+/);
  const parsedAmount = parseFloat((amountRaw ?? "").replace(/[$,]/g, ""));

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    await message.reply("Usage: `!buy 100` — provide a positive number to record a purchase.");
    return;
  }

  const amount = Number(parsedAmount.toFixed(2));

  const { error: insertError } = await supabase.from("discord_purchases").insert({
    guild_id: message.guildId,
    channel_id: message.channelId,
    message_id: message.id,
    user_id: message.author.id,
    amount,
    brand_slug: BRAND_SLUG,
  });

  if (insertError) {
    console.error("[discord-bot] Failed to save purchase", insertError);
    await message.reply("I couldn't record that purchase right now. Try again in a moment.");
    return;
  }

  const { data: totalRow, error: totalError } = await supabase.rpc("discord_purchases_total", {
    p_guild_id: message.guildId,
    p_channel_id: null,
    p_brand_slug: BRAND_SLUG,
  });

  if (totalError) {
    console.error("[discord-bot] Failed to calculate running total", totalError);
  }

  const runningTotal = Number(totalRow ?? 0) || amount;

  const embed = new EmbedBuilder()
    .setTitle("Purchase Recorded")
    .setColor(0x00b894)
    .addFields(
      { name: "Price", value: formatCurrency(amount), inline: true },
      { name: "Running Total", value: formatCurrency(runningTotal), inline: true },
    )
    .setFooter({ text: `Logged by ${message.author.username}` })
    .setTimestamp();

  if (CART_PREVIEW_IMAGE) {
    embed.setThumbnail(CART_PREVIEW_IMAGE);
  }

  await message.reply({ embeds: [embed] });
});

client.login(DISCORD_BOT_TOKEN);
