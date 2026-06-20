"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Info,
  ShieldAlert,
} from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { InAppNotificationItem } from "@/lib/staff/in-app-notifications-api";
import { markNotificationRead } from "@/lib/staff/in-app-notifications-api";
import { normalizeInboxMessageParams } from "@/lib/staff/inbox-notifications";

function SeverityIcon({
  severity,
}: {
  severity: InAppNotificationItem["severity"];
}) {
  switch (severity) {
    case "success":
      return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />;
    case "critical":
      return <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" aria-hidden />;
    default:
      return <Info className="h-4 w-4 shrink-0 text-staff-text-muted" aria-hidden />;
  }
}

function messageKeyToTranslationKey(messageKey: string): string {
  if (messageKey.startsWith("inbox.types.")) {
    return messageKey.replace("inbox.types.", "");
  }
  return messageKey;
}

export function NotificationListItem({
  item,
  onRead,
}: {
  item: InAppNotificationItem;
  onRead?: () => void;
}) {
  const t = useTranslations("inbox");
  const format = useFormatter();
  const now = useNow();
  const router = useRouter();
  const isUnread = item.readAt == null;
  const typeKey = messageKeyToTranslationKey(item.messageKey);
  const params = normalizeInboxMessageParams(typeKey, item.messageParams);

  const handleClick = async () => {
    if (isUnread) {
      try {
        await markNotificationRead(item.id);
        onRead?.();
      } catch {
        // navigation still useful even if mark-read fails
      }
    }
    if (item.link) {
      router.push(item.link);
    }
  };

  const className = isUnread
    ? "flex w-full cursor-pointer items-start gap-3 rounded-lg border border-staff-border bg-staff-surface-elevated px-4 py-3 text-left transition-colors hover:bg-staff-nav-hover"
    : "flex w-full cursor-pointer items-start gap-3 rounded-lg border border-transparent bg-transparent px-4 py-3 text-left transition-colors hover:bg-staff-nav-hover/60";

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className={className}
    >
      <SeverityIcon severity={item.severity} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-staff-text">
          {t.has(`types.${typeKey}`)
            ? t(`types.${typeKey}`, params)
            : typeKey}
        </p>
        <p className="mt-1 text-xs text-staff-text-muted">
          {format.relativeTime(new Date(item.createdAt), now)}
        </p>
      </div>
      {isUnread ? (
        <Circle
          className="mt-1 h-2.5 w-2.5 shrink-0 fill-red-600 text-red-600"
          aria-hidden
        />
      ) : null}
    </button>
  );
}
