import type { LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function StaffHubCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="group block h-full">
      <article className="flex h-full flex-col rounded-xl border border-staff-border bg-staff-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-staff-nav-active-bg/15 text-staff-nav-active transition-transform duration-200 group-hover:scale-105 motion-reduce:group-hover:scale-100">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <h2 className="mt-4 font-semibold text-staff-text group-hover:text-staff-nav-active">
          {title}
        </h2>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-staff-text-muted">
          {description}
        </p>
      </article>
    </Link>
  );
}
