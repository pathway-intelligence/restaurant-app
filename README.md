# Pathway restaurant app

A simplified version of Pathway, the platform restaurants use to run their operations. It shows the invoices a restaurant receives from its distributors, what was bought on each one, and sends each invoice to the restaurant's QuickBooks as a bill.

**Start with [TASK.md](TASK.md).** This file only covers setup.

The follow-up call is a conversation without AI tools.

## Set up

You need [Node](https://nodejs.org) 22.13 or newer, and nothing else. The database is a local file, so there's no Docker or database server to install.

```bash
npm install
npm run dev
```

Open the URL printed in your terminal, usually http://localhost:3000. The first run creates the database and loads the sample data.

## Fake QuickBooks service

- **URL:** https://fake-quickbooks.onrender.com
- **Authentication token:** ask an interviewer for the token.

Put both in `.env.local` in the project folder:

```bash
QUICKBOOKS_URL=https://fake-quickbooks.onrender.com
QUICKBOOKS_TOKEN=YOUR_TOKEN
```

This stands in for the real QuickBooks API. It uses the same names for objects and fields, but it's simpler: there's no OAuth or query language, and money is in dollars.

Send the token on every request:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://fake-quickbooks.onrender.com/companies/1001/bills
```

Each restaurant has its own company, and every path starts with its company id:

| Restaurant | Company id |
|---|---|
| Alder Street Kitchen | `1001` |
| Juniper Taqueria | `1002` |

| Endpoint | What it returns |
|---|---|
| `GET /companies/:companyId/accounts` | A list with `Id`, `Name`, `FullyQualifiedName`, `AcctNum`, `Classification`, `AccountType`, `AccountSubType`, `Active` |
| `GET /companies/:companyId/vendors` | A list with `Id`, `DisplayName`, `Active` |
| `GET /companies/:companyId/bills` | A list of bills, with `Id`, `VendorRef`, `DocNumber`, `TxnDate`, `DueDate`, `TotalAmt`, `Balance`, `PrivateNote`, `Line` |
| `GET /companies/:companyId/bills/:id` | One bill, found by its `Id` |
| `POST /companies/:companyId/bills` | Checks a new bill and returns what it would create |

To create a bill, send JSON like this. `Id` and `value` fields are strings:

```json
{
  "VendorRef": { "value": "VENDOR_ID" },
  "DocNumber": "12345",
  "TxnDate": "2026-11-05",
  "Line": [
    {
      "Amount": 100.00,
      "DetailType": "AccountBasedExpenseLineDetail",
      "AccountBasedExpenseLineDetail": {
        "AccountRef": { "value": "ACCOUNT_ID" }
      }
    }
  ]
}
```

`POST` checks your bill and returns what it would create, including a new `Id`, but the bill won't appear when you read bills afterwards. Treat a `201` as success. A bill it can't accept gets a `400` with a short message saying why.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Applies any new migrations, then starts the app |
| `npm run quickbooks:send` | Sends each invoice that hasn't been sent, and each one that failed, to QuickBooks |
| `npm test` | Runs the tests |
| `npm run db:migrate` | Applies any new migrations |
| `npm run db:reset` | Deletes the database and starts over with the sample data |

The test QuickBooks keeps nothing, so sending never changes the books.

## What's in the repo

| Path | What it is |
|---|---|
| `app/` | The pages, and the actions that save changes |
| `components/` | The sidebar, business switcher and other small pieces |
| `lib/db.ts` | Every database query |
| `lib/quickbooks.ts` | Sending invoices to QuickBooks |
| `scripts/send.ts` | The nightly send, `npm run quickbooks:send` |
| `docs/quickbooks.md` | How sending to QuickBooks works |
| `db/migrations/` | The database schema, as SQL files |
| `db/seed.json` | The sample data |

It's Next.js and TypeScript, with SQLite through Node's built-in `node:sqlite`.
