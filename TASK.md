# The interview task

Pathway helps restaurants run their operations. The invoices their distributors send already come to us, so we know what each restaurant bought, line by line. This repo is a simplified version of our platform, and setup is in the [README](README.md).

## What's happening

**Pathway sends invoices to QuickBooks now.** Two weeks ago we turned on QuickBooks sending for
Alder Street Kitchen and Juniper Taqueria. Each night it creates a bill in the restaurant's
QuickBooks for every new invoice, so their bookkeepers stopped retyping them. How it works is in
`docs/quickbooks.md`. The engineer who built it has moved to another team, and it's yours now.

This week we heard from two customers.

**Juniper's accountant, Nov 3:** "I'm closing October. Produce cost for the second half of the
month is almost nothing, and supplies expense stops after the 21st. Our count on the 31st came in
about $2,900 below what the books say we have. I also think we paid Bayline twice for one
invoice. Did something change on your side?"

**Alder's bookkeeper, Nov 4:** "I love not typing. But Bayline's statement says we still owe $932
on invoice 88107, and QuickBooks says we paid it in full. There are two bills for a few invoices
from mid-October, and the linen service is sitting in inventory. Our accountant posts food cost
from the month-end count, so I won't see food numbers until then. Can you look?"

**What we'd like from you.** You have one hour. Don't write code. Before anyone touches this, we
want to understand it. Come to the follow-up call ready to:

1. Show us what's wrong, most important first, with evidence from our data and from the books.
2. Explain why it's happening, in enough accounting that a new engineer could follow you.
3. Tell us what these two customers actually need, and what you'd change first.

Write down anything you'd want to ask the bookkeeper or accountant. One of us will answer in
character on the call.

We don't expect you to know anything about restaurants or accounting. Working out what you need
to learn is part of the task. Use AI as much as you like this hour, and keep your chats. **The
follow-up call is a conversation without AI tools.** Bring notes if you like.

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
| **Invoices** | Every invoice received, and what's on each one. The QuickBooks column shows whether each invoice was sent: Sent, Error or — |
| **Invoice** | One invoice's lines, with a status strip above them: the QuickBooks bill it became and when it was sent, or why it couldn't be sent, and a Send again button |
| **Purchases** | Every line from every invoice, where you can set its category |
| **Settings** | The restaurant's list of categories, and a QuickBooks section: the company id, the date sending starts from, Import accounts, and the QuickBooks account each category's purchases go to |

### The data

There are eight tables, and the schema is in `db/migrations`.

| Table | What a row is | Columns |
|---|---|---|
| `businesses` | A restaurant | `name`, `qbo_realm_id` (its QuickBooks company id), `qbo_send_from` (we send invoices dated on or after this) |
| `distributors` | Someone a restaurant buys from | `business_id`, `name` |
| `categories` | A restaurant's way of grouping purchases | `business_id`, `name` |
| `invoices` | One invoice from a distributor | `business_id`, `distributor_id`, `invoice_number`, `invoice_date`, `total_cents`, `qbo_status` (null, `sent` or `error`), `qbo_bill_id`, `qbo_error`, `qbo_sent_at` |
| `purchases` | One line on an invoice | `invoice_id`, `description`, `quantity`, `unit_price_cents`, `amount_cents`, `category_id` |
| `qbo_accounts` | A QuickBooks account, copied by Import accounts | `name`, `account_type`, `classification`, `imported_at` |
| `category_accounts` | The QuickBooks account a category's purchases go to | `category_id`, `qbo_account_id` |
| `qbo_sends` | One attempt to send an invoice to QuickBooks | `invoice_id`, `sent_at`, `request_json`, `status` (the HTTP status), `response_json` |

Every table except `category_accounts` also has an `id`, and in `qbo_accounts` it's the QuickBooks Id. Money is stored in cents, and `total_cents` is the total printed on the invoice. Times are UTC, like `2026-10-22 23:00:00`.

Here's part of one invoice, Greenhollow Produce `GH-5478`, dated October 19, 2026, with a total of $558.90:

| Description | Category | Quantity | Unit price | Amount |
|---|---|---:|---:|---:|
| Cucumbers, 24 ct case | Produce | 3 | $26.30 | $78.90 |
| Button mushrooms, 10 lb case | Produce | 2 | $38.40 | $76.80 |
| Roma tomatoes, 25 lb case | Produce | 1 | $41.35 | $41.35 |
