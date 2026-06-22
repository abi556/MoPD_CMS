import {
  Activity,
  BookOpen,
  Building2,
  Clock,
  FileText,
  FolderTree,
  Mail,
  ScrollText,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Icons for admin hub cards and matching sidebar sub-menu links. */
export const ADMIN_NAV_ICONS: Record<string, LucideIcon> = {
  adminUsers: Users,
  adminRoles: Shield,
  adminCategories: FolderTree,
  adminOrgUnits: Building2,
  adminSla: Clock,
  adminTemplates: FileText,
  adminEmailDeliveries: Mail,
  adminKnowledge: BookOpen,
  adminSystem: Activity,
  adminAudit: ScrollText,
};

export function getStaffSubNavIcon(labelKey: string): LucideIcon | undefined {
  return ADMIN_NAV_ICONS[labelKey];
}
