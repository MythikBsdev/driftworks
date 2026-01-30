import type { CSSProperties, ReactNode } from "react";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { brand, buildBrandCssVars } from "@/config/brands";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: brand.metadata.title ?? brand.name,
    template: `%s - ${brand.shortName}`,
  },
  description: brand.metadata.description,
  icons: brand.metadata.icons,
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  const cssVars = buildBrandCssVars(brand) as CSSProperties;
  const isMosleys = brand.slug === "mosleys";

  return (
    <html lang="en" className="bg-[#050505]" data-brand={brand.slug}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[#050505] text-white antialiased`}
        style={{
          ...cssVars,
          ...(isMosleys
            ? {
                backgroundImage:
                  "linear-gradient(rgba(0,0,0,0.82), rgba(0,0,0,0.88)), url('/mosleys.jpg')",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }
            : null),
        }}
      >
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
