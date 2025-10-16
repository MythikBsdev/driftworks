"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { FileText, Package, Settings2, Users } from "lucide-react";

import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/invoices",
    label: "Invoices",
    icon: FileText,
  },
  {
    href: "/users",
    label: "Users",
    icon: Users,
  },
  {
    href: "/products",
    label: "Products",
    icon: Package,
  },
  {
    href: "/management",
    label: "Management",
    icon: Settings2,
  },
];

const SidebarNav = () => {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-2">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center justify-between rounded-xl border border-transparent px-3 py-2 text-sm font-medium transition",
              "hover:border-brand-primary/70 hover:bg-brand-primary/10",
              active
                ? "border-brand-primary/80 bg-brand-primary/20 text-white shadow-[0_8px_20px_rgba(255,22,22,0.25)]"
                : "text-white/70",
            )}
          >
            <span className="flex items-center gap-2">
              <Icon
                className={cn(
                  "h-4 w-4",
                  active ? "text-brand-accent" : "text-white/50",
                )}
              />
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default SidebarNav;
