"use client";
import React from "react";
import { useTheme } from "@/context/theme-context";

const VISIBILITY_STYLES: Record<string, string> = {
  PUBLIC:  "bg-emerald-900/40 text-emerald-300 border border-emerald-700/40",
  PRIVATE: "bg-gray-800/60 text-gray-400 border border-gray-700/40",
};

const ENGINE_STYLES: Record<string, string> = {
  BACKTEST: "bg-blue-900/40 text-blue-300 border border-blue-700/40",
  LIVE:     "bg-red-900/40 text-red-300 border border-red-700/40",
};

export default function StrategiesTable({ strategies = [] }: { strategies: any[] }) {
  const { darkMode } = useTheme();

  const th = "py-3 px-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap";
  const td = "px-4 py-3 align-middle text-sm";

  return (
    <div className={`rounded-xl border overflow-hidden
      ${darkMode ? "bg-[#111] border-[#1f1f1f]" : "bg-white border-gray-200"}`}>

      {/* Table header */}
      <div className={`px-6 py-4 border-b flex items-center justify-between
        ${darkMode ? "border-[#1f1f1f]" : "border-gray-100"}`}>
        <div>
          <h2 className={`text-base font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Global Strategies
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            All user-created strategies across the platform — {strategies.length} total
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border"
          style={{ borderColor: "#2d2d2d", color: "#888" }}>
          <span className="material-symbols-outlined text-sm">monitoring</span>
          Read-only view
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className={`w-full text-left ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          <thead className={darkMode ? "bg-[#161616] border-b border-[#1f1f1f]" : "bg-gray-50 border-b border-gray-200"}>
            <tr>
              <th className={th}>#</th>
              <th className={th}>Strategy Name</th>
              <th className={th}>Owner</th>
              <th className={th}>Visibility</th>
              <th className={th}>Engine</th>
              <th className={th}>Created</th>
            </tr>
          </thead>
          <tbody className={darkMode ? "divide-y divide-[#1a1a1a]" : "divide-y divide-gray-100"}>
            {strategies.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500 text-sm">
                  No strategies found.
                </td>
              </tr>
            )}
            {strategies.map((s, idx) => (
              <tr
                key={s._id ?? idx}
                className={`transition-colors duration-150
                  ${darkMode ? "hover:bg-[#181818]" : "hover:bg-gray-50"}`}
              >
                {/* # */}
                <td className={`${td} text-gray-500 font-mono`}>{idx + 1}</td>

                {/* Name + desc */}
                <td className={td}>
                  <p className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {s.name}
                  </p>
                  {s.description && (
                    <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{s.description}</p>
                  )}
                </td>

                {/* Owner */}
                <td className={td}>
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                      {s.user_id?.username ?? "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">{s.user_id?.email ?? ""}</p>
                  </div>
                </td>

                {/* Visibility */}
                <td className={td}>
                  <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full
                    ${VISIBILITY_STYLES[s.visibility] ?? "bg-gray-800 text-gray-400"}`}>
                    {s.visibility ?? "—"}
                  </span>
                </td>

                {/* Engine */}
                <td className={td}>
                  <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full
                    ${ENGINE_STYLES[s.engine_type] ?? "bg-gray-800 text-gray-400"}`}>
                    {s.engine_type ?? "—"}
                  </span>
                </td>

                {/* Created */}
                <td className={`${td} text-gray-500 whitespace-nowrap`}>
                  {s.created_at
                    ? new Date(s.created_at).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
