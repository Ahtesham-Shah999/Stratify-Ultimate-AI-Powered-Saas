// components/DashboardCards.tsx
"use client";
import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "@/context/theme-context";
import { getStrategiesByUserApi } from "@/lib/strategyapi";
import { getBacktestsByUserApi } from "@/lib/backtest";

function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const duration = 1200;
    const startTime = performance.now();
    const startVal = 0;
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(startVal + (value - startVal) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  const formatted =
    decimals === 0
      ? Math.floor(displayed).toLocaleString()
      : displayed.toFixed(decimals);

  return (
    <>
      {prefix}
      {formatted}
      {suffix}
    </>
  );
}

const DashboardCards: React.FC = () => {
  const { darkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [backtests, setBacktests] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      if (typeof window === "undefined") return;
      const raw = localStorage.getItem("userData");
      if (!raw) return;
      const user = JSON.parse(raw);
      const userId = user?.id || user?._id;
      if (!userId) return;

      try {
        const [strats, bts] = await Promise.all([
          getStrategiesByUserApi(userId).catch(() => []),
          getBacktestsByUserApi(userId).catch(() => []),
        ]);
        setStrategies(strats ?? []);
        setBacktests(bts ?? []);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Computed Metrics ─────────────────────────────────────────────────────
  const totalPortfolioValue = strategies.reduce(
    (sum, s) => sum + (Number(s.initial_capital) || 0),
    0
  );

  const totalStrategies = strategies.length;
  const totalBacktests = backtests.length;

  // Win rate: average of all backtest win_rate fields
  const winRate =
    backtests.length > 0
      ? backtests.reduce((sum, b) => sum + (Number(b.win_rate) || 0), 0) / backtests.length
      : 0;

  // Overall Success Rate = Sum(Win Rate * Total Trades) / Sum(All Trades)
  const totalTradesAcrossAll = backtests.reduce((sum, b) => sum + (Number(b.trades_count) || 0), 0);
  const weightedWins = backtests.reduce((sum, b) => sum + ((Number(b.win_rate) || 0) * (Number(b.trades_count) || 0)), 0);
  const successRate = totalTradesAcrossAll > 0 ? (weightedWins / totalTradesAcrossAll) : 0;

  // ── Skeleton helper ───────────────────────────────────────────────────────
  const skeletonCls = `inline-block w-20 h-6 rounded animate-pulse ${
    darkMode ? "bg-[#2d2d2d]" : "bg-gray-200"
  }`;

  const card = `${
    darkMode
      ? "bg-[#1a1a1a] border-[#2d2d2d] text-white"
      : "bg-white border-[#e5e7eb] text-gray-900"
  } rounded-xl shadow-sm p-6 border relative overflow-hidden`;

  return (
    <div className={`${darkMode ? "bg-[#230f0f]" : "bg-[#f8f5f5]"} space-y-8 py-6`}>
      {/* Dashboard Header */}
      <h1
        className={`${
          darkMode ? "text-white" : "text-gray-900"
        } text-4xl font-black leading-tight tracking-[-0.033em]`}
      >
        Dashboard Overview
      </h1>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Portfolio Summary */}
        <div
          className={`${
            darkMode
              ? "bg-[#1a1a1a] border-[#2d2d2d] text-white"
              : "bg-white border-[#e5e7eb] text-gray-900"
          } md:col-span-2 xl:col-span-1 rounded-xl shadow-lg p-6 flex flex-col justify-between border`}
        >
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Portfolio Summary</h3>
              <span className="material-symbols-outlined text-gray-400">
                account_balance_wallet
              </span>
            </div>
            <p className="text-4xl font-bold tracking-tighter mb-1">
              {loading ? (
                <span className={skeletonCls} />
              ) : (
                <AnimatedNumber
                  value={totalPortfolioValue}
                  prefix="$"
                  decimals={2}
                />
              )}
            </p>
            <p className="text-sm text-gray-400">Total Portfolio Value</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
            <div>
              <p className="text-gray-400">Total Strategies</p>
              <p className="font-bold text-lg">
                {loading ? (
                  <span className={skeletonCls} />
                ) : (
                  totalStrategies
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Win Rate</p>
              <p
                className="font-bold text-lg"
                style={{ color: winRate >= 50 ? "#00e676" : "#f90606" }}
              >
                {loading ? (
                  <span className={skeletonCls} />
                ) : (
                  `${winRate.toFixed(1)}%`
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Total Strategies */}
        <div className={card}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Strategies Created</p>
              <p className="text-3xl font-bold mt-1">
                {loading ? (
                  <span className={skeletonCls} />
                ) : (
                  <AnimatedNumber value={totalStrategies} />
                )}
              </p>
            </div>
            <span className="material-symbols-outlined text-[#f90606] text-3xl">
              psychology
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#f90606]/20">
            <div
              className="h-1 bg-[#f90606] transition-all duration-1000"
              style={{
                width: loading
                  ? "0%"
                  : `${Math.min((totalStrategies / 10) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Backtests Run */}
        <div className={card}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400">Backtests Run</p>
              <p className="text-3xl font-bold mt-1">
                {loading ? (
                  <span className={skeletonCls} />
                ) : (
                  <AnimatedNumber value={totalBacktests} />
                )}
              </p>
            </div>
            <span className="material-symbols-outlined text-[#f90606] text-3xl">
              query_stats
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#f90606]/20">
            <div
              className="h-1 bg-[#f90606] transition-all duration-1000"
              style={{
                width: loading
                  ? "0%"
                  : `${Math.min((totalBacktests / 20) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Success Rate */}
        <div className={card}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400">Success Rate</p>
              <p
                className="text-3xl font-bold mt-1"
                style={{
                  color: successRate >= 50 ? "#00e676" : "#f90606",
                }}
              >
                {loading ? (
                  <span className={skeletonCls} />
                ) : backtests.length === 0 ? (
                  <span className="text-gray-400 text-xl">No data</span>
                ) : (
                  <AnimatedNumber
                    value={successRate}
                    suffix="%"
                    decimals={1}
                  />
                )}
              </p>
            </div>
            <span className="material-symbols-outlined text-[#f90606] text-3xl">
              verified
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#f90606]/20">
            <div
              className="h-1 transition-all duration-1000"
              style={{
                width: loading ? "0%" : `${Math.min(successRate, 100)}%`,
                background:
                  successRate >= 50
                    ? "linear-gradient(90deg,#00e676,#00c853)"
                    : "#f90606",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCards;
