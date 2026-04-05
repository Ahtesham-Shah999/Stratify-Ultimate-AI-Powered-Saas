"use client";
import React from "react";
import { useTheme } from "@/context/theme-context";

export default function AILoader() {
  const { darkMode } = useTheme();

  return (
    <div
      className={`
        rounded-xl border border-dashed p-5
        ${darkMode ? "border-border-dark bg-transparent" : "border-gray-300 bg-transparent"}
      `}
    >
      <div className="flex items-center justify-center gap-4 animate-pulse">
        <svg
          className={`h-5 w-5 ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            fill="currentColor"
          ></path>
        </svg>

        <p
          className={`
            font-medium text-sm
            ${darkMode ? "text-neutral-400" : "text-neutral-500"}
          `}
        >
          AI is generating rules...
        </p>
      </div>
    </div>
  );
}
