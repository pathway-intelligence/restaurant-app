import type { Metadata } from "next";
import { currentBusiness } from "@/lib/current-business";
import { listDistributors } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Distributors" };

export default async function DistributorsPage() {
  const business = await currentBusiness();
  const distributors = listDistributors(business.id);

  return (
    <div className="page">
      <div className="title-row">
        <h1 className="title">Distributors</h1>
        <span className="count">{distributors.length}</span>
      </div>
      <table className="table">
        <colgroup>
          <col />
          <col style={{ width: 160 }} />
          <col style={{ width: 200 }} />
          <col style={{ width: 180 }} />
        </colgroup>
        <thead>
          <tr>
            <th>Distributor</th>
            <th className="right">Invoices</th>
            <th className="right">Last invoice</th>
            <th className="right">Total spend</th>
          </tr>
        </thead>
        <tbody>
          {distributors.map((distributor) => (
            <tr key={distributor.id}>
              <td className="strong">{distributor.name}</td>
              <td className="right supporting">{distributor.invoice_count}</td>
              <td className="right supporting">
                {distributor.last_invoice_date ? formatDate(distributor.last_invoice_date) : "—"}
              </td>
              <td className="right">{formatMoney(distributor.total_spend_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
