"use client";
import { useEffect, useState } from "react";
import { useTheme } from "@/context/theme-context";
import { useBacktestResultStore } from "@/app/store/backtestResultStore";
import BacktestSidebar from "@/app/components/Backtest/BacktestSidebar/BacktestSidebar";
import PerformanceChart from "@/app/components/Backtest/PerformanceChart/page";
import TradeAlerts from "@/app/components/Backtest/TradeAlerts/page";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Strategy {
  _id: string;
  name: string;
  description?: string;
  generated_rules?: {
    pair?: string | null;
    indicator?: string | null;
    buy?: string | null;
    sell?: string | null;
    stop_loss?: number | null;
    take_profit?: number | null;
  };
  initial_capital?: number;
  engine_type?: string;
  visibility?: string;
}

interface Metric {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bg: string;
}

// ─── Build metric cards from strategy fields ─────────────────────────────────
function buildMetrics(strategy: Strategy | null): Metric[] {
  const rules = strategy?.generated_rules ?? {};
  return [
    {
      label: "Initial Capital",
      value: strategy?.initial_capital
        ? `$${Number(strategy.initial_capital).toLocaleString()}`
        : "—",
      icon: "payments",
      color: "text-green-400",
      bg: "from-green-500/10 to-green-500/5",
    },
    {
      label: "Stop Loss",
      value: rules.stop_loss != null ? `${rules.stop_loss}%` : "—",
      icon: "do_not_disturb_on",
      color: "text-red-400",
      bg: "from-red-500/10 to-red-500/5",
    },
    {
      label: "Take Profit",
      value: rules.take_profit != null ? `${rules.take_profit}%` : "—",
      icon: "trending_up",
      color: "text-emerald-400",
      bg: "from-emerald-500/10 to-emerald-500/5",
    },
    {
      label: "Engine",
      value: strategy?.engine_type ?? "—",
      icon: "memory",
      color: "text-blue-400",
      bg: "from-blue-500/10 to-blue-500/5",
    },
  ];
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BacktestPage() {
  const { darkMode } = useTheme();
  const clearCurrentBacktest = useBacktestResultStore((state) => state.clearCurrentBacktest);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [visible, setVisible] = useState(false);

  // Trigger entrance animation and wipe any old backtest data hanging around
  useEffect(() => {
    clearCurrentBacktest();
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [clearCurrentBacktest]);

  const metrics = buildMetrics(selectedStrategy);

  const alerts = [
    { type: "buy",  text: "BUY triggered at $65,102.50",  time: "2023-11-15 09:30:15 UTC" },
    { type: "sell", text: "SELL triggered at $68,540.00", time: "2023-11-18 14:05:42 UTC" },
    { type: "buy",  text: "BUY triggered at $67,980.10",  time: "2023-11-20 08:00:05 UTC" },
    { type: "sell", text: "SELL triggered at $71,200.75", time: "2023-11-25 18:45:21 UTC" },
  ];

  return (
    <main
      className={`flex-1 min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-[#0d0d0d] text-gray-200" : "bg-[#f8f5f5] text-gray-900"
      }`}
    >
      <div
        className={`container mx-auto px-4 py-10 transition-all duration-500 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight">
            Backtest a Strategy
          </h1>
          <p className={`mt-1 text-sm ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>
            Select a strategy, configure parameters, and simulate historical performance.
          </p>
        </div>

        {/* ── Strategy info strip ─────────────────────────────────────────── */}
        {selectedStrategy && (
          <div
            className={`mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl px-5 py-4 border animate-fade-in ${
              darkMode
                ? "bg-[#1a1a1a] border-[#2d2d2d]"
                : "bg-white border-[#e5e7eb] shadow-sm"
            }`}
          >
            {/* Strategy Name */}
            <InfoChip
              icon="strategy"
              label="Strategy"
              value={selectedStrategy.name}
              darkMode={darkMode}
            />
            {selectedStrategy.generated_rules?.pair && (
              <>
                <Divider darkMode={darkMode} />
                <InfoChip
                  icon="currency_bitcoin"
                  label="Pair"
                  value={selectedStrategy.generated_rules.pair}
                  darkMode={darkMode}
                />
              </>
            )}
            {selectedStrategy.generated_rules?.indicator && (
              <>
                <Divider darkMode={darkMode} />
                <InfoChip
                  icon="show_chart"
                  label="Indicator"
                  value={selectedStrategy.generated_rules.indicator}
                  darkMode={darkMode}
                />
              </>
            )}
            {selectedStrategy.engine_type && (
              <>
                <Divider darkMode={darkMode} />
                <InfoChip
                  icon="memory"
                  label="Engine"
                  value={selectedStrategy.engine_type}
                  darkMode={darkMode}
                />
              </>
            )}
            {selectedStrategy.visibility && (
              <>
                <Divider darkMode={darkMode} />
                <InfoChip
                  icon="lock"
                  label="Visibility"
                  value={selectedStrategy.visibility}
                  darkMode={darkMode}
                />
              </>
            )}
          </div>
        )}

        {/* ── Main Grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Sidebar */}
          <BacktestSidebar onStrategyChange={setSelectedStrategy} />

          {/* Right Content */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            
            {/* Performance Chart Placeholder */}
            <PerformanceChart />

            {/* Trade Alerts */}
            <TradeAlerts />
          </div>
        </div>
      </div>

      {/* ── Global animations ─────────────────────────────────────────────── */}
      <style jsx global>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease both;
        }
        .animate-fade-in {
          animation: fade-in 0.35s ease both;
        }
      `}</style>
    </main>
  );
}

// ─── Small helper components ──────────────────────────────────────────────────

function InfoChip({
  icon,
  label,
  value,
  darkMode,
}: {
  icon: string;
  label: string;
  value: string;
  darkMode: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-[#f90606] text-lg">{icon}</span>
      <div>
        <p className={`text-xs ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>
          {label}
        </p>
        <p className={`font-bold text-sm ${darkMode ? "text-white" : "text-black"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function Divider({ darkMode }: { darkMode: boolean }) {
  return (
    <div className={`h-8 w-px ${darkMode ? "bg-[#2d2d2d]" : "bg-[#e5e7eb]"}`} />
  );
}

function RuleChip({
  label,
  value,
  icon,
  color,
  darkMode,
}: {
  label: string;
  value?: string | null;
  icon: string;
  color: string;
  darkMode: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-3 border ${
        darkMode ? "border-[#2d2d2d] bg-[#111]" : "border-[#f0f0f0] bg-[#fafafa]"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`material-symbols-outlined text-base ${color}`}>{icon}</span>
        <p className={`text-xs font-semibold ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
          {label}
        </p>
      </div>
      <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-black"} break-words`}>
        {value || <span className="opacity-30 font-normal italic">Not set</span>}
      </p>
    </div>
  );
}
