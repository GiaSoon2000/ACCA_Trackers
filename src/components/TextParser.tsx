import React, { useState } from "react";
import { Chapter, Subchapter } from "../types";
import { ClipboardPaste, CheckCircle, AlertCircle, Loader } from "lucide-react";

interface TextParserProps {
  onParsed: (chapters: Chapter[]) => void;
}

// ─── Junk line patterns ────────────────────────────────────────────────────────
// Lines matching any of these are discarded entirely.
const JUNK_PATTERNS: RegExp[] = [
  /^confidence level\s*:?.*/i,          // "Confidence Level: medium Medium" or "Confidence Level:"
  /^complete$/i,
  /^medium$/i,
  /^low$/i,
  /^not started$/i,
  /^in progress$/i,
  /^video is attached$/i,
  /^overview$/i,                          // standalone "Overview" nav item
  /^\s*[\u2600-\u27BF\uFE00-\uFE0F\u1F300-\u1F9FF]+\s*$/u, // emoji-only lines
  /^[^a-zA-Z0-9]+$/,                     // symbol/icon-only lines (no alphanumeric)
  /^\s*$/,                               // blank lines
];

const isJunkLine = (line: string): boolean =>
  JUNK_PATTERNS.some((p) => p.test(line.trim()));

// ─── Chapter header detection ──────────────────────────────────────────────────
// Matches: "Chapter 4", "CHAPTER 4:", "Chapter 1 Title..."
// Captures the chapter NUMBER only (not section/sub-section numbers).
const CHAPTER_HEADER_RE = /^chapter\s+(\d+)/i;

// ─── Section GROUP header detection (skip — NOT a subchapter) ─────────────────
// Lines like "4.1 ACCA's Code of Ethics" or "4.2 Independence Standards"
// Format: digit(s) DOT digit(s) then a NON-digit/NON-dot character (not X.Y.Z)
// These are category groupings that contain real subchapters underneath.
const isSectionGroupHeader = (line: string): boolean =>
  /^\d+\.\d+[^.\d]/.test(line.trim());

// ─── Portal navigation item detection (skip) ──────────────────────────────────
// Lines like "4 Conclusion", "4 Syllabus Coverage", "4 Summary and Quiz",
// "4 Technical Articles", "4 Visual Overview" — standalone portal menu items
// that start with just a chapter number followed by a nav keyword.
const NAV_ITEM_RE =
  /^\d+\s+(conclusion|syllabus|summary|technical|overview|quiz|introduction)\b/i;

const isNavItem = (line: string): boolean => NAV_ITEM_RE.test(line.trim());

// ─── Main parser function ─────────────────────────────────────────────────────
const parsePortalText = (rawText: string): Chapter[] => {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => !isJunkLine(l));

  type ChapterBuf = { number: number; title: string; subchapters: string[] };
  const chapters: ChapterBuf[] = [];
  let currentChapter: ChapterBuf | null = null;
  const preamble: string[] = []; // lines before any "Chapter N" header
  let foundFirstChapter = false;

  for (const line of lines) {
    const chapterMatch = line.match(CHAPTER_HEADER_RE);

    if (chapterMatch) {
      const num = parseInt(chapterMatch[1], 10);
      foundFirstChapter = true;

      // Deduplicate: if this is another header for the SAME chapter number
      // (e.g., "CHAPTER 4: Visual Overview" after "Chapter 4: Professional…"),
      // skip creating a new chapter — we're still inside the same one.
      if (currentChapter && currentChapter.number === num) {
        continue;
      }

      // New chapter number — push previous and start fresh
      if (currentChapter) chapters.push(currentChapter);

      // Strip "Chapter N" / "Chapter N:" prefix to produce a clean title
      const title = line
        .replace(/^chapter\s+\d+\s*[:.-]?\s*/i, "")
        .trim();

      currentChapter = { number: num, title: title || `Chapter ${num}`, subchapters: [] };

    } else if (!foundFirstChapter) {
      // Preamble: content before the first chapter header
      preamble.push(line);

    } else if (currentChapter) {
      // ── Subchapter line candidate ──────────────────────────────────────────
      // Skip section GROUP headers (e.g., "4.1 Something") — they organise
      // subchapters but are not individual topics to study.
      if (isSectionGroupHeader(line)) continue;

      // Skip portal navigation items (e.g., "4 Conclusion", "4 Summary and Quiz")
      if (isNavItem(line)) continue;

      currentChapter.subchapters.push(line);
    }
  }

  // Push the last chapter
  if (currentChapter) chapters.push(currentChapter);

  // ─── Build result array ────────────────────────────────────────────────────
  const result: Chapter[] = [];

  // Chapter 0: Preliminary Materials (if there is any preamble content)
  if (preamble.length > 0) {
    const ch0Id = `parsed-ch-0-${Date.now()}`;
    result.push({
      id: ch0Id,
      chapterNumber: "Chapter 0",
      chapterTitle: "Preliminary Materials",
      subchapters: preamble.map(
        (title, i): Subchapter => ({
          id: `${ch0Id}-sub-${i}`,
          title,
          isCompleted: false,
        })
      ),
    });
  }

  // Numbered chapters
  chapters.forEach((ch, idx) => {
    const chId = `parsed-ch-${ch.number}-${Date.now()}-${idx}`;
    result.push({
      id: chId,
      chapterNumber: `Chapter ${ch.number}`,
      chapterTitle: ch.title || `Chapter ${ch.number}`,
      subchapters: ch.subchapters.map(
        (title, i): Subchapter => ({
          id: `${chId}-sub-${i}`,
          title,
          isCompleted: false,
        })
      ),
    });
  });

  return result;
};

