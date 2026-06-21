import React from "react";
import { Chapter, TrackerSettings } from "../types";
import { Calendar, BookOpen, Zap, CheckCircle, AlertCircle, Coffee, TrendingUp, Trophy } from "lucide-react";

interface MathWidgetProps {
  chapters: Chapter[];
  settings: TrackerSettings;
}

export const MathWidget: React.FC<MathWidgetProps> = ({ chapters, settings }) => {
  const syllabusLoaded = chapters.length > 0;

  // --- Subchapter counts ---
  let totalSubchapters = 0;
  let completedSubchapters = 0;

  if (syllabusLoaded) {
    chapters.forEach((c) => {
      c.subchapters.forEach((sub) => {
        totalSubchapters++;
        if (sub.isCompleted) completedSubchapters++;
      });
    });
  }

  const remainingSubchapters = totalSubchapters - completedSubchapters;
  const progressPercent =
    totalSubchapters > 0 ? Math.round((completedSubchapters / totalSubchapters) * 100) : 0;

  // --- Calendar days remaining (always uses real today's date) ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(settings.examDate + "T00:00:00");
  exam.setHours(0, 0, 0, 0);
  const msDiff = exam.getTime() - today.getTime();
  const calendarDaysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

  // --- Study blocks left ---
  const studyBlocksLeft = Math.ceil((calendarDaysRemaining / 7) * settings.studyDaysPerWeek);

  // --- Daily subchapter target ---
  let dailyTarget = 0;
  if (syllabusLoaded && studyBlocksLeft > 0) {
    dailyTarget = parseFloat((remainingSubchapters / studyBlocksLeft).toFixed(1));
  } else if (syllabusLoaded && remainingSubchapters > 0) {
    dailyTarget = remainingSubchapters; // Exam is today or overdue — do everything!
  }

  // --- Motivational / status message ---
  const getStatus = () => {
    if (!syllabusLoaded) {
      return {
        icon: <BookOpen className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />,
        title: "Welcome! Your tracker is ready.",
        desc: "Set your exam details above, then paste your ACCA portal text below to generate your personal study schedule.",
        style: "bg-slate-800/60 border-slate-700 text-slate-300",
      };
    }
    if (calendarDaysRemaining === 0 && remainingSubchapters === 0) {
      return {
        icon: <Trophy className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />,
        title: "Exam Day — You're Ready!",
        desc: "100% of the syllabus is complete. Put on your game face and crush this ACCA exam.",
        style: "bg-emerald-950/30 border-emerald-500/30 text-emerald-200",
      };
    }
    if (calendarDaysRemaining === 0 && remainingSubchapters > 0) {
      return {
        icon: <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />,
        title: "Exam Day / Overdue",
        desc: `${remainingSubchapters} topic(s) remain. Complete all remaining material immediately.`,
        style: "bg-rose-950/20 border-rose-500/30 text-rose-200",
      };
    }
    if (remainingSubchapters === 0) {
      return {
        icon: <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />,
        title: "All Caught Up! 🎉",
        desc: `Phenomenal! Your syllabus is 100% complete. Use the remaining ${calendarDaysRemaining} days for mock exams and past papers.`,
        style: "bg-emerald-950/30 border-emerald-500/30 text-emerald-200",
      };
    }
    if (dailyTarget > 3) {
      return {
        icon: <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />,
        title: "Catch-Up Alert ⚠️",
        desc: `Your target has scaled to ${dailyTarget} subchapters per study session. Try to add an extra study block or two this week to recover pace.`,
        style: "bg-amber-950/20 border-amber-500/30 text-amber-200",
      };
    }
    if (dailyTarget <= 1) {
      return {
        icon: <Coffee className="w-4 h-4 shrink-0 text-teal-400 mt-0.5" />,
        title: "Comfortable Pace ☕",
        desc: `You only need ${dailyTarget || 1} subchapter per study session. You're well ahead — keep it consistent!`,
        style: "bg-teal-950/20 border-teal-500/30 text-teal-200",
      };
    }
    return {
      icon: <TrendingUp className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />,
      title: "Steady Progress 📈",
      desc: `Aim for ${Math.ceil(dailyTarget)} topics per study session across your ${settings.studyDaysPerWeek} committed day(s) a week to finish right on time.`,
      style: "bg-indigo-950/20 border-indigo-500/30 text-indigo-200",
    };
  };

  const status = getStatus();

  const formatExamDate = (dateStr: string) => {
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div id="math-widget-container" className="w-full">
      {/* Header row */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono block">
            Exam Target
          </span>
          <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3.5 h-3.5" />
            {formatExamDate(settings.examDate)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono block">
            Progress
          </span>
          <span className="text-lg font-bold text-white mt-0.5 flex items-center justify-end gap-1">
            {progressPercent}%
            {progressPercent === 100 && syllabusLoaded && (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            )}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full mb-4">
        <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono">
          <span>{completedSubchapters} / {totalSubchapters} topics mastered</span>
          <span>{remainingSubchapters} remaining</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            id="main-progress-bar"
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Three stat cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-700/50 flex flex-col items-center text-center">
          <Calendar className="w-4 h-4 text-teal-400 mb-1" />
          <span className="text-[9px] text-slate-400 uppercase font-mono leading-none">Days Left</span>
          <span id="calendar-days-remaining" className="text-2xl font-black mt-1 text-white leading-none">
            {calendarDaysRemaining}
          </span>
          <span className="text-[8px] text-slate-500 mt-1 font-mono">Calendar</span>
        </div>

        <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-700/50 flex flex-col items-center text-center">
          <BookOpen className="w-4 h-4 text-emerald-400 mb-1" />
          <span className="text-[9px] text-slate-400 uppercase font-mono leading-none">Study Blocks</span>
          <span id="study-blocks-remaining" className="text-2xl font-black mt-1 text-white leading-none">
            {studyBlocksLeft}
          </span>
          <span className="text-[8px] text-slate-500 mt-1 font-mono">Sessions</span>
        </div>

        <div
          className={`p-3 rounded-2xl border flex flex-col items-center text-center ${
            syllabusLoaded
              ? "bg-emerald-950/30 border-emerald-500/20"
              : "bg-slate-800/70 border-slate-700/50"
          }`}
        >
          <Zap
            className={`w-4 h-4 mb-1 ${syllabusLoaded ? "text-emerald-300" : "text-slate-500"}`}
          />
          <span
            className={`text-[9px] uppercase font-mono leading-none ${
              syllabusLoaded ? "text-emerald-300" : "text-slate-400"
            }`}
          >
            Daily Target
          </span>
          <span
            id="daily-subchapter-target"
            className={`text-2xl font-black mt-1 leading-none ${
              syllabusLoaded ? "text-emerald-400" : "text-slate-600"
            }`}
          >
            {syllabusLoaded ? (dailyTarget || 0) : 0}
          </span>
          <span
            className={`text-[8px] mt-1 font-mono ${
              syllabusLoaded ? "text-emerald-600" : "text-slate-600"
            }`}
          >
            Topics/Session
          </span>
        </div>
      </div>

      {/* Motivational / onboarding message */}
      <div
        id="status-alert-box"
        className={`p-3 rounded-2xl border text-xs flex gap-2 items-start ${status.style}`}
      >
        {status.icon}
        <div>
          <p className="font-semibold mb-0.5">{status.title}</p>
          <p className="leading-relaxed opacity-90">{status.desc}</p>
        </div>
      </div>
    </div>
  );
};
