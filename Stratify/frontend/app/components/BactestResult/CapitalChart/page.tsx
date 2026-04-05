"use client";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@/context/theme-context";
import { useBacktestResultStore } from "@/app/store/backtestResultStore";

export default function CapitalChart() {
  const { darkMode } = useTheme();
  const { currentBacktest } = useBacktestResultStore();

  const bgColor     = darkMode ? "#1a1a1a" : "#FFFFFF";
  const borderColor = darkMode ? "#2d2d2d" : "#E5E7EB";
  const textPrimary = darkMode ? "#FFFFFF" : "#000000";
  const textSec     = darkMode ? "#D1D5DB" : "#6B7280";
  const strokeMain  = darkMode ? "#f90606" : "#f90606";
  const strokeRef   = darkMode ? "#4ade80" : "#16a34a";

  const svgWidth  = 500;
  const svgHeight = 200;
  const padL = 10, padR = 10, padT = 16, padB = 16;

  // Build equity curve from trades
  const trades = currentBacktest?.trades ?? [];
  const initialCapital = currentBacktest?.initial_capital ?? 10000;

  // Build cumulative capital at each completed trade
  const equityPoints: { time: string; capital: number }[] = [
    { time: "Start", capital: initialCapital },
  ];
  let running = initialCapital;
  for (const t of trades) {
    if (t.profit !== null) {
      running += t.profit;
      equityPoints.push({ time: t.time, capital: running });
    }
  }

  // Map equity to SVG coordinates
  const minCap = Math.min(...equityPoints.map(p => p.capital));
  const maxCap = Math.max(...equityPoints.map(p => p.capital));
  const capRange = maxCap - minCap || 1;

  const toX = (i: number) =>
    padL + (i / Math.max(equityPoints.length - 1, 1)) * (svgWidth - padL - padR);
  const toY = (val: number) =>
    padT + (1 - (val - minCap) / capRange) * (svgHeight - padT - padB);

  const pathD = equityPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p.capital).toFixed(1)}`)
    .join(" ");

  // Animated stroke-dashoffset draw-on reveal
  const pathRef = useRef<SVGPathElement | null>(null);
  const [pathLen, setPathLen] = useState(0);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    setDrawn(false);
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      setPathLen(len);
      // small timeout to ensure dash is applied before we animate
      setTimeout(() => setDrawn(true), 60);
    }
  }, [pathD]);

  // Baseline (initial capital) reference line
  const baselineY = toY(initialCapital);
  const baselineD = `M${padL},${baselineY.toFixed(1)} L${(svgWidth - padR).toFixed(1)},${baselineY.toFixed(1)}`;

  // Date axis ticks (first, middle, last)
  const tickIndices = equityPoints.length <= 2
    ? [0, equityPoints.length - 1]
    : [0, Math.floor((equityPoints.length - 1) / 2), equityPoints.length - 1];
  const ticks = tickIndices.map(i => ({
    x: toX(i),
    label: equityPoints[i]?.time?.slice(0, 10) ?? "",
  }));

  const isNoData = equityPoints.length === 1;

  return (
    <div
      className="lg:col-span-2 flex flex-col gap-4 p-6 rounded-lg border"
      style={{ backgroundColor: bgColor, borderColor }}
    >
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold" style={{ color: textPrimary }}>
          Equity Curve
        </p>
        {currentBacktest && (
          <span
            style={{ backgroundColor: darkMode ? "#2d2d2d" : "#f3f4f6", color: textSec }}
            className="text-xs font-semibold px-3 py-1 rounded-full"
          >
            {equityPoints.length - 1} data points
          </span>
        )}
      </div>

      <div className="flex min-h-[220px] flex-1 flex-col justify-end">
        {isNoData && !currentBacktest ? (
          <div className={`flex-1 rounded animate-pulse ${darkMode ? "bg-[#2d2d2d]" : "bg-gray-100"}`} style={{ minHeight: 200 }} />
        ) : (
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%">
            {/* Baseline reference */}
            <path
              d={baselineD}
              stroke={strokeRef}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              opacity={0.5}
              fill="none"
            />

            {/* Area fill under curve */}
            {!isNoData && (
              <path
                d={`${pathD} L${toX(equityPoints.length - 1).toFixed(1)},${(svgHeight - padB).toFixed(1)} L${padL},${(svgHeight - padB).toFixed(1)} Z`}
                fill={strokeMain}
                opacity={0.06}
              />
            )}

            {/* Equity curve line with draw-on animation */}
            {!isNoData && (
              <path
                ref={pathRef}
                d={pathD}
                stroke={strokeMain}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray={pathLen}
                strokeDashoffset={drawn ? 0 : pathLen}
                style={{ transition: drawn ? "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" : "none" }}
              />
            )}

            {/* Dots at each trade */}
            {!isNoData && equityPoints.map((p, i) => (
              <circle
                key={i}
                cx={toX(i)}
                cy={toY(p.capital)}
                r={3}
                fill={strokeMain}
                opacity={drawn ? 0.85 : 0}
                style={{ transition: `opacity 0.3s ease ${Math.min(i * 40, 1200)}ms` }}
              />
            ))}
          </svg>
        )}
      </div>

      {/* Date labels */}
      <div
        className="flex justify-between text-xs pt-2 border-t"
        style={{ borderColor, color: textSec }}
      >
        {currentBacktest && !isNoData
          ? ticks.map((t, i) => <span key={i}>{t.label}</span>)
          : ["Start", "Mid", "End"].map((l, i) => (
              <span key={i} className={`inline-block w-16 h-3 rounded animate-pulse ${darkMode ? "bg-[#2d2d2d]" : "bg-gray-100"}`} />
            ))
        }
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs" style={{ color: textSec }}>
        <span className="flex items-center gap-1.5">
          <span style={{ display: "inline-block", width: 20, height: 2.5, backgroundColor: strokeMain, borderRadius: 2 }} />
          Equity
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ display: "inline-block", width: 20, height: 2, backgroundColor: strokeRef, borderRadius: 2, opacity: 0.6 }} />
          Initial Capital
        </span>
      </div>
    </div>
  );
}
