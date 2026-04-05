"use client";
import React, { useEffect, useState } from "react";
import { useTheme } from "@/context/theme-context";
import { useBacktestResultStore } from "@/app/store/backtestResultStore";

export default function ExecutedSignalsTable() {
  const { darkMode } = useTheme();
  const { currentBacktest } = useBacktestResultStore();

  const trades = currentBacktest?.trades ?? [];
  const symbol = currentBacktest?.symbol ?? "—";

  const bgColor     = darkMode ? "#1a1a1a" : "#FFFFFF";
  const borderColor = darkMode ? "#2d2d2d" : "#E5E7EB";
  const textPrimary = darkMode ? "#FFFFFF"  : "#000000";
  const textSec     = darkMode ? "#D1D5DB"  : "#6B7280";

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, [currentBacktest]);

  return (
    <div
      className="flex flex-col gap-4 p-6 rounded-lg border"
      style={{ backgroundColor: bgColor, borderColor }}
    >
      <div className="flex items-center justify-between">
        <h3 style={{ color: textPrimary }} className="text-lg font-bold">
          Executed Trades
        </h3>
        <span
          style={{ backgroundColor: darkMode ? "#2d2d2d" : "#f3f4f6", color: textSec }}
          className="text-xs font-semibold px-3 py-1 rounded-full"
        >
          {trades.length} trades · {symbol}
        </span>
      </div>

      {trades.length === 0 && !currentBacktest && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`h-10 rounded animate-pulse ${darkMode ? "bg-[#2d2d2d]" : "bg-gray-100"}`} />
          ))}
        </div>
      )}

      {trades.length === 0 && currentBacktest && (
        <p style={{ color: textSec }} className="text-sm text-center py-6">
          No trades were executed in this backtest.
        </p>
      )}

      {trades.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}`, color: textSec }}>
                <th className="p-3 font-medium">Date / Time</th>
                <th className="p-3 font-medium">Symbol</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Price</th>
                <th className="p-3 font-medium">P/L ($)</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade, i) => {
                const isBuy   = trade.action === "BUY";
                const pl      = trade.profit;
                const plPositive = (pl ?? 0) >= 0;

                return (
                  <tr
                    key={i}
                    style={{
                      borderBottom: `1px solid ${borderColor}`,
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateY(0)" : "translateY(8px)",
                      transition: `opacity 0.35s ease ${Math.min(i * 40, 800)}ms, transform 0.35s ease ${Math.min(i * 40, 800)}ms`,
                    }}
                  >
                    <td className="p-3" style={{ color: textPrimary }}>{trade.time}</td>
                    <td className="p-3" style={{ color: textPrimary }}>{symbol}</td>
                    <td className="p-3 font-bold" style={{ color: isBuy ? (darkMode ? "#4ade80" : "#16a34a") : "#f90606" }}>
                      {trade.action}
                    </td>
                    <td className="p-3 tabular-nums" style={{ color: textPrimary }}>
                      {trade.price.toFixed(5)}
                    </td>
                    <td
                      className="p-3 font-bold tabular-nums"
                      style={{ color: pl === null ? textSec : (plPositive ? (darkMode ? "#4ade80" : "#16a34a") : "#f90606") }}
                    >
                      {pl === null
                        ? "Open"
                        : `${plPositive ? "+" : ""}$${pl.toFixed(2)}`
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
