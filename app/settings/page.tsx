import type { Metadata } from "next";
import { CategoriesSection } from "@/components/categories-section";
import { currentBusiness } from "@/lib/current-business";
import { listCategories } from "@/lib/db";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const business = await currentBusiness();

  return (
    <div className="page">
      <h1 className="title">Settings</h1>
      <CategoriesSection key={business.id} categories={listCategories(business.id)} />
    </div>
  );
}
