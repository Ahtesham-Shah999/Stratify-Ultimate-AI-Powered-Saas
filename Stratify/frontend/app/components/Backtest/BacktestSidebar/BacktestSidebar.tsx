"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/theme-context";
import { getStrategiesByUserApi } from "@/lib/strategyapi";
import { runBacktestApi } from "@/lib/backtest";
import { useBacktestResultStore } from "@/app/store/backtestResultStore";

interface Strategy {
  _id: string;
  name: string;
  description?: string;
  language_input?: string;
  generated_rules?: {
    pair?: string | null;
    indicator?: string | null;
    buy?: string | null;
    sell?: string | null;
    stop_loss?: number | null;
    take_profit?: number | null;
    timeframe?: string | null;
  };
  initial_capital?: number;
  engine_type?: string;
  visibility?: string;
}

interface BacktestSidebarProps {
  onStrategyChange?: (strategy: Strategy | null) => void;
}

export default function BacktestSidebar({ onStrategyChange }: BacktestSidebarProps) {
  const { darkMode } = useTheme();
  const router = useRouter();

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [symbol, setSymbol] = useState("BTC/USDT");
  const [quickRange, setQuickRange] = useState("1d");
  const [interval, setInterval] = useState("1m");
  const [capital, setCapital] = useState<number>(10000);
  const [startDate, setStartDate] = useState("2024-01-01T00:00");
  const [endDate, setEndDate] = useState("2024-12-31T23:59");
  const [fetching, setFetching] = useState(false);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [showNoTradesDialog, setShowNoTradesDialog] = useState(false);

  // Store actions
  const { setCurrentBacktest, setLoading, setError, isLoading } = useBacktestResultStore();

  // Fetch all strategies on mount
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        setFetching(true);
        const userId = localStorage.getItem("user_id") || localStorage.getItem("userId") || "";
        if (!userId) {
          try {
            const userRaw = localStorage.getItem("userData");
            if (userRaw) {
              const u = JSON.parse(userRaw);
              const id = u?._id ?? u?.id;
              if (id) {
                const list = await getStrategiesByUserApi(id);
                const reversed = list.reverse();
                setStrategies(reversed);
                if (reversed.length > 0) handleSelectStrategy(reversed[0], reversed);
              }
            }
          } catch { /* ignore */ }
          return;
        }
        
        const list = await getStrategiesByUserApi(userId);
        const reversed = list.reverse();
        setStrategies(reversed);
        if (reversed.length > 0) {
          handleSelectStrategy(reversed[0], reversed);
        }
      } catch (err) {
        console.error("Failed to fetch strategies:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchStrategies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectStrategy = (strategy: Strategy, list?: Strategy[]) => {
    const strats = list ?? strategies;
    const s = strats.find((x) => x._id === strategy._id) ?? strategy;
    setSelectedId(s._id);
    setSymbol(s.generated_rules?.pair ?? "BTC/USDT");
    setCapital(s.initial_capital ?? 10000);
    onStrategyChange?.(s);
  };

  const handleDropdownChange = (id: string) => {
    const found = strategies.find((s) => s._id === id);
    if (found) handleSelectStrategy(found);
  };

  const selected = strategies.find((s) => s._id === selectedId);

  // ─── Smart timeframe → date range parser ────────────────────────────────────
  useEffect(() => {
    if (!selected) return;

    const tf = quickRange.trim().toLowerCase();
    const now = new Date();
    const start = new Date(now);

    // Patterns: weeks, days, hours, minutes (handles "4days","4 days","4d","1 week","5weeks","2h","30m")
    const weeksMatch  = tf.match(/(\d+)\s*w(?:eeks?)?/i);
    const daysMatch   = tf.match(/(\d+)\s*d(?:ays?)?/i);
    const hoursMatch  = tf.match(/(\d+)\s*h(?:ours?|rs?)?/i);
    const minsMatch   = tf.match(/(\d+)\s*m(?:in(?:utes?)?)?(?!o)/i);
    const monthsMatch = tf.match(/(\d+)\s*mo(?:nths?)?/i);

    let matched = false;

    if (monthsMatch) {
      start.setMonth(now.getMonth() - parseInt(monthsMatch[1], 10));
      matched = true;
    }
    if (weeksMatch) {
      start.setDate(now.getDate() - parseInt(weeksMatch[1], 10) * 7);
      matched = true;
    }
    if (daysMatch && !weeksMatch) {
      start.setDate(now.getDate() - parseInt(daysMatch[1], 10));
      matched = true;
    }
    if (hoursMatch) {
      start.setHours(now.getHours() - parseInt(hoursMatch[1], 10));
      matched = true;
    }
    if (minsMatch) {
      start.setMinutes(now.getMinutes() - parseInt(minsMatch[1], 10));
      matched = true;
    }

    // Default: 1 day back if nothing matched
    if (!matched) {
      start.setDate(now.getDate() - 1);
    }

    const fmt = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setStartDate(fmt(start));
    setEndDate(fmt(now));
  }, [selectedId, strategies, quickRange]);

  const handleSentimentAnalysis = () => {
    setSentimentLoading(true);
    // Open the Sentiment Analysis page in a new tab
    const url = new URL("/SentimentAnalysis", window.location.origin);
    url.searchParams.set("symbol", symbol);
    window.open(url.toString(), "_blank");
    // Stop loader after a short delay
    setTimeout(() => setSentimentLoading(false), 1500);
  };

  const handleRunBacktest = async () => {
    if (!selectedId) return;

    setLoading(true);
    setError(null);

    const selected = strategies.find(s => s._id === selectedId);

    try {
      const selected = strategies.find(s => s._id === selectedId);

      // Calculate the difference between start and end date to store as "timeframe"
      let calculatedTimeframe = "1 Day";
      const sDate = new Date(startDate);
      const eDate = new Date(endDate);
      const diffMs = eDate.getTime() - sDate.getTime();

      if (!isNaN(diffMs) && diffMs > 0) {
        const days = diffMs / (1000 * 60 * 60 * 24);
        if (days >= 30) {
          const months = Math.round(days / 30);
          calculatedTimeframe = `${months} Month${months > 1 ? 's' : ''}`;
        } else if (days >= 7) {
          const weeks = Math.round(days / 7);
          calculatedTimeframe = `${weeks} Week${weeks > 1 ? 's' : ''}`;
        } else if (days >= 1) {
          const d = Math.round(days);
          calculatedTimeframe = `${d} Day${d > 1 ? 's' : ''}`;
        } else {
          const hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
          calculatedTimeframe = `${hours} Hour${hours > 1 ? 's' : ''}`;
        }
      }

      const res = await runBacktestApi({
        strategy_id: selectedId,
        timeframe: interval, // Using the Candle Interval for simulation
        initial_capital: capital,
        start_date: startDate,
        end_date: endDate,
        generated_rules: selected?.generated_rules
      });

      if (res && res.backtest) {
        const bt = res.backtest;

        // Automatically show warning dialog if 0 trades happened
        if (bt.trades_count === 0) {
          setShowNoTradesDialog(true);
          return;
        }

        // Merge result fields + trades into the store
        setCurrentBacktest({
          _id:             bt._id,
          strategy_id:     bt.strategy_id,
          timeframe:       bt.timeframe,
          initial_capital: bt.initial_capital ?? capital,
          final_capital:   bt.final_capital ?? null,
          profit_loss:     bt.profit_loss,
          win_rate:        bt.win_rate,
          max_drawdown:    bt.max_drawdown,
          sharpe_ratio:    bt.sharpe_ratio,
          trades_count:    bt.trades_count,
          trades:          bt.trades ?? [],
          symbol:          selected?.generated_rules?.pair ?? symbol,
          created_at:      bt.created_at,
        });

        // The routing to the results page is now handled by the PerformanceChart 
        // after the live simulation completes.
      }
    } catch (err: any) {
      console.error("Backtest Error:", JSON.stringify(err));
      // err can be an Error instance OR a plain object { error: "...", message: "..." }
      // thrown by the Axios interceptor in lib/backtest.ts
      let errorMsg =
        err?.message ||
        err?.error ||
        (typeof err === "string" ? err : "Something went wrong while running the backtest.");

      if (errorMsg.includes("No MT5 data found")) {
        errorMsg = "Your coin/pair name is incorrect or not supported by the broker's database. Try reversing it (e.g., EURUSD instead of USDEUR).";
      } else if (errorMsg.includes("Failed to initialize MT5")) {
        errorMsg = "The MetaTrader 5 terminal is not connected. Please ensure MT5 is running, logged in to a broker account, and has 'Allow Algo Trading' enabled.";
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full rounded-lg h-12 px-3 transition-colors ${
    darkMode
      ? "bg-black text-white border border-[#2d2d2d] focus:border-[#f90606]"
      : "bg-[#f8f5f5] text-black border border-[#e5e7eb] focus:border-[#f90606]"
  } outline-none`;

  const labelClass = `pb-2 text-sm font-medium ${
    darkMode ? "text-neutral-300" : "text-neutral-600"
  }`;

  return (
    <div
      className={`rounded-xl p-6 transition-all relative ${
        darkMode
          ? "bg-[#1a1a1a] border border-[#2d2d2d]"
          : "bg-white border border-[#e5e7eb] shadow-sm"
      }`}
    >
      {/* No Trades Dialog */}
      {showNoTradesDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`p-6 rounded-2xl max-w-sm w-full mx-4 shadow-2xl transform transition-all ${darkMode ? "bg-[#1a1a1a] border border-[#2d2d2d]" : "bg-white border border-gray-200"}`}>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 bg-[#f90606]/10 text-[#f90606] rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">info</span>
              </div>
              <div>
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? "text-white" : "text-black"}`}>No Trades Executed</h3>
                <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Your strategy rules did not trigger any trades during this specific time frame. Try adjusting your indicators, pairs, or selecting a larger date range.
                </p>
              </div>
              <button
                onClick={() => setShowNoTradesDialog(false)}
                className="w-full h-11 bg-[#f90606] hover:bg-red-700 text-white font-bold rounded-lg transition-colors mt-2"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      <form className="flex flex-col gap-5">

        {/* Select Strategy */}
        <label className="flex flex-col gap-1">
          <p className={labelClass}>Select Strategy</p>
          {fetching ? (
            <div className={`h-12 animate-pulse rounded-lg ${darkMode ? "bg-[#2d2d2d]" : "bg-gray-100"}`} />
          ) : (
            <select
              value={selectedId}
              onChange={(e) => handleDropdownChange(e.target.value)}
              className={inputClass}
            >
              {strategies.length === 0 && (
                <option value="">No strategies found</option>
              )}
              {strategies.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </label>

        {/* Symbol */}
        <label className="flex flex-col gap-1">
          <p className={labelClass}>Symbol / Pair</p>
          <input
            value={symbol}
            readOnly
            className={`w-full rounded-lg h-12 px-3 outline-none transition-colors select-none ${
              darkMode
                ? "bg-black/50 text-neutral-500 border border-[#2d2d2d] cursor-not-allowed"
                : "bg-gray-100/50 text-neutral-400 border border-[#e5e7eb] cursor-not-allowed"
            }`}
          />
        </label>

        {/* Candle Interval */}
        <label className="flex flex-col gap-1">
          <p className={labelClass}>Candle Interval</p>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className={inputClass}
          >
            <option value="1m">1 Minute</option>
            <option value="5m">5 Minutes</option>
            <option value="15m">15 Minutes</option>
            <option value="30m">30 Minutes</option>
            <option value="1h">1 Hour</option>
            <option value="4h">4 Hours</option>
            <option value="1d">1 Day</option>
            <option value="1w">1 Week</option>
          </select>
        </label>

        {/* Quick Range (Sets the Dates) */}
        <label className="flex flex-col gap-1">
          <p className={labelClass}>Quick Range</p>
          <select
            value={quickRange}
            onChange={(e) => setQuickRange(e.target.value)}
            className={inputClass}
          >
            <option value="1m">1 Minute</option>
            <option value="5m">5 Minutes</option>
            <option value="15m">15 Minutes</option>
            <option value="30m">30 Minutes</option>
            <option value="1h">1 Hour</option>
            <option value="4h">4 Hours</option>
            <option value="1d">1 Day</option>
            <option value="1w">1 Week</option>
            <option value="1mo">1 Month</option>
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Start Date", value: startDate, set: setStartDate },
            { label: "End Date", value: endDate, set: setEndDate },
          ].map(({ label, value, set }, i) => (
            <label key={i} className="flex flex-col gap-1">
              <p className={labelClass}>{label}</p>
              <input
                type="datetime-local"
                value={value}
                onChange={(e) => set(e.target.value)}
                className={inputClass}
              />
            </label>
          ))}
        </div>

        {/* Initial Capital */}
        <label className="flex flex-col gap-1">
          <p className={labelClass}>Initial Capital</p>
          <div className="relative">
            <span
              className={`absolute left-3 top-1/2 -translate-y-1/2 font-medium ${
                darkMode ? "text-neutral-400" : "text-neutral-500"
              }`}
            >
              $
            </span>
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              className={`${inputClass} pl-7`}
            />
          </div>
        </label>

        {/* Buttons */}
        <div className="flex flex-col gap-3 pt-1">
          {/* Run / Stop Backtest */}
          <button
            type="button"
            onClick={isLoading ? () => window.location.reload() : handleRunBacktest}
            className={`w-full flex items-center justify-center gap-2 rounded-lg h-12 ${
              isLoading ? "bg-[#2d2d2d] hover:bg-[#3d3d3d]" : "bg-[#f90606] hover:bg-red-700"
            } text-white font-bold transition-colors active:scale-95`}
          >
            <span className="material-symbols-outlined">
              {isLoading ? "stop" : "play_arrow"}
            </span>
            {isLoading ? "Stop Backtest" : "Run Backtest"}
          </button>

          <button
            type="button"
            onClick={handleSentimentAnalysis}
            disabled={sentimentLoading}
            className={`w-full flex items-center justify-center gap-2 rounded-lg h-12 border font-bold transition-all active:scale-95 ${
              darkMode
                ? "bg-[#1a1a1a] border-[#2d2d2d] text-white hover:bg-white/10"
                : "bg-white border-[#e5e7eb] text-black hover:bg-gray-50"
            } disabled:opacity-60`}
          >
            {sentimentLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Opening…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">sentiment_satisfied</span>
                Sentiment Analysis
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
