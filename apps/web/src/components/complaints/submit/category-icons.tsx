import {
  Bolt,
  Droplets,
  HelpCircle,
  Landmark,
  MoreHorizontal,
  Route,
  type LucideIcon,
} from "lucide-react";

const CODE_ICONS: Record<string, LucideIcon> = {
  ROAD_INFRA: Route,
  WATER_SUPPLY: Droplets,
  ELECTRICITY: Bolt,
  PUBLIC_HEALTH: Landmark,
  GOVT_SERVICE: Landmark,
  OTHER: MoreHorizontal,
};

export function getCategoryIcon(code: string): LucideIcon {
  return CODE_ICONS[code] ?? HelpCircle;
}
