import { redirect } from "next/navigation";

import ClientList, { type ClientSummary } from "@/components/clients/client-list";
import NewClientForm from "@/components/clients/new-client-form";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { currencyFormatter } from "@/lib/utils";

const ClientsPage = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();
  const [{ data: clientRows }, { data: invoiceRows }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, company, email, phone, address, created_at")
      .eq("owner_id", session.user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, client_id, status, total, currency, due_date, created_at")
      .eq("owner_id", session.user.id),
  ]);

  const invoices =
    (invoiceRows ?? []) as Database["public"]["Tables"]["invoices"]["Row"][];
  const defaultCurrency = invoices[0]?.currency ?? "GBP";
  const formatter = currencyFormatter(defaultCurrency);

  const clientRecords =
    (clientRows ?? []) as Database["public"]["Tables"]["clients"]["Row"][];

  const clients: ClientSummary[] = clientRecords.map((client) => {
    const clientInvoices = invoices.filter(
      (invoice) => invoice.client_id === client.id,
    );
    const outstandingTotal = clientInvoices
      .filter((invoice) => invoice.status === "sent" || invoice.status === "overdue")
      .reduce((acc, invoice) => acc + (invoice.total ?? 0), 0);
    const lastInvoiceDate = clientInvoices
      .map((invoice) => invoice.created_at)
      .sort(
        (a, b) =>
          new Date(b ?? "").getTime() -
          new Date(a ?? "").getTime(),
      )[0];

    return {
      id: client.id,
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      address: client.address,
      totalInvoices: clientInvoices.length,
      outstandingTotal,
      lastInvoiceDate,
    };
  });

  const totalOutstanding = clients.reduce(
    (acc, client) => acc + client.outstandingTotal,
    0,
  );

  return (
    <div className="space-y-10">
      <div className="rounded-3xl border border-white/10 bg-[#0f0f0f]/85 p-8 shadow-[0_25px_60px_-45px_rgba(255,22,22,0.6)]">
        <p className="text-xs uppercase tracking-[0.4em] text-white/40">Clients</p>
        <h1 className="text-3xl font-semibold text-white">Client directory</h1>
        <p className="mt-2 text-sm text-white/50">
          {clients.length} clients · {formatter.format(totalOutstanding)} outstanding
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <ClientList clients={clients} currency={defaultCurrency} />
        <div className="rounded-3xl border border-white/10 bg-[#0f0f0f]/85 p-6">
          <h2 className="text-xl font-semibold text-white">Add a client</h2>
          <p className="mt-1 text-sm text-white/60">
            Client records become available to your team instantly after creation.
          </p>
          <div className="mt-6">
            <NewClientForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;
