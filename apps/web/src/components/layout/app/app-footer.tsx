import { Link } from "@/i18n/navigation";

export function AppFooter() {
  return (
    <footer className="mt-auto flex w-full flex-col items-center justify-between gap-4 border-t border-border-standard bg-inverse-surface px-gutter py-4 dark:bg-surface-container-lowest md:flex-row">
      <div className="text-center font-label text-label text-inverse-on-surface dark:text-on-surface md:text-left">
        © 2026 Ministry of Planning and Development. All rights reserved.
      </div>
      <div className="flex gap-4">
        <Link
          className="font-label text-label text-surface-variant underline transition-colors hover:text-primary-fixed-dim"
          href="/forbidden"
        >
          Privacy Policy
        </Link>
        <Link
          className="font-label text-label text-surface-variant underline transition-colors hover:text-primary-fixed-dim"
          href="/forbidden"
        >
          Terms of Service
        </Link>
        <Link
          className="font-label text-label text-surface-variant underline transition-colors hover:text-primary-fixed-dim"
          href="/forbidden"
        >
          Contact Support
        </Link>
      </div>
    </footer>
  );
}
