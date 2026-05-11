import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 30% -10%, rgba(212,179,112,0.14), transparent 50%), radial-gradient(circle at 85% 30%, rgba(52,211,153,0.05), transparent 55%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 60%)",
        }}
      />

      {/* Top bar */}
      <header className="relative z-10">
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
          <div className="flex items-center gap-2">
            <Link
              href="/simulate"
              className="btn-secondary !py-2 hidden sm:inline-flex"
            >
              Try the demo
            </Link>
            <Link href="/app" className="btn-primary !py-2 text-sm">
              Launch app →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pb-12 sm:pt-20 lg:pt-24">
          <div className="max-w-3xl">
            <h1 className="display text-[40px] leading-[1.05] text-fg sm:text-5xl lg:text-7xl">
              Tokenized exposure to the
              <br className="hidden sm:inline" />
              {" "}funds you trust.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-fg-muted sm:mt-6 sm:text-lg">
              A stablecoin-denominated fund token, backed 1:1 by units in an off-chain
              hedge fund. Token value tracks the fund's NAV. Subscribe in seconds, settle
              on-chain, redeem when ready.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/simulate"
                className="btn-primary !px-5 !py-3 text-center text-base"
              >
                Try the demo · no wallet needed
              </Link>
              <Link
                href="/app"
                className="btn-secondary !px-5 !py-3 text-center text-base"
              >
                Launch live app →
              </Link>
            </div>
            <p className="mt-3 text-xs text-fg-faint">
              The demo runs entirely in your browser. No keys, no testnet, no setup.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-8 sm:mt-12 sm:gap-x-8 sm:gap-y-4 sm:grid-cols-4">
              <KeyStat label="Settlement" value="On-chain" sub="seconds, not days" />
              <KeyStat label="Minimum" value="$100" sub="vs $100K institutional" />
              <KeyStat label="Reach" value="Global" sub="anywhere you hold USDC" />
              <KeyStat label="Compliance" value="Allowlist" sub="institutional KYC" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 border-t border-line bg-bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <div className="kbd-label text-gold">How it works</div>
            <h2 className="display mt-3 text-[28px] text-fg sm:text-4xl">
              One stack, three layers.
            </h2>
            <p className="mt-3 text-fg-muted">
              The on-chain layer never touches regulated equity. It only tokenizes claims
              on units in a regulated off-chain fund.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card
              num="01"
              title="Investors"
              body="Send USDC, receive fund tokens minted at the current NAV. Hold them, transfer between KYC'd addresses, or redeem for stablecoin."
            />
            <Card
              num="02"
              title="Feeder fund (on-chain)"
              body="A smart-contract layer that pools investor stablecoin and tokenizes the position. Subscriptions, redemptions, NAV propagation — all transparent and atomic."
              accent
            />
            <Card
              num="03"
              title="Source fund (off-chain)"
              body="A regulated hedge fund holding the listed equity. Reports NAV on a periodic cadence. The feeder fund subscribes as a single institutional unit-holder."
            />
          </div>

          <ValueFlow />

        </div>
      </section>

      {/* Exit paths */}
      <section className="relative z-10">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <div className="kbd-label text-gold">Exit paths</div>
            <h2 className="display mt-3 text-[28px] text-fg sm:text-4xl">
              Two ways out, both clean.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <PathCard
              tag="Path A"
              tagAccent="gain"
              title="Redeem at NAV"
              body="The Source Fund exits the underlying position. Realized proceeds settle the treasury. Investors burn tokens, receive USDC at NAV. Cycle closed."
            />
            <PathCard
              tag="Path B"
              tagAccent="gold"
              title="Market-maker buyback at NAV − discount"
              body="Source Fund keeps the underlying. A fresh institutional round funds a token buyback at NAV minus a small discount (e.g. 5%). Token holders exit; the position rides on."
            />
          </div>
        </div>
      </section>

      {/* Stack */}
      <section className="relative z-10 border-t border-line bg-bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div>
              <div className="kbd-label text-gold">Engineering</div>
              <h2 className="display mt-3 text-[28px] text-fg sm:text-4xl">
                Built like a financial product.
              </h2>
              <p className="mt-3 max-w-md text-fg-muted">
                The on-chain stack is small, auditable, and built on standards used by
                BlackRock BUIDL, KKR's tokenized funds, and the Hamilton Lane feeders.
              </p>
            </div>
            <ul className="space-y-3 text-sm">
              <Bullet>
                <strong className="text-fg">Solidity 0.8.24</strong>, OpenZeppelin v5
                contracts, deployed via Hardhat
              </Bullet>
              <Bullet>
                <strong className="text-fg">Transfer-gated ERC-20</strong> — tokens move
                only between KYC-approved addresses
              </Bullet>
              <Bullet>
                <strong className="text-fg">NAV oracle</strong> with per-update sanity
                bound (±50%), authorized updater, full event log
              </Bullet>
              <Bullet>
                <strong className="text-fg">Path A / Path B redemption</strong> as a
                first-class primitive, not an afterthought
              </Bullet>
              <Bullet>
                <strong className="text-fg">42 contract tests passing</strong> including a
                full subscribe → NAV → redeem lifecycle integration
              </Bullet>
              <Bullet>
                <strong className="text-fg">Self-custody</strong> · investor stablecoin
                balances + KYC allowlist, no custodial dependency
              </Bullet>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/[0.08] via-transparent to-transparent p-6 sm:rounded-3xl sm:p-10 lg:p-16">
            <div className="max-w-2xl">
              <h2 className="display text-3xl text-fg sm:text-4xl lg:text-5xl">
                Take it for a spin.
              </h2>
              <p className="mt-4 text-fg-muted">
                The live MVP runs on a local testnet. Connect a wallet, get test USDC,
                subscribe, watch the NAV move, and redeem.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href="/simulate"
                  className="btn-primary !px-6 !py-3 text-center text-base"
                >
                  Try the demo
                </Link>
                <Link
                  href="/app"
                  className="btn-secondary !px-6 !py-3 text-center text-base"
                >
                  Launch live app →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-fg-faint sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
          <span>Tokenized RWA Fund · MVP</span>
          <span>Not an offer to sell securities. For demonstration only.</span>
        </div>
      </footer>
    </div>
  );
}

