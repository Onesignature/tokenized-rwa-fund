"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#exit-paths", label: "Exit paths" },
  { href: "#engineering", label: "Engineering" },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6 sm:py-6">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-gold-200 to-gold-500 shadow-glow">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#1A1006">
              <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.236L18 8v8l-6 3.764L6 16V8l6-3.764z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[14px] font-semibold tracking-tight text-fg sm:text-[15px]">
              Tokenized RWA Fund
            </span>
            <span className="kbd-label hidden text-fg-faint sm:inline">MVP</span>
          </div>
        </Link>

        {/* Desktop nav + CTAs */}
        <div className="hidden items-center gap-6 md:flex">
          <nav className="flex items-center gap-5 text-sm text-fg-muted">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="transition hover:text-fg"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/simulate" className="btn-secondary !py-2">
              Try the demo
            </Link>
            <Link href="/app" className="btn-primary !py-2 text-sm">
              Launch app →
            </Link>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white/[0.02] text-fg hover:bg-white/[0.06] md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? (
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 5h10M3 8h10M3 11h10" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile slide-down panel */}
      <div
        className={`md:hidden absolute left-0 right-0 top-full z-30 origin-top border-y border-line bg-bg/95 backdrop-blur-xl shadow-2xl transition-all duration-200 ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 py-5">
          <nav className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium text-fg-muted transition hover:bg-white/[0.04] hover:text-fg"
              >
                {l.label}
                <svg viewBox="0 0 16 16" className="h-4 w-4 text-fg-subtle" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ))}
          </nav>

          <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
            <Link
              href="/simulate"
              onClick={() => setOpen(false)}
              className="btn-primary w-full !py-3 text-center text-base"
            >
              Try the demo · no wallet needed
            </Link>
            <Link
              href="/app"
              onClick={() => setOpen(false)}
              className="btn-secondary w-full !py-3 text-center text-base"
            >
              Launch live app →
            </Link>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 top-[73px] z-10 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
    </header>
  );
}
