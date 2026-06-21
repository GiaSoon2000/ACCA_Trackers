import React from "react";
import { TrackerSettings } from "../types";
import { Settings as SettingsIcon, Calendar, Flame, RefreshCw } from "lucide-react";

interface OnboardingSettingsProps {
  settings: TrackerSettings;
  onChange: (settings: TrackerSettings) => void;
  onResetToDefault: () => void;
}

export const OnboardingSettings: React.FC<OnboardingSettingsProps> = ({
  settings,
  onChange,
  onResetToDefault,
}) => {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...settings,
      examDate: e.target.value,
    });
  };

  const handleDaysChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...settings,
      studyDaysPerWeek: parseInt(e.target.value, 10),
    });
  };

  // Get minimum date for tomorrow
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <div id="onboarding-settings-container" className="w-full bg-white border border-slate-100 rounded-3xl p-5 mb-6 shadow-xs">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
          <SettingsIcon className="w-4 h-4 text-emerald-600" />
          Plan Commitments
        </h3>
        <button
          onClick={onResetToDefault}
          className="text-xs text-slate-500 hover:text-emerald-700 font-mono flex items-center gap-1 transition-all"
        >
          <RefreshCw className="w-3 h-3" />
          Reset Date
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Exam Date Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Exam Date
          </label>
          <input
            id="exam-date-picker"
            type="date"
            min={getMinDate()}
            value={settings.examDate}
            onChange={handleDateChange}
            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 rounded-2xl p-3 text-sm font-medium outline-hidden transition-all"
          />
        </div>

        {/* Study Frequency Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-slate-400" />
            Study Commitment (Days/Wk)
          </label>
          <select
            id="study-days-selector"
            value={settings.studyDaysPerWeek}
            onChange={handleDaysChange}
            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 rounded-2xl p-3 text-sm font-medium outline-hidden transition-all appearance-none"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? "day" : "days"} per week
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
        <p className="text-[10px] text-slate-400 font-mono">
          Changes propagate immediately across the target calculus blocks.
        </p>
      </div>
    </div>
  );
};
