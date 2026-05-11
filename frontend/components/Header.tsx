"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/ConnectButton";
import { networkInfo } from "@/lib/contracts";

export function Header() {
  const pathname = usePathname();
  const inSimulate = pathname?.startsWith("/simulate") ?? false;
  const basePath = inSimulate ? "/simulate" : "/app";

  const tabs = [
    { href: `${basePath}`, label: "Dashboard" },
    { href: `${basePath}/subscribe`, label: "Subscribe" },
    { href: `${basePath}/redeem`, label: "Redeem" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-gold-200 to-gold-500 shadow-glow">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="#1A1006">
                  <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.236L18 8v8l-6 3.764L6 16V8l6-3.764z" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[15px] font-semibold tracking-tight text-fg">
                  Tokenized RWA Fund
                </span>
                <span className="kbd-label text-fg-faint">MVP</span>
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
          <div className="flex items-center gap-3">
            {!inSimulate && (
              <div className="hidden md:block">
                <span className="chip">
                  <span className="chip-dot bg-gain shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  {networkInfo.network} · {networkInfo.chainId}
                </span>
              </div>
            )}
            {!inSimulate && <ConnectButton />}
            {inSimulate && (
              <span className="chip border-gold/30 bg-gold/[0.08] text-gold">
                <span className="chip-dot bg-gold" />
                Simulated wallet
              </span>
            )}
          </div>
        </div>
        <nav className="flex gap-1 pb-3 md:hidden">
          {tabs.map((tab) => {
            const active =
              tab.href === basePath
                ? pathname === basePath
                : pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 text-center ${
                  active ? "tab-pill-active" : "tab-pill-inactive"
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
