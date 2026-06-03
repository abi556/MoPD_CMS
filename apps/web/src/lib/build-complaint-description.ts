import {
  getRegionLabel,
  getZoneLabel,
} from "@/lib/complaint-location-options";

const LOCATION_HEADER = "--- Location ---";
const MAX_DESCRIPTION_LENGTH = 4000;

export interface LocationFields {
  region: string;
  zone: string;
  woreda: string;
}

export function buildDescriptionWithLocation(
  narrative: string,
  location: LocationFields,
  locale: "en" | "am",
): string {
  const trimmed = narrative.trim();
  const hasLocation =
    location.region.trim() || location.zone.trim() || location.woreda.trim();

  if (!hasLocation) {
    return trimmed.slice(0, MAX_DESCRIPTION_LENGTH);
  }

  const lines: string[] = [LOCATION_HEADER];
  if (location.region.trim()) {
    lines.push(
      `Region: ${getRegionLabel(location.region.trim(), locale)}`,
    );
  }
  if (location.zone.trim()) {
    lines.push(
      `Zone: ${getZoneLabel(location.region.trim(), location.zone.trim(), locale)}`,
    );
  }
  if (location.woreda.trim()) {
    lines.push(`Woreda: ${location.woreda.trim()}`);
  }

  const block = lines.join("\n");
  const combined = `${trimmed}\n\n${block}`;
  if (combined.length <= MAX_DESCRIPTION_LENGTH) {
    return combined;
  }

  const maxNarrative =
    MAX_DESCRIPTION_LENGTH - block.length - 2;
  if (maxNarrative < 20) {
    return block.slice(0, MAX_DESCRIPTION_LENGTH);
  }
  return `${trimmed.slice(0, maxNarrative)}\n\n${block}`;
}
