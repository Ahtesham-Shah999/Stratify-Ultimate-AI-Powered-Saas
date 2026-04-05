"use client";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@/context/theme-context";
import { useBacktestResultStore } from "@/app/store/backtestResultStore";

function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 2 }: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = 0;
    const end = value;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(start + (end - start) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return <>{prefix}{displayed.toFixed(decimals)}{suffix}</>;
}

export default function StatsGrid() {
  const { darkMode } = useTheme();
  const { currentBacktest } = useBacktestResultStore();

  const pl = currentBacktest?.profit_loss ?? 0;
  const winRate = currentBacktest?.win_rate ?? 0;
  const maxDrawdown = currentBacktest?.max_drawdown ?? 0;
  const sharpe = currentBacktest?.sharpe_ratio ?? 0;
  const tradesCount = currentBacktest?.trades_count ?? 0;
  const initialCapital = currentBacktest?.initial_capital ?? 10000;
  const finalCapital = currentBacktest?.final_capital ?? (initialCapital + pl);

  const plPercent = initialCapital > 0 ? ((pl / initialCapital) * 100) : 0;
  const wins = Math.round((winRate / 100) * tradesCount);
  const losses = tradesCount - wins;

  const stats = [
    {
      title: "Total Profit / Loss",
      value: pl,
      prefix: pl >= 0 ? "+$" : "-$",
      displayValue: Math.abs(pl),
      sub: `${plPercent >= 0 ? "+" : ""}${plPercent.toFixed(1)}%`,
      subColorLight: pl >= 0 ? "#16a34a" : "#f90606",
      subColorDark:  pl >= 0 ? "#4ade80" : "#f90606",
      decimals: 2,
    },
    {
      title: "Max Drawdown",
      value: maxDrawdown,
      prefix: "-",
      displayValue: maxDrawdown,
      sub: "Peak-to-Trough",
      subColorLight: "#f90606",
      subColorDark:  "#f90606",
      suffix: "%",
      decimals: 2,
    },
    {
      title: "Win Rate",
      value: winRate,
      prefix: "",
      displayValue: winRate,
      sub: `${wins} Wins / ${losses} Losses`,
      subColorLight: "#4B5563",
      subColorDark:  "#D1D5DB",
      suffix: "%",
      decimals: 1,
    },
    {
      title: "Sharpe Ratio",
      value: sharpe,
      prefix: "",
      displayValue: sharpe,
      sub: sharpe >= 1 ? "Excellent risk-adjusted return" : sharpe >= 0.5 ? "Good risk-adjusted return" : "Below-average return",
      subColorLight: "#4B5563",
      subColorDark:  "#D1D5DB",
      suffix: "",
      decimals: 4,
    },
  ];

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(timer);
  }, [currentBacktest]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((s, i) => (
        <div
          key={i}
          style={{
            backgroundColor: darkMode ? "#1a1a1a" : "#FFFFFF",
            borderColor: darkMode ? "#2d2d2d" : "#E5E7EB",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: `opacity 0.5s ease ${i * 100}ms, transform 0.5s ease ${i * 100}ms`,
          }}
          className="flex flex-col gap-2 p-6 rounded-lg border"
        >
          <p
            style={{ color: darkMode ? "#a1a1aa" : "#6b7280" }}
            className="text-sm font-medium uppercase tracking-wide"
          >
            {s.title}
          </p>

          <p
            style={{ color: darkMode ? "#FFFFFF" : "#000000" }}
            className="text-3xl font-bold tabular-nums"
          >
            {currentBacktest ? (
              <AnimatedNumber
                value={s.displayValue}
                prefix={s.prefix}
                suffix={s.suffix ?? ""}
                decimals={s.decimals}
              />
            ) : (
              <span className={`inline-block w-24 h-8 rounded animate-pulse ${darkMode ? "bg-[#2d2d2d]" : "bg-gray-100"}`} />
            )}
          </p>

          <p
            style={{ color: darkMode ? s.subColorDark : s.subColorLight }}
            className="text-sm font-medium"
          >
            {s.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
