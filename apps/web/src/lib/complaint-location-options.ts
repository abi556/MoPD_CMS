export interface LocationOption {
  value: string;
  labelEn: string;
  labelAm: string;
}

/** Federal regions and city administrations (English / Amharic). */
export const COMPLAINT_REGIONS: LocationOption[] = [
  { value: "tigray", labelEn: "Tigray Region", labelAm: "ትግራይ ክልል" },
  { value: "afar", labelEn: "Afar Region", labelAm: "አፋር ክልል" },
  { value: "amhara", labelEn: "Amhara Region", labelAm: "አማራ ክልል" },
  { value: "oromia", labelEn: "Oromia Region", labelAm: "ኦሮሚያ ክልል" },
  { value: "somali", labelEn: "Somali Region", labelAm: "ሶማሌ ክልል" },
  {
    value: "benishangul_gumuz",
    labelEn: "Benishangul-Gumuz Region",
    labelAm: "ቤንሻንጉል ጉሙዝ ክልል",
  },
  { value: "gambela", labelEn: "Gambela Region", labelAm: "ጋምቤላ ክልል" },
  { value: "harari", labelEn: "Harari Region", labelAm: "ሐረሪ ክልል" },
  { value: "sidama", labelEn: "Sidama Region", labelAm: "ሲዳማ ክልል" },
  {
    value: "central_ethiopia",
    labelEn: "Central Ethiopia Region",
    labelAm: "ማዕከላዊ ኢትዮጵያ ክልል",
  },
  {
    value: "south_ethiopia",
    labelEn: "South Ethiopia Region",
    labelAm: "ደቡብ ኢትዮጵያ ክልል",
  },
  {
    value: "south_west_ethiopia",
    labelEn: "South West Ethiopia Peoples' Region",
    labelAm: "ደቡብ ምዕራብ ኢትዮጵያ ሕዝቦች ክልል",
  },
  {
    value: "addis_ababa",
    labelEn: "Addis Ababa City Administration",
    labelAm: "አዲስ አበባ ከተማ አስተዳደር",
  },
  {
    value: "dire_dawa",
    labelEn: "Dire Dawa City Administration",
    labelAm: "ድሬዳዋ ከተማ አስተዳደር",
  },
];

