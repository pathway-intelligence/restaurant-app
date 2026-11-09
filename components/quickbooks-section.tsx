"use client";

import { useOptimistic, useTransition } from "react";
import { importAccounts, setCategoryAccount } from "@/app/actions";
import type { CategoryAccountRow, QuickBooksAccount } from "@/lib/db";
import { formatDate } from "@/lib/format";

type Props = {
  realmId: string;
  sendFrom: string;
  rows: CategoryAccountRow[];
  assetAccounts: QuickBooksAccount[];
};

export function QuickBooksSection({ realmId, sendFrom, rows, assetAccounts }: Props) {
  const [importing, startImport] = useTransition();

  return (
    <section className="section">
      <div className="section-head">
        <div className="section-text">
          <h2 className="section-title">QuickBooks</h2>
          <p className="section-description">
            Company {realmId} · Sending invoices from {formatDate(sendFrom)}
          </p>
        </div>
        <button
          className="button"
          type="button"
          disabled={importing}
          onClick={() => startImport(() => importAccounts())}
        >
          {importing ? "Importing…" : "Import accounts"}
        </button>
      </div>
      <table className="table">
        <colgroup>
          <col style={{ width: 240 }} />
          <col />
          <col style={{ width: 320 }} />
        </colgroup>
        <thead>
          <tr>
            <th>Category</th>
            <th>Account</th>
            <th aria-label="Change account" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.category_id}>
              <td className="strong">{row.category}</td>
              <td className="supporting">
                {row.account_name === null ? "—" : `${row.account_name} · ${row.account_type}`}
              </td>
              <td>
                <AccountSelect
                  categoryId={row.category_id}
                  accountId={row.qbo_account_id}
                  accounts={assetAccounts}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

type AccountSelectProps = {
  categoryId: number;
  accountId: string | null;
  accounts: QuickBooksAccount[];
};

function AccountSelect({ categoryId, accountId, accounts }: AccountSelectProps) {
  const listed = accounts.some((account) => account.id === accountId) ? accountId : null;
  const [value, setValue] = useOptimistic(listed);
  const [, startTransition] = useTransition();

  return (
    <select
      className="select select-wide"
      aria-label="Account"
      value={value ?? ""}
      onChange={(event) => {
        const next = event.target.value;
        startTransition(async () => {
          setValue(next);
          await setCategoryAccount(categoryId, next);
        });
      }}
    >
      {value === null && (
        <option value="" disabled hidden>
          Choose…
        </option>
      )}
      {accounts.map((account) => (
        <option key={account.id} value={account.id}>
          {`${account.name} · ${account.account_type}`}
        </option>
      ))}
    </select>
  );
}
