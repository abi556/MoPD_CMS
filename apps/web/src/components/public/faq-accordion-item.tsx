import { Minus, Plus } from "lucide-react";

interface FaqAccordionItemProps {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}

export function FaqAccordionItem({
  question,
  answer,
  defaultOpen = false,
}: FaqAccordionItemProps) {
  return (
    <details
      className="group overflow-hidden rounded-xl bg-surface-container-low transition-[background-color,border-color,box-shadow] duration-200 open:border open:border-primary/20 open:bg-surface-container-lowest open:shadow-sm"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:content-none focus-visible:rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
        <span className="text-left font-h3 text-h3 text-text-secondary transition-colors duration-200 group-open:font-semibold group-open:text-on-surface">
          {question}
        </span>
        <span
          className="shrink-0 text-on-surface transition-colors duration-200"
          aria-hidden
        >
          <Plus
            className="h-5 w-5 group-open:hidden"
            strokeWidth={2}
            aria-hidden
          />
          <Minus
            className="hidden h-5 w-5 group-open:block"
            strokeWidth={2}
            aria-hidden
          />
        </span>
      </summary>
      <div className="border-t border-border-standard/60 px-5 pb-5 pt-1 text-body-sm leading-relaxed text-text-secondary">
        {answer}
      </div>
    </details>
  );
}