/** Zones, sub-cities, and special administrations by region `value`. */
export const COMPLAINT_ZONES_BY_REGION: Record<string, LocationOption[]> = {
  addis_ababa: [
    { value: "addis_ketema", labelEn: "Addis Ketema", labelAm: "አዲስ ከተማ" },
    { value: "akaky_kaliti", labelEn: "Akaky Kaliti", labelAm: "አቃቂ ቃሊቲ" },
    { value: "arada", labelEn: "Arada", labelAm: "አራዳ" },
    { value: "bole", labelEn: "Bole", labelAm: "ቦሌ" },
    { value: "gullele", labelEn: "Gullele", labelAm: "ጉለሌ" },
    { value: "kirkos", labelEn: "Kirkos", labelAm: "ቂርቆስ" },
    { value: "kolfe_keranio", labelEn: "Kolfe Keranio", labelAm: "ኮልፌ ቀራኒዮ" },
    { value: "lideta", labelEn: "Lideta", labelAm: "ልደታ" },
    {
      value: "nifas_silk_lafto",
      labelEn: "Nifas Silk-Lafto",
      labelAm: "ንፋስ ስልክ ላፍቶ",
    },
    { value: "yeka", labelEn: "Yeka", labelAm: "የካ" },
    { value: "lemi_kura", labelEn: "Lemi Kura", labelAm: "ለሚ ኩራ" },
  ],
  oromia: [
    { value: "arsi", labelEn: "Arsi", labelAm: "አርሲ" },
    { value: "bale", labelEn: "Bale", labelAm: "ባሌ" },
    { value: "borena", labelEn: "Borena", labelAm: "ቦረና" },
    { value: "buno_bedele", labelEn: "Buno Bedele", labelAm: "ቡኖ በደሌ" },
    { value: "east_hararghe", labelEn: "East Hararghe", labelAm: "ምስራቅ ሐረርጌ" },
    { value: "east_shewa", labelEn: "East Shewa", labelAm: "ምስራቅ ሸዋ" },
    { value: "east_welega", labelEn: "East Welega", labelAm: "ምስራቅ ወለጋ" },
    { value: "guji", labelEn: "Guji", labelAm: "ጉጂ" },
    {
      value: "horo_guduru_welega",
      labelEn: "Horo Guduru Welega",
      labelAm: "ሆሮ ጉዱሩ ወለጋ",
    },
    { value: "illu_aba_bora", labelEn: "Illu Aba Bora", labelAm: "ኢሉ አባ ቦራ" },
    { value: "jimma", labelEn: "Jimma", labelAm: "ጅማ" },
    { value: "kelam_welega", labelEn: "Kelam Welega", labelAm: "ቄለም ወለጋ" },
    { value: "north_shewa", labelEn: "North Shewa", labelAm: "ሰሜን ሸዋ" },
    {
      value: "south_west_shewa",
      labelEn: "South West Shewa",
      labelAm: "ደቡብ ምዕራብ ሸዋ",
    },
    { value: "west_arsi", labelEn: "West Arsi", labelAm: "ምዕራብ አርሲ" },
    { value: "west_guji", labelEn: "West Guji", labelAm: "ምዕራብ ጉጂ" },
    { value: "west_hararghe", labelEn: "West Hararghe", labelAm: "ምዕራብ ሐረርጌ" },
    { value: "west_shewa", labelEn: "West Shewa", labelAm: "ምዕራብ ሸዋ" },
    { value: "west_welega", labelEn: "West Welega", labelAm: "ምዕራብ ወለጋ" },
    { value: "east_bale", labelEn: "East Bale", labelAm: "ምስራቅ ባሌ" },
    { value: "east_borena", labelEn: "East Borena", labelAm: "ምስራቅ ቦረና" },
  ],
  amhara: [
    { value: "awi", labelEn: "Awi", labelAm: "አዊ" },
    { value: "east_gojjam", labelEn: "East Gojjam", labelAm: "ምስራቅ ጎጃም" },
    { value: "west_gojjam", labelEn: "West Gojjam", labelAm: "ምዕራብ ጎጃም" },
    { value: "north_gondar", labelEn: "North Gondar", labelAm: "ሰሜን ጎንደር" },
    { value: "central_gondar", labelEn: "Central Gondar", labelAm: "ማዕከላዊ ጎንደር" },
    { value: "west_gondar", labelEn: "West Gondar", labelAm: "ምዕራብ ጎንደር" },
    { value: "south_gondar", labelEn: "South Gondar", labelAm: "ደቡብ ጎንደር" },
    { value: "north_wollo", labelEn: "North Wollo", labelAm: "ሰሜን ወሎ" },
    { value: "south_wollo", labelEn: "South Wollo", labelAm: "ደቡብ ወሎ" },
    { value: "north_shewa", labelEn: "North Shewa", labelAm: "ሰሜን ሸዋ" },
    { value: "wag_hemra", labelEn: "Wag Hemra", labelAm: "ዋግ ሕምራ" },
    {
      value: "oromia_special_zone",
      labelEn: "Oromia Special Zone",
      labelAm: "ኦሮሚያ ልዩ ዞን",
    },
    {
      value: "bahir_dar_special_zone",
      labelEn: "Bahir Dar Special Zone",
      labelAm: "ባሕር ዳር ልዩ ዞን",
    },
  ],
  afar: [
    { value: "awsi_rasu", labelEn: "Awsi Rasu", labelAm: "አውሲ ራሱ" },
    { value: "kilbet_rasu", labelEn: "Kilbet Rasu", labelAm: "ኪልበት ራሱ" },
    { value: "gabi_rasu", labelEn: "Gabi Rasu", labelAm: "ጋቢ ራሱ" },
    { value: "fanti_rasu", labelEn: "Fanti Rasu", labelAm: "ፋንቲ ራሱ" },
    { value: "hari_rasu", labelEn: "Hari Rasu", labelAm: "ሐሪ ራሱ" },
    { value: "mahi_rasu", labelEn: "Mahi Rasu", labelAm: "ማሂ ራሱ" },
    {
      value: "argobba_special_woreda",
      labelEn: "Argobba Special Woreda",
      labelAm: "አርጎባ ልዩ ወረዳ",
    },
  ],
  benishangul_gumuz: [
    { value: "assosa", labelEn: "Assosa", labelAm: "አሶሳ" },
    { value: "kamashi", labelEn: "Kamashi", labelAm: "ካማሺ" },
    { value: "metekel", labelEn: "Metekel", labelAm: "መተከል" },
  ],
  central_ethiopia: [
    { value: "gurage", labelEn: "Gurage", labelAm: "ጉራጌ" },
    { value: "east_gurage", labelEn: "East Gurage", labelAm: "ምስራቅ ጉራጌ" },
    { value: "hadiya", labelEn: "Hadiya", labelAm: "ሀዲያ" },
    { value: "halaba", labelEn: "Halaba", labelAm: "ሃላባ" },
    { value: "kembata", labelEn: "Kembata", labelAm: "ከምባታ" },
    { value: "silte", labelEn: "Silte", labelAm: "ስልጤ" },
    { value: "yem", labelEn: "Yem", labelAm: "የም" },
    {
      value: "kebena_special_woreda",
      labelEn: "Kebena Special Woreda",
      labelAm: "ቀቤና ልዩ ወረዳ",
    },
    {
      value: "mareko_special_woreda",
      labelEn: "Mareko Special Woreda",
      labelAm: "ማረቆ ልዩ ወረዳ",
    },
    {
      value: "tembaro_special_woreda",
      labelEn: "Tembaro Special Woreda",
      labelAm: "ጠምባሮ ልዩ ወረዳ",
    },
  ],
  south_ethiopia: [
    { value: "wolayita", labelEn: "Wolayita", labelAm: "ወላይታ" },
    { value: "gamo", labelEn: "Gamo", labelAm: "ጋሞ" },
    { value: "gofa", labelEn: "Gofa", labelAm: "ጎፋ" },
    { value: "gedeo", labelEn: "Gedeo", labelAm: "ጌዴኦ" },
    { value: "south_omo", labelEn: "South Omo", labelAm: "ደቡብ ኦሞ" },
    { value: "ari", labelEn: "Ari", labelAm: "አሪ" },
    { value: "konso", labelEn: "Konso", labelAm: "ኮንሶ" },
    { value: "burji", labelEn: "Burji", labelAm: "ቡርጂ" },
    { value: "basketo", labelEn: "Basketo", labelAm: "ባስኬቶ" },
    { value: "ale", labelEn: "Ale", labelAm: "አሌ" },
    { value: "kore", labelEn: "Kore", labelAm: "ኮሬ" },
    { value: "gardula", labelEn: "Gardula", labelAm: "ጋርዱላ" },
  ],
  tigray: [
    { value: "central_tigray", labelEn: "Central Tigray", labelAm: "ማዕከላዊ ትግራይ" },
    { value: "eastern_tigray", labelEn: "Eastern Tigray", labelAm: "ምስራቃዊ ትግራይ" },
    {
      value: "south_eastern_tigray",
      labelEn: "South Eastern Tigray",
      labelAm: "ደቡብ ምስራቅ ትግራይ",
    },
    { value: "southern_tigray", labelEn: "Southern Tigray", labelAm: "ደቡባዊ ትግራይ" },
    {
      value: "north_western_tigray",
      labelEn: "North Western Tigray",
      labelAm: "ሰሜን ምዕራብ ትግራይ",
    },
    { value: "western_tigray", labelEn: "Western Tigray", labelAm: "ምዕራብ ትግራይ" },
    {
      value: "mekelle_special_zone",
      labelEn: "Mekelle Special Zone",
      labelAm: "መቐለ ልዩ ዞን",
    },
  ],
  somali: [
    { value: "afder", labelEn: "Afder", labelAm: "አፍዴር" },
    { value: "doolo", labelEn: "Doolo (Dollo)", labelAm: "ዶሎ" },
    { value: "erer", labelEn: "Erer", labelAm: "ኤረር" },
    { value: "fafan", labelEn: "Fafan", labelAm: "ፋፋን" },
    { value: "jarar", labelEn: "Jarar", labelAm: "ጃራር" },
    { value: "korahe", labelEn: "Korahe", labelAm: "ቆራሄ" },
    { value: "liben", labelEn: "Liben", labelAm: "ሊበን" },
    { value: "dawa", labelEn: "Dawa (Dhawa)", labelAm: "ዳዋ" },
    { value: "nogob", labelEn: "Nogob", labelAm: "ኖጎብ" },
    { value: "shabelle", labelEn: "Shabelle", labelAm: "ሸበሌ" },
    { value: "sitti", labelEn: "Sitti", labelAm: "ሲቲ" },
    {
      value: "degehabur_special_zone",
      labelEn: "Degehabur Special Zone",
      labelAm: "ደገሃቡር ልዩ ዞን",
    },
    { value: "gode_special_zone", labelEn: "Gode Special Zone", labelAm: "ጎዴ ልዩ ዞን" },
    {
      value: "harawo_special_zone",
      labelEn: "Harawo Special Zone",
      labelAm: "ሀራዎ ልዩ ዞን",
    },
    {
      value: "kebri_beyah_special_zone",
      labelEn: "Kebri Beyah Special Zone",
      labelAm: "ቀብሪ በያህ ልዩ ዞን",
    },
    {
      value: "tog_wajale_special_zone",
      labelEn: "Tog Wajale Special Zone",
      labelAm: "ቶግ ዋጃሌ ልዩ ዞን",
    },
  ],
  gambela: [
    { value: "anywaa_zone", labelEn: "Anywaa Zone", labelAm: "አኝዋ ዞን" },
    { value: "nuer_zone", labelEn: "Nuer Zone", labelAm: "ኑዌር ዞን" },
    { value: "majang_zone", labelEn: "Majang Zone", labelAm: "ማጃንግ ዞን" },
    {
      value: "itang_special_woreda",
      labelEn: "Itang Special Woreda",
      labelAm: "ኢታንግ ልዩ ወረዳ",
    },
  ],
  harari: [
    {
      value: "harar_city_administration",
      labelEn: "Harar City Administration",
      labelAm: "ሐረር ከተማ አስተዳደር",
    },
    {
      value: "surrounding_rural_woredas",
      labelEn: "Surrounding Rural Woredas",
      labelAm: "አጎራባች የገጠር ወረዳዎች",
    },
  ],
  sidama: [
    { value: "central_sidama", labelEn: "Central Sidama", labelAm: "ማዕከላዊ ሲዳማ" },
    { value: "east_sidama", labelEn: "East Sidama", labelAm: "ምስራቅ ሲዳማ" },
    { value: "north_sidama", labelEn: "North Sidama", labelAm: "ሰሜን ሲዳማ" },
    { value: "south_sidama", labelEn: "South Sidama", labelAm: "ደቡብ ሲዳማ" },
    {
      value: "hawassa_city_administration",
      labelEn: "Hawassa City Administration",
      labelAm: "ሀዋሳ ከተማ አስተዳደር",
    },
  ],
  south_west_ethiopia: [
    { value: "bench_sheko", labelEn: "Bench Sheko", labelAm: "ቤንች ሸኮ" },
    { value: "dawro", labelEn: "Dawro", labelAm: "ዳውሮ" },
    { value: "keffa", labelEn: "Keffa", labelAm: "ከፋ" },
    { value: "sheka", labelEn: "Sheka", labelAm: "ሸካ" },
    { value: "west_omo", labelEn: "West Omo", labelAm: "ምዕራብ ኦሞ" },
    { value: "konta", labelEn: "Konta", labelAm: "ኮንታ" },
  ],
  dire_dawa: [
    { value: "addis_ketema", labelEn: "Addis Ketema", labelAm: "አዲስ ከተማ" },
    { value: "gende_kore", labelEn: "Gende Kore", labelAm: "ገንደ ኮሬ" },
    { value: "kezira", labelEn: "Kezira", labelAm: "ከዚራ" },
    { value: "megala", labelEn: "Megala", labelAm: "መጋላ" },
    { value: "sabian", labelEn: "Sabian", labelAm: "ሳቢያን" },
    { value: "dechatu", labelEn: "Dechatu", labelAm: "ደቻቱ" },
    { value: "shinile", labelEn: "Shinile", labelAm: "ሺኒሌ" },
    { value: "goro", labelEn: "Goro", labelAm: "ጎሮ" },
    { value: "melka_jebdu", labelEn: "Melka Jebdu", labelAm: "መልካ ጄብዱ" },
    {
      value: "surrounding_rural_administrations",
      labelEn: "Surrounding rural administrations",
      labelAm: "አጎራባች የገጠር ቀበሌዎች",
    },
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
