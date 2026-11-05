"use client";

import { useState, useTransition, type FormEvent } from "react";
import { addCategory, renameCategory, type SaveResult } from "@/app/actions";
import type { CategoryRow } from "@/lib/db";

const NEW_ROW = "new";

export function CategoriesSection({ categories }: { categories: CategoryRow[] }) {
  const [editing, setEditing] = useState<number | typeof NEW_ROW | null>(null);

  return (
    <section className="section">
      <div className="section-head">
        <div className="section-text">
          <h2 className="section-title">Categories</h2>
          <p className="section-description">The categories you can pick for a purchase.</p>
        </div>
        <button className="button" type="button" onClick={() => setEditing(NEW_ROW)}>
          Add category
        </button>
      </div>
      <table className="table">
        <colgroup>
          <col />
          <col style={{ width: 120 }} />
          <col style={{ width: 96 }} />
        </colgroup>
        <thead>
          <tr>
            <th>Category</th>
            <th className="right">Purchases</th>
            <th aria-label="Rename" />
          </tr>
        </thead>
        <tbody>
          {editing === NEW_ROW && (
            <NameRow save={addCategory} onDone={() => setEditing(null)} />
          )}
          {categories.map((category) =>
            editing === category.id ? (
              <NameRow
                key={category.id}
                name={category.name}
                purchaseCount={category.purchase_count}
                save={(formData) => renameCategory(category.id, formData)}
                onDone={() => setEditing(null)}
              />
            ) : (
              <tr key={category.id}>
                <td className="strong">{category.name}</td>
                <td className="right supporting">{category.purchase_count}</td>
                <td className="right rename-cell">
                  <button className="link-button" type="button" onClick={() => setEditing(category.id)}>
                    Rename
                  </button>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </section>
  );
}

type NameRowProps = {
  name?: string;
  purchaseCount?: number;
  save: (formData: FormData) => Promise<SaveResult>;
  onDone: () => void;
};

function NameRow({ name = "", purchaseCount, save, onDone }: NameRowProps) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await save(formData);
      if (result.error) setError(result.error);
      else onDone();
    });
  }

  return (
    <tr>
      <td colSpan={3}>
        <form
          className="name-form"
          onSubmit={submit}
          onKeyDown={(event) => {
            if (event.key === "Escape") onDone();
          }}
        >
          <div className="name-field">
            <input
              className="input"
              name="name"
              aria-label="Category"
              defaultValue={name}
              autoFocus
              onFocus={(event) => event.target.select()}
            />
            {error && <p className="field-error">{error}</p>}
          </div>
          <span className="name-count supporting">{purchaseCount}</span>
          <span className="name-actions">
            <button className="link-button" type="submit">
              Save
            </button>
            <button className="link-button" type="button" onClick={onDone}>
              Cancel
            </button>
          </span>
        </form>
      </td>
    </tr>
  );
}
