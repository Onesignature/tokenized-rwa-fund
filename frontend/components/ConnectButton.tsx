"use client";

import { ConnectButton as RKConnectButton } from "@rainbow-me/rainbowkit";

/**
 * Custom connect button using RainbowKit's render-prop API.
 * Lets us match the button to our own design system instead of relying on
 * RainbowKit's default styled element.
 */
export function ConnectButton() {
  return (
    <RKConnectButton.Custom>
      {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button onClick={openConnectModal} className="btn-primary">
                    Connect wallet
                  </button>
                );
              }

              return (
                <button
                  onClick={openAccountModal}
                  className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/[0.04] px-3 py-2 text-sm font-medium text-fg transition hover:bg-white/[0.08] hover:border-line-strong"
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-gain shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  <span className="font-mono text-xs tabular">
                    {account.displayName}
                  </span>
                  <svg
                    viewBox="0 0 16 16"
                    className="h-3 w-3 text-fg-subtle"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              );
            })()}
          </div>
        );
      }}
    </RKConnectButton.Custom>
  );
}
