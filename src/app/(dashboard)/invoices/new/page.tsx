import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import NewInvoiceForm from "@/components/invoices/new-invoice-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const nextInvoiceNumber = (previous?: string | null) => {
  const year = new Date().getFullYear();
  const prefix = `DW-${year}`;

  if (!previous || !previous.startsWith(prefix)) {
    return `${prefix}-001`;
  }

  const match = previous.match(/(\d+)$/);
  const current = match ? Number(match[1]) : 0;
  const next = String(current + 1).padStart(3, "0");
  return `${prefix}-${next}`;
};

const NewInvoicePage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: clientRows } = await supabase
    .from("clients")
    .select("id, name, company")
    .eq("owner_id", user.id)
    .order("name", { ascending: true });

  const { data: lastInvoice } = await supabase
    .from("invoices")
    .select("invoice_number")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const suggestedNumber = nextInvoiceNumber(lastInvoice?.invoice_number);

  if (!clientRows?.length) {
    return (
      <div className="space-y-6">
        <Link href="/invoices" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to invoices
        </Link>
        <div className="rounded-3xl border border-dashed border-white/10 bg-[#0f0f0f]/80 p-12 text-center">
          <h1 className="text-2xl font-semibold text-white">Add a client first</h1>
          <p className="mt-2 text-sm text-white/60">
            You need at least one client to create an invoice.
          </p>
          <Link
            href="/clients"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-brand-primary/60 bg-brand-primary/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary"
          >
            Manage clients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/invoices" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to invoices
      </Link>
      <div className="rounded-3xl border border-white/10 bg-[#0f0f0f]/85 p-8 shadow-[0_20px_60px_-45px_rgba(255,22,22,0.6)]">
        <h1 className="text-3xl font-semibold text-white">Create new invoice</h1>
        <p className="mt-2 text-sm text-white/60">
          Send branded invoices with built-in tracking and client insights.
        </p>
        <div className="mt-8">
          <NewInvoiceForm clients={clientRows} suggestedInvoiceNumber={suggestedNumber} currency="USD" />
        </div>
      </div>
    </div>
  );
};

export default NewInvoicePage;