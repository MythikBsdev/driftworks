import Link from "next/link";
import { Mail, Phone, Receipt, User2 } from "lucide-react";

import { currencyFormatter } from "@/lib/utils";

export type ClientSummary = {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  totalInvoices: number;
  outstandingTotal: number;
  lastInvoiceDate?: string | null;
};

const ClientList = ({ clients, currency = "USD" }: { clients: ClientSummary[]; currency?: string }) => {
  const formatter = currencyFormatter(currency);

  if (!clients.length) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
        <h3 className="text-xl font-semibold text-white">No clients yet</h3>
        <p className="mt-2 text-sm text-white/60">
          Add your first client to start tracking invoices and activity.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {clients.map((client) => (
        <li
          key={client.id}
          className="group rounded-3xl border border-white/10 bg-[#0f0f0f]/85 p-5 shadow-[0_20px_50px_-45px_rgba(255,22,22,0.6)] transition hover:border-brand-primary hover:shadow-[0_25px_65px_-45px_rgba(255,22,22,0.9)]"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/40">Client</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{client.name}</h3>
              <p className="text-xs text-white/50">{client.company ?? "Independent"}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60">
              <User2 className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 space-y-2 text-xs text-white/60">
            {client.email ? (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                <a href={`mailto:${client.email}`} className="text-white/70 hover:text-white">
                  {client.email}
                </a>
              </div>
            ) : null}
            {client.phone ? (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                <a href={`tel:${client.phone}`} className="text-white/70 hover:text-white">
                  {client.phone}
                </a>
              </div>
            ) : null}
            {client.address ? <p>{client.address}</p> : null}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between text-sm font-medium text-white">
              <span className="flex items-center gap-2 text-white/70">
                <Receipt className="h-4 w-4" /> Invoices
              </span>
              <span>{client.totalInvoices}</span>
            </div>
            <div className="mt-2 text-xs text-white/40">
              Outstanding: <span className="font-semibold text-white">{formatter.format(client.outstandingTotal)}</span>
            </div>
            <div className="mt-1 text-xs text-white/40">
              Last invoice: {client.lastInvoiceDate ? new Date(client.lastInvoiceDate).toLocaleDateString() : "N/A"}
            </div>
          </div>

          <Link
            href={`/clients/${client.id}`}
            className="mt-5 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white/70 transition hover:border-brand-primary hover:text-brand-accent"
          >
            View details
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default ClientList;