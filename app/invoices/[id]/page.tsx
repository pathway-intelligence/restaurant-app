import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sendAgain } from "@/app/actions";
import { currentBusiness } from "@/lib/current-business";
import { getInvoice, listInvoiceLines } from "@/lib/db";
import { formatDate, formatDay, formatMoney, formatQuantity } from "@/lib/format";

export const metadata: Metadata = { title: "Invoice" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = await currentBusiness();
  const invoice = /^\d+$/.test(id) ? getInvoice(business.id, Number(id)) : undefined;
  if (!invoice) notFound();

  const lines = listInvoiceLines(invoice.id);

  return (
    <div className="page page-detail">
      <div className="page-head">
        <Link className="back-link" href="/invoices">
          ← Invoices
        </Link>
        <h1 className="title">{invoice.distributor}</h1>
        <p className="count">
          Invoice {invoice.invoice_number} · {formatDate(invoice.invoice_date)}
        </p>
      </div>
      {invoice.qbo_status && (
        <div className={`quickbooks-strip quickbooks-strip-${invoice.qbo_status}`}>
          <p className="quickbooks-strip-text">
            {invoice.qbo_status === "sent"
              ? `In QuickBooks as bill ${invoice.qbo_bill_id} · sent ${formatDay(invoice.qbo_sent_at!)}`
              : `Couldn't send to QuickBooks: ${invoice.qbo_error}`}
          </p>
          <form action={sendAgain.bind(null, invoice.id)}>
            <button className="button button-secondary" type="submit">
              Send again
            </button>
          </form>
        </div>
      )}
      <div>
        <table className="table">
          <colgroup>
            <col />
            <col style={{ width: 240 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 140 }} />
            <col style={{ width: 140 }} />
          </colgroup>
          <thead>
            <tr>
              <th>Description</th>
              <th>Category</th>
              <th className="right">Qty</th>
              <th className="right">Unit price</th>
              <th className="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id}>
                <td>{line.description}</td>
                <td className="supporting">{line.category ?? "—"}</td>
                <td className="right">{formatQuantity(line.quantity)}</td>
                <td className="right">{formatMoney(line.unit_price_cents)}</td>
                <td className="right">{formatMoney(line.amount_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="invoice-total">
          <span className="supporting">Invoice total</span>
          <span className="invoice-total-value">{formatMoney(invoice.total_cents)}</span>
        </div>
      </div>
    </div>
  );
}
