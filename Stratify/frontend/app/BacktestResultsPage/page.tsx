"use client";
import React from "react";
import { useTheme } from "@/context/theme-context";
import { useBacktestResultStore } from "@/app/store/backtestResultStore";
import Breadcrumbs from "@/app/components/BactestResult/Breadcrumbs/page";
import PageHeading from "@/app/components/BactestResult/PageHeading/page";
import StatsGrid from "@/app/components/BactestResult/StatsGrid/page";
import ChartsAndMetrics from "@/app/components/BactestResult/ChartsAndMetrics/page";
import ExecutedSignalsTable from "@/app/components/BactestResult/ExecutedSignalsTable/page";

export default function BacktestResultsPage() {
  const { darkMode } = useTheme();
  const { currentBacktest, isLoading } = useBacktestResultStore();

  return (
    <main
      className={`flex-1 p-8 overflow-y-auto ${
        darkMode ? "bg-black text-gray-200" : "bg-white text-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <Breadcrumbs />
        <PageHeading />

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <svg className="animate-spin h-12 w-12 text-[#f90606]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Running backtest, please wait…
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !currentBacktest && (
          <div className={`flex flex-col items-center justify-center py-24 gap-4 rounded-xl border ${
            darkMode ? "border-[#2d2d2d] bg-[#1a1a1a]" : "border-gray-200 bg-gray-50"
          }`}>
            <span className="material-symbols-outlined text-5xl text-[#f90606]">query_stats</span>
            <p className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
              No backtest results yet
            </p>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Go to the Backtest page, select a strategy, and click &ldquo;Run Backtest&rdquo;.
            </p>
          </div>
        )}

        {/* Results */}
        {!isLoading && currentBacktest && (
          <>
            <StatsGrid />
            <ChartsAndMetrics />
            <ExecutedSignalsTable />
          </>
        )}
      </div>
    </main>
  );
}
