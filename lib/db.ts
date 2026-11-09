import { join } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

const DB_PATH = join(process.cwd(), "db", "restaurant.sqlite");
const UNIQUE_CONSTRAINT_FAILED = 2067;

function withDb<T>(work: (db: DatabaseSync) => T): T {
  const db = new DatabaseSync(DB_PATH);
  try {
    db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
    return work(db);
  } finally {
    db.close();
  }
}

function all<T>(sql: string, ...params: SQLInputValue[]): T[] {
  return withDb((db) => db.prepare(sql).all(...params).map((row) => ({ ...row }) as T));
}

function run(sql: string, ...params: SQLInputValue[]) {
  return withDb((db) => db.prepare(sql).run(...params));
}

function inTransaction(work: (db: DatabaseSync) => void) {
  withDb((db) => {
    db.exec("BEGIN");
    try {
      work(db);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  });
}

export type Business = {
  id: number;
  name: string;
  qbo_realm_id: string | null;
  qbo_send_from: string | null;
};

export type DistributorRow = {
  id: number;
  name: string;
  invoice_count: number;
  last_invoice_date: string | null;
  total_spend_cents: number;
};

export type QuickBooksStatus = "sent" | "error";

export type InvoiceRow = {
  id: number;
  invoice_date: string;
  distributor: string;
  invoice_number: string;
  item_count: number;
  total_cents: number;
  qbo_status: QuickBooksStatus | null;
};

export type Invoice = {
  id: number;
  invoice_date: string;
  distributor: string;
  invoice_number: string;
  total_cents: number;
  qbo_status: QuickBooksStatus | null;
  qbo_bill_id: string | null;
  qbo_error: string | null;
  qbo_sent_at: string | null;
};

export type InvoiceLine = {
  id: number;
  description: string;
  category_id: number | null;
  category: string | null;
  quantity: number;
  unit_price_cents: number;
  amount_cents: number;
};

export type PurchaseRow = {
  id: number;
  invoice_date: string;
  description: string;
  distributor: string;
  invoice_number: string;
  category_id: number | null;
  quantity: number;
  unit_price_cents: number;
  amount_cents: number;
};

export type Category = { id: number; name: string };

export type CategoryRow = Category & { purchase_count: number };

export type QuickBooksAccount = {
  id: string;
  name: string;
  account_type: string | null;
  classification: string | null;
};

export type CategoryAccountRow = {
  category_id: number;
  category: string;
  qbo_account_id: string | null;
  account_name: string | null;
  account_type: string | null;
};

export type Send = {
  request_json: string | null;
  status: number | null;
  response_json: string | null;
};

export type SendResult =
  | { qbo_status: "sent"; qbo_bill_id: string }
  | { qbo_status: "error"; qbo_error: string };

export function listBusinesses() {
  return all<Business>("SELECT id, name, qbo_realm_id, qbo_send_from FROM businesses ORDER BY id");
}

export function listDistributors(businessId: number) {
  return all<DistributorRow>(
    `SELECT d.id, d.name,
            COUNT(i.id) AS invoice_count,
            MAX(i.invoice_date) AS last_invoice_date,
            COALESCE(SUM(i.total_cents), 0) AS total_spend_cents
     FROM distributors d
     LEFT JOIN invoices i ON i.distributor_id = d.id
     WHERE d.business_id = ?
     GROUP BY d.id
     ORDER BY d.name COLLATE NOCASE`,
    businessId,
  );
}

export function listInvoices(businessId: number) {
  return all<InvoiceRow>(
    `SELECT i.id, i.invoice_date, d.name AS distributor, i.invoice_number, i.total_cents,
            (SELECT COUNT(*) FROM purchases p WHERE p.invoice_id = i.id) AS item_count,
            i.qbo_status
     FROM invoices i
     JOIN distributors d ON d.id = i.distributor_id
     WHERE i.business_id = ?
     ORDER BY i.invoice_date DESC, i.id DESC`,
    businessId,
  );
}

const INVOICE_COLUMNS = `i.id, i.invoice_date, d.name AS distributor, i.invoice_number, i.total_cents,
  i.qbo_status, i.qbo_bill_id, i.qbo_error, i.qbo_sent_at`;

export function getInvoice(businessId: number, invoiceId: number): Invoice | undefined {
  return all<Invoice>(
    `SELECT ${INVOICE_COLUMNS}
     FROM invoices i
     JOIN distributors d ON d.id = i.distributor_id
     WHERE i.business_id = ? AND i.id = ?`,
    businessId,
    invoiceId,
  )[0];
}

// The invoices the nightly send picks up: not sent yet or failed, dated on or after qbo_send_from.
export function listInvoicesToSend(businessId: number) {
  return all<Invoice>(
    `SELECT ${INVOICE_COLUMNS}
     FROM invoices i
     JOIN distributors d ON d.id = i.distributor_id
     JOIN businesses b ON b.id = i.business_id
     WHERE i.business_id = ?
       AND i.invoice_date >= b.qbo_send_from
       AND (i.qbo_status IS NULL OR i.qbo_status = 'error')
     ORDER BY i.invoice_date, i.id`,
    businessId,
  );
}

export function listInvoiceLines(invoiceId: number) {
  return all<InvoiceLine>(
    `SELECT p.id, p.description, p.category_id, c.name AS category, p.quantity, p.unit_price_cents,
            p.amount_cents
     FROM purchases p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.invoice_id = ?
     ORDER BY p.id`,
    invoiceId,
  );
}

export function listPurchases(businessId: number) {
  return all<PurchaseRow>(
    `SELECT p.id, i.invoice_date, p.description, d.name AS distributor, i.invoice_number,
            p.category_id, p.quantity, p.unit_price_cents, p.amount_cents
     FROM purchases p
     JOIN invoices i ON i.id = p.invoice_id
     JOIN distributors d ON d.id = i.distributor_id
     WHERE i.business_id = ?
     ORDER BY i.invoice_date DESC, i.id DESC, p.id`,
    businessId,
  );
}

export function listCategories(businessId: number) {
  return all<CategoryRow>(
    `SELECT c.id, c.name, COUNT(p.id) AS purchase_count
     FROM categories c
     LEFT JOIN purchases p ON p.category_id = c.id
     WHERE c.business_id = ?
     GROUP BY c.id
     ORDER BY c.name COLLATE NOCASE`,
    businessId,
  );
}

export function setPurchaseCategory(businessId: number, purchaseId: number, categoryId: number) {
  run(
    `UPDATE purchases SET category_id = ?
     WHERE id = ?
       AND invoice_id IN (SELECT id FROM invoices WHERE business_id = ?)
       AND EXISTS (SELECT 1 FROM categories WHERE id = ? AND business_id = ?)`,
    categoryId,
    purchaseId,
    businessId,
    categoryId,
    businessId,
  );
}

// Both return false when the business already has a category with that name.
export function addCategory(businessId: number, name: string) {
  return savingName(() =>
    run("INSERT INTO categories (business_id, name) VALUES (?, ?)", businessId, name),
  );
}

export function renameCategory(businessId: number, categoryId: number, name: string) {
  return savingName(() =>
    run("UPDATE categories SET name = ? WHERE id = ? AND business_id = ?", name, categoryId, businessId),
  );
}

function savingName(save: () => unknown) {
  try {
    save();
    return true;
  } catch (error) {
    if ((error as { errcode?: number }).errcode === UNIQUE_CONSTRAINT_FAILED) return false;
    throw error;
  }
}

export function listAssetAccounts() {
  return all<QuickBooksAccount>(
    `SELECT id, name, account_type, classification
     FROM qbo_accounts
     WHERE classification = 'Asset'
     ORDER BY name COLLATE NOCASE`,
  );
}

// Saves each account by its QuickBooks Id, replacing any row with the same Id.
export function saveAccounts(accounts: QuickBooksAccount[]) {
  inTransaction((db) => {
    const save = db.prepare(
      `INSERT INTO qbo_accounts (id, name, account_type, classification, imported_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT (id) DO UPDATE SET
         name = excluded.name,
         account_type = excluded.account_type,
         classification = excluded.classification,
         imported_at = excluded.imported_at`,
    );
    for (const account of accounts) {
      save.run(account.id, account.name, account.account_type, account.classification);
    }
  });
}

export function listCategoryAccounts(businessId: number) {
  return all<CategoryAccountRow>(
    `SELECT c.id AS category_id, c.name AS category, ca.qbo_account_id,
            a.name AS account_name, a.account_type
     FROM categories c
     LEFT JOIN category_accounts ca ON ca.category_id = c.id
     LEFT JOIN qbo_accounts a ON a.id = ca.qbo_account_id
     WHERE c.business_id = ?
     ORDER BY c.name COLLATE NOCASE`,
    businessId,
  );
}

// Maps each of the business's category ids to its QuickBooks account id.
export function getCategoryAccountIds(businessId: number) {
  const rows = all<{ category_id: number; qbo_account_id: string }>(
    `SELECT ca.category_id, ca.qbo_account_id
     FROM category_accounts ca
     JOIN categories c ON c.id = ca.category_id
     WHERE c.business_id = ?`,
    businessId,
  );
  return new Map(rows.map((row) => [row.category_id, row.qbo_account_id]));
}

export function setCategoryAccount(businessId: number, categoryId: number, accountId: string) {
  run(
    `INSERT INTO category_accounts (category_id, qbo_account_id)
     SELECT id, ? FROM categories WHERE id = ? AND business_id = ?
     ON CONFLICT (category_id) DO UPDATE SET qbo_account_id = excluded.qbo_account_id`,
    accountId,
    categoryId,
    businessId,
  );
}

// Saves one attempt in qbo_sends, and its result on the invoice.
export function saveSend(invoiceId: number, send: Send, result: SendResult) {
  inTransaction((db) => {
    const { sent_at } = db
      .prepare(
        `INSERT INTO qbo_sends (invoice_id, sent_at, request_json, status, response_json)
         VALUES (?, datetime('now'), ?, ?, ?)
         RETURNING sent_at`,
      )
      .get(invoiceId, send.request_json, send.status, send.response_json) as { sent_at: string };

    if (result.qbo_status === "sent") {
      db.prepare(
        `UPDATE invoices SET qbo_status = 'sent', qbo_bill_id = ?, qbo_error = NULL, qbo_sent_at = ?
         WHERE id = ?`,
      ).run(result.qbo_bill_id, sent_at, invoiceId);
    } else {
      db.prepare("UPDATE invoices SET qbo_status = 'error', qbo_error = ? WHERE id = ?").run(
        result.qbo_error,
        invoiceId,
      );
    }
  });
}
