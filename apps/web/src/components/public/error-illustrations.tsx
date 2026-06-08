/**
 * Brand-colored line-art illustrations for the public error / connectivity
 * pages. Colors are driven by the design tokens (primary #58874b, brand-deep
 * #22521f) via currentColor and explicit token classes so they stay on-brand.
 */

type IllustrationProps = {
  className?: string;
};

function Sparkles() {
  return (
    <g className="text-primary/40" fill="currentColor">
      <path d="M40 60 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" />
      <circle cx="320" cy="44" r="4" />
      <circle cx="58" cy="150" r="3" />
      <path d="M300 150 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" />
      <circle cx="180" cy="26" r="3" />
    </g>
  );
}

/** Broken chain link — used on the 404 / broken-link page. */
export function BrokenLinkArt({ className = "" }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 360 240"
      fill="none"
      role="img"
      aria-hidden="true"
      className={className}
    >
      <Sparkles />
      {/* soft platform shadow */}
      <ellipse cx="180" cy="208" rx="120" ry="14" className="text-primary/10" fill="currentColor" />

      {/* dashed gap between the two halves */}
      <path
        d="M150 120 h60"
        className="text-primary/30"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="2 14"
      />

      {/* left link half */}
      <g
        className="text-primary"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="rotate(-18 120 120)"
      >
        <rect x="60" y="96" width="92" height="48" rx="24" fill="none" />
      </g>
      {/* right link half */}
      <g
        className="text-brand-deep"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="rotate(-18 244 120)"
      >
        <rect x="208" y="96" width="92" height="48" rx="24" fill="none" />
      </g>

      {/* snapped ends */}
      <g className="text-primary" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
        <path d="M150 108 l14 8" transform="rotate(-18 157 112)" />
        <path d="M150 132 l14 -8" transform="rotate(-18 157 128)" />
      </g>
    </svg>
  );
}

/** Warning disc — used on the generic error boundary page. */
export function GenericErrorArt({ className = "" }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 360 240"
      fill="none"
      role="img"
      aria-hidden="true"
      className={className}
    >
      <Sparkles />
      <ellipse cx="180" cy="210" rx="92" ry="12" className="text-primary/10" fill="currentColor" />

      <circle cx="180" cy="118" r="74" className="text-brand-wash" fill="currentColor" />
      <circle
        cx="180"
        cy="118"
        r="74"
        className="text-primary"
        stroke="currentColor"
        strokeWidth="8"
      />
      <g className="text-brand-deep" fill="currentColor">
        <rect x="172" y="78" width="16" height="48" rx="8" />
        <circle cx="180" cy="148" r="9" />
      </g>
    </svg>
  );
}

/** Shield with keyhole — used on the 403 / forbidden page. */
export function ForbiddenArt({ className = "" }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 360 240"
      fill="none"
      role="img"
      aria-hidden="true"
      className={className}
    >
      <Sparkles />
      <ellipse cx="180" cy="214" rx="96" ry="12" className="text-primary/10" fill="currentColor" />

      {/* shield body */}
      <path
        d="M180 36 L262 64 V128 C262 176 226 198 180 214 C134 198 98 176 98 128 V64 Z"
        className="text-brand-wash"
        fill="currentColor"
      />
      <path
        d="M180 36 L262 64 V128 C262 176 226 198 180 214 C134 198 98 176 98 128 V64 Z"
        className="text-primary"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinejoin="round"
      />

      {/* keyhole */}
      <g className="text-brand-deep" fill="currentColor">
        <circle cx="180" cy="112" r="20" />
        <path d="M170 126 h20 l6 40 h-32 z" />
      </g>
    </svg>
  );
}
