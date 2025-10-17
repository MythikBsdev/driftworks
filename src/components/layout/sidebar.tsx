import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import LogoutButton from "./logout-button";
import SidebarNav from "./sidebar-nav";

type SidebarProps = {
  user: {
    fullName?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
};

const getInitials = (fullName?: string | null, email?: string | null) => {
  if (fullName) {
    const segments = fullName.trim().split(/\s+/);
    if (segments.length === 1) {
      return segments[0]!.slice(0, 2).toUpperCase();
    }
    return `${segments[0]?.[0] ?? ""}${segments.at(-1)?.[0] ?? ""}`.toUpperCase();
  }

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "DW";
};

const Sidebar = ({ user }: SidebarProps) => (
  <aside className="hidden w-72 flex-col border-r border-white/10 bg-[#0a0a0a]/95 px-5 py-6 backdrop-blur lg:flex">
    <Link href="/dashboard" className="flex items-center gap-3 pb-8">
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
        <Image src="/driftworks.png" alt="Driftworks" width={48} height={48} className="object-cover" />
      </div>
      <div>
        <p className="text-sm uppercase tracking-[0.4em] text-white/40">Driftworks</p>
        <p className="text-lg font-semibold leading-5 text-white">Operations Hub</p>
      </div>
    </Link>

    <SidebarNav />

    <div className="mt-auto space-y-4 pt-8">
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/80 text-sm font-semibold text-white shadow-glow",
          )}
        >
          {getInitials(user?.fullName, user?.email)}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{user?.fullName ?? "Unknown user"}</p>
          <p className="muted-label">{user?.role ?? "Team"}</p>
        </div>
      </div>
      <LogoutButton />
    </div>
  </aside>
);

export default Sidebar;

