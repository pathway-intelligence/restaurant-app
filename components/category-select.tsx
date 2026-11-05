"use client";

import { useOptimistic, useTransition } from "react";
import { setPurchaseCategory } from "@/app/actions";
import type { Category } from "@/lib/db";

type Props = {
  purchaseId: number;
  categoryId: number | null;
  categories: Category[];
};

export function CategorySelect({ purchaseId, categoryId, categories }: Props) {
  const [value, setValue] = useOptimistic(categoryId);
  const [, startTransition] = useTransition();

  return (
    <select
      className="select"
      aria-label="Category"
      value={value ?? ""}
      onChange={(event) => {
        const next = Number(event.target.value);
        startTransition(async () => {
          setValue(next);
          await setPurchaseCategory(purchaseId, next);
        });
      }}
    >
      {value === null && (
        <option value="" disabled hidden>
          Choose…
        </option>
      )}
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}
