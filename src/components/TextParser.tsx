import React, { useState } from "react";
import { Chapter, Subchapter } from "../types";
import { ClipboardPaste, CheckCircle, AlertCircle, Loader } from "lucide-react";

interface TextParserProps {
  onParsed: (chapters: Chapter[]) => void;
}

// Lines to strip from pasted portal text
const JUNK_PATTERNS: RegExp[] = [
  /^confidence level\s*:\s*.*/i,
  /^complete$/i,
  /^medium$/i,
  /^low$/i,
  /^video is attached$/i,
  /^not started$/i,
  /^in progress$/i,
  /^\s*[\u2600-\u27BF\uFE00-\uFE0F\u1F300-\u1F9FF]+\s*$/u, // emoji-only lines
  /^[^a-zA-Z0-9]+$/, // lines with no alphanumeric characters (symbols/icons only)
  /^\s*$/, // blank lines
];

const isJunkLine = (line: string): boolean =>
  JUNK_PATTERNS.some((pattern) => pattern.test(line.trim()));

// Detect a chapter header — "Chapter 1", "CHAPTER 2", "1. Introduction", etc.
const CHAPTER_HEADER_RE = /^(?:chapter\s+(\d+)|(\d+)\.\s+\S)/i;

const parsePortalText = (rawText: string): Chapter[] => {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim());
  const cleaned = lines.filter((line) => !isJunkLine(line));

  const chapters: Array<{ number: number; title: string; subchapters: string[] }> = [];
  let currentChapter: { number: number; title: string; subchapters: string[] } | null = null;
  let preamble: string[] = []; // lines before "Chapter 1"
  let foundFirstChapter = false;

  for (const line of cleaned) {
    const chapterMatch = line.match(CHAPTER_HEADER_RE);

    if (chapterMatch) {
      foundFirstChapter = true;
      // Save previous chapter if exists
      if (currentChapter) {
        chapters.push(currentChapter);
      }
      const num = parseInt(chapterMatch[1] || chapterMatch[2], 10);
      currentChapter = { number: num, title: line, subchapters: [] };
    } else if (!foundFirstChapter) {
      // Collect preamble lines
      preamble.push(line);
    } else if (currentChapter) {
      // Subchapter line under the current chapter
      currentChapter.subchapters.push(line);
    }
  }

  // Push last chapter
  if (currentChapter) {
    chapters.push(currentChapter);
  }

  const result: Chapter[] = [];

  // Chapter 0: Preliminary Materials (if preamble lines exist)
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
      chapterTitle: ch.title
        .replace(/^chapter\s+\d+\s*[-:.]?\s*/i, "") // strip "Chapter N" prefix from title
        .replace(/^\d+\.\s*/, "") // strip "N. " prefix
        .trim() || `Chapter ${ch.number}`,
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

    // Small timeout to allow UI to re-render before the parsing work
    setTimeout(() => {
      try {
        const chapters = parsePortalText(rawText);

        if (chapters.length === 0) {
          setParseState("error");
          setMessage(
            "No chapters could be detected. Make sure the text contains 'Chapter 1', 'Chapter 2', etc."
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
      } catch (err) {
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
          placeholder={`Paste the raw text copied from your online learning portal here.\n\nThe parser will automatically:\n• Strip "Confidence Level: complete" lines\n• Remove "Complete", "Medium", "Video is attached" labels\n• Group everything into chapters and subchapters\n• Place any intro text under "Chapter 0: Preliminary Materials"`}
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

      {/* Status message */}
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
