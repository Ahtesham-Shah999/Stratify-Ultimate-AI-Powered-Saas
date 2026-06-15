"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/theme-context";

export default function AILoader() {
  const { darkMode } = useTheme();
  const [textIndex, setTextIndex] = useState(0);

  const texts = [
    "Analyzing Strategy...",
    "Generating Trading Rules...",
    "Optimizing Parameters..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % texts.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div
        className={`
          flex flex-col items-center justify-center p-10 rounded-2xl w-full max-w-sm
          ${darkMode ? "bg-[#1a1a1a] border-[#2d2d2d]" : "bg-white border-[#e5e7eb] shadow-xl"}
          border transition-colors duration-300
        `}
      >
        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute w-20 h-20 rounded-full border-4 border-dashed border-red-500/30 animate-spin" style={{ animationDuration: '3s' }} />
          <div className="w-16 h-16 rounded-full border-4 border-t-red-600 border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1s' }} />
          <span className="material-symbols-outlined absolute text-red-500 animate-pulse text-[28px]">
            memory
          </span>
        </div>

        <p
          className={`
            font-semibold text-lg tracking-wide transition-opacity duration-300
            ${darkMode ? "text-white" : "text-gray-900"}
          `}
        >
          {texts[textIndex]}
        </p>
        <p className={`mt-2 text-sm text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Please wait while AI processes your request.
        </p>
      </div>
    </div>
  );
}
