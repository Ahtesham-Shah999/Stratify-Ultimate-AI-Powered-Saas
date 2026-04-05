"use client";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@/context/theme-context";
import { useBacktestResultStore } from "@/app/store/backtestResultStore";

function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 2 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number;
}) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const duration = 1000;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(value * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);
  return <>{prefix}{displayed.toFixed(decimals)}{suffix}</>;
}

export default function MetricsGrid() {
  const { darkMode } = useTheme();
  const { currentBacktest } = useBacktestResultStore();

  const trades = currentBacktest?.trades ?? [];
  const tradesCount = currentBacktest?.trades_count ?? 0;
  const winRate = currentBacktest?.win_rate ?? 0;
  const maxDrawdown = currentBacktest?.max_drawdown ?? 0;

  const completedTrades = trades.filter(t => t.profit !== null);
  const winningTrades = completedTrades.filter(t => (t.profit ?? 0) > 0);
  const losingTrades  = completedTrades.filter(t => (t.profit ?? 0) <= 0);
  const avgWin  = winningTrades.length > 0 ? winningTrades.reduce((s, t) => s + (t.profit ?? 0), 0) / winningTrades.length : 0;
  const avgLoss = losingTrades.length  > 0 ? losingTrades.reduce((s, t)  => s + (t.profit ?? 0), 0) / losingTrades.length  : 0;
  const profitFactor = Math.abs(avgLoss) > 0 ? (avgWin * winningTrades.length) / Math.abs(avgLoss * losingTrades.length) : 0;

  const metrics = [
    { label: "Total Trades",   value: tradesCount,         prefix: "",   suffix: "",  decimals: 0 },
    { label: "Win Rate",       value: winRate * 100,       prefix: "",   suffix: "%", decimals: 1 },
    { label: "Profit Factor",  value: profitFactor,        prefix: "",   suffix: "",  decimals: 2, colorLight: profitFactor >= 1 ? "#16a34a" : "#f90606", colorDark: profitFactor >= 1 ? "#4ade80" : "#f90606" },
    { label: "Average Win",    value: Math.abs(avgWin),    prefix: "$",  suffix: "",  decimals: 2, colorLight: "#16a34a", colorDark: "#4ade80" },
    { label: "Average Loss",   value: Math.abs(avgLoss),   prefix: "-$", suffix: "",  decimals: 2, colorLight: "#f90606", colorDark: "#f90606" },
    { label: "Max Drawdown",   value: maxDrawdown * 100,   prefix: "",   suffix: "%", decimals: 2, colorLight: "#f90606", colorDark: "#f90606" },
  ];

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, [currentBacktest]);

  const bgColor     = darkMode ? "#1a1a1a" : "#FFFFFF";
  const borderColor = darkMode ? "#2d2d2d" : "#E5E7EB";
  const textPrimary = darkMode ? "#FFFFFF"  : "#000000";
  const textSec     = darkMode ? "#D1D5DB"  : "#6B7280";

  return (
    <div
      className="flex flex-col gap-4 p-6 rounded-lg border"
      style={{ backgroundColor: bgColor, borderColor }}
    >
      <p style={{ color: textPrimary }} className="text-lg font-bold">
        Performance Metrics
      </p>

      <div className="flex flex-col gap-4 text-sm">
        {metrics.map((m, i) => (
          <div
            key={i}
            className="flex justify-between items-center"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(16px)",
              transition: `opacity 0.4s ease ${i * 80}ms, transform 0.4s ease ${i * 80}ms`,
            }}
          >
            <span style={{ color: textSec }}>{m.label}</span>
            <span
              className="font-bold tabular-nums"
              style={{ color: m.colorLight && m.colorDark ? (darkMode ? m.colorDark : m.colorLight) : textPrimary }}
            >
              {currentBacktest ? (
                <AnimatedNumber value={m.value} prefix={m.prefix} suffix={m.suffix} decimals={m.decimals} />
              ) : (
                <span className={`inline-block w-16 h-4 rounded animate-pulse ${darkMode ? "bg-[#2d2d2d]" : "bg-gray-100"}`} />
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
