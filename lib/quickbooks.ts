import * as db from "./db.ts";
import type { Business, Invoice, InvoiceLine, QuickBooksStatus } from "./db.ts";

const PRIVATE_NOTE = "Sent from Pathway";

type Ref = { value?: string };

export type BillLine = {
  Amount: number;
  Description: string;
  DetailType: "AccountBasedExpenseLineDetail";
  AccountBasedExpenseLineDetail: { AccountRef: Ref };
};

export type Bill = {
  VendorRef: Ref;
  DocNumber: string;
  TxnDate: string;
  PrivateNote: string;
  Line: BillLine[];
};

type Account = { Id: string; Name: string; AccountType: string; Classification: string };
type Vendor = { Id: string; DisplayName: string };

async function request(path: string, init?: RequestInit) {
  const response = await fetch(`${process.env.QUICKBOOKS_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.QUICKBOOKS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  return { status: response.status, body: await response.json() };
}

async function get<T>(path: string): Promise<T> {
  const { status, body } = await request(path);
  if (status !== 200) throw new Error(`QuickBooks GET ${path} returned ${status}: ${body.error}`);
  return body;
}

export async function importAccounts(business: Business) {
  const accounts = await get<Account[]>(`/companies/${business.qbo_realm_id}/accounts`);
  db.saveAccounts(
    accounts.map((account) => ({
      id: account.Id,
      name: account.Name,
      account_type: account.AccountType,
      classification: account.Classification,
    })),
  );
  return accounts.length;
}

export function buildBill(
  invoice: Pick<Invoice, "invoice_number" | "invoice_date">,
  purchases: Pick<InvoiceLine, "description" | "amount_cents" | "category_id">[],
  categoryAccounts: Map<number, string>,
  vendorId: string,
): Bill {
  return {
    VendorRef: { value: vendorId },
    DocNumber: invoice.invoice_number,
    TxnDate: invoice.invoice_date,
    PrivateNote: PRIVATE_NOTE,
    // Lines with no dollars are left off, and so are lines with no category: those are delivery
    // and fuel charges, which the bookkeeper doesn't track separately.
    Line: purchases.flatMap((purchase): BillLine[] =>
      purchase.amount_cents === 0 || purchase.category_id === null
        ? []
        : [
            {
              Amount: purchase.amount_cents / 100,
              Description: purchase.description,
              DetailType: "AccountBasedExpenseLineDetail",
              AccountBasedExpenseLineDetail: {
                AccountRef: { value: categoryAccounts.get(purchase.category_id) },
              },
            },
          ],
    ),
  };
}

export async function sendInvoice(business: Business, invoice: Invoice): Promise<QuickBooksStatus> {
  const company = `/companies/${business.qbo_realm_id}`;
  const vendors = await get<Vendor[]>(`${company}/vendors`);
  const vendor = vendors.find((vendor) => vendor.DisplayName === invoice.distributor);

  if (!vendor) {
    db.saveSend(
      invoice.id,
      { request_json: null, status: null, response_json: null },
      { qbo_status: "error", qbo_error: `No QuickBooks vendor named ${invoice.distributor}` },
    );
    return "error";
  }

  const bill = buildBill(
    invoice,
    db.listInvoiceLines(invoice.id),
    db.getCategoryAccountIds(business.id),
    vendor.Id,
  );
  const { status, body } = await request(`${company}/bills`, {
    method: "POST",
    body: JSON.stringify(bill),
  });
  const send = {
    request_json: JSON.stringify(bill),
    status,
    response_json: JSON.stringify(body),
  };

  if (status === 201) {
    db.saveSend(invoice.id, send, { qbo_status: "sent", qbo_bill_id: body.Id });
    return "sent";
  }
  db.saveSend(invoice.id, send, { qbo_status: "error", qbo_error: body.error });
  return "error";
}

export type SendSummary = { business: string; sent: number; errors: number };

export async function sendPending() {
  const summaries: SendSummary[] = [];
  for (const business of db.listBusinesses()) {
    if (!business.qbo_realm_id) continue;
    const summary = { business: business.name, sent: 0, errors: 0 };
    for (const invoice of db.listInvoicesToSend(business.id)) {
      if ((await sendInvoice(business, invoice)) === "sent") summary.sent++;
      else summary.errors++;
    }
    summaries.push(summary);
  }
  return summaries;
}
