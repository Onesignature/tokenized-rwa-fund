"use client";

import { useMemo, useState } from "react";
import type { Activity } from "@/lib/fund-types";
import { formatUnits } from "viem";

interface NavChartProps {
  activity: Activity[];
  currentNav?: bigint;
}

export function NavChart({ activity, currentNav }: NavChartProps) {
  const [hover, setHover] = useState<number | null>(null);

  const points = useMemo(() => {
    const navUpdates = activity
      .filter((a): a is Extract<Activity, { kind: "nav" }> => a.kind === "nav")
      .sort((a, b) => Number(a.timestamp - b.timestamp));
    return navUpdates.map((u) => ({
      timestamp: Number(u.timestamp),
      nav: Number(formatUnits(u.newNav, 18)),
    }));
  }, [activity]);

  if (points.length < 2) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-line text-center">
        <div className="text-xs text-fg-subtle">No history yet</div>
        <div className="mt-1 text-[11px] text-fg-faint">
          Update NAV to populate the chart
        </div>
      </div>
    );
  }

  const minNav = Math.min(...points.map((p) => p.nav));
  const maxNav = Math.max(...points.map((p) => p.nav));
  const padding = (maxNav - minNav) * 0.15 || 0.1;
  const yMin = Math.max(0, minNav - padding);
  const yMax = maxNav + padding;

  const W = 600;
  const H = 180;
  const PX = 0;
  const PY = 16;

  const xScale = (i: number) => PX + (i / Math.max(1, points.length - 1)) * (W - 2 * PX);
  const yScale = (v: number) => PY + (1 - (v - yMin) / (yMax - yMin)) * (H - 2 * PY);

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(2)},${yScale(p.nav).toFixed(2)}`)
    .join(" ");

  const areaD = `${pathD} L ${xScale(points.length - 1).toFixed(2)},${H - PY} L ${PX},${
    H - PY
  } Z`;

  const lastPoint = points[points.length - 1];
  const lastX = xScale(points.length - 1);
  const lastY = yScale(lastPoint.nav);

  const focused = hover !== null ? points[hover] : null;
  const focusX = hover !== null ? xScale(hover) : null;
  const focusY = hover !== null ? yScale(focused!.nav) : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-44 w-full"
        preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * W;
          // find closest point
          let best = 0;
          let bestDist = Infinity;
          for (let i = 0; i < points.length; i++) {
            const dx = Math.abs(x - xScale(i));
            if (dx < bestDist) {
              best = i;
              bestDist = dx;
            }
          }
          setHover(best);
        }}
      >
        <defs>
          <linearGradient id="navFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4B370" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#D4B370" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="navStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#D4B370" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#E8D7A6" stopOpacity="1" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={PX}
            x2={W - PX}
            y1={PY + t * (H - 2 * PY)}
            y2={PY + t * (H - 2 * PY)}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        ))}

        <path d={areaD} fill="url(#navFill)" />
        <path
          d={pathD}
          fill="none"
          stroke="url(#navStroke)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Last point with glow */}
        <circle
          cx={lastX}
          cy={lastY}
          r={5}
          fill="#D4B370"
          filter="url(#glow)"
        />
        <circle cx={lastX} cy={lastY} r={2.5} fill="#FFF8E7" />

        {/* Hover indicator */}
        {focusX !== null && (
          <>
            <line
              x1={focusX}
              x2={focusX}
              y1={PY}
              y2={H - PY}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle cx={focusX} cy={focusY!} r={4} fill="#D4B370" />
            <circle cx={focusX} cy={focusY!} r={2} fill="#FFF8E7" />
          </>
        )}
      </svg>

      {/* Tooltip */}
      <div className="mt-2 flex items-center justify-between text-[11px]">
        <div className="text-fg-faint tabular">
          ${yMin.toFixed(2)} – ${yMax.toFixed(2)}
        </div>
        <div className="tabular text-fg-subtle">
          {focused ? (
            <>
              <span className="text-fg">${focused.nav.toFixed(4)}</span>
              <span className="ml-2 text-fg-faint">
                {new Date(focused.timestamp * 1000).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </>
          ) : (
            `${points.length} updates`
          )}
        </div>
      </div>
    </div>
  );
}
