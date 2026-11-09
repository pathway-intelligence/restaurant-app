-- Why: send invoices to QuickBooks as bills.
ALTER TABLE businesses ADD COLUMN qbo_realm_id TEXT;
ALTER TABLE businesses ADD COLUMN qbo_send_from TEXT;

CREATE TABLE qbo_accounts (
  id TEXT PRIMARY KEY,                 -- QuickBooks Account.Id
  name TEXT NOT NULL,
  account_type TEXT,
  classification TEXT,
  imported_at TEXT NOT NULL
);

CREATE TABLE category_accounts (
  category_id INTEGER PRIMARY KEY REFERENCES categories (id),
  qbo_account_id TEXT NOT NULL
);

ALTER TABLE invoices ADD COLUMN qbo_status TEXT;     -- NULL, 'sent' or 'error'
ALTER TABLE invoices ADD COLUMN qbo_bill_id TEXT;
ALTER TABLE invoices ADD COLUMN qbo_error TEXT;
ALTER TABLE invoices ADD COLUMN qbo_sent_at TEXT;

CREATE TABLE qbo_sends (
  id INTEGER PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices (id),
  sent_at TEXT NOT NULL,
  request_json TEXT,                   -- null when we never got as far as sending
  status INTEGER,                      -- HTTP status, null when nothing was sent
  response_json TEXT
);
