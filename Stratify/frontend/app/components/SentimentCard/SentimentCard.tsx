"use client";
import React, { useState } from "react";
import { useTheme } from "@/context/theme-context";

export default function SentimentCard({ sentiment }: any) {
  const { darkMode } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const { source, type, confidence, emoji, summary } = sentiment;

  // --- UNIVERSAL THEME COLORS ---
  const bg = darkMode ? "#0F0F0F" : "#FFFFFF";
  const border = darkMode ? "#2d2d2d" : "#E5E7EB";
  const textPrimary = darkMode ? "#FFFFFF" : "#000000";
  const textSecondary = darkMode ? "#A3A3A3" : "#6B7280";

  // --- SENTIMENT COLORS ---
  let sentimentColor = ""; // stroke color
  let sentimentBg = "";    // badge background

  if (type === "Bullish") {
    sentimentColor = "#16A34A"; // green
    sentimentBg = "#DCFCE7";    // light green
  } else if (type === "Bearish") {
    sentimentColor = "#DC2626"; // red
    sentimentBg = "#ECDFDF";    // red tint background
  } else {
    sentimentColor = "#3B82F6"; // blue
    sentimentBg = "#DBEAFE";    // light blue
  }

  return (
    <div
      className="flex flex-col gap-4 rounded-xl p-6 sm:p-8 shadow-sm transition-all duration-300"
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
      }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <span
          className="rounded-full px-4 py-2 text-xl font-black tracking-tight"
          style={{
            backgroundColor: sentimentBg,
            color: sentimentColor,
          }}
        >
          {source}
        </span>

        <span className="text-5xl">{emoji}</span>
      </div>

      {/* BODY */}
      <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <p
            className="text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ color: textPrimary }}
          >
            {type}
          </p>

          <p className="text-lg font-semibold" style={{ color: textPrimary }}>
            Confidence:{" "}
            <span style={{ color: sentimentColor }}>{confidence}%</span>
          </p>
        </div>

        {/* CIRCLE GRAPH */}
        <div className="relative h-20 w-20">
          <svg className="h-full w-full" viewBox="0 0 36 36">
            {/* Background circle */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={border}
              strokeWidth="3"
            />

            {/* Progress circle */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              strokeLinecap="round"
              strokeWidth="3"
              transform="rotate(-90 18 18)"
              strokeDasharray={`${confidence}, 100`}
              stroke={sentimentColor}
            />
          </svg>
        </div>
      </div>

      {/* SUMMARY */}
      <div
        className="mt-4 pt-6"
        style={{ borderTop: `1px solid ${border}` }}
      >
        <h3 className="text-base font-bold" style={{ color: textPrimary }}>
          Key Summary
        </h3>

        <div
          className={`mt-2 text-base leading-relaxed overflow-hidden transition-all duration-300 ${
            isExpanded ? "" : "line-clamp-2"
          }`}
          style={{ color: textSecondary }}
        >
          {summary}
        </div>
        
        {summary && summary.length > 80 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-sm font-bold hover:underline cursor-pointer transition-colors"
            style={{ color: sentimentColor }}
          >
            {isExpanded ? "Show Less" : "Read More"}
          </button>
        )}
      </div>
    </div>
  );
}