function ValueFlow() {
  const nodes = [
    {
      label: "Investor",
      sub: "HNI / family office / EAM",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 21c0-3.866 3.134-7 7-7s7 3.134 7 7" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Feeder fund",
      sub: "on-chain",
      accent: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="6" width="16" height="13" rx="2" />
          <path d="M4 10h16M9 14h2M13 14h2" strokeLinecap="round" />
          <path d="M8 6V4M16 6V4" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Source fund",
      sub: "off-chain hedge fund",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Listed equity",
      sub: "the underlying",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 19h16M4 19v-5l4-2 4 3 4-4 4 2v6" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx="8" cy="12" r="0.5" fill="currentColor" />
          <circle cx="16" cy="11" r="0.5" fill="currentColor" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-bg-surface">
      <div className="border-b border-line px-6 py-4">
        <div className="kbd-label">Value flow</div>
      </div>

      <div className="relative px-4 py-10 sm:px-8">
        {/* Decorative grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative">
          {/* Forward flow (capital) */}
          <div className="mb-3 flex items-center gap-2 px-2">
            <span className="kbd-label text-gold">Capital flows down</span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-stretch">
            <Node node={nodes[0]} />
            <Arrow label="USDC" direction="right" />
            <Node node={nodes[1]} />
            <Arrow label="subscribes" direction="right" />
            <Node node={nodes[2]} />
            <Arrow label="buys at entry" direction="right" />
            <Node node={nodes[3]} />
          </div>

          {/* Reverse flow (NAV) */}
          <div className="mt-10 flex items-center gap-2 px-2">
            <span className="kbd-label text-gain">NAV propagates back up</span>
          </div>

          <div className="relative mt-3 overflow-hidden rounded-xl border border-gain/20 bg-gain/[0.04] p-4">
            <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
              <span className="text-xs text-fg-muted">
                Listed equity moves → Source Fund marks NAV → Feeder NAV updates → Token
                price tracks
              </span>
              <NavArrow />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Node({
  node,
}: {
  node: { label: string; sub: string; icon: React.ReactNode; accent?: boolean };
}) {
  return (
    <div
      className={`relative flex flex-col items-center gap-2 rounded-xl border bg-bg-raised p-4 text-center ${
        node.accent ? "border-gold/40 shadow-glow" : "border-line"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${
          node.accent
            ? "bg-gold/[0.12] text-gold border border-gold/30"
            : "bg-white/[0.04] text-fg-muted border border-line"
        }`}
      >
        {node.icon}
      </div>
      <div>
        <div className={`text-sm font-semibold ${node.accent ? "text-gold" : "text-fg"}`}>
          {node.label}
        </div>
        <div className="text-[11px] text-fg-faint">{node.sub}</div>
      </div>
    </div>
  );
}

function Arrow({ label, direction }: { label: string; direction: "right" }) {
  return (
    <div className="flex flex-col items-center justify-center px-1 md:py-6">
      <div className="kbd-label text-fg-subtle">{label}</div>
      <svg
        viewBox="0 0 60 16"
        className="mt-1 h-3 w-12 text-fg-subtle md:w-16"
        fill="none"
      >
        <defs>
          <linearGradient id={`arrow-${label}`} x1="0" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="100%" stopColor="#D4B370" stopOpacity="1" />
          </linearGradient>
        </defs>
        <line x1="0" y1="8" x2="50" y2="8" stroke={`url(#arrow-${label})`} strokeWidth="1.5" />
        <path d="M44 4 L52 8 L44 12" fill="none" stroke="#D4B370" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function NavArrow() {
  return (
    <svg viewBox="0 0 200 16" className="h-3 w-40 shrink-0 text-gain" fill="none">
      <defs>
        <linearGradient id="nav-arrow" x1="200" y1="0" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="100%" stopColor="#34D399" stopOpacity="1" />
        </linearGradient>
      </defs>
      <line x1="200" y1="8" x2="14" y2="8" stroke="url(#nav-arrow)" strokeWidth="1.5" />
      <path d="M20 4 L12 8 L20 12" fill="none" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KeyStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="kbd-label">{label}</div>
      <div className="display mt-1 text-2xl text-fg">{value}</div>
      <div className="text-[11px] text-fg-faint">{sub}</div>
    </div>
  );
}

function Card({
  num,
  title,
  body,
  accent,
}: {
  num: string;
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-bg-surface p-6 ${
        accent ? "border-gold/30" : "border-line"
      }`}
    >
      {accent && (
        <div
          className="pointer-events-none absolute inset-x-0 -top-12 h-24"
          style={{
            background:
              "radial-gradient(50% 100% at 50% 100%, rgba(212,179,112,0.15), transparent)",
          }}
        />
      )}
      <div className="relative">
        <div
          className={`kbd-label ${accent ? "text-gold" : "text-fg-subtle"}`}
        >
          {num}
        </div>
        <div className="mt-2 text-lg font-semibold text-fg">{title}</div>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">{body}</p>
      </div>
    </div>
  );
}

function PathCard({
  tag,
  tagAccent,
  title,
  body,
}: {
  tag: string;
  tagAccent: "gain" | "gold";
  title: string;
  body: string;
}) {
  const color =
    tagAccent === "gain"
      ? "border-gain/30 bg-gain-soft text-gain"
      : "border-gold/30 bg-gold/[0.08] text-gold";
  return (
    <div className="rounded-2xl border border-line bg-bg-surface p-8">
      <span className={`chip ${color}`}>
        <span className="chip-dot bg-current" />
        {tag}
      </span>
      <div className="display mt-4 text-2xl text-fg">{title}</div>
      <p className="mt-3 text-sm leading-relaxed text-fg-muted">{body}</p>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
      <span className="text-fg-muted">{children}</span>
    </li>
  );
}
