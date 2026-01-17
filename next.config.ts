import type { NextConfig } from "next";

const brandSlug = process.env.NEXT_PUBLIC_BRAND ?? "driftworks";
const brandIcon =
  {
    bennys: "/bennys.png",
    driftworks: "/driftworks.png",
    lscustoms: "/lscustoms.png",
    synlineauto: "/synlineauto.png",
    bigtuna: "/bigtuna.png",
  }[brandSlug] ?? "/favicon.ico";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/favicon.ico", destination: brandIcon },
      { source: "/apple-touch-icon.png", destination: brandIcon },
      { source: "/icon.png", destination: brandIcon },
    ];
  },
};

export default nextConfig;
