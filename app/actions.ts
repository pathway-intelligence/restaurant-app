"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as db from "@/lib/db";
import { BUSINESS_COOKIE, currentBusiness } from "@/lib/current-business";

const ONE_YEAR = 60 * 60 * 24 * 365;

export type SaveResult = { error?: string };

export async function switchBusiness(formData: FormData) {
  const id = Number(formData.get("businessId"));
  if (db.listBusinesses().some((business) => business.id === id)) {
    (await cookies()).set(BUSINESS_COOKIE, String(id), {
      path: "/",
      maxAge: ONE_YEAR,
      sameSite: "lax",
      httpOnly: true,
    });
  }
  redirect("/invoices");
}

export async function setPurchaseCategory(purchaseId: number, categoryId: number) {
  const business = await currentBusiness();
  db.setPurchaseCategory(business.id, purchaseId, categoryId);
  revalidatePath("/", "layout");
}

export async function addCategory(formData: FormData): Promise<SaveResult> {
  const name = categoryName(formData);
  if (!name) return { error: "Enter a name." };
  const business = await currentBusiness();
  if (!db.addCategory(business.id, name)) return { error: "That name is already used." };
  revalidatePath("/", "layout");
  return {};
}

export async function renameCategory(categoryId: number, formData: FormData): Promise<SaveResult> {
  const name = categoryName(formData);
  if (!name) return { error: "Enter a name." };
  const business = await currentBusiness();
  if (!db.renameCategory(business.id, categoryId, name)) return { error: "That name is already used." };
  revalidatePath("/", "layout");
  return {};
}

function categoryName(formData: FormData) {
  return String(formData.get("name") ?? "").trim();
}
