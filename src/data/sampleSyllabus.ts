import { Chapter, TrackerSettings } from "../types";

// Default settings configured to roughly 3 months out with 5 study days a week
export const DEFAULT_SETTINGS: TrackerSettings = {
  examDate: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // approx 80 days away
  studyDaysPerWeek: 4,
};

export const SAMPLE_ACCA_SYLLABUS: Chapter[] = [
  {
    id: "chapter-0",
    chapterNumber: "Chapter 0",
    chapterTitle: "Introduction & ACCA Core Syllabus Study Guide",
    subchapters: [
      { id: "sub-0-1", title: "ACCA AA Syllabus Objective & Key Capabilities", isCompleted: true },
      { id: "sub-0-2", title: "Syllabus Relational Diagram & Exam Structure", isCompleted: true },
      { id: "sub-0-3", title: "Study & Practice Exam Guidelines", isCompleted: false },
    ],
  },
  {
    id: "chapter-1",
    chapterNumber: "Chapter 1",
    chapterTitle: "Audit Framework and Regulation",
    subchapters: [
      { id: "sub-1-1", title: "The Concept, Purpose, and Scope of Assurance", isCompleted: true },
      { id: "sub-1-2", title: "Corporate Governance Requirements", isCompleted: false },
      { id: "sub-1-3", title: "Professional Ethics and Liability Issues", isCompleted: false },
      { id: "sub-1-4", title: "Internal Audit Role, Scope, and Responsibility", isCompleted: false },
    ],
  },
  {
    id: "chapter-2",
    chapterNumber: "Chapter 2",
    chapterTitle: "Planning and Risk Assessment",
    subchapters: [
      { id: "sub-2-1", title: "Obtaining and Accepting Audit Engagements", isCompleted: false },
      { id: "sub-2-2", title: "Understanding the Entity and its Environment", isCompleted: false },
      { id: "sub-2-3", title: "Assessing Audit Risks and Materiality Bounds", isCompleted: false },
      { id: "sub-2-4", title: "The Written Planning Memorandum", isCompleted: false },
    ],
  },
  {
    id: "chapter-3",
    chapterNumber: "Chapter 3",
    chapterTitle: "Internal Control Systems",
    subchapters: [
      { id: "sub-3-1", title: "Audit Evaluation of Internal Control Mechanisms", isCompleted: false },
      { id: "sub-3-2", title: "Standard Transactional Cycles (Sales, Purchases)", isCompleted: false },
      { id: "sub-3-3", title: "Payroll, Inventory, and Cash Control Audits", isCompleted: false },
      { id: "sub-3-4", title: "Writing Letters on Internal Control Deficiencies", isCompleted: false },
    ],
  },
  {
    id: "chapter-4",
    chapterNumber: "Chapter 4",
    chapterTitle: "Audit Evidence & Testing Methods",
    subchapters: [
      { id: "sub-4-1", title: "Financial Statement Assertions & Audit Procedures", isCompleted: false },
      { id: "sub-4-2", title: "Audit Sampling and Computer-Assisted Techniques", isCompleted: false },
      { id: "sub-4-3", title: "Substantive Procedures for Non-current Assets", isCompleted: false },
      { id: "sub-4-4", title: "Substantive Procedures for Receivables and Cash", isCompleted: false },
      { id: "sub-4-5", title: "SOP Audit Procedures for Inventory & Payables", isCompleted: false },
    ],
  },
  {
    id: "chapter-5",
    chapterNumber: "Chapter 5",
    chapterTitle: "Review Audit conclusions & Final Reporting",
    subchapters: [
      { id: "sub-5-1", title: "Subsequent Events Analysis & Going Concern Review", isCompleted: false },
      { id: "sub-5-2", title: "Evaluating Misstatements & Working Paper Reviews", isCompleted: false },
      { id: "sub-5-3", title: "Informed Written Representations", isCompleted: false },
      { id: "sub-5-4", title: "Assurance Reports: Qualified vs Unmodified Opinions", isCompleted: false },
    ],
  },
];
