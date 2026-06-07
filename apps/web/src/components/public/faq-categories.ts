export const FAQ_CATEGORIES = [
  {
    id: "general",
    items: [
      "types",
      "requiredInfo",
      "whyPersonalInfo",
      "anonymous",
      "category",
      "consent",
      "multipleComplaints",
      "languages",
    ],
  },
  {
    id: "submitting",
    items: ["evidenceRequired", "evidence", "fileTypes", "editAfterSubmit"],
  },
  {
    id: "tracking",
    items: ["track", "lostReference", "trackingVisibility", "timeline"],
  },
  {
    id: "privacy",
    items: ["sharedWith", "privacy"],
  },
  {
    id: "support",
    items: ["appeal", "contact"],
  },
] as const;

export type FaqCategoryId = (typeof FAQ_CATEGORIES)[number]["id"];
export type FaqItemId = (typeof FAQ_CATEGORIES)[number]["items"][number];
