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
};

const BRANDS = {
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
      favicon: "/favicon.ico",
    },
    metadata: {
      title: "Driftworks Invoice Dashboard",
      description:
        "Manage Driftworks invoices, clients, and payments with a dark, automotive-inspired dashboard powered by Supabase.",
      icons: {
        icon: "/favicon.ico",
      },
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
      favicon: "/favicon.ico",
    },
    metadata: {
      title: "Los Santos Customs Portal",
      description:
        "Manage estimates, invoices, and loyalty builds for Los Santos Customs with Supabase-backed workflows.",
      icons: {
        icon: "/favicon.ico",
      },
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
