import type { Metadata } from "next";
import { CategorySelect } from "@/components/category-select";
import { currentBusiness } from "@/lib/current-business";
import { listCategories, listPurchases } from "@/lib/db";
import { formatDate, formatMoney, formatQuantity } from "@/lib/format";

export const metadata: Metadata = { title: "Purchases" };

export default async function PurchasesPage() {
  const business = await currentBusiness();
  const purchases = listPurchases(business.id);
  const categories = listCategories(business.id).map(({ id, name }) => ({ id, name }));

  return (
    <div className="page">
      <div className="title-row">
        <h1 className="title">Purchases</h1>
        <span className="count">{purchases.length}</span>
      </div>
      <table className="table table-tall">
        <colgroup>
          <col style={{ width: 120 }} />
          <col />
          <col style={{ width: 190 }} />
          <col style={{ width: 96 }} />
          <col style={{ width: 200 }} />
          <col style={{ width: 56 }} />
          <col style={{ width: 96 }} />
          <col style={{ width: 104 }} />
        </colgroup>
        <thead>
          <tr>
            <th>Date</th>
            <th>Item</th>
            <th>Distributor</th>
            <th>Invoice #</th>
            <th>Category</th>
            <th className="right">Qty</th>
            <th className="right">Unit price</th>
            <th className="right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase) => (
            <tr key={purchase.id}>
              <td className="supporting">{formatDate(purchase.invoice_date)}</td>
              <td className="strong">{purchase.description}</td>
              <td className="supporting">{purchase.distributor}</td>
              <td className="supporting">{purchase.invoice_number}</td>
              <td>
                <CategorySelect
                  purchaseId={purchase.id}
                  categoryId={purchase.category_id}
                  categories={categories}
                />
              </td>
              <td className="right">{formatQuantity(purchase.quantity)}</td>
              <td className="right">{formatMoney(purchase.unit_price_cents)}</td>
              <td className="right">{formatMoney(purchase.amount_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
