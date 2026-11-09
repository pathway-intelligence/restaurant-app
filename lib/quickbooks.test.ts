import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildBill } from "./quickbooks.ts";

type Seed = {
  invoices: { id: number; invoice_number: string; invoice_date: string }[];
  purchases: {
    id: number;
    invoice_id: number;
    description: string;
    amount_cents: number;
    category_id: number | null;
  }[];
  category_accounts: { category_id: number; qbo_account_id: string }[];
  qbo_sends: { id: number; invoice_id: number; request_json: string | null }[];
};

const seed: Seed = JSON.parse(readFileSync(new URL("../db/seed.json", import.meta.url), "utf8"));
const categoryAccounts = new Map(
  seed.category_accounts.map((row) => [row.category_id, row.qbo_account_id]),
);

for (const send of seed.qbo_sends) {
  if (send.request_json === null) continue;
  const logged = JSON.parse(send.request_json);

  test(`buildBill rebuilds the bill in qbo_sends ${send.id}`, () => {
    const invoice = seed.invoices.find((row) => row.id === send.invoice_id);
    assert.ok(invoice);
    const purchases = seed.purchases
      .filter((purchase) => purchase.invoice_id === invoice.id)
      .sort((a, b) => a.id - b.id);

    // The vendor list lives in QuickBooks, so the logged vendor id stands in for the lookup.
    const bill = buildBill(invoice, purchases, categoryAccounts, logged.VendorRef.value);

    assert.deepEqual(JSON.parse(JSON.stringify(bill)), logged);
  });
}
