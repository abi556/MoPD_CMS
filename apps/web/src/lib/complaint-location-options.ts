export interface LocationOption {
  value: string;
  labelEn: string;
  labelAm: string;
}

export const COMPLAINT_REGIONS: LocationOption[] = [
  {
    value: "addis_ababa",
    labelEn: "Addis Ababa",
    labelAm: "አዲስ አበባ",
  },
  {
    value: "oromia",
    labelEn: "Oromia",
    labelAm: "ኦሮሚያ",
  },
  {
    value: "amhara",
    labelEn: "Amhara",
    labelAm: "አማራ",
  },
  {
    value: "somali",
    labelEn: "Somali",
    labelAm: "ሶማሌ",
  },
];

export const COMPLAINT_ZONES_BY_REGION: Record<string, LocationOption[]> = {
  addis_ababa: [
    { value: "bole", labelEn: "Bole", labelAm: "ቦሌ" },
    { value: "yeka", labelEn: "Yeka", labelAm: "የካ" },
    { value: "kirkos", labelEn: "Kirkos", labelAm: "ቂርቆስ" },
  ],
  oromia: [
    { value: "adama", labelEn: "Adama", labelAm: "አዳማ" },
    { value: "bishoftu", labelEn: "Bishoftu", labelAm: "ቢሾፍቱ" },
  ],
  amhara: [
    { value: "bahir_dar", labelEn: "Bahir Dar", labelAm: "ባሕር ዳር" },
    { value: "gondar", labelEn: "Gondar", labelAm: "ጎንደር" },
  ],
  somali: [
    { value: "jijiga", labelEn: "Jijiga", labelAm: "ጅጅጋ" },
  ],
};

export function getRegionLabel(
  value: string,
  locale: "en" | "am",
): string {
  const region = COMPLAINT_REGIONS.find((r) => r.value === value);
  if (!region) return value;
  return locale === "am" ? region.labelAm : region.labelEn;
}

export function getZoneLabel(
  regionValue: string,
  zoneValue: string,
  locale: "en" | "am",
): string {
  const zones = COMPLAINT_ZONES_BY_REGION[regionValue] ?? [];
  const zone = zones.find((z) => z.value === zoneValue);
  if (!zone) return zoneValue;
  return locale === "am" ? zone.labelAm : zone.labelEn;
}
