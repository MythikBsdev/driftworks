"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { tabHighlight } from "@/config/brand-overrides";
import { cn } from "@/lib/utils";

type Tab = {
  label: string;
  href: string;
};

const DashboardTabs = ({ tabs }: { tabs: Tab[] }) => {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/40 p-1 backdrop-blur-xl">
      {tabs.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "tab-pill border border-transparent",
              active
                ? "bg-black/70 text-white"
                : "text-white/70 hover:text-white hover:bg-white/5 hover:border-white/20",
            )}
            style={
              active
                ? {
                    borderColor: tabHighlight.borderColor,
                    boxShadow: tabHighlight.shadow,
                  }
                : undefined
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default DashboardTabs;
