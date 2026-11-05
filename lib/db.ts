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

export type Business = { id: number; name: string };

export type DistributorRow = {
  id: number;
  name: string;
  invoice_count: number;
  last_invoice_date: string | null;
  total_spend_cents: number;
};

export type InvoiceRow = {
  id: number;
  invoice_date: string;
  distributor: string;
  invoice_number: string;
  item_count: number;
  total_cents: number;
};

export type Invoice = {
  id: number;
  invoice_date: string;
  distributor: string;
  invoice_number: string;
  total_cents: number;
};

export type InvoiceLine = {
  id: number;
  description: string;
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

export function listBusinesses() {
  return all<Business>("SELECT id, name FROM businesses ORDER BY id");
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
            (SELECT COUNT(*) FROM purchases p WHERE p.invoice_id = i.id) AS item_count
     FROM invoices i
     JOIN distributors d ON d.id = i.distributor_id
     WHERE i.business_id = ?
     ORDER BY i.invoice_date DESC, i.id DESC`,
    businessId,
  );
}

export function getInvoice(businessId: number, invoiceId: number): Invoice | undefined {
  return all<Invoice>(
    `SELECT i.id, i.invoice_date, d.name AS distributor, i.invoice_number, i.total_cents
     FROM invoices i
     JOIN distributors d ON d.id = i.distributor_id
     WHERE i.business_id = ? AND i.id = ?`,
    businessId,
    invoiceId,
  )[0];
}

export function listInvoiceLines(invoiceId: number) {
  return all<InvoiceLine>(
    `SELECT p.id, p.description, c.name AS category, p.quantity, p.unit_price_cents, p.amount_cents
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
