import {
  AlertTriangle,
  Baby,
  Banknote,
  BookOpen,
  Zap,
  Building2,
  Droplets,
  Home,
  MoreHorizontal,
  Route,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

/** Maps backend `ComplaintCategory.code` values to icons (labels come from API only). */
const CODE_ICONS: Record<string, LucideIcon> = {
  CORRUPTION: Banknote,
  GOVT_SERVICE: Building2,
  PUBLIC_SAFETY: AlertTriangle,
  EDUCATION: BookOpen,
  PUBLIC_HEALTH: Stethoscope,
  LAND_HOUSING: Home,
  CHILD: Baby,
  CHILD_UNDER_ROADS: Baby,
  ROAD_INFRA: Route,
  WATER_SUPPLY: Droplets,
  ELECTRICITY: Zap,
  OTHER: MoreHorizontal,
};

export function getCategoryIcon(code: string): LucideIcon {
  return CODE_ICONS[code] ?? MoreHorizontal;
}
