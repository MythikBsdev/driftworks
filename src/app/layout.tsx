import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

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
    default: "Driftworks Invoice Dashboard",
    template: "%s — Driftworks",
  },
  description:
    "Manage Driftworks invoices, clients, and payments with a dark, automotive-inspired dashboard powered by Supabase.",
  icons: {
    icon: "/favicon.ico",
  },
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" className="bg-[#050505]">
    <body
      className={`${geistSans.variable} ${geistMono.variable} bg-[#050505] text-white antialiased`}
    >
      {children}
    </body>
  </html>
);

export default RootLayout;