// ─── Component ────────────────────────────────────────────────────────────────
type ParseState = "idle" | "success" | "error";

export const TextParser: React.FC<TextParserProps> = ({ onParsed }) => {
  const [rawText, setRawText] = useState("");
  const [parseState, setParseState] = useState<ParseState>("idle");
  const [message, setMessage] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const handleParse = () => {
    if (!rawText.trim()) {
      setParseState("error");
      setMessage("Please paste your portal text into the field above first.");
      return;
    }

    setIsParsing(true);
    setParseState("idle");
    setMessage("");

    setTimeout(() => {
      try {
        const chapters = parsePortalText(rawText);

        if (chapters.length === 0) {
          setParseState("error");
          setMessage(
            "No chapters detected. Make sure the text contains lines like 'Chapter 1', 'Chapter 2', etc."
          );
          setIsParsing(false);
          return;
        }

        const totalSubs = chapters.reduce((acc, c) => acc + c.subchapters.length, 0);
        onParsed(chapters);
        setRawText("");
        setParseState("success");
        setMessage(
          `✓ Loaded ${chapters.length} chapter${chapters.length !== 1 ? "s" : ""} and ${totalSubs} subchapter${totalSubs !== 1 ? "s" : ""} successfully.`
        );
      } catch {
        setParseState("error");
        setMessage("An unexpected error occurred while parsing. Please try again.");
      } finally {
        setIsParsing(false);
      }
    }, 80);
  };

  return (
    <div id="text-parser-container" className="space-y-3">
      <div>
        <label
          htmlFor="portal-text-input"
          className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5"
        >
          Paste Your ACCA Portal Text
        </label>
        <textarea
          id="portal-text-input"
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value);
            if (parseState !== "idle") setParseState("idle");
          }}
          placeholder={`Paste the raw text copied from your online learning portal here.\n\nThe parser will automatically:\n• Strip "Confidence Level", "Complete", "Medium", "Video is attached"\n• Skip section group headers like "4.1 Something" (not individual study topics)\n• Skip portal nav items like "4 Conclusion", "4 Summary and Quiz"\n• Group any intro text under "Chapter 0: Preliminary Materials"`}
          rows={7}
          className="w-full bg-slate-50 border border-slate-200 focus:border-[#4ECDC4] focus:ring-2 focus:ring-[#4ECDC4]/20 text-slate-800 rounded-xl p-3 text-xs font-mono leading-relaxed outline-none transition-all resize-none placeholder:text-slate-400 placeholder:font-sans placeholder:text-xs"
        />
      </div>

      <button
        id="parse-syllabus-btn"
        onClick={handleParse}
        disabled={isParsing || !rawText.trim()}
        className="w-full flex items-center justify-center gap-2 bg-[#4ECDC4] hover:bg-teal-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black uppercase text-xs tracking-wide py-3 rounded-xl transition-all duration-150 active:scale-[0.98]"
      >
        {isParsing ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <ClipboardPaste className="w-4 h-4" />
        )}
        {isParsing ? "Parsing..." : "Parse & Load Syllabus"}
      </button>

      {parseState !== "idle" && (
        <div
          className={`flex items-start gap-2 text-xs p-2.5 rounded-xl border ${
            parseState === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {parseState === "success" ? (
            <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          )}
          <span className="font-medium">{message}</span>
        </div>
      )}
    </div>
  );
};
