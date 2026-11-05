"use client";

import { useEffect, useRef, useState } from "react";
import { switchBusiness } from "@/app/actions";
import type { Business } from "@/lib/db";

type Props = {
  businesses: Business[];
  current: Business;
};

export function BusinessSwitcher({ businesses, current }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="switcher" ref={root}>
      <button
        className="switcher-button"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Avatar business={current} large />
        <span className="switcher-name">{current.name}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-supporting)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m7 15 5 5 5-5" />
          <path d="m7 9 5-5 5 5" />
        </svg>
      </button>
      {open && (
        <div className="switcher-menu">
          <div className="switcher-notice">
            <div className="switcher-notice-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="18" height="11" x="3" y="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Super admin only
            </div>
            <p>Internal view. Customers only see their own business.</p>
          </div>
          <div className="switcher-options">
            {businesses.map((business) => {
              const selected = business.id === current.id;
              return (
                <form key={business.id} action={switchBusiness} onSubmit={() => setOpen(false)}>
                  <input type="hidden" name="businessId" value={business.id} />
                  <button className="switcher-option" type="submit" data-selected={selected}>
                    <Avatar business={business} />
                    <span className="switcher-option-name">{business.name}</span>
                    {selected && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ business, large = false }: { business: Business; large?: boolean }) {
  const classes = ["avatar", large && "avatar-large", business.id % 2 === 0 && "avatar-alt"];
  return (
    <span className={classes.filter(Boolean).join(" ")} aria-hidden="true">
      {business.name.charAt(0)}
    </span>
  );
}
