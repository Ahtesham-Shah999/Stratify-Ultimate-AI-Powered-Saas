'use client'
import React from "react";
import SentimentCard from "@/app/components/SentimentCard/SentimentCard";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/theme-context";
const sentimentData = [
  {
    source: "Twitter",
    type: "Positive",
    confidence: 92,
    emoji: "🙂",
    summary: "The overall market sentiment leans positive...",
    color: {
      border: "border-black/10 dark:border-white/10",
      bg: "bg-white dark:bg-background-dark/50",
      text: "text-gray-900 dark:text-gray-50",
      textLight: "text-gray-600 dark:text-gray-400",
      sourceBg: "bg-primary/10 dark:bg-primary/20",
      sourceText: "text-primary dark:text-red-300",
      strokeBg: "text-gray-200 dark:text-gray-700",
      stroke: "text-primary",
    },
  },
  {
    source: "News Article",
    type: "Neutral",
    confidence: 78,
    emoji: "😐",
    summary: "Analysis indicates a mixed or neutral sentiment...",
    color: {
      border: "border-black/10 dark:border-white/10",
      bg: "bg-white dark:bg-background-dark/50",
      text: "text-gray-900 dark:text-gray-50",
      textLight: "text-gray-600 dark:text-gray-400",
      sourceBg: "bg-gray-500/10 dark:bg-gray-400/20",
      sourceText: "text-gray-600 dark:text-gray-300",
      strokeBg: "text-gray-200 dark:text-gray-700",
      stroke: "text-gray-500",
    },
  },
  {
    source: "Reddit Thread",
    type: "Negative",
    confidence: 85,
    emoji: "☹️",
    summary: "A prevailing negative sentiment has been detected...",
    color: {
      border: "border-red-900/50 dark:border-primary/30",
      bg: "bg-red-900/10 dark:bg-primary/10",
      text: "text-red-900 dark:text-red-200",
      textLight: "text-red-900/80 dark:text-red-200/80",
      sourceBg: "bg-red-900/20 dark:bg-primary/20",
      sourceText: "text-red-800 dark:text-red-300",
      strokeBg: "text-red-900/20 dark:text-red-200/20",
      stroke: "text-red-800 dark:text-red-400",
    },
  },
];

export default function SentimentAnalysis() {
  const router = useRouter();
  const { darkMode } = useTheme();

  return (
    <div
      className={`
        container mx-auto px-4 py-8 md:py-12 
        ${darkMode ? "bg-[#0f0f0f] text-white" : "bg-white text-black"}
      `}
    >
      {/* ===== Page Header ===== */}
      <div className="flex items-center gap-4 mb-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/BacktestPage")}
          className={`
            flex h-10 w-10 items-center justify-center rounded-lg border 
            cursor-pointer shrink-0
            ${
              darkMode
                ? "border-white/10 text-gray-300 hover:bg-white/10"
                : "border-black/10 text-gray-700 hover:bg-black/5"
            }
          `}
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>

        {/* Title + Subtitle */}
        <div className="flex min-w-0 flex-col">
          <h1
            className={`
              text-3xl font-black leading-tight tracking-tighter md:text-4xl
              ${darkMode ? "text-gray-50" : "text-gray-900"}
            `}
          >
            Sentiment Analysis
          </h1>
          <p
            className={`
              truncate text-base font-normal leading-normal
              ${darkMode ? "text-gray-400" : "text-gray-500"}
            `}
          >
            for 'ETH Momentum Cross'
          </p>
        </div>
      </div>

      {/* ===== Sentiment Cards ===== */}
      <div className="mx-auto max-w-3xl flex flex-col gap-8">
        {sentimentData.map((item, index) => (
          <SentimentCard key={index} sentiment={item} />
        ))}
      </div>
    </div>
  );
}

