import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DashboardLayout = async ({ children }: { children: ReactNode }) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const enhancedProfile = {
    fullName: profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? user.email,
    role: profile?.role ?? (user.user_metadata?.role as string | undefined) ?? "Administrator",
    email: user.email,
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      <Sidebar user={enhancedProfile} />
      <div className="flex flex-1 flex-col">
        <Topbar fullName={enhancedProfile.fullName} />
        <main className="flex-1 overflow-y-auto px-4 pb-12 pt-6 sm:px-6 lg:px-12">
          <div className="mx-auto w-full max-w-7xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;