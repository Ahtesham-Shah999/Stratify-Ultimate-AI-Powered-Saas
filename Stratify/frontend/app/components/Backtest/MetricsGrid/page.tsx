"use client";
import React from "react";
import { useTheme } from "@/context/theme-context";

interface Metric {
  label: string;
  value: string | number;
  color?: string;
}

interface MetricsGridProps {
  metrics: Metric[];
}

export default function MetricsGrid({ metrics }: MetricsGridProps) {
  const { darkMode } = useTheme();

  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {metrics.map((m, i) => (
        <div
          key={i}
          className={`rounded-xl border p-4 text-center ${
            darkMode
              ? "border-white/20 bg-[#1a1a1a] text-gray-200"
              : "border-[#F8F5F5] border-b border-solid border-2"
          }`}
        >
          <p className={`mb-1 text-sm ${darkMode ? "text-gray-400" : "text-text-secondary-dark"}`}>
            {m.label}
          </p>
          <p className={`text-2xl font-bold ${m.color || ""}`}>{m.value}</p>
        </div>
      ))}
    </div>
  );
}
