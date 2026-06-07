import type { ReactNode } from "react";

interface PublicLegalSectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

export function PublicLegalSection({
  id,
  title,
  children,
}: PublicLegalSectionProps) {
  return (
    <section id={id} className="scroll-mt-28 space-y-4">
      <h2 className="font-h2 text-h2 text-brand-deep">{title}</h2>
      <div className="space-y-4 text-body text-text-secondary leading-relaxed">
        {children}
      </div>
    </section>
  );
}
