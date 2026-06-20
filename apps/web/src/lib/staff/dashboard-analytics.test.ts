import { describe, expect, it } from "vitest";
import {
  volumeWindowCount,
  volumeWindowRangeLabel,
  volumeWindowSlice,
  type WeeklyVolume,
} from "./dashboard-analytics";

function day(label: string): WeeklyVolume {
  return { label, submitted: 1, closed: 0 };
}

describe("volume chart windows", () => {
  const twoWeeks = Array.from({ length: 14 }, (_, i) => day(`Jun ${i + 5}`));

  it("shows the latest seven days by default", () => {
    expect(volumeWindowSlice(twoWeeks, 0)).toHaveLength(7);
    expect(volumeWindowSlice(twoWeeks, 0)[0].label).toBe("Jun 12");
    expect(volumeWindowSlice(twoWeeks, 0)[6].label).toBe("Jun 18");
  });

  it("shows the previous seven days when stepping back", () => {
    expect(volumeWindowSlice(twoWeeks, 1)).toHaveLength(7);
    expect(volumeWindowSlice(twoWeeks, 1)[0].label).toBe("Jun 5");
    expect(volumeWindowSlice(twoWeeks, 1)[6].label).toBe("Jun 11");
  });

  it("computes window count and range labels", () => {
    expect(volumeWindowCount(14)).toBe(2);
    expect(volumeWindowRangeLabel(volumeWindowSlice(twoWeeks, 1))).toBe(
      "Jun 5 – Jun 11",
    );
  });
});
