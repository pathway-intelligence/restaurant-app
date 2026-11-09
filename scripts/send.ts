import { sendPending } from "../lib/quickbooks.ts";

for (const { business, sent, errors } of await sendPending()) {
  console.log(`${business}: ${sent} sent, ${errors} with errors`);
}
