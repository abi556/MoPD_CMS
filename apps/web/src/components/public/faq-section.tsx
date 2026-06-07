"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { FaqAccordionItem } from "@/components/public/faq-accordion-item";
import {
  FAQ_CATEGORIES,
  type FaqCategoryId,
  type FaqItemId,
} from "@/components/public/faq-categories";

interface FaqSectionProps {
  navLabel: string;
  categoryLabels: Record<FaqCategoryId, string>;
  items: Record<FaqItemId, { question: string; answer: string }>;
  stillNeedHelp: string;
  stillNeedHelpBody: string;
  ctaContact: string;
}

export function FaqSection({
  navLabel,
  categoryLabels,
  items,
  stillNeedHelp,
  stillNeedHelpBody,
  ctaContact,
}: FaqSectionProps) {
  const [activeCategory, setActiveCategory] =
    useState<FaqCategoryId>("general");

  const activeItems =
    FAQ_CATEGORIES.find((category) => category.id === activeCategory)?.items ??
    FAQ_CATEGORIES[0].items;

  return (
    <div className="mx-auto w-full max-w-6xl px-gutter py-12 md:py-16">
      <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16 xl:gap-20">
        <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-56 xl:w-64 animate-fade-in-up">
          <p className="font-h3 text-h3 text-brand-deep">{navLabel}</p>
          <nav className="mt-5 flex flex-col gap-1" aria-label={navLabel}>
            {FAQ_CATEGORIES.map((category, index) => {
              const isActive = category.id === activeCategory;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  style={{ animationDelay: `${index * 40}ms` }}
                  className={`block w-full rounded-lg py-2.5 pl-0 pr-2 text-left text-body-sm transition-all duration-200 animate-fade-in-up ${
                    isActive
                      ? "border-t-2 border-primary pt-3 font-semibold text-brand-deep"
                      : "border-t-2 border-transparent pt-3 text-text-secondary hover:text-on-surface"
                  }`}
                >
                  {categoryLabels[category.id]}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="space-y-3">
            {activeItems.map((id, index) => (
              <div
                key={`${activeCategory}-${id}`}
                style={{ animationDelay: `${index * 40}ms` }}
                className="animate-fade-in-up fill-mode-both"
              >
                <FaqAccordionItem
                  question={items[id].question}
                  answer={items[id].answer}
                  defaultOpen={index === 0}
                />
              </div>
            ))}
          </div>

          <section className="mt-12 border-t border-border-standard pt-8 animate-fade-in-up [animation-delay:200ms] fill-mode-both">
            <h2 className="font-h2 text-h2 text-brand-deep">{stillNeedHelp}</h2>
            <p className="mt-3 text-body text-text-secondary leading-relaxed">
              {stillNeedHelpBody}{" "}
              <Link
                href="/contact"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                {ctaContact}
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
