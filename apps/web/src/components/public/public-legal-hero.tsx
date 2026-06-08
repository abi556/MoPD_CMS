interface PublicLegalHeroProps {
  title: string;
  subtitle: string;
}

export function PublicLegalHero({ title, subtitle }: PublicLegalHeroProps) {
  return (
    <section className="relative overflow-hidden bg-primary pb-16 pt-12 text-on-primary sm:pb-20 sm:pt-14 md:pb-24 md:pt-16">
      {/* Content with elegant fade-in-up animation */}
      <div className="mx-auto max-w-max-width px-gutter text-center animate-fade-in-up">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-body text-on-primary/75">
          {subtitle}
        </p>
      </div>

      {/* Wavy bottom structure with dual-layer slow waving animation */}
      <div
        className="pointer-events-none absolute inset-x-0 -bottom-px h-12 overflow-hidden md:h-14"
        aria-hidden
      >
        {/* Back Wave (Slower, filled with secondary/brand-deep color, waving behind) */}
        <div className="absolute bottom-0 left-0 flex h-full w-[200%] text-brand-deep opacity-50 animate-wave-slower">
          <svg
            viewBox="0 0 1440 56"
            preserveAspectRatio="none"
            className="h-full w-1/2 fill-current"
          >
            <path d="M0,28 C480,56 960,0 1440,28 L1440,56 L0,56 Z" />
          </svg>
          <svg
            viewBox="0 0 1440 56"
            preserveAspectRatio="none"
            className="h-full w-1/2 fill-current"
          >
            <path d="M0,28 C480,56 960,0 1440,28 L1440,56 L0,56 Z" />
          </svg>
        </div>

        {/* Front Wave (Primary, filled with background color to blend with content below) */}
        <div className="absolute bottom-0 left-0 flex h-full w-[200%] text-background animate-wave-slow">
          <svg
            viewBox="0 0 1440 56"
            preserveAspectRatio="none"
            className="h-full w-1/2 fill-current"
          >
            <path d="M0,28 C480,56 960,0 1440,28 L1440,56 L0,56 Z" />
          </svg>
          <svg
            viewBox="0 0 1440 56"
            preserveAspectRatio="none"
            className="h-full w-1/2 fill-current"
          >
            <path d="M0,28 C480,56 960,0 1440,28 L1440,56 L0,56 Z" />
          </svg>
        </div>
      </div>
    </section>
  );
}
