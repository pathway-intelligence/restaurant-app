# Sending invoices to QuickBooks

Each night Pathway sends every new invoice to the restaurant's QuickBooks as a bill, so the bookkeeper doesn't have to type it.

1. **Connect.** Each restaurant has one QuickBooks company, whose id is in `businesses.qbo_realm_id`. We send invoices dated on or after `businesses.qbo_send_from`.
2. **Import accounts.** Settings › QuickBooks › Import accounts copies the company's accounts into `qbo_accounts`, saving each one by its QuickBooks Id and replacing any row with the same Id. Account ids never change, so this only needs doing once.
3. **Map categories.** Each category picks the QuickBooks account its purchases go to, in the Category → Account table under Settings › QuickBooks. Restaurants buy inventory, so the list shows asset accounts. The choice is saved in `category_accounts`.
4. **Send.** Every night, `npm run quickbooks:send` sends each invoice that hasn't been sent, and each one that failed:
   - The vendor is the QuickBooks vendor with the distributor's name. If there isn't one, the invoice is marked Error.
   - There's one bill line per purchase, to its category's account, with the item as the description.
   - Lines with no category are left off. They're delivery and fuel charges, which the bookkeeper doesn't track separately.
   - Lines with no dollars are left off.
   - The bill number and date are the invoice's.
   - The note reads "Sent from Pathway".
5. **Status.** A 201 marks the invoice Sent and saves the bill's id. Anything else marks it Error with QuickBooks' message, and it's tried again the next night. Every attempt is saved in `qbo_sends`. The Invoices page shows each invoice's status in its QuickBooks column, and the invoice page shows it above the lines.
6. **Send again.** If a bill looks wrong in QuickBooks, fix the invoice's categories and press Send again on the invoice page.

**Launch.** We set the start date a week back, so bookkeepers could stop typing right away.

## What we send

`buildBill` in `lib/quickbooks.ts` takes the invoice, its purchases in id order, the map from category id to account id in `category_accounts`, and the vendor id. For Greenhollow Produce `GH-5521` it sends this, shown here with its first line only:

```json
{
  "VendorRef": { "value": "61" },
  "DocNumber": "GH-5521",
  "TxnDate": "2026-10-29",
  "PrivateNote": "Sent from Pathway",
  "Line": [
    {
      "Amount": 54.3,
      "Description": "Italian parsley, 12 ct bunch",
      "DetailType": "AccountBasedExpenseLineDetail",
      "AccountBasedExpenseLineDetail": { "AccountRef": { "value": "12" } }
    }
  ]
}
```

- Lines include only purchases with dollars and a category, in id order. `Amount` is `amount_cents / 100`.
- Refs carry `value` only, with no name. There is no `DueDate`.
- The vendor id comes from `GET /companies/:id/vendors`, matched by `DisplayName` equal to the distributor's name.

## What each attempt saves

`sendInvoice` writes one `qbo_sends` row and updates the invoice:

| Outcome | `qbo_sends` row | Invoice |
|---|---|---|
| No vendor with the distributor's name | `request_json`, `status` and `response_json` all null | `qbo_status` `'error'`, `qbo_error` "No QuickBooks vendor named …" |
| Any status other than 201 | The request, the status and the response body | `qbo_status` `'error'`, `qbo_error` the response's `error` |
| 201 | The request, 201 and the response body as returned | `qbo_status` `'sent'`, `qbo_bill_id` the response's `Id`, `qbo_sent_at` the row's `sent_at`, `qbo_error` null |

`request_json` and `response_json` are JSON text. Times are UTC text in SQLite's `datetime('now')` form, such as `2026-10-22 23:00:00`, and screens show the date part only.

`sendPending` runs for each business with a `qbo_realm_id`, in id order. It picks that business's invoices dated on or after `qbo_send_from` whose `qbo_status` is null or `'error'`, sorted by date, then id, and sends each one. Send again sends the invoice whatever its status, and replaces `qbo_bill_id`.

## Where it lives

| Path | What it is |
|---|---|
| `db/migrations/002_quickbooks.sql` | The new tables and columns |
| `lib/quickbooks.ts` | The QuickBooks client, `importAccounts`, `buildBill`, `sendInvoice` and `sendPending` |
| `lib/db.ts` | The queries |
| `scripts/send.ts` | `npm run quickbooks:send` |
| `lib/quickbooks.test.ts` | Checks that `buildBill` rebuilds every bill saved in `qbo_sends` |
