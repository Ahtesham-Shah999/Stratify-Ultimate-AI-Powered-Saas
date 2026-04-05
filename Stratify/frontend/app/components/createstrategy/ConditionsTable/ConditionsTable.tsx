"use client";
import React from "react";
import { useTheme } from "@/context/theme-context";

export interface ConditionRow {
  indicator: string | null;
  operator: string | null;
  value: string | number | null;
  action: string | null;
}

export interface UI_Strategy {
  strategy_name?: string;
  pair?: string | null;
  timeframe?: string | null;
  capital?: number | null;
  conditions?: ConditionRow[];  // <--- add this
}

interface ConditionsTableProps {
  data: ConditionRow[]; // rows from editedStrategy
  onChange: (newRows: ConditionRow[]) => void;
}

export default function ConditionsTable({ data, onChange }: ConditionsTableProps) {
  const { darkMode } = useTheme();

  if (!data) return null;

  // Handle individual cell change
  const handleCellChange = (index: number, field: keyof ConditionRow, value: any) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  // Add new blank condition
  const handleAdd = () => {
    const newRow: ConditionRow = { indicator: "", operator: "", value: "", action: "" };
    onChange([...data, newRow]);
  };

  // Delete condition
  const handleDelete = (index: number) => {
    const updated = [...data];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div
      className={`${
        darkMode ? "bg-[#1a1a1a] border-[#2d2d2d]" : "bg-[#ffffff] border-[#e5e7eb]"
      } rounded-lg p-6 border`}
    >
      <div className="mb-4">
        <h3 className={`${darkMode ? "text-white" : "text-black"} text-lg font-bold`}>
          Auto-Filled Conditions
        </h3>
        <div className="mt-2 h-px w-16 bg-[#f90606]" />
      </div>

      <div className="overflow-x-auto">
        <table className={`${darkMode ? "text-white" : "text-black"} w-full text-left`}>
          <thead>
            <tr
              className={`${
                darkMode ? "text-neutral-300 border-[#2d2d2d]" : "text-neutral-600 border-[#e5e7eb]"
              } border-b`}
            >
              <th className="py-3 px-4 text-sm font-semibold">Indicator</th>
              <th className="py-3 px-4 text-sm font-semibold">Value</th>
              <th className="py-3 px-4 text-sm font-semibold">Action</th>
              <th className="py-3 px-4 w-12"></th>
            </tr>
          </thead>

          <tbody>
            {data.map((r: ConditionRow, i: number) => (
              <tr
                key={i}
                className={`${darkMode ? "border-[#2d2d2d]" : "border-[#e5e7eb]"} border-b`}
              >
                <td className="py-4 px-4">
                  <input
                    className={`${
                      darkMode
                        ? "bg-[#230f0f] text-white border-[#2d2d2d]"
                        : "bg-[#f8f5f5] text-black border-[#e5e7eb]"
                    } form-input w-full rounded px-2 py-1 border`}
                    value={r.indicator || ""}
                    onChange={(e) => handleCellChange(i, "indicator", e.target.value)}
                  />
                </td>

                <td className="py-4 px-4">
                  <input
                    className={`${
                      darkMode
                        ? "bg-[#230f0f] text-white border-[#2d2d2d]"
                        : "bg-[#f8f5f5] text-black border-[#e5e7eb]"
                    } form-input w-full rounded px-2 py-1 border`}
                    value={r.value ?? ""}
                    onChange={(e) => handleCellChange(i, "value", e.target.value)}
                  />
                </td>

                <td className="py-4 px-4">
                  <input
                    className={`${
                      darkMode
                        ? "bg-[#230f0f] text-white border-[#2d2d2d]"
                        : "bg-[#f8f5f5] text-black border-[#e5e7eb]"
                    } form-input w-full rounded px-2 py-1 border`}
                    value={r.action ?? ""}
                    onChange={(e) => handleCellChange(i, "action", e.target.value)}
                  />
                </td>

                <td className="py-4 px-4 text-center">
                  <button
                    className={`${
                      darkMode ? "text-white hover:text-red-400" : "text-[#f90606] hover:text-red-700"
                    }`}
                    onClick={() => handleDelete(i)}
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}