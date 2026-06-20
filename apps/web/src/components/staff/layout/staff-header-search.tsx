"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "@/components/providers/auth-provider";
import { hasPermission } from "@/lib/permissions";
import { staffRoutes } from "@/lib/staff/routes";
import { STAFF_FOCUS_SEARCH_EVENT } from "@/lib/staff/help/staff-shortcuts";

export function StaffHeaderSearch() {
  const tShell = useTranslations("staff.shell");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useSession();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const canSearch =
    user &&
    (hasPermission(user.permissions, "complaint:read") ||
      hasPermission(user.permissions, "complaint:read:own"));

  const onComplaintsPage = pathname === staffRoutes.complaints;

  useEffect(() => {
    if (onComplaintsPage) {
      setQuery(searchParams.get("q") ?? "");
      return;
    }
    setQuery("");
  }, [onComplaintsPage, searchParams]);

  useEffect(() => {
    const focusSearch = () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener(STAFF_FOCUS_SEARCH_EVENT, focusSearch);
    return () => window.removeEventListener(STAFF_FOCUS_SEARCH_EVENT, focusSearch);
  }, []);

  if (!canSearch) {
    return null;
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    const params = new URLSearchParams();
    if (trimmed) {
      params.set("q", trimmed);
    }
    const qs = params.toString();
    router.push(qs ? `${staffRoutes.complaints}?${qs}` : staffRoutes.complaints);
  };

  const focusSearch = () => {
    inputRef.current?.focus();
  };

  return (
    <form
      onSubmit={submit}
      className="hidden min-w-0 flex-1 lg:flex lg:items-center"
      role="search"
    >
      <div className="relative w-full max-w-md">
        <button
          type="button"
          onClick={focusSearch}
          className="absolute left-2.5 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-md p-0.5 text-staff-text-muted transition-colors hover:text-staff-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-staff-nav-active/30"
          aria-label={tShell("searchPlaceholder")}
        >
          <Search size={16} strokeWidth={2} aria-hidden />
        </button>
        <input
          ref={inputRef}
          className="w-full rounded-xl border border-staff-border/30 bg-staff-nav-hover/25 py-2 pl-9 pr-4 font-body-sm text-body-sm text-staff-text transition-colors placeholder:text-staff-text-muted hover:border-staff-border/45 hover:bg-staff-nav-hover/35 focus:border-staff-border/55 focus:bg-staff-surface/80 focus:outline-none focus:ring-1 focus:ring-staff-nav-active/15"
          placeholder={tShell("searchPlaceholder")}
          type="search"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={tShell("searchPlaceholder")}
          autoComplete="off"
        />
      </div>
    </form>
  );
}
