import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  delta?: string;
  trend?: "up" | "down";
  icon: ReactNode;
  footer?: string;
};

const StatCard = ({ title, value, delta, trend, icon, footer }: StatCardProps) => (
  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111]/90 p-6 shadow-[0_20px_60px_-40px_rgba(255,22,22,0.6)] backdrop-blur">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">{title}</p>
        <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      </div>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70">
        {icon}
      </div>
    </div>
    {delta ? (
      <div className="mt-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
        {trend === "down" ? (
          <ArrowDownRight className="h-4 w-4 text-red-400" />
        ) : (
          <ArrowUpRight className="h-4 w-4 text-emerald-400" />
        )}
        <span className={cn(trend === "down" ? "text-red-300" : "text-emerald-300")}>{delta}</span>
        <span className="text-white/40">vs last period</span>
      </div>
    ) : null}
    {footer ? <p className="mt-4 text-xs text-white/45">{footer}</p> : null}
  </div>
);

export default StatCard;