import { ReactNode } from "react";

interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function Section({ title, description, children }: SectionProps) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      {description && (
        <p className="mt-1 max-w-2xl text-sm text-ink-500">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}
