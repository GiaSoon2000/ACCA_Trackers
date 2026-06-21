import React, { useState, useEffect, useCallback } from "react";
import { DEFAULT_SETTINGS } from "./data/sampleSyllabus";
import { Chapter, TrackerSettings } from "./types";
import { MathWidget } from "./components/MathWidget";
import { OnboardingSettings } from "./components/OnboardingSettings";
import { TextParser } from "./components/TextParser";
import {
  db,
  saveTrackerStateToCloud,
  fetchTrackerStateFromCloud,
} from "./lib/firebase";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  Settings as SettingsIcon,
  Trash2,
  Plus,
  X,
  Cloud,
  CloudOff,
  Loader,
  BookOpenCheck,
} from "lucide-react";

// Fixed document ID — personal single-user app, no auth required.
const STUDENT_ID = "sister_acca_prep";

type SyncStatus = "idle" | "loading" | "synced" | "saving" | "error" | "offline";

export default function App() {
  // ─── Core state ─────────────────────────────────────────────────────────────
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [settings, setSettings] = useState<TrackerSettings>(DEFAULT_SETTINGS);

  // ─── UI state ────────────────────────────────────────────────────────────────
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  // Per-chapter inline subchapter input
  const [subInput, setSubInput] = useState<Record<string, string>>({});

  // ─── Firebase: Load on mount ─────────────────────────────────────────────────
  useEffect(() => {
    async function loadFromCloud() {
      if (!db) {
        setSyncStatus("offline");
        return;
      }
      setSyncStatus("loading");
      const cloudData = await fetchTrackerStateFromCloud(STUDENT_ID);
      if (cloudData && Array.isArray(cloudData.chapters)) {
        setChapters(cloudData.chapters);
        if (cloudData.settings) setSettings(cloudData.settings);
        setSyncStatus("synced");
      } else {
        // First session — no cloud data yet
        setSyncStatus("idle");
      }
    }
    loadFromCloud();
  }, []);

  // ─── Firebase: Debounced save on state changes ────────────────────────────────
  useEffect(() => {
    if (syncStatus === "loading") return; // Don't save during initial load

    const timer = setTimeout(async () => {
      if (!db) return;
      setSyncStatus("saving");
      const ok = await saveTrackerStateToCloud(STUDENT_ID, { chapters, settings });
      setSyncStatus(ok ? "synced" : "error");
    }, 1200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapters, settings]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleToggleSubchapter = useCallback((chapterId: string, subId: string) => {
    setChapters((prev) =>
      prev.map((ch) => {
        if (ch.id !== chapterId) return ch;
        return {
          ...ch,
          subchapters: ch.subchapters.map((sub) =>
            sub.id === subId ? { ...sub, isCompleted: !sub.isCompleted } : sub
          ),
        };
      })
    );
  }, []);

  const toggleChapterExpand = useCallback((chapterId: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  }, []);

  const handleAddSubchapter = useCallback((chapterId: string) => {
    const text = subInput[chapterId]?.trim();
    if (!text) return;
    setChapters((prev) =>
      prev.map((ch) => {
        if (ch.id !== chapterId) return ch;
        return {
          ...ch,
          subchapters: [
            ...ch.subchapters,
            { id: `custom-sub-${Date.now()}`, title: text, isCompleted: false },
          ],
        };
      })
    );
    setSubInput((prev) => ({ ...prev, [chapterId]: "" }));
  }, [subInput]);

  const handleRemoveChapter = useCallback((chapterId: string, chapterTitle: string) => {
    const confirmed = window.confirm(
      `Delete "${chapterTitle}" and all its subchapters?\n\nThis cannot be undone. (You can always re-paste your portal text to reload it.)`
    );
    if (!confirmed) return;
    setChapters((prev) => prev.filter((c) => c.id !== chapterId));
  }, []);

  const handleParsed = useCallback((newChapters: Chapter[]) => {
    setChapters(newChapters);
    // Auto-expand first two chapters for immediate visibility
    const expands: Record<string, boolean> = {};
    newChapters.slice(0, 2).forEach((c) => { expands[c.id] = true; });
    setExpandedChapters(expands);
  }, []);

  const handleClearAll = () => {
    const confirmed = window.confirm(
      "Clear the entire syllabus?\n\nUse this when starting a new exam. All chapters and your progress will be permanently deleted from the cloud."
    );
    if (!confirmed) return;
    setChapters([]);
    setExpandedChapters({});
  };

  // ─── Derived stats ────────────────────────────────────────────────────────────
  const totalSubchapters = chapters.reduce((acc, c) => acc + c.subchapters.length, 0);
  const finishedSubchapters = chapters.reduce(
    (acc, c) => acc + c.subchapters.filter((s) => s.isCompleted).length,
    0
  );
  const syllabusLoaded = chapters.length > 0;

  // ─── Sync indicator ───────────────────────────────────────────────────────────
  const SyncIndicator = () => {
    if (!db) {
      return (
        <span className="flex items-center gap-1 text-[9px] text-slate-400 font-mono" title="Offline mode — no Firebase connection">
          <CloudOff className="w-3 h-3" /> Offline
        </span>
      );
    }
    if (syncStatus === "loading") {
      return (
        <span className="flex items-center gap-1 text-[9px] text-slate-400 font-mono animate-pulse">
          <Loader className="w-3 h-3 animate-spin" /> Loading...
        </span>
      );
    }
    if (syncStatus === "saving") {
      return (
        <span className="flex items-center gap-1 text-[9px] text-amber-500 font-mono animate-pulse">
          <Loader className="w-3 h-3 animate-spin" /> Saving...
        </span>
      );
    }
    if (syncStatus === "synced") {
      return (
        <span className="flex items-center gap-1 text-[9px] text-emerald-500 font-mono" title="Saved to Firestore">
          <Cloud className="w-3 h-3" /> Synced
        </span>
      );
    }
    if (syncStatus === "error") {
      return (
        <span className="flex items-center gap-1 text-[9px] text-rose-400 font-mono" title="Sync failed — check connection">
          <CloudOff className="w-3 h-3" /> Sync error
        </span>
      );
    }
    return null;
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      id="app-root"
      className="min-h-screen bg-gradient-to-br from-slate-100 via-rose-50 to-teal-50 flex items-start justify-center p-3 sm:p-6 font-sans"
    >
      {/* Central card — max-width 430px mirrors a phone screen */}
      <div className="w-full max-w-[430px] flex flex-col gap-0 rounded-3xl shadow-2xl overflow-hidden border border-white/60 bg-white">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="bg-[#FF6B6B] px-5 pt-5 pb-4 text-white">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-80 font-mono font-bold">
                ACCA Study Tracker
              </p>
              <h1 className="text-2xl font-black tracking-tight leading-tight mt-0.5">
                My Sister's Prep
              </h1>
            </div>
            <div className="flex flex-col items-end gap-2 mt-1">
              <SyncIndicator />
              <button
                id="settings-toggle-btn"
                onClick={() => setIsSettingsOpen((v) => !v)}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                aria-expanded={isSettingsOpen}
                aria-label="Toggle settings panel"
              >
                <SettingsIcon className="w-3.5 h-3.5" />
                {isSettingsOpen ? "Close" : "Settings"}
              </button>
            </div>
          </div>

          {/* Commitment quick-read */}
          {!isSettingsOpen && (
            <div className="mt-2 bg-white/10 rounded-xl px-3 py-2 text-xs text-white/90 flex items-center justify-between">
              <span className="font-medium">
                📅 Exam:{" "}
                <span className="font-black">
                  {new Date(settings.examDate + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </span>
              <span className="font-medium">
                🔥 <span className="font-black">{settings.studyDaysPerWeek}</span> days/wk
              </span>
            </div>
          )}
        </div>

        {/* ── Settings panel (collapsible) ────────────────────────────────────── */}
        {isSettingsOpen && (
          <div className="bg-[#FFFAF0] border-b border-amber-100 px-5 py-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                <SettingsIcon className="w-3.5 h-3.5 text-[#FF6B6B]" />
                Study Plan Settings
              </h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 hover:bg-amber-100 rounded-full transition"
                aria-label="Close settings"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <OnboardingSettings settings={settings} onChange={setSettings} />
          </div>
        )}

        {/* ── Math Dashboard (dark card) ──────────────────────────────────────── */}
        <div className="bg-slate-900 px-5 py-5">
          <MathWidget chapters={chapters} settings={settings} />
        </div>

        {/* ── Syllabus Tracker ────────────────────────────────────────────────── */}
        <div className="flex-1 bg-[#FFFAF0] px-4 pt-4 pb-2">

          {/* Section header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-slate-700">
              <Layers className="w-4 h-4 text-[#4ECDC4]" />
              <h2 className="text-xs font-black uppercase tracking-wide">Syllabus Chapters</h2>
            </div>
            <div className="flex items-center gap-2">
              {syllabusLoaded && (
                <>
                  <span className="text-[10px] font-bold text-[#4ECDC4] bg-[#4ECDC4]/10 px-2 py-0.5 rounded-full">
                    {finishedSubchapters}/{totalSubchapters} done
                  </span>
                  <button
                    onClick={handleClearAll}
                    title="Clear all chapters (start fresh for a new exam)"
                    className="flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-600 font-bold font-mono transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear All
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Empty state */}
          {!syllabusLoaded ? (
            <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-slate-200 px-6 mb-4">
              <BookOpenCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">No syllabus loaded yet</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Set your exam details above, then paste your ACCA portal text in the field below to generate your personal study schedule.
              </p>
            </div>
          ) : (
            /* Chapter accordion list */
            <div className="space-y-2.5 mb-3">
              {chapters.map((chapter) => {
                const isExpanded = !!expandedChapters[chapter.id];
                const chDone = chapter.subchapters.filter((s) => s.isCompleted).length;
                const chTotal = chapter.subchapters.length;
                const allDone = chTotal > 0 && chDone === chTotal;

                return (
                  <div
                    key={chapter.id}
                    className={`border-2 rounded-2xl overflow-hidden transition-all duration-200 ${
                      isExpanded
                        ? "border-[#4ECDC4] bg-[#4ECDC4]/5 shadow-sm"
                        : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                  >
                    {/* Accordion header */}
                    <div
                      onClick={() => toggleChapterExpand(chapter.id)}
                      className="p-3.5 flex justify-between items-center cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg text-[11px] font-bold flex items-center justify-center shrink-0 transition-colors ${
                            allDone
                              ? "bg-slate-200 text-slate-400"
                              : isExpanded
                              ? "bg-[#4ECDC4] text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {chapter.chapterNumber.replace(/\D/g, "") || "0"}
                        </div>
                        <div>
                          <span className="block text-[9px] font-mono font-bold text-slate-400 uppercase leading-none">
                            {chapter.chapterNumber}
                          </span>
                          <span
                            className={`block text-xs font-black leading-tight mt-0.5 ${
                              allDone ? "text-slate-400 line-through" : "text-slate-800"
                            }`}
                          >
                            {chapter.chapterTitle}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {chDone}/{chTotal}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#4ECDC4]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded subchapter list */}
                    {isExpanded && (
                      <div className="border-t border-[#4ECDC4]/20 bg-white p-3 space-y-2">
                        {chapter.subchapters.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-start gap-2 cursor-pointer group"
                            onClick={() => handleToggleSubchapter(chapter.id, sub.id)}
                          >
                            <button
                              type="button"
                              id={`sub-check-${sub.id}`}
                              aria-checked={sub.isCompleted}
                              role="checkbox"
                              className={`w-4 h-4 mt-0.5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-all ${
                                sub.isCompleted
                                  ? "bg-[#4ECDC4] border-[#4ECDC4] text-white"
                                  : "border-slate-300 group-hover:border-[#4ECDC4] bg-white"
                              }`}
                            >
                              {sub.isCompleted && <Check className="w-3 h-3 stroke-[3px]" />}
                            </button>
                            <span
                              className={`text-[11px] leading-relaxed select-none transition-all ${
                                sub.isCompleted
                                  ? "text-slate-400 line-through"
                                  : "text-slate-800 font-semibold"
                              }`}
                            >
                              {sub.title}
                            </span>
                          </div>
                        ))}

                        {/* Inline subchapter adder */}
                        <div className="pt-2 mt-1 border-t border-slate-100 flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Add a topic..."
                            value={subInput[chapter.id] || ""}
                            onChange={(e) =>
                              setSubInput((prev) => ({ ...prev, [chapter.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddSubchapter(chapter.id);
                            }}
                            className="flex-1 bg-slate-50 border border-slate-200 text-[11px] p-1.5 rounded-lg text-slate-800 focus:outline-none focus:border-[#4ECDC4]"
                          />
                          <button
                            onClick={() => handleAddSubchapter(chapter.id)}
                            className="bg-[#4ECDC4] hover:bg-teal-500 text-white px-2.5 py-1 rounded-lg text-xs font-black transition"
                            title="Add topic"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Delete chapter */}
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveChapter(chapter.id, chapter.chapterTitle);
                            }}
                            className="flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-600 font-mono font-medium transition"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete Chapter
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Text Parser ─────────────────────────────────────────────────────── */}
        <div className="bg-white border-t border-slate-100 px-4 py-4">
          <TextParser onParsed={handleParsed} />
        </div>

      </div>
    </div>
  );
}
