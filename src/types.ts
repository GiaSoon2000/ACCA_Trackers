export interface Subchapter {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Chapter {
  id: string;
  chapterNumber: string; // e.g., "0", "1", "Chapter 0", "Chapter 1"
  chapterTitle: string;
  subchapters: Subchapter[];
}

export interface TrackerSettings {
  examDate: string; // YYYY-MM-DD
  studyDaysPerWeek: number; // 1 to 7
}

export type QueueItemStatus = 'idle' | 'processing' | 'retry_cooldown' | 'completed' | 'failed';

export interface QueueItem {
  id: string;
  name: string;
  size: number;
  status: QueueItemStatus;
  progress: number; // 0 to 100
  error?: string;
  cooldownRemaining?: number; // countdown in seconds when rate limited
  base64Data?: string;
  mimeType?: string;
}
