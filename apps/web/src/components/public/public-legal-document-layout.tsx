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
    <div className="mx-auto w-full max-w-6xl px-gutter py-10 sm:py-12 md:py-16">
      <div className="flex flex-col gap-10 md:gap-12 lg:flex-row lg:items-start lg:gap-16 xl:gap-20">
        <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-56 xl:w-64 animate-fade-in-up">
          <p className="font-h3 text-h3 text-brand-deep">{navLabel}</p>
          <nav
            className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:mt-5 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden"
            aria-label={navLabel}
          >
            {sections.map((section, index) => {
              const isActive = section.id === activeId;

              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={() => setActiveId(section.id)}
                  style={{ animationDelay: `${index * 40}ms` }}
                  className={`block shrink-0 whitespace-nowrap rounded-none border-t-2 py-2.5 pl-0 pr-3 text-left text-body-sm transition-all duration-200 animate-fade-in-up lg:whitespace-normal lg:rounded-lg lg:py-2.5 lg:pl-0 lg:pr-2 ${
                    isActive
                      ? "border-primary font-semibold text-brand-deep lg:pt-3"
                      : "border-transparent text-text-secondary hover:text-on-surface lg:pt-3"
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
