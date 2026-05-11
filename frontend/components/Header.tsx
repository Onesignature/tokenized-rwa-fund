"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const tabs = [
  { href: "/", label: "Dashboard" },
  { href: "/subscribe", label: "Subscribe" },
  { href: "/redeem", label: "Redeem" },
  { href: "/admin", label: "Admin" },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="border-b border-ink-200 bg-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="text-base font-semibold tracking-tight text-ink-900">
              Tokenized RWA Fund
            </span>
            <span className="text-xs text-ink-400">MVP</span>
          </Link>
          <nav className="hidden gap-1 md:flex">
            {tabs.map((tab) => {
              const active =
                tab.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-ink-100 text-ink-900"
                      : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
          <ConnectButton showBalance={false} accountStatus="address" />
        </div>
        <nav className="flex gap-1 pb-3 md:hidden">
          {tabs.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-medium transition ${
                  active
                    ? "bg-ink-100 text-ink-900"
                    : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
