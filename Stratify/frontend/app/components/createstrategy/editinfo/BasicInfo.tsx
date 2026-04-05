"use client";

import React from "react";
import { useTheme } from "@/context/theme-context";

interface BasicInfoProps {
  data: any;
  onChange: (newData: any) => void;
}

export default function BasicInfo({ data, onChange }: BasicInfoProps) {
  const { darkMode } = useTheme();

  if (!data) return null;

  const handleChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const inputClass = `w-full h-12 rounded-lg px-4 border text-sm outline-none transition-all focus:ring-2 focus:ring-[#f90606]/30 focus:border-[#f90606] ${
    darkMode
      ? "bg-[#111] text-white border-[#2d2d2d] placeholder-gray-600"
      : "bg-[#f8f5f5] text-black border-[#e5e7eb] placeholder-gray-400"
  }`;

  const labelClass = `text-xs font-semibold uppercase tracking-wider mb-1.5 block ${
    darkMode ? "text-neutral-400" : "text-neutral-500"
  }`;

  return (
    <div
      className={`rounded-xl shadow-md overflow-hidden border ${
        darkMode ? "bg-[#1a1a1a] border-[#2d2d2d]" : "bg-white border-[#e5e7eb]"
      }`}
    >
      {/* Section Header */}
      <div className={`px-6 py-4 border-b flex items-center gap-3 ${darkMode ? "border-[#2d2d2d]" : "border-[#e5e7eb]"}`}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#f90606]/10">
          <span className="material-symbols-outlined text-[#f90606] text-base">info</span>
        </div>
        <div>
          <h3 className={`text-base font-bold ${darkMode ? "text-white" : "text-black"}`}>
            Basic Strategy Information
          </h3>
          <p className={`text-xs ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
            Core identity and parameters for this strategy
          </p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Strategy Name — spans 2 cols */}
        <div className="sm:col-span-2">
          <label className={labelClass}>Strategy Name</label>
          <input
            className={inputClass}
            placeholder="e.g. MACD Momentum Strategy"
            value={data.strategy_name || ""}
            onChange={(e) => handleChange("strategy_name", e.target.value)}
          />
        </div>

        {/* Pair / Symbol */}
        <div>
          <label className={labelClass}>Pair / Symbol</label>
          <input
            className={inputClass}
            placeholder="e.g. BTC/USDT"
            value={data.pair || ""}
            onChange={(e) => handleChange("pair", e.target.value)}
          />
        </div>



        {/* Capital — spans 2 cols */}
        <div className="sm:col-span-2">
          <label className={labelClass}>Capital Allocation ($)</label>
          <div className="relative">
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>$</span>
            <input
              className={`${inputClass} pl-7`}
              type="number"
              placeholder="10000"
              value={data.capital || ""}
              onChange={(e) => handleChange("capital", e.target.value)}
            />
          </div>
        </div>

        {/* Visibility badge — read-only, always PUBLIC */}
        <div className="sm:col-span-2 flex items-end">
          <div className={`w-full h-12 rounded-lg px-4 flex items-center gap-2 border ${
            darkMode ? "bg-[#111] border-[#2d2d2d]" : "bg-[#f8f5f5] border-[#e5e7eb]"
          }`}>
            <span className="material-symbols-outlined text-green-500 text-base">public</span>
            <span className={`text-sm font-semibold ${darkMode ? "text-green-400" : "text-green-600"}`}>
              Public
            </span>
            <span className={`text-xs ml-auto ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
              Shared when posted to Community
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}