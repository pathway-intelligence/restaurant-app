import type { Metadata } from "next";
import { CategoriesSection } from "@/components/categories-section";
import { QuickBooksSection } from "@/components/quickbooks-section";
import { currentBusiness } from "@/lib/current-business";
import { listAssetAccounts, listCategories, listCategoryAccounts } from "@/lib/db";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const business = await currentBusiness();

  return (
    <div className="page">
      <h1 className="title">Settings</h1>
      <CategoriesSection key={business.id} categories={listCategories(business.id)} />
      {business.qbo_realm_id && business.qbo_send_from && (
        <QuickBooksSection
          realmId={business.qbo_realm_id}
          sendFrom={business.qbo_send_from}
          rows={listCategoryAccounts(business.id)}
          assetAccounts={listAssetAccounts()}
        />
      )}
    </div>
  );
}
