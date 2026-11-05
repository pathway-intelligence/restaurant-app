CREATE TABLE businesses (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  business_id INTEGER REFERENCES businesses (id),
  name TEXT,
  UNIQUE (business_id, name)
);

CREATE TABLE distributors (
  id INTEGER PRIMARY KEY,
  business_id INTEGER REFERENCES businesses (id),
  name TEXT,
  UNIQUE (business_id, name)
);

CREATE TABLE invoices (
  id INTEGER PRIMARY KEY,
  business_id INTEGER REFERENCES businesses (id),
  distributor_id INTEGER REFERENCES distributors (id),
  invoice_number TEXT NOT NULL,
  invoice_date TEXT,
  total_cents INTEGER
);

CREATE TABLE purchases (
  id INTEGER PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices (id),
  description TEXT,
  quantity REAL,
  unit_price_cents INTEGER,
  amount_cents INTEGER,
  category_id INTEGER REFERENCES categories (id)
);
