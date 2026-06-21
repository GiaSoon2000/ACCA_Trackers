export interface Subchapter {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Chapter {
  id: string;
  chapterNumber: string; // e.g., "Chapter 0", "Chapter 1"
  chapterTitle: string;
  subchapters: Subchapter[];
}

export interface TrackerSettings {
  examDate: string; // YYYY-MM-DD
  studyDaysPerWeek: number; // 1 to 7
}
