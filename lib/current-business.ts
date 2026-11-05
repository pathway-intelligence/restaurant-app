import { cookies } from "next/headers";
import { listBusinesses } from "./db";

export const BUSINESS_COOKIE = "business_id";

export async function currentBusiness() {
  const selected = (await cookies()).get(BUSINESS_COOKIE)?.value;
  const businesses = listBusinesses();
  return businesses.find((business) => String(business.id) === selected) ?? businesses[0];
}
