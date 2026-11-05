"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function NavLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link className="nav-link" href={href} aria-current={active ? "page" : undefined}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icon}
      </svg>
      {children}
    </Link>
  );
}

export function SidebarNav() {
  return (
    <>
      <nav className="nav">
        <NavLink
          href="/distributors"
          icon={
            <>
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
              <path d="M15 18H9" />
              <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
              <circle cx="17" cy="18" r="2" />
              <circle cx="7" cy="18" r="2" />
            </>
          }
        >
          Distributors
        </NavLink>
        <NavLink
          href="/invoices"
          icon={
            <>
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
            </>
          }
        >
          Invoices
        </NavLink>
        <NavLink
          href="/purchases"
          icon={
            <>
              <path d="M3 12h.01" />
              <path d="M3 18h.01" />
              <path d="M3 6h.01" />
              <path d="M8 12h13" />
              <path d="M8 18h13" />
              <path d="M8 6h13" />
            </>
          }
        >
          Purchases
        </NavLink>
      </nav>
      <div className="nav nav-bottom">
        <NavLink
          href="/settings"
          icon={
            <>
              <path d="M21 4h-7" />
              <path d="M10 4H3" />
              <path d="M21 12h-9" />
              <path d="M8 12H3" />
              <path d="M21 20h-5" />
              <path d="M12 20H3" />
              <path d="M14 2v4" />
              <path d="M8 10v4" />
              <path d="M16 18v4" />
            </>
          }
        >
          Settings
        </NavLink>
      </div>
    </>
  );
}
