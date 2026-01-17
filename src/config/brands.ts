import type { Metadata } from "next";

type BrandPalette = {
  primary: string;
  accent: string;
  highlight: string;
  slate: string;
  card: string;
  outline: string;
  surface: string;
  surfaceStrong: string;
  textMuted: string;
  glow: string;
};

type BrandCopy = {
  heroTitle: string;
  heroDescription: string;
  loginSubtitle: string;
  footerCredit: string;
  navSubtitle: string;
  clientPlaceholder: string;
};

type BrandAssets = {
  logo: string;
  favicon: string;
};

type BrandWebhooks = {
  sales?: string;
};

export type BrandDefinition = {
  slug: string;
  name: string;
  shortName: string;
  initials: string;
  siteUrl: string;
  domains: string[];
  palette: BrandPalette;
  copy: BrandCopy;
  assets: BrandAssets;
  metadata: Pick<Metadata, "title" | "description" | "icons">;
  webhooks?: BrandWebhooks;
};

const BRANDS = {
  bennys: {
    slug: "bennys",
    name: "Benny's Service Dashboard",
    shortName: "Benny's",
    initials: "BM",
    siteUrl: "https://bennysmechanic.com",
    domains: ["bennysmechanic.com", "bennys"],
    palette: {
      primary: "#ff1616",
      accent: "#ff4d4d",
      highlight: "#ffb347",
      slate: "#101010",
      card: "#171717",
      outline: "#2a2a2a",
      surface: "rgba(18, 18, 20, 0.65)",
      surfaceStrong: "rgba(12, 12, 15, 0.85)",
      textMuted: "rgba(229, 231, 235, 0.65)",
      glow: "rgba(255, 22, 22, 0.35)",
    },
    copy: {
      heroTitle: "Benny's Invoice Dashboard",
      heroDescription:
        "Manage Benny's invoices, clients, and payments with a dark, automotive-inspired dashboard powered by Supabase.",
      loginSubtitle: "Enter your credentials to access the Benny's dashboard",
      footerCredit: "Benny's Original Motor Works",
      navSubtitle: "Operations Hub",
      clientPlaceholder: "Benny's Original Motor Works",
    },
    assets: {
      logo: "/bennys.png",
      favicon: "/bennys.png",
    },
    metadata: {
      title: "Benny's Invoice Dashboard",
      description:
        "Manage Benny's invoices, clients, and payments with a dark, automotive-inspired dashboard powered by Supabase.",
      icons: {
        icon: "/bennys.png",
        shortcut: "/bennys.png",
        apple: "/bennys.png",
      },
    },
    webhooks: {
      sales: process.env.DISCORD_WEBHOOK_BENNYS,
    },
  },
  bigtuna: {
    slug: "bigtuna",
    name: "Big Tuna Operations Hub",
    shortName: "Big Tuna",
    initials: "BT",
    siteUrl: "https://bigtunamechanic.com",
    domains: ["bigtunamechanic.com", "bigtuna"],
    palette: {
      primary: "#32d1ff",
      accent: "#67e4ff",
      highlight: "#a8f4ff",
      slate: "#050a14",
      card: "#0a1324",
      outline: "#11243b",
      surface: "rgba(7, 15, 30, 0.78)",
      surfaceStrong: "rgba(4, 10, 20, 0.92)",
      textMuted: "rgba(207, 233, 255, 0.72)",
      glow: "rgba(50, 209, 255, 0.42)",
    },
    copy: {
      heroTitle: "Big Tuna Service Dashboard",
      heroDescription:
        "Run Big Tuna service tickets, invoices, and client loyalty from a neon ocean-inspired control room powered by Supabase.",
      loginSubtitle: "Sign in to access the Big Tuna mechanic portal",
      footerCredit: "Made By MythikBs",
      navSubtitle: "Service Command",
      clientPlaceholder: "Big Tuna Bay",
    },
    assets: {
      logo: "/bigtuna.png",
      favicon: "/bigtuna.png",
    },
    metadata: {
      title: "Big Tuna Operations Hub",
      description:
        "Manage Big Tuna service, invoices, and client loyalty with a neon-blue dashboard backed by Supabase.",
      icons: {
        icon: "/bigtuna.png",
        shortcut: "/bigtuna.png",
        apple: "/bigtuna.png",
      },
    },
    webhooks: {
      sales: process.env.DISCORD_WEBHOOK_BIGTUNA,
    },
  },
  driftworks: {
    slug: "driftworks",
    name: "Driftworks Invoice Dashboard",
    shortName: "Driftworks",
    initials: "DW",
    siteUrl: "https://driftworks.example.com",
    domains: ["localhost", "driftworks"],
    palette: {
      primary: "#ff1616",
      accent: "#ff4d4d",
      highlight: "#ffb347",
      slate: "#101010",
      card: "#171717",
      outline: "#2a2a2a",
      surface: "rgba(18, 18, 20, 0.65)",
      surfaceStrong: "rgba(12, 12, 15, 0.85)",
      textMuted: "rgba(229, 231, 235, 0.65)",
      glow: "rgba(255, 22, 22, 0.35)",
    },
    copy: {
      heroTitle: "Driftworks Invoice Dashboard",
      heroDescription:
        "Manage Driftworks invoices, clients, and payments with a dark, automotive-inspired dashboard powered by Supabase.",
      loginSubtitle: "Enter your credentials to access the dashboard",
      footerCredit: "Created by MythikBs",
      navSubtitle: "Operations Hub",
      clientPlaceholder: "Driftworks South",
    },
    assets: {
      logo: "/driftworks.png",
      favicon: "/driftworks.png",
    },
    metadata: {
      title: "Driftworks Invoice Dashboard",
      description:
        "Manage Driftworks invoices, clients, and payments with a dark, automotive-inspired dashboard powered by Supabase.",
      icons: {
        icon: "/driftworks.png",
        shortcut: "/driftworks.png",
        apple: "/driftworks.png",
      },
    },
    webhooks: {
      sales: process.env.DISCORD_WEBHOOK_DRIFTWORKS,
    },
  },
  lscustoms: {
    slug: "lscustoms",
    name: "Los Santos Customs",
    shortName: "LS Customs",
    initials: "LS",
    siteUrl: "https://lscustomsmechanic.com",
    domains: ["lscustomsmechanic.com", "lscustoms"],
    palette: {
      primary: "#46b0ff",
      accent: "#a955ff",
      highlight: "#ffd76d",
      slate: "#070b1c",
      card: "#101a34",
      outline: "#1b2c4b",
      surface: "rgba(6, 10, 25, 0.75)",
      surfaceStrong: "rgba(3, 6, 18, 0.9)",
      textMuted: "rgba(189, 207, 255, 0.7)",
      glow: "rgba(70, 176, 255, 0.4)",
    },
    copy: {
      heroTitle: "Los Santos Customs Operations Hub",
      heroDescription:
        "Track builds, client jobs, and invoices for LS Customs with a neon-drenched interface inspired by the city nights.",
      loginSubtitle: "Authenticate to access the LS Customs mechanic dashboard",
      footerCredit: "Los Santos Customs - Since 1982",
      navSubtitle: "Mechanic HQ",
      clientPlaceholder: "Los Santos Customs North",
    },
    assets: {
      logo: "/lscustoms.png",
      favicon: "/lscustoms.png",
    },
    metadata: {
      title: "Los Santos Customs Portal",
      description:
        "Manage estimates, invoices, and loyalty builds for Los Santos Customs with Supabase-backed workflows.",
      icons: {
        icon: "/lscustoms.png",
        shortcut: "/lscustoms.png",
        apple: "/lscustoms.png",
      },
    },
    webhooks: {
      sales: process.env.DISCORD_WEBHOOK_LSCUSTOMS,
    },
  },
  synlineauto: {
    slug: "synlineauto",
    name: "Synline Auto Operations Hub",
    shortName: "Synline Auto",
    initials: "SA",
    siteUrl: "https://synlineauto.com",
    domains: ["synlineauto.com", "synlineauto"],
    palette: {
      primary: "#d62828",
      accent: "#a9afb8",
      highlight: "#f26c4f",
      slate: "#0b0c10",
      card: "#15171c",
      outline: "#242830",
      surface: "rgba(10, 12, 16, 0.75)",
      surfaceStrong: "rgba(5, 6, 10, 0.9)",
      textMuted: "rgba(220, 224, 230, 0.65)",
      glow: "rgba(214, 40, 40, 0.4)",
    },
    copy: {
      heroTitle: "Synline Auto Service Dashboard",
      heroDescription:
        "Run Synline Auto invoices, clients, and loyalty from a gritty red-and-steel command center powered by Supabase.",
      loginSubtitle: "Log in to access the Synline Auto control room",
      footerCredit: "Synline Auto",
      navSubtitle: "Service Command",
      clientPlaceholder: "Synline Auto HQ",
    },
    assets: {
      logo: "/synlineauto.png",
      favicon: "/synlineauto.png",
    },
    metadata: {
      title: "Synline Auto Dashboard",
      description:
        "Manage Synline Auto operations, invoices, and client loyalty with a Supabase-backed control center.",
      icons: {
        icon: "/synlineauto.png",
        shortcut: "/synlineauto.png",
        apple: "/synlineauto.png",
      },
    },
    webhooks: {
      sales: process.env.DISCORD_WEBHOOK_SYNLINELAUTO,
    },
  },
} satisfies Record<string, BrandDefinition>;

