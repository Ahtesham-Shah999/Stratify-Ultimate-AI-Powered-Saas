"use client";
import React from "react";
import { useTheme } from "@/context/theme-context";

export default function StrategyRow({ strategy }: any) {
  const { darkMode } = useTheme();

  return (
    <div className={`flex items-center gap-4 p-3 justify-between rounded-lg ${darkMode ? "bg-gray-900/60" : "bg-gray-100"}`}>
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center rounded-lg shrink-0 size-10 bg-[#FFCCCC] text-black">
          <span className="material-symbols-outlined">{strategy.icon}</span>
        </div>
        <div className="flex flex-col justify-center">
          <p className={`text-base font-medium leading-normal line-clamp-1 ${darkMode ? "text-white" : "text-black"}`}>{strategy.name}</p>
          <p className="text-sm font-normal leading-normal text-gray-500 line-clamp-2">{strategy.type}</p>
        </div>
      </div>
      <div className="shrink-0">
        <p className={`text-base font-bold leading-normal ${darkMode ? "text-white" : "text-black"}`}>{strategy.allocation}</p>
      </div>
    </div>
  );
}
