import React from "react";
import { useTheme } from "@/context/theme-context";

export default function RuleList({ rules }: any) {
  const { darkMode } = useTheme();

  return (
    <div className="flex flex-col gap-4">
      <h2 className={`${darkMode ? "text-white" : "text-black"} text-2xl font-bold`}>
        Generated Rules
      </h2>

      {rules.map((rule: any, idx: any) => (
        <div
          key={idx}
          className={`rounded-xl border p-5 ${
            darkMode
              ? "bg-[#1a1a1a] border-[#2d2d2d]"
              : "bg-[#ffffff] border-[#e5e7eb]"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-1">
              {/* Icon + Labels */}
              <div className="flex items-center gap-3">
                <span className={`${rule.bg} ${rule.color} rounded-full p-2`}>
                  <span className="material-symbols-outlined">{rule.icon}</span>
                </span>

                <div>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-neutral-400" : "text-neutral-600"
                    }`}
                  >
                    {rule.type}
                  </p>

                  <p className={`${darkMode ? "text-white" : "text-black"} font-bold`}>
                    {rule.pair}
                  </p>
                </div>
              </div>

              {/* Rule conditions */}
              <div
                className={`border-l-2 pl-4 sm:pl-6 ${
                  darkMode
                    ? "border-neutral-700 text-white"
                    : "border-neutral-300 text-black"
                }`}
              >
                When
                <code
                  className={`rounded px-1.5 py-0.5 mx-1 ${
                    darkMode ? "bg-[#2d2d2d]" : "bg-[#e5e7eb]"
                  }`}
                >
                  {rule.indicator}
                </code>
                is
                <code
                  className={`rounded px-1.5 py-0.5 mx-1 ${
                    darkMode ? "bg-[#2d2d2d]" : "bg-[#e5e7eb]"
                  }`}
                >
                  {rule.condition}
                </code>
                <code
                  className={`rounded px-1.5 py-0.5 mx-1 ${
                    darkMode ? "bg-[#2d2d2d]" : "bg-[#e5e7eb]"
                  }`}
                >
                  {rule.value}
                </code>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <button
                className={`p-2 rounded-lg transition ${
                  darkMode
                    ? "text-neutral-400 hover:bg-white/10"
                    : "text-neutral-600 hover:bg-black/5"
                }`}
              >
                <span className="material-symbols-outlined">edit</span>
              </button>

              <button
                className={`p-2 rounded-lg transition ${
                  darkMode
                    ? "text-neutral-400 hover:bg-white/10"
                    : "text-neutral-600 hover:bg-black/5"
                }`}
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
