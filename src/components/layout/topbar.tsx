import Link from "next/link";

import { format } from "date-fns";
import { Plus } from "lucide-react";

import MobileNav from "./mobile-nav";

const Topbar = ({
  fullName,
}: {
  fullName?: string | null;
}) => {
  const now = format(new Date(), "EEEE, MMMM d");

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-[#0b0b0b]/80 px-6 py-5 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-[0.45em] text-white/40">Dashboard</p>
        <h1 className="text-2xl font-semibold text-white">
          Welcome back{fullName ? `, ${fullName.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-white/60">{now}</p>
      </div>
      <div className="flex items-center gap-3">
        <MobileNav />
        <Link
          href="/invoices/new"
          className="hidden items-center gap-2 rounded-xl border border-brand-primary/60 bg-brand-primary/90 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(255,22,22,0.35)] transition hover:bg-brand-primary sm:inline-flex"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Link>
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 rounded-xl border border-brand-primary/60 bg-brand-primary/90 px-3 py-2 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(255,22,22,0.35)] transition hover:bg-brand-primary sm:hidden"
          aria-label="Create invoice"
        >
          <Plus className="h-4 w-4" />
          New
        </Link>
      </div>
    </header>
  );
};

export default Topbar;