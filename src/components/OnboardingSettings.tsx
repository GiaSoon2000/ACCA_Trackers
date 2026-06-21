import React from "react";
import { TrackerSettings } from "../types";
import { Calendar, Flame } from "lucide-react";

interface OnboardingSettingsProps {
  settings: TrackerSettings;
  onChange: (settings: TrackerSettings) => void;
}

export const OnboardingSettings: React.FC<OnboardingSettingsProps> = ({ settings, onChange }) => {
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <div id="onboarding-settings-container" className="space-y-4">
      {/* Exam Date Picker */}
      <div>
        <label
          htmlFor="exam-date-picker"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5"
        >
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          Exam Date
        </label>
        <input
          id="exam-date-picker"
          type="date"
          min={getMinDate()}
          value={settings.examDate}
          onChange={(e) => onChange({ ...settings, examDate: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 text-slate-800 rounded-xl p-3 text-sm font-medium outline-none transition-all"
        />
      </div>

      {/* Study Days Dropdown */}
      <div>
        <label
          htmlFor="study-days-selector"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5"
        >
          <Flame className="w-3.5 h-3.5 text-slate-400" />
          Study Days per Week
        </label>
        <select
          id="study-days-selector"
          value={settings.studyDaysPerWeek}
          onChange={(e) =>
            onChange({ ...settings, studyDaysPerWeek: parseInt(e.target.value, 10) })
          }
          className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 text-slate-800 rounded-xl p-3 text-sm font-medium outline-none transition-all appearance-none"
        >
          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
            <option key={num} value={num}>
              {num} {num === 1 ? "day" : "days"} per week
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
