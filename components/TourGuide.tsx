"use client";

import { useEffect, useState } from "react";
import { useTour } from "@/contexts/TourContext";

export function TourGuide() {
  const { step, index, total, next, prev, skip, active } = useTour();
  const [show, setShow] = useState(false);

  // Fade-in when step changes
  useEffect(() => {
    if (!step) return;
    setShow(false);
    const t = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(t);
  }, [step?.id]);

  if (!active || !step) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {/* Card */}
      <div
        className={`pointer-events-auto fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 sm:w-[360px] sm:max-w-[calc(100vw-3rem)] transition-all duration-300 ${
          show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="relative overflow-hidden rounded-xl border border-gold/30 bg-bg-surface shadow-2xl">
          {/* Accent glow */}
          <div
            className="pointer-events-none absolute inset-x-0 -top-12 h-24"
            style={{
              background:
                "radial-gradient(50% 100% at 50% 100%, rgba(212,179,112,0.20), transparent)",
            }}
          />
          <div className="relative p-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="chip border-gold/30 bg-gold/[0.08] text-gold">
                <span className="chip-dot bg-gold shadow-[0_0_8px_rgba(212,179,112,0.6)]" />
                Guided tour
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-fg-faint tabular">
                  {index + 1} / {total}
                </span>
                <button
                  onClick={skip}
                  className="text-fg-subtle hover:text-fg transition"
                  aria-label="Dismiss tour"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="mt-4">
              <div className="text-base font-semibold text-fg">{step.title}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{step.body}</p>
              {step.hint && (
                <p className="mt-2 text-[11px] italic text-fg-subtle">{step.hint}</p>
              )}
            </div>

            {/* Progress */}
            <div className="mt-5 flex gap-1">
              {Array.from({ length: total }, (_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition ${
                    i < index
                      ? "bg-gold/60"
                      : i === index
                      ? "bg-gold shadow-[0_0_6px_rgba(212,179,112,0.5)]"
                      : "bg-white/[0.06]"
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-between gap-2">
              <button
                onClick={skip}
                className="text-xs font-medium text-fg-subtle hover:text-fg transition"
              >
                Skip tour
              </button>
              <div className="flex items-center gap-2">
                {index > 0 && (
                  <button onClick={prev} className="btn-quiet">
                    Back
                  </button>
                )}
                <button onClick={next} className="btn-primary !py-2 !px-4 text-sm">
                  {index === total - 1 ? "Done" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
