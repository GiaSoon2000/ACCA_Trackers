import { TrackerSettings } from "../types";

// Default settings: exam ~80 days away, 4 study days per week.
// The exam date is calculated dynamically so it's always relative to when the app is first used.
export const DEFAULT_SETTINGS: TrackerSettings = {
  examDate: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  studyDaysPerWeek: 4,
};
