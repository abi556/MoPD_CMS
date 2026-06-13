import { Link } from "@/i18n/navigation";

export function AppFooter() {
  return (
    <footer className="mt-auto flex w-full flex-col items-center justify-between gap-4 border-t border-staff-border bg-staff-surface px-gutter py-4 md:flex-row">
      <div className="text-center font-label text-label text-staff-text-muted md:text-left">
        © 2026 Ministry of Planning and Development. All rights reserved.
      </div>
      <div className="flex gap-4">
        <Link
          className="font-label text-label text-staff-text-muted underline transition-colors hover:text-staff-nav-active"
          href="/forbidden"
        >
          Privacy Policy
        </Link>
        <Link
          className="font-label text-label text-staff-text-muted underline transition-colors hover:text-staff-nav-active"
          href="/forbidden"
        >
          Terms of Service
        </Link>
        <Link
          className="font-label text-label text-staff-text-muted underline transition-colors hover:text-staff-nav-active"
          href="/forbidden"
        >
          Contact Support
        </Link>
      </div>
    </footer>
  );
}
