# The interview task

Pathway helps restaurants run their operations. The invoices their distributors send already come to us, so we know what each restaurant bought, line by line. This repo is a simplified version of our platform, and setup is in the [README](README.md).

## The problem

Two restaurants, Alder Street Kitchen and Juniper Taqueria, have asked for the same thing. In their words:

> "My bookkeeper retypes every invoice into QuickBooks by hand each day. You already have my invoices. Make that go away."

Here's what that costs them today:

- **The work gets done twice.** Every invoice is already in Pathway, and the bookkeeper still types it in again, every day.
- **It lives in one person's head.** Where each line belongs is something the bookkeeper just knows.
- **Mistakes surface late.** A wrong entry can sit unnoticed for weeks, and fixing it then costs far more than typing it did.
- **They still have to trust it.** The bookkeeper is happy to lose the typing, but still answers for what's in the books.

## What we'd like you to do

Work out how to make this go away, then build it on top of this app so it works for both restaurants.

- **The experience is yours to design.** Build any pages you want and change anything in the app.
- **QuickBooks:** we run a stand-in for its API. The [README](README.md#fake-quickbooks-service) lists each endpoint and what it returns.
- **The data is messy.** Nothing here or in QuickBooks has been cleaned up for you. You're welcome to build ways to help the customer clean it up.
- **You can change the database, but justify it.** Add whatever tables and migrations you need. At the top of each migration, say why it's needed, and expect us to ask.
- **You can ask questions.** One of your interviewers will answer as the bookkeeper.

## What this doesn't explain

We don't expect you to know anything about restaurants or accounting. This page covers how restaurants buy things and what's in our system, but **it doesn't explain accounting or QuickBooks.** Working out what you need to learn, where to find it and how much is enough is part of the task.

Please use AI as much as you like, and keep your chats so you can show us how you got there.

## How our system works

To help you get familiar with what's there today, here's how restaurants buy, what's in the app and how the data is stored.

### How restaurants buy

A restaurant doesn't shop at a store. It orders from **distributors**, which are companies that sell and deliver supplies. A typical restaurant has a handful: maybe one for most of its food, one for produce, one for meat, one for coffee. Some distributors sell services rather than goods, like washing linens.

1. The restaurant places an order, often several times a week.
2. The distributor delivers it and sends an **invoice**, which lists what was bought and what the restaurant owes.
3. The restaurant pays later, often some weeks afterwards.

Each row on an invoice is a **purchase**: one thing that was bought, with a quantity, a price and an amount. Pathway also gives each purchase a **category**, like Produce or Dairy, so a restaurant can see where its money goes.

### What's in the app

Each restaurant is a **business**. The switcher at the top of the sidebar moves between them. It's an internal view that customers wouldn't see.

| Page | What it shows |
|---|---|
| **Distributors** | Who the restaurant buys from |
| **Invoices** | Every invoice received, and what's on each one |
| **Purchases** | Every line from every invoice, where you can set its category |
| **Settings** | The restaurant's list of categories |

### The data

There are five tables, and the schema is in `db/migrations`.

| Table | What a row is | Columns |
|---|---|---|
| `businesses` | A restaurant | `name` |
| `distributors` | Someone a restaurant buys from | `business_id`, `name` |
| `categories` | A restaurant's way of grouping purchases | `business_id`, `name` |
| `invoices` | One invoice from a distributor | `business_id`, `distributor_id`, `invoice_number`, `invoice_date`, `total_cents` |
| `purchases` | One line on an invoice | `invoice_id`, `description`, `quantity`, `unit_price_cents`, `amount_cents`, `category_id` |

Every table also has an `id`. Money is stored in cents, and `total_cents` is the total printed on the invoice.

Here's part of one invoice, Greenhollow Produce `GH-5478`, dated October 19, 2026, with a total of $558.90:

| Description | Category | Quantity | Unit price | Amount |
|---|---|---:|---:|---:|
| Cucumbers, 24 ct case | Produce | 3 | $26.30 | $78.90 |
| Button mushrooms, 10 lb case | Produce | 2 | $38.40 | $76.80 |
| Roma tomatoes, 25 lb case | Produce | 1 | $41.35 | $41.35 |
