import type { Metadata } from "next";
import Image from "next/image";

import { brand } from "@/config/brands";
import LoginForm from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: `${brand.shortName} Portal - Login`,
  description: brand.copy.loginSubtitle,
};

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[]>>;
};

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const redirectTo =
    typeof resolvedSearchParams?.redirectTo === "string"
      ? resolvedSearchParams.redirectTo
      : undefined;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050505] px-4 text-white">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at top, rgb(var(--color-brand-primary) / 0.12), transparent 60%)",
        }}
      />
      <div className="absolute inset-y-0 w-full max-w-md -translate-y-1/2 blur-3xl" />

      <div className="flex flex-col items-center gap-6">
        <Image
          src={brand.assets.logo}
          width={220}
          height={220}
          alt={`${brand.shortName} logo`}
          priority
          style={{
            filter: "drop-shadow(0 0 20px rgb(var(--color-brand-primary) / 0.35))",
          }}
        />

        <div
          className="w-full max-w-md rounded-3xl border border-white/8 bg-[#121212]/90 p-10 backdrop-blur"
          style={{
            boxShadow: "0 25px 60px -30px rgb(var(--color-brand-primary) / 0.55)",
          }}
        >
          <div className="space-y-2 pb-6 text-center">
            <h1 className="text-3xl font-semibold">Login</h1>
            <p className="text-sm text-white/70">{brand.copy.loginSubtitle}</p>
          </div>
          <LoginForm redirectTo={redirectTo} />
        </div>
      </div>

      <p className="mt-12 text-xs uppercase tracking-[0.4em] text-white/30">{brand.copy.footerCredit}</p>
    </div>
  );
};

export default LoginPage;
