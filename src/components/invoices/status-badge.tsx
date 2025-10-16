import type { InvoiceStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<InvoiceStatus, { label: string; className: string }> = {
  paid: {
    label: "Paid",
    className: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
  },
  sent: {
    label: "Sent",
    className: "border-sky-500/50 bg-sky-500/15 text-sky-300",
  },
  overdue: {
    label: "Overdue",
    className: "border-red-500/50 bg-red-500/20 text-red-300",
  },
  draft: {
    label: "Draft",
    className: "border-white/10 bg-white/10 text-white/60",
  },
};

const InvoiceStatusBadge = ({ status }: { status: InvoiceStatus }) => {
  const style = statusStyles[status] ?? statusStyles.draft;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider",
        style.className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {style.label}
    </span>
  );
};

export default InvoiceStatusBadge;