export type BrandKey = keyof typeof BRANDS;

const isBrandKey = (value: string): value is BrandKey => value in BRANDS;

const DEFAULT_BRAND_KEY = (() => {
  const envValue = process.env.NEXT_PUBLIC_BRAND;
  if (envValue && isBrandKey(envValue)) {
    return envValue;
  }
  return "driftworks";
})();

export const brandKeys = Object.keys(BRANDS) as BrandKey[];

export const getBrandConfig = (slug?: string | null) => {
  if (slug && isBrandKey(slug)) {
    return BRANDS[slug];
  }
  return BRANDS[DEFAULT_BRAND_KEY];
};

export const findBrandByHost = (host?: string | null) => {
  if (!host) {
    return BRANDS[DEFAULT_BRAND_KEY];
  }

  const normalized = host.toLowerCase();
  const match = Object.values(BRANDS).find((entry) =>
    entry.domains.some((domain) => normalized.includes(domain)),
  );
  return match ?? BRANDS[DEFAULT_BRAND_KEY];
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  const bigint = Number.parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r} ${g} ${b}`;
};

export const buildBrandCssVars = (definition: BrandDefinition) => ({
  "--color-brand-primary": hexToRgb(definition.palette.primary),
  "--color-brand-accent": hexToRgb(definition.palette.accent),
  "--color-brand-highlight": hexToRgb(definition.palette.highlight),
  "--color-brand-slate": hexToRgb(definition.palette.slate),
  "--color-brand-card": hexToRgb(definition.palette.card),
  "--color-brand-outline": hexToRgb(definition.palette.outline),
  "--surface-base": definition.palette.surface,
  "--surface-strong": definition.palette.surfaceStrong,
  "--text-muted": definition.palette.textMuted,
  "--brand-shadow": definition.palette.glow,
});

export const brand = getBrandConfig();
