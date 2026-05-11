"use client";

import type { Activity } from "@/lib/fund-types";
import { fmtNav, fmtToken, fmtUsdc } from "@/lib/format";

interface Props {
  items: Activity[];
  limit?: number;
}

export function ActivityFeed({ items, limit = 10 }: Props) {
  if (items.length === 0) {
    return (
      <div className="card text-sm text-fg-subtle">
        No activity yet. Subscribe or update NAV to see events appear here.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-bg-surface">
      <div className="divide-y divide-line">
        {items.slice(0, limit).map((a, i) => (
          <ActivityRow key={`${a.txHash}-${i}`} item={a} />
        ))}
      </div>
    </div>
  );
}

function ActivityRow({ item }: { item: Activity }) {
  const time = formatTimeAgo(Number(item.timestamp));
  const exact = new Date(Number(item.timestamp) * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (item.kind === "nav") {
    const direction =
      item.newNav > item.oldNav ? "up" : item.newNav < item.oldNav ? "down" : "init";
    const pct =
      item.oldNav === 0n
        ? 0
        : (Number(item.newNav - item.oldNav) / Number(item.oldNav)) * 100;
    return (
      <Row
        icon={<NavIcon direction={direction} />}
        title={
          <>
            NAV updated to{" "}
            <span className="tabular font-semibold text-fg">${fmtNav(item.newNav)}</span>
            {direction !== "init" && (
              <span
                className={`ml-2 tabular text-sm ${
                  direction === "up" ? "text-gain" : "text-loss"
                }`}
              >
                {direction === "up" ? "+" : ""}
                {pct.toFixed(2)}%
              </span>
            )}
          </>
        }
        sub={`from $${fmtNav(item.oldNav)}`}
        time={time}
        title2={exact}
      />
    );
  }

  if (item.kind === "subscribe") {
    return (
      <Row
        icon={<SubscribeIcon />}
        title={
          <>
            <span className="tabular font-semibold text-fg">${fmtUsdc(item.usdcIn)}</span>{" "}
            <span className="text-fg-faint">→</span>{" "}
            <span className="tabular font-semibold text-fg">
              {fmtToken(item.tokensOut)} FFT
            </span>
          </>
        }
        sub={`${short(item.subscriber)} subscribed at NAV $${fmtNav(item.navAtSubscription)}`}
        time={time}
        title2={exact}
      />
    );
  }

  if (item.kind === "redeem") {
    return (
      <Row
        icon={<RedeemIcon />}
        title={
          <>
            <span className="tabular font-semibold text-fg">
              {fmtToken(item.tokensIn)} FFT
            </span>{" "}
            <span className="text-fg-faint">→</span>{" "}
            <span className="tabular font-semibold text-fg">
              ${fmtUsdc(item.usdcOut)}
            </span>
          </>
        }
        sub={
          item.discountBps > 0n
            ? `${short(item.redeemer)} redeemed at NAV $${fmtNav(item.navAtRedemption)} · Path B ${
                Number(item.discountBps) / 100
              }%`
            : `${short(item.redeemer)} redeemed at NAV $${fmtNav(item.navAtRedemption)} · Path A`
        }
        time={time}
        title2={exact}
      />
    );
  }

  return (
    <Row
      icon={<KycIcon active={item.kycd} />}
      title={
        item.kycd
          ? "Address added to KYC allowlist"
          : "Address removed from KYC allowlist"
      }
      sub={short(item.account)}
      time={time}
      title2={exact}
    />
  );
}

function Row({
  icon,
  title,
  sub,
  time,
  title2,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  sub?: string;
  time: string;
  title2?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-white/[0.02] sm:gap-4 sm:px-5 sm:py-4">
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-fg">{title}</div>
        {sub && <div className="mt-0.5 truncate text-xs text-fg-subtle">{sub}</div>}
      </div>
      <div className="shrink-0 text-right">
        <div className="text-xs text-fg-subtle tabular">{time}</div>
        {title2 && (
          <div className="hidden text-[10px] text-fg-faint sm:block">{title2}</div>
        )}
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────

function NavIcon({ direction }: { direction: "up" | "down" | "init" }) {
  const color =
    direction === "up"
      ? "text-gain bg-gain-soft border-gain/30"
      : direction === "down"
      ? "text-loss bg-loss-soft border-loss/30"
      : "text-gold bg-gold/[0.08] border-gold/30";
  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-full border ${color}`}
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        {direction === "up" && (
          <path d="M3 11l5-5 3 3 2-3" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {direction === "down" && (
          <path d="M3 5l5 5 3-3 2 3" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {direction === "init" && <circle cx="8" cy="8" r="3" fill="currentColor" />}
      </svg>
    </div>
  );
}

function SubscribeIcon() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.08] text-gold">
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 3v10M3 8l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function RedeemIcon() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-fg-muted/20 bg-white/[0.04] text-fg-muted">
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 13V3M3 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function KycIcon({ active }: { active: boolean }) {
  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-full border ${
        active
          ? "text-gain bg-gain-soft border-gain/30"
          : "text-fg-subtle bg-white/[0.04] border-line"
      }`}
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function short(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatTimeAgo(unixSec: number): string {
  if (!unixSec) return "—";
  const diff = Math.floor(Date.now() / 1000) - unixSec;
  if (diff < 5) return "now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
