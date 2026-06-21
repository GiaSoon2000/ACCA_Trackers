import React from "react";
import { Chapter, TrackerSettings } from "../types";
import { Calendar, BookOpen, Clock, AlertCircle, Sparkles, CheckCircle } from "lucide-react";

interface MathWidgetProps {
  chapters: Chapter[];
  settings: TrackerSettings;
}

export const MathWidget: React.FC<MathWidgetProps> = ({ chapters, settings }) => {
  // 1. Total and remaining subchapters count
  let totalSubchapters = 0;
  let completedSubchapters = 0;

  chapters.forEach((c) => {
    c.subchapters.forEach((sub) => {
      totalSubchapters++;
      if (sub.isCompleted) {
        completedSubchapters++;
      }
    });
  });

  const remainingSubchapters = totalSubchapters - completedSubchapters;
  const progressPercent = totalSubchapters > 0 ? Math.round((completedSubchapters / totalSubchapters) * 100) : 0;

  // 2. Total Days Remaining until chosen exam date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const exam = new Date(settings.examDate);
  exam.setHours(0, 0, 0, 0);

  const msDiff = exam.getTime() - today.getTime();
  const calendarDaysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

  // 3. Calculation of total active study sessions left
  // Formula matching spec: if 14 calendar days remaining and 4 study days/week -> 8 active sessions left
  const totalStudyDaysLeft = Math.ceil((calendarDaysRemaining / 7) * settings.studyDaysPerWeek);

  // 4. Daily Subchapter Target (Remaining subchapters divided by Total Study Days Left)
  // If no sessions are left or exam is today, fallback to remaining count to avoid division by zero or infinity.
  let targetPerStudyDay = 0;
  if (totalStudyDaysLeft > 0) {
    targetPerStudyDay = parseFloat((remainingSubchapters / totalStudyDaysLeft).toFixed(2));
  } else if (remainingSubchapters > 0) {
    targetPerStudyDay = remainingSubchapters; // Must do all of them today!
  }

  // Round target upward to a whole number for human actionable target
  const roundedTarget = Math.ceil(targetPerStudyDay);

  // Formatting date for nice display
  const formatDate = (dateStr: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
      return new Date(dateStr).toLocaleDateString("en-US", options);
    } catch {
      return dateStr;
    }
  };

  // Automatic catch up scaling message logic
  // Calculate raw initial speed required (e.g. if starting 12 weeks out with study committed)
  // Just show helpful hints based on commitments
  const getMotivationalMessage = () => {
    if (calendarDaysRemaining === 0) {
      if (remainingSubchapters === 0) {
        return {
          title: "Exam Day is Here!",
          desc: "You have reviewed 100% of the syllabus! Put on your game face and crush this ACCA exam.",
          type: "success",
        };
      } else {
        return {
          title: "Exam is Today / Overdue",
          desc: `You have ${remainingSubchapters} topic(s) left. Complete them immediately to ensure assurance coverage.`,
          type: "danger",
        };
      }
    }

    if (remainingSubchapters === 0) {
      return {
        title: "All Caught Up!",
        desc: "Phenomenal! Your syllabus progress is at 100%. Use the remaining days for mock drafts and past papers.",
        type: "success",
      };
    }

    if (targetPerStudyDay > 3) {
      return {
        title: "Catch-up Alert Active ⚠️",
        desc: `High study load detected! The math engine scaled your target to ${targetPerStudyDay} subchapters per study session because of unticked sections. Allocate extra review block hours to recover.`,
        type: "warning",
      };
    }

    if (targetPerStudyDay <= 1) {
      return {
        title: "Sustained Pace ☕",
        desc: "Brilliant! You are on a highly sustainable pace. Just study 1 subchapter per committed block day to graduate.",
        type: "cool",
      };
    }

    return {
      title: "Steady Action Required 📈",
      desc: `Your current commitment schedule of ${settings.studyDaysPerWeek} days/week matches your syllabus load perfectly. Aim for ${roundedTarget} topics per study session to secure completion.`,
      type: "info",
    };
  };

  const motivation = getMotivationalMessage();

  return (
    <div id="math-widget-container" className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6 text-white shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl -ml-6 -mb-6" />

      {/* Header Info */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">My Exam Target</span>
          <h3 id="exam-date-title" className="text-base font-semibold text-emerald-400 mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-400" />
            {formatDate(settings.examDate)}
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">Completed</span>
          <h3 id="overall-progress-text" className="text-lg font-bold text-white mt-0.5 flex items-center justify-end gap-1">
            {progressPercent}%
            {progressPercent === 100 && <CheckCircle className="w-4 h-4 text-emerald-400 inline" />}
          </h3>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full mb-6">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-mono">
          <span>{completedSubchapters} / {totalSubchapters} Topics Mastered</span>
          <span>{remainingSubchapters} Left</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            id="main-progress-bar"
            className="h-full bg-linear-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Three-Column Bento Grid metrics (Native Mobile Style) */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Metric 1 */}
        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 flex flex-col items-center text-center">
          <Clock className="w-5 h-5 text-teal-400 mb-1" />
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-tight leading-none">Days Left</span>
          <span id="calendar-days-remaining" className="text-xl font-bold mt-1 text-white leading-none">
            {calendarDaysRemaining}
          </span>
          <span className="text-[8px] text-slate-500 mt-1 font-mono">Calendar</span>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 flex flex-col items-center text-center">
          <BookOpen className="w-5 h-5 text-emerald-400 mb-1" />
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-tight leading-none">Study Blocks</span>
          <span id="study-days-remaining" className="text-xl font-bold mt-1 text-white leading-none">
            {totalStudyDaysLeft}
          </span>
          <span className="text-[8px] text-slate-500 mt-1 font-mono">At {settings.studyDaysPerWeek}d/wk</span>
        </div>

        {/* Metric 3 */}
        <div className="bg-emerald-950/30 p-3 rounded-2xl border border-emerald-500/20 flex flex-col items-center text-center relative overflow-hidden">
          <Sparkles className="w-5 h-5 text-emerald-300 mb-1" />
          <span className="text-[10px] text-emerald-300 uppercase font-mono tracking-tight leading-none">Target Daily</span>
          <span id="daily-subchapter-target" className="text-xl font-black mt-1 text-emerald-400 leading-none">
            {targetPerStudyDay}
          </span>
          <span className="text-[8px] text-emerald-500/80 mt-1 font-mono font-medium">Topics / Session</span>
        </div>
      </div>

      {/* Motivational / Catch-up Warning Alertbox */}
      <div
        id="motivation-alert-box"
        className={`p-3.5 rounded-2xl border text-xs flex gap-2.5 items-start ${
          motivation.type === "warning"
            ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
            : motivation.type === "danger"
            ? "bg-rose-950/20 border-rose-500/30 text-rose-200"
            : motivation.type === "success"
            ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
            : "bg-slate-950/40 border-slate-800 text-slate-300"
        }`}
      >
        <AlertCircle className={`w-4 h-4 shrink-0 ${
          motivation.type === "warning" ? "text-amber-400" :
          motivation.type === "danger" ? "text-rose-400" :
          motivation.type === "success" ? "text-emerald-400" : "text-slate-400"
        } mt-0.5`} />
        <div>
          <p className="font-semibold block mb-0.5">{motivation.title}</p>
          <p className="leading-relaxed opacity-90">{motivation.desc}</p>
        </div>
      </div>
    </div>
  );
};
