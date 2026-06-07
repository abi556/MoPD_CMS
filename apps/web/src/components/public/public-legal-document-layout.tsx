"use client";

import { useEffect, useState, type ReactNode } from "react";

export interface LegalNavSection {
  id: string;
  title: string;
}

interface PublicLegalDocumentLayoutProps {
  navLabel: string;
  sections: LegalNavSection[];
  children: ReactNode;
}

export function PublicLegalDocumentLayout({
  navLabel,
  sections,
  children,
}: PublicLegalDocumentLayoutProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.target.getBoundingClientRect().top -
              b.target.getBoundingClientRect().top,
          );

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: 0 },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="mx-auto w-full max-w-6xl px-gutter py-12 md:py-16">
      <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16 xl:gap-20">
        <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-56 xl:w-64 animate-fade-in-up">
          <p className="font-h3 text-h3 text-brand-deep">{navLabel}</p>
          <nav className="mt-5 flex flex-col gap-1" aria-label={navLabel}>
            {sections.map((section, index) => {
              const isActive = section.id === activeId;

              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={() => setActiveId(section.id)}
                  style={{ animationDelay: `${index * 40}ms` }}
                  className={`block rounded-lg py-2.5 pl-0 pr-2 text-left text-body-sm transition-all duration-200 animate-fade-in-up ${
                    isActive
                      ? "border-t-2 border-primary pt-3 font-semibold text-brand-deep"
                      : "border-t-2 border-transparent pt-3 text-text-secondary hover:text-on-surface"
                  }`}
                >
                  {section.title}
                </a>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 space-y-12 md:space-y-14 animate-fade-in-up [animation-delay:150ms] fill-mode-both">
          {children}
        </div>
      </div>
    </div>
  );
}
