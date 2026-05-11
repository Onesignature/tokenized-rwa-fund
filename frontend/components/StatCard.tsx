interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
}

export function StatCard({ label, value, sublabel }: StatCardProps) {
  return (
    <div className="card">
      <div className="stat-label">{label}</div>
      <div className="stat-value mt-1">{value}</div>
      {sublabel && <div className="mt-1 text-xs text-ink-400">{sublabel}</div>}
    </div>
  );
}
