"use client";

import {
  type ReactNode,
  type SubmitEvent,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import { ArrowRight, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import {
  normalizeReferenceInput,
  type ComplaintTrackResult,
} from "@/lib/complaint-track";
import { trackComplaintByReference } from "@/lib/public-complaints";
import { ComplaintTrackProgressVisual } from "./ComplaintTrackProgressVisual";
import { ComplaintTrackResults } from "./ComplaintTrackResults";

const REF_QUERY = "ref";

function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function TrackSplitCard({
  title,
  children,
  footer,
  tone = "default",
}: {
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  tone?: "default" | "danger";
}) {
  const isDanger = tone === "danger";

  return (
    <div
      className={`flex h-full min-h-[320px] flex-col overflow-hidden rounded-lg border shadow-sm ${
        isDanger
          ? "border-danger/40 bg-danger/5"
          : "border-border-standard bg-surface"
      }`}
    >
      <div
        className={`shrink-0 border-b px-6 py-5 md:px-8 ${
          isDanger ? "border-danger/30" : "border-border-standard"
        }`}
      >
        <h2 className="flex items-center gap-2.5 font-h2 text-h2 text-brand-deep">
          {title}
        </h2>
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-6 md:p-8">{children}</div>
      {footer ? (
        <div
          className={`shrink-0 border-t px-6 py-5 md:px-8 ${
            isDanger ? "border-danger/30" : "border-border-standard"
          }`}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}

function ComplaintTrackPanelInner() {
  const t = useTranslations("complaintTrack");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isClient = useIsClient();

  const [reference, setReference] = useState("");
  const [result, setResult] = useState<ComplaintTrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const urlRef = isClient ? (searchParams.get(REF_QUERY) ?? "") : "";
  const skipUrlFetchRef = useRef(false);
  const prevUrlRef = useRef<string | null>(null);
  const manualSearchInFlightRef = useRef<string | null>(null);

  const activeReference = normalizeReferenceInput(reference);
  const showSplitLayout =
    isClient && (result !== null || error !== null || loading);

  const runSearch = useCallback(
    async (raw: string) => {
      const normalized = normalizeReferenceInput(raw);
      if (!normalized) {
        setError(t("errors.referenceRequired"));
        setResult(null);
        return;
      }

      skipUrlFetchRef.current = false;
      setLoading(true);
      setError(null);

      try {
        const data = await trackComplaintByReference(normalized);
        setResult({
          referenceNo: data.referenceNo,
          status: data.status as ComplaintTrackResult["status"],
          subject: data.subject,
          submittedAt: data.submittedAt,
        });
        prevUrlRef.current = data.referenceNo;
        const params = new URLSearchParams(searchParams.toString());
        params.set(REF_QUERY, data.referenceNo);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      } catch (err) {
        setResult(null);
        setError(
          err instanceof ApiError && err.status === 404
            ? t("errors.notFound")
            : err instanceof ApiError
              ? err.message
              : t("errors.generic"),
        );
      } finally {
        setLoading(false);
        manualSearchInFlightRef.current = null;
      }
    },
    [pathname, router, searchParams, t],
  );

  // Load from ?ref= only when the URL reference actually changes (not when loading toggles).
  useEffect(() => {
    if (!isClient) {
      return;
    }
    if (prevUrlRef.current === urlRef) {
      return;
    }
    prevUrlRef.current = urlRef;

    setReference(urlRef);

    if (!urlRef) {
      skipUrlFetchRef.current = false;
      return;
    }
    if (skipUrlFetchRef.current) {
      return;
    }
    if (manualSearchInFlightRef.current) {
      return;
    }

    const normalized = normalizeReferenceInput(urlRef);
    if (!normalized) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch when ?ref= changes (load, locale switch)
    void runSearch(urlRef);
  }, [isClient, urlRef, runSearch]);

  const onSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const field = e.currentTarget.elements.namedItem("referenceNumber");
    const value =
      field instanceof HTMLInputElement ? field.value : reference;
    const normalized = normalizeReferenceInput(value);
    if (!normalized) {
      void runSearch(value);
      return;
    }
    manualSearchInFlightRef.current = normalized;
    setReference(value);
    void runSearch(value);
  };

  const onSearchAnother = () => {
    skipUrlFetchRef.current = true;
    manualSearchInFlightRef.current = null;
    prevUrlRef.current = "";
    setResult(null);
    setError(null);
    setReference("");
    setLoading(false);
    router.replace(pathname, { scroll: false });
  };

  const referenceField = (
    <div>
      <label
        htmlFor="referenceNumber"
        className="mb-1 block font-label text-label text-on-surface"
      >
        {t("referenceLabel")}
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-placeholder"
          aria-hidden
        />
        <input
          id="referenceNumber"
          name="referenceNumber"
          type="text"
          required
          autoComplete="off"
          suppressHydrationWarning
          value={reference}
          onChange={(e) => setReference(e.target.value.toUpperCase())}
          placeholder={t("referencePlaceholder")}
          className="w-full rounded-lg border border-border-standard bg-surface py-3 pl-10 pr-4 font-body text-body uppercase text-on-surface placeholder:normal-case placeholder:text-text-placeholder transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  );

  const renderSearchForm = (options?: {
    showIntro?: boolean;
    showProgressSlot?: boolean;
  }) => (
    <form className="flex flex-1 flex-col" onSubmit={onSubmit}>
      <div className="flex flex-col gap-4">
        {referenceField}
        {options?.showIntro ? (
          <p className="font-body-sm text-body-sm text-text-secondary">
            {t("intro")}
          </p>
        ) : null}
      </div>

      {options?.showProgressSlot ? (
        <div className="my-4 flex min-h-[160px] flex-1 items-center justify-center">
          {loading ? (
            <ComplaintTrackProgressVisual mode="loading" />
          ) : result !== null ? (
            <ComplaintTrackProgressVisual mode="progress" status={result.status} />
          ) : error !== null ? (
            <ComplaintTrackProgressVisual mode="error" />
          ) : null}
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={loading}
        suppressHydrationWarning
        className={`w-full gap-2 py-3 shadow-sm ${options?.showProgressSlot ? "" : "mt-6"}`}
      >
        {loading ? t("searching") : t("search")}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
    </form>
  );

  const centeredSearchCard = (
    <div className="overflow-hidden rounded-lg border border-border-standard bg-surface shadow-sm">
      <div className="flex flex-col items-center p-8 text-center md:p-12">
        <Image
          src="/mopd_logo.png"
          alt=""
          width={96}
          height={96}
          className="mb-8 h-24 w-auto object-contain"
          priority
        />
        <h1 className="font-h1 text-h1 text-brand-deep">{t("title")}</h1>
        <p className="mb-8 mt-2 max-w-lg font-body text-body text-text-secondary">
          {t("intro")}
        </p>

        <div className="w-full text-left">{renderSearchForm()}</div>

        {error ? (
          <p
            className="mt-6 w-full rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-left text-sm text-danger"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <p className="mt-8 w-full border-t border-border-standard pt-8 font-body-sm text-body-sm text-text-secondary">
          {t("lostReference")}{" "}
          <Link
            href="/complaints/recover"
            className="text-primary underline-offset-4 hover:underline"
          >
            {t("recoverReference")}
          </Link>
        </p>
      </div>
    </div>
  );

  const splitSearchCard = (
    <TrackSplitCard
      title={
        <>
          <Image
            src="/mopd_logo.png"
            alt=""
            width={48}
            height={48}
            className="size-10 shrink-0 object-contain"
            priority
          />
          <span>{t("title")}</span>
        </>
      }
      footer={
        <div className="flex flex-col gap-4">
          <p className="font-body-sm text-body-sm text-text-secondary">
            {t("lostReference")}{" "}
            <Link
              href="/complaints/recover"
              className="text-primary underline-offset-4 hover:underline"
            >
              {t("recoverReference")}
            </Link>
          </p>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            suppressHydrationWarning
            onClick={onSearchAnother}
          >
            {t("searchAnother")}
          </Button>
        </div>
      }
    >
      {renderSearchForm({ showIntro: true, showProgressSlot: true })}
    </TrackSplitCard>
  );

  const splitOutcome =
    error !== null ? (
      <TrackSplitCard title={t("errors.title")} tone="danger">
        <p className="font-body text-body text-danger">{error}</p>
        {activeReference ? (
          <p className="mt-4 font-body-sm text-body-sm text-text-secondary">
            {t("errors.referenceAttempted", { reference: activeReference })}
          </p>
        ) : null}
      </TrackSplitCard>
    ) : result !== null ? (
      <ComplaintTrackResults result={result} layout="split" />
    ) : (
      <TrackSplitCard
        title={t("resultsHeading", { reference: activeReference })}
      >
        <div className="flex min-h-[200px] items-center justify-center">
          <ComplaintTrackProgressVisual mode="loading" />
        </div>
      </TrackSplitCard>
    );

  if (showSplitLayout) {
    return (
      <div className="mx-auto w-full max-w-max-width px-gutter py-8 md:py-10">
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
          {splitSearchCard}
          <div className="min-w-0">{splitOutcome}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-gutter py-12 md:py-16">
      {centeredSearchCard}
    </div>
  );
}

export function ComplaintTrackPanel() {
  const t = useTranslations("complaintTrack");

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-gutter py-16 text-center text-text-secondary">
          {t("loading")}
        </div>
      }
    >
      <ComplaintTrackPanelInner />
    </Suspense>
  );
}
