import type { Metadata } from "next";
import Image from "next/image";

import LoginForm from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Driftworks Portal - Login",
  description: "Secure access to the Driftworks invoice management dashboard.",
};

type LoginPageProps = {
  searchParams?: Record<string, string | string[]>;
};

const LoginPage = ({ searchParams }: LoginPageProps) => {
  const redirectTo =
    typeof searchParams?.redirectTo === "string" ? searchParams.redirectTo : undefined;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050505] px-4 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,22,22,0.07),_transparent_60%)]" />
      <div className="absolute inset-y-0 w-full max-w-md -translate-y-1/2 blur-3xl" />

      <div className="flex flex-col items-center gap-6">
        <Image
          src="/driftworks.png"
          width={220}
          height={220}
          alt="Driftworks logo"
          priority
          className="drop-shadow-[0_0_15px_rgba(255,22,22,0.3)]"
        />

        <div className="w-full max-w-md rounded-3xl border border-white/8 bg-[#121212]/90 p-10 shadow-[0_25px_60px_-30px_rgba(255,22,22,0.6)] backdrop-blur">
          <div className="space-y-2 pb-6 text-center">
            <h1 className="text-3xl font-semibold">Login</h1>
            <p className="text-sm text-white/70">Enter your credentials to access the dashboard</p>
          </div>
          <LoginForm redirectTo={redirectTo} />
        </div>
      </div>

      <p className="mt-12 text-xs uppercase tracking-[0.4em] text-white/30">Created by MythikBs</p>
    </div>
  );
};

export default LoginPage;
