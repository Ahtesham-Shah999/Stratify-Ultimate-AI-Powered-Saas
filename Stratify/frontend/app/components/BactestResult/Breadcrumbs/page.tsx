import React from "react";
import { useTheme } from "@/context/theme-context";

export default function Breadcrumbs() {
  const { darkMode } = useTheme();

  const textSecondary = darkMode ? "text-gray-300" : "text-gray-600";
  const textPrimary = darkMode ? "text-white" : "text-black";

  return (
    <div className="flex flex-wrap gap-2 text-base font-medium">
      <a className={textSecondary}>Stratify</a>
      <span className={textSecondary}>/</span>
      <a className={textSecondary}>Backtest</a>
      <span className={textSecondary}>/</span>
      <span className={textPrimary}>Results</span>
    </div>
  );
}
