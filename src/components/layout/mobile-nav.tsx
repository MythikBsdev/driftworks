"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { NAV_ITEMS } from "./sidebar-nav";

const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((flag) => !flag)}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/70"
        aria-expanded={open}
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        Menu
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
          <div className="mx-auto mt-24 w-11/12 max-w-sm rounded-3xl border border-white/10 bg-[#0f0f0f]/95 p-6 shadow-[0_20px_60px_-45px_rgba(255,22,22,0.6)]">
            <h2 className="text-sm uppercase tracking-[0.35em] text-white/40">Navigate</h2>
            <nav className="mt-4 space-y-3">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium",
                      active
                        ? "border-brand-primary/80 bg-brand-primary/20 text-white"
                        : "border-white/10 bg-white/5 text-white/70",
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {item.badge ? (
                      <span className="rounded-full bg-white/10 px-2 py-[2px] text-[10px] uppercase tracking-wider text-white/60">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MobileNav;