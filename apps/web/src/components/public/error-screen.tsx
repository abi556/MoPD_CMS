import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

interface ErrorScreenAction {
  href?: string;
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}

interface ErrorScreenProps {
  /** Large translucent status code shown behind the heading (e.g. "404"). */
  code?: string;
  eyebrow?: string;
  title: string;
  body: string;
  illustration: ReactNode;
  primaryAction: ErrorScreenAction;
  secondaryAction?: ErrorScreenAction;
}

function ActionButton({ action }: { action: ErrorScreenAction }) {
  const button = (
    <Button
      type="button"
      variant={action.variant ?? "primary"}
      size="lg"
      onClick={action.onClick}
      className="w-full px-8 sm:w-auto"
    >
      {action.label}
    </Button>
  );

  if (action.href) {
    return (
      <Link href={action.href} className="w-full sm:w-auto">
        {button}
      </Link>
    );
  }
  return button;
}

export function ErrorScreen({
  code,
  eyebrow,
  title,
  body,
  illustration,
  primaryAction,
  secondaryAction,
}: ErrorScreenProps) {
  return (
    <section className="relative flex flex-1 items-center overflow-hidden bg-brand-wash">
      {/* subtle background grid, consistent with the landing hero */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-25 mask-[radial-gradient(ellipse_70%_60%_at_50%_40%,#000_70%,transparent_100%)]" />

      <div className="relative mx-auto grid w-full max-w-max-width items-center gap-10 px-gutter py-16 md:grid-cols-2 md:gap-12 md:py-24">
        <div className="order-2 space-y-5 text-center md:order-1 md:text-left animate-fade-in-up">
          {(eyebrow || code) && (
            <div className="flex items-center justify-center gap-3 md:justify-start">
              {code ? (
                <span className="font-display text-5xl font-bold tracking-tight text-primary/30 md:text-6xl">
                  {code}
                </span>
              ) : null}
              {eyebrow ? (
                <span className="text-overline font-semibold uppercase tracking-wider text-primary">
                  {eyebrow}
                </span>
              ) : null}
            </div>
          )}

          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-brand-deep sm:text-4xl md:text-5xl md:leading-[1.1]">
            {title}
          </h1>
          <p className="mx-auto max-w-md text-body text-text-secondary leading-relaxed md:mx-0">
            {body}
          </p>

          <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-center md:justify-start">
            <ActionButton action={primaryAction} />
            {secondaryAction ? <ActionButton action={secondaryAction} /> : null}
          </div>
        </div>

        <div className="order-1 flex justify-center md:order-2 animate-scale-in [animation-delay:100ms] fill-mode-both">
          <div className="w-full max-w-sm md:max-w-md">{illustration}</div>
        </div>
      </div>
    </section>
  );
}
