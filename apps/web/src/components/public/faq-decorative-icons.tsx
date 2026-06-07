const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function FaqSpeechBubblesLeft({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 72"
      className={className}
      aria-hidden
    >
      <path
        {...strokeProps}
        d="M12 18c0-8 10-14 22-14s22 6 22 14-10 14-22 14c-3 0-6-.5-8.5-1.5L8 44V18z"
      />
      <path
        {...strokeProps}
        d="M28 34c0-6 7-10 16-10s16 4 16 10-7 10-16 10c-2.5 0-4.8-.4-6.8-1.2L20 56V34z"
        opacity={0.55}
      />
    </svg>
  );
}

export function FaqQuestionInfoRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 88 72"
      className={className}
      aria-hidden
    >
      <circle {...strokeProps} cx="24" cy="36" r="18" />
      <path
        {...strokeProps}
        d="M24 28c0-3 2.5-5 6-5 3.5 0 6 2.2 6 5.5 0 2.5-1.8 4-4.5 5.5-1.5.8-2.5 2-2.5 3.5"
      />
      <circle fill="currentColor" cx="24" cy="50" r="1.75" />
      <circle {...strokeProps} cx="62" cy="36" r="18" />
      <circle fill="currentColor" cx="62" cy="28" r="1.75" />
      <path {...strokeProps} d="M62 34v14" />
    </svg>
  );
}

export function FaqNotebookDoodle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 56 48"
      className={className}
      aria-hidden
    >
      <path
        {...strokeProps}
        d="M10 6h30c2 0 4 2 4 4v32c0 2-2 4-4 4H10V6z"
      />
      <path {...strokeProps} d="M14 6v40" />
      <path {...strokeProps} d="M22 16h16M22 24h16M22 32h10" />
      <path
        {...strokeProps}
        d="M38 38l10-6-2 12-4-4-4-2z"
        opacity={0.7}
      />
    </svg>
  );
}

export function FaqSparkles({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 40"
      className={className}
      aria-hidden
    >
      <path
        {...strokeProps}
        d="M8 20l2-6 2 6 6 2-6 2-2 6-2-6-6-2z"
      />
      <path
        {...strokeProps}
        d="M34 10l1.5-4 1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5z"
        opacity={0.65}
      />
    </svg>
  );
}
