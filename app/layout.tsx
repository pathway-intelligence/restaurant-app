import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BusinessSwitcher } from "@/components/business-switcher";
import { SidebarNav } from "@/components/sidebar-nav";
import { currentBusiness } from "@/lib/current-business";
import { listBusinesses } from "@/lib/db";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Restaurant app", template: "%s · Restaurant app" },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const business = await currentBusiness();

  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/inter-tight.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>
        <div className="app">
          <aside className="sidebar">
            <BusinessSwitcher businesses={listBusinesses()} current={business} />
            <SidebarNav />
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
