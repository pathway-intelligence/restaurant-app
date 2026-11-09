import type { Metadata } from "next";
import Link from "next/link";
import { currentBusiness } from "@/lib/current-business";
import { listInvoices } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Invoices" };

const QUICKBOOKS_LABELS = { sent: "Sent", error: "Error" };

export default async function InvoicesPage() {
  const business = await currentBusiness();
  const invoices = listInvoices(business.id);

  return (
    <div className="page">
      <div className="title-row">
        <h1 className="title">Invoices</h1>
        <span className="count">{invoices.length}</span>
      </div>
      <table className="table">
        <colgroup>
          <col style={{ width: 160 }} />
          <col />
          <col style={{ width: 180 }} />
          <col style={{ width: 120 }} />
          <col style={{ width: 96 }} />
          <col style={{ width: 160 }} />
        </colgroup>
        <thead>
          <tr>
            <th>Date</th>
            <th>Distributor</th>
            <th>Invoice #</th>
            <th>QuickBooks</th>
            <th className="right">Items</th>
            <th className="right">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="row-link">
              <td className="supporting">{formatDate(invoice.invoice_date)}</td>
              <td className="strong">{invoice.distributor}</td>
              <td>
                <Link href={`/invoices/${invoice.id}`} prefetch={false}>
                  {invoice.invoice_number}
                </Link>
              </td>
              <td>
                {invoice.qbo_status ? (
                  <span className={`status status-${invoice.qbo_status}`}>
                    {QUICKBOOKS_LABELS[invoice.qbo_status]}
                  </span>
                ) : (
                  <span className="supporting">—</span>
                )}
              </td>
              <td className="right supporting">{invoice.item_count}</td>
              <td className="right">{formatMoney(invoice.total_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
