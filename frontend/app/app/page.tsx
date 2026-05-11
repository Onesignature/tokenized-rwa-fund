"use client";

import { NavHero } from "@/components/NavHero";
import { NextStepCard } from "@/components/NextStepCard";
import { PositionCard } from "@/components/PositionCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { AdminPanel } from "@/components/AdminPanel";
import { useFund } from "@/hooks/useFund";

export default function DashboardPage() {
  const { activity } = useFund();

  return (
    <div className="space-y-6 pt-8">
      <NavHero />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <AdminPanel />

          <section>
            <div className="mb-3 flex items-baseline justify-between px-1">
              <h2 className="kbd-label">Activity</h2>
              <span className="text-xs text-fg-faint tabular">{activity.length} events</span>
            </div>
            <ActivityFeed items={activity} limit={10} />
          </section>
        </div>

        <div className="space-y-6">
          <NextStepCard />
          <PositionCard />
        </div>
      </div>
    </div>
  );
}
