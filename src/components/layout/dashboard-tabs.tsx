"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type Tab = {
  label: string;
  href: string;
};

const DashboardTabs = ({ tabs }: { tabs: Tab[] }) => {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#111]/80 px-2 py-1">
      {tabs.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition",
              active
                ? "bg-white text-black shadow-[0_10px_25px_rgba(255,22,22,0.35)]"
                : "text-white/70 hover:text-white hover:bg-white/10",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default DashboardTabs;
