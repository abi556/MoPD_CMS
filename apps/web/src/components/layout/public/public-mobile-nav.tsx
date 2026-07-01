"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

function normalizePath(pathname: string): string {
  return pathname.replace(/^(\/(en|am))(?=\/|$)/, "").replace(/\/+$/, "");
}

interface NavLink {
  href: string;
  label: string;
  external?: boolean;
  match?: (path: string) => boolean;
}

export function PublicMobileNav() {
  const nav = useTranslations("nav-public");
  const pub = useTranslations("public");
  const common = useTranslations("common");
  const pathname = usePathname();
  const normalizedPath = normalizePath(pathname);
  const [open, setOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Close the menu when pathname changes (React state adjustment pattern)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Touch swipe/drag gesture handling for sidebar
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const clientX = e.touches[0].clientX;
      // Swipe-to-open: only trigger if swipe starts near the right edge (within 50px)
      const isRightEdge = clientX > window.innerWidth - 50;
      
      if (isRightEdge && !open) {
        setTouchStartX(clientX);
      } else if (open) {
        // Swipe-to-close: can start anywhere
        setTouchStartX(clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      setTouchEndX(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
      if (touchStartX === null || touchEndX === null) return;

      const diffX = touchStartX - touchEndX;

      if (!open) {
        // Swipe left to open (drag inward from right edge)
        if (diffX > 40) {
          setOpen(true);
        }
      } else {
        // Swipe right to close (drag outward to right edge)
        if (diffX < -40) {
          setOpen(false);
        }
      }

      setTouchStartX(null);
      setTouchEndX(null);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [open, touchStartX, touchEndX]);

  const linkClass = (active: boolean) =>
    `block rounded-none border-l-2 py-3 pl-4 pr-3 text-body font-medium transition-colors ${
      active
        ? "border-primary bg-primary/5 text-primary"
        : "border-transparent text-on-surface hover:border-primary/30 hover:bg-surface-container-low"
    }`;

  const sections: { title: string; links: NavLink[] }[] = [
    {
      title: nav("publicPortal"),
      links: [
        {
          href: "/",
          label: nav("home"),
          match: (path) => path === "" || path === "/",
        },
        {
          href: "/complaints/new",
          label: nav("submitComplaint"),
          match: (path) => path.startsWith("/complaints/new"),
        },
        {
          href: "/complaints/track",
          label: nav("trackStatus"),
          match: (path) => path.startsWith("/complaints/track"),
        },
      ],
    },
    {
      title: pub("footerHelpLinks"),
      links: [
        { href: "/faq", label: pub("footerFaq"), match: (path) => path === "/faq" },
        {
          href: "/contact",
          label: pub("footerContact"),
          match: (path) => path === "/contact",
        },
        {
          href: "https://www.mopd.gov.et",
          label: "mopd.gov.et",
          external: true,
        },
      ],
    },
    {
      title: pub("footerLegalLinks"),
      links: [
        {
          href: "/privacy",
          label: pub("footerPrivacy"),
          match: (path) => path === "/privacy",
        },
        {
          href: "/terms",
          label: pub("footerTerms"),
          match: (path) => path === "/terms",
        },
        {
          href: "/cookies",
          label: pub("footerCookies"),
          match: (path) => path === "/cookies",
        },
        {
          href: "/accessibility",
          label: pub("footerAccessibility"),
          match: (path) => path === "/accessibility",
        },
      ],
    },
  ];

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const drawer = open ? (
    <div className="fixed inset-0 z-100 md:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px] animate-fade-in"
        aria-label={common("close")}
        onClick={close}
      />
      <div
        className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col border-l border-border-standard bg-surface shadow-xl animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-label={nav("menu")}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border-standard px-4">
          <span className="font-label text-label font-semibold uppercase tracking-wider text-text-secondary">
            {nav("menu")}
          </span>
          <button
            type="button"
            onClick={close}
            suppressHydrationWarning
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-none text-on-surface transition-colors hover:bg-surface-container-low"
            aria-label={common("close")}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-6 last:mb-0">
              <p className="mb-2 px-4 font-label text-[11px] font-semibold uppercase tracking-wider text-text-placeholder">
                {section.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.links.map((link) => {
                  const active = link.match?.(normalizedPath) ?? false;

                  if (link.external) {
                    return (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass(false)}
                        onClick={close}
                      >
                        {link.label}
                      </a>
                    );
                  }

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={linkClass(active)}
                      onClick={close}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Sleek, vertical pull-tab handle on the right edge of the screen */}
      <button
        type="button"
        className="fixed right-0 top-1/2 z-40 flex h-20 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-l-xl border border-r-0 border-primary/20 bg-surface/90 shadow-md backdrop-blur-xs transition-all duration-200 hover:w-7 hover:bg-brand-wash active:scale-95 md:hidden"
        aria-expanded={open}
        aria-controls="public-mobile-nav"
        aria-label={nav("openMenu")}
        onClick={() => setOpen(true)}
        suppressHydrationWarning
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-primary transition-transform duration-200"
        >
          <path
            d="M17 3.5c-2 3-8 6.5-8 8.5s6 5.5 8 8.5"
            stroke="currentColor"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {drawer ? createPortal(drawer, document.body) : null}
    </>
  );
}
