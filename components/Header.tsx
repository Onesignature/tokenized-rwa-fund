"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ConnectButton } from "@/components/ConnectButton";
import { networkInfo } from "@/lib/contracts";

export function Header() {
  const pathname = usePathname();
  const inSimulate = pathname?.startsWith("/simulate") ?? false;
  const basePath = inSimulate ? "/simulate" : "/app";
  const [open, setOpen] = useState(false);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const tabs = [
    { href: `${basePath}`, label: "Dashboard" },
    { href: `${basePath}/swap`, label: "Swap" },
    { href: `${basePath}/subscribe`, label: "Subscribe" },
    { href: `${basePath}/redeem`, label: "Redeem" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between py-3.5 md:py-4">
          {/* Left: logo + desktop nav */}
          <div className="flex items-center gap-6 md:gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-gold-200 to-gold-500 shadow-glow">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="#1A1006">
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
            <nav className="hidden gap-1 md:flex">
              {tabs.map((tab) => {
                const active =
                  tab.href === basePath
                    ? pathname === basePath
                    : pathname?.startsWith(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={active ? "tab-pill-active" : "tab-pill-inactive"}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: desktop wallet controls + mobile hamburger */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex md:items-center md:gap-3">
              {!inSimulate && (
                <span className="chip">
                  <span className="chip-dot bg-gain shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  {networkInfo.network} · {networkInfo.chainId}
                </span>
              )}
              {!inSimulate && <ConnectButton />}
              {inSimulate && (
                <span className="chip border-gold/30 bg-gold/[0.08] text-gold">
                  <span className="chip-dot bg-gold" />
                  Simulated wallet
                </span>
              )}
            </div>

            {/* Hamburger (mobile) */}
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
        </div>
      </div>

      {/* Mobile slide-down menu */}
      <div
        className={`md:hidden absolute left-0 right-0 top-full origin-top border-b border-line bg-bg/95 backdrop-blur-xl shadow-xl transition-all duration-200 ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 py-4">
          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => {
              const active =
                tab.href === basePath
                  ? pathname === basePath
                  : pathname?.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium transition ${
                    active
                      ? "bg-white/[0.06] text-fg"
                      : "text-fg-muted hover:bg-white/[0.03] hover:text-fg"
                  }`}
                >
                  {tab.label}
                  <svg viewBox="0 0 16 16" className="h-4 w-4 text-fg-subtle" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-line pt-4">
            {!inSimulate ? (
              <div className="flex items-center justify-between gap-3">
                <span className="chip">
                  <span className="chip-dot bg-gain shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  {networkInfo.network} · {networkInfo.chainId}
                </span>
                <ConnectButton />
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span className="chip border-gold/30 bg-gold/[0.08] text-gold">
                  <span className="chip-dot bg-gold" />
                  Simulated wallet
                </span>
                <Link
                  href="/app"
                  onClick={() => setOpen(false)}
                  className="btn-quiet"
                >
                  Switch to live →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop (mobile only, when open) */}
      {open && (
        <div
          className="fixed inset-0 top-[57px] z-[-1] bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
    </header>
  );
}
