"use client";
import React from "react";
import { useTheme } from "@/context/theme-context";

interface AdvancedSettingsProps {
  data: any; // editedStrategy
  onChange: (newData: any) => void;
}

export default function AdvancedSettings({ data, onChange }: AdvancedSettingsProps) {
  const { darkMode } = useTheme();

  if (!data) return null;

  const fieldClass = `${
    darkMode
      ? "bg-[#230f0f] text-white border-[#2d2d2d]"
      : "bg-[#f8f5f5] text-black border-[#e5e7eb]"
  } form-input w-full h-12 rounded px-3 border`;

  const handleChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div
      className={`${
        darkMode
          ? "bg-[#1a1a1a] border-[#2d2d2d]"
          : "bg-[#ffffff] border-[#e5e7eb]"
      } rounded-lg shadow-md overflow-hidden border`}
    >
      <div className="p-6">
        <h3 className={`${darkMode ? "text-white" : "text-black"} text-lg font-bold`}>
          Advanced Settings
        </h3>
        <div className="mt-2 h-px w-16 bg-[#f90606]" />
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
        <label className="flex flex-col">
          <p className={`${darkMode ? "text-neutral-300" : "text-neutral-700"} pb-2`}>
            Stop Loss (%)
          </p>
          <input
            className={fieldClass}
            type="number"
            value={data.stop_loss ?? 2}
            onChange={(e) => handleChange("stop_loss", e.target.value)}
          />
        </label>

        <label className="flex flex-col">
          <p className={`${darkMode ? "text-neutral-300" : "text-neutral-700"} pb-2`}>
            Take Profit (%)
          </p>
          <input
            className={fieldClass}
            type="number"
            value={data.take_profit ?? 5}
            onChange={(e) => handleChange("take_profit", e.target.value)}
          />
        </label>

        <label className="flex flex-col">
          <p className={`${darkMode ? "text-neutral-300" : "text-neutral-700"} pb-2`}>
            Trading Pair
          </p>
          <input
            className={fieldClass}
            type="text"
            value={data.pair ?? ""}
            onChange={(e) => handleChange("pair", e.target.value)}
          />
        </label>

        <label className="flex flex-col">
          <p className={`${darkMode ? "text-neutral-300" : "text-neutral-700"} pb-2`}>
            Indicator
          </p>
          <input
            className={fieldClass}
            type="text"
            value={data.indicator ?? ""}
            onChange={(e) => handleChange("indicator", e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}