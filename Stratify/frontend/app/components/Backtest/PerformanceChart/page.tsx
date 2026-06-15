"use client";
import React, { useEffect, useState } from "react";
import { useTheme } from "@/context/theme-context";
import { useBacktestResultStore, Trade } from "@/app/store/backtestResultStore";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAlertStore } from "@/app/store/alertStore";

interface PerformanceChartProps {
  onStopSimulation?: () => void;
}

export default function PerformanceChart({ onStopSimulation }: PerformanceChartProps = {}) {
  const { darkMode } = useTheme();
  const { currentBacktest, isLoading, error, clearCurrentBacktest } = useBacktestResultStore();
  const router = useRouter();

  // State for live simulation
  const [simulationActive, setSimulationActive] = useState(false);
  const [simIndex, setSimIndex] = useState(0);
  const [simTrades, setSimTrades] = useState<Trade[]>([]);
  const [simCapital, setSimCapital] = useState(0);
  const [simComplete, setSimComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { addAlert } = useAlertStore();

  // Start simulation when a backtest result comes in
  useEffect(() => {
    if (currentBacktest && !isLoading) {
      setSimulationActive(true);
      setSimIndex(0);
      setSimTrades([]);
      setSimCapital(currentBacktest.initial_capital ?? 10000);
      setSimComplete(false);
    }
  }, [currentBacktest, isLoading]);

  // Pause the simulation manually
  const handleTogglePause = () => {
    setIsPaused(prev => !prev);
  };

  // Stop the simulation manually
  const handleStop = () => {
    setSimulationActive(false);
    setSimComplete(true);
    onStopSimulation?.();
  };

  // Run the simulation loop
  useEffect(() => {
    if (!simulationActive || !currentBacktest || simComplete || isPaused) return;

    const trades = currentBacktest.trades || [];
    if (trades.length === 0) {
      setSimComplete(true);
      return;
    }

    if (simIndex < trades.length) {
      const timer = setTimeout(() => {
        const nextTrade = trades[simIndex];
        setSimTrades(prev => [nextTrade, ...prev].slice(0, 50)); // Keep last 50 for performance
        if (nextTrade.profit) {
          setSimCapital(prev => prev + nextTrade.profit!);
        }

        // Add to generic Trade Alerts
        addAlert({
          type: nextTrade.action.toLowerCase(),
          text: `${nextTrade.action} triggered at $${nextTrade.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          time: nextTrade.time,
        });

        setSimIndex(prev => prev + 1);
      }, 150); // Speed of simulation
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => setSimComplete(true), 500);
    }
  }, [simulationActive, simIndex, currentBacktest, simComplete, isPaused, addAlert]);


  if (error) {
    return (
      <div className={`rounded-xl border p-6 flex flex-col items-center justify-center min-h-[400px] ${darkMode ? "bg-[#1a1a1a] border-[#2d2d2d]" : "bg-white border-[#e5e7eb]"}`}>
        <div className="h-16 w-16 bg-[#f90606]/10 text-[#f90606] rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Engine Failed</h3>
        <p className={`text-sm mt-2 text-center max-w-sm leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`rounded-xl border p-6 flex flex-col items-center justify-center min-h-[400px] ${darkMode ? "bg-[#1a1a1a] border-[#2d2d2d]" : "bg-white border-[#e5e7eb]"}`}>
        <span className="material-symbols-outlined text-5xl text-[#f90606] animate-spin mb-4">sync</span>
        <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Analyzing Market Data...</h3>
        <p className="text-gray-500 mt-2">Computing historical indicators & executing rules</p>
      </div>
    );
  }

  if (!currentBacktest) {
    return (
      <div className={`rounded-xl border p-6 flex flex-col items-center justify-center min-h-[400px] ${darkMode ? "bg-[#1a1a1a] border-[#2d2d2d]" : "bg-white border-[#e5e7eb]"}`}>
        <span className="material-symbols-outlined text-5xl text-gray-400 mb-4">candlestick_chart</span>
        <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}>No Simulation Running</h3>
        <p className="text-gray-500 mt-2">Configure and run a strategy from the sidebar.</p>
      </div>
    );
  }

  const progress = currentBacktest.trades?.length ? (simIndex / currentBacktest.trades.length) * 100 : 100;

  return (
    <div className={`rounded-xl border overflow-hidden flex flex-col ${darkMode ? "bg-[#1a1a1a] border-[#2d2d2d]" : "bg-white border-[#e5e7eb]"}`}>
      {/* Header */}
      <div className={`p-4 border-b flex items-center justify-between ${darkMode ? "border-[#2d2d2d]" : "border-[#e5e7eb]"}`}>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className={`material-symbols-outlined ${simComplete ? "text-green-500" : "text-[#f90606] animate-pulse"}`}>
              {simComplete ? "check_circle" : "smart_toy"}
            </span>
          </div>
          <div>
            <h3 className={`font-bold ${darkMode ? "text-white" : "text-black"}`}>
              {simComplete ? "Simulation Complete" : "Live Market Simulation"}
            </h3>
            <p className="text-xs text-gray-500">
              {simComplete ? "All historical orders processed." : `Processing order ${simIndex} of ${currentBacktest.trades?.length || 0}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Pause/Continue & Stop buttons — only shown during active sim */}
          {simulationActive && !simComplete && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePause}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-500 text-xs font-bold hover:bg-blue-500/20 transition-all"
              >
                <span className="material-symbols-outlined text-base">{isPaused ? "play_arrow" : "pause"}</span>
                {isPaused ? "Continue" : "Pause"}
              </button>
              <button
                onClick={handleStop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f90606]/10 border border-[#f90606]/30 text-[#f90606] text-xs font-bold hover:bg-[#f90606]/20 transition-all"
              >
                <span className="material-symbols-outlined text-base">stop_circle</span>
                Stop
              </button>
            </div>
          )}
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Simulated Capital</p>
            <p className={`text-2xl font-black ${darkMode ? "text-white" : "text-black"}`}>
              ${simCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-gray-200 dark:bg-gray-800">
        <div 
          className="h-full bg-[#f90606] transition-all duration-150 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Live Chart Area (Abstracted Candles) */}
      <div className={`h-[250px] relative overflow-hidden flex items-end p-4 gap-1 border-b ${darkMode ? "border-[#2d2d2d] bg-[#111]" : "border-[#e5e7eb] bg-gray-50"}`}>
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        
        {/* Render fake candles based on trades to look alive */}
        <AnimatePresence mode="popLayout">
          {simTrades.slice(0, 40).reverse().map((trade, i) => {
            const isBuy = trade.action === "BUY";
            const height = 20 + (Math.random() * 60); // Random visual height for aesthetic
            return (
              <motion.div
                key={`${trade.time}-${i}`}
                initial={{ opacity: 0, height: 0, scaleY: 0 }}
                animate={{ opacity: 1, height: `${height}%`, scaleY: 1 }}
                layout
                className={`flex-1 min-w-[4px] rounded-t-sm ${isBuy ? "bg-green-500/80" : "bg-red-500/80"}`}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Live Order Logs */}
      <div className="h-[200px] overflow-y-auto p-4 flex flex-col gap-2 font-mono text-xs">
        {simTrades.map((trade, i) => (
          <motion.div 
            key={`${trade.time}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center justify-between p-2 rounded border ${
              trade.action === "BUY" 
              ? (darkMode ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-50 border-green-200 text-green-700")
              : (darkMode ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-700")
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold">{trade.action}</span>
              <span className="opacity-70">{trade.time}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>@ ${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              {trade.profit != null && (
                <span className={`font-bold ${trade.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {trade.profit >= 0 ? "+" : ""}${trade.profit.toFixed(2)}
                </span>
              )}
            </div>
          </motion.div>
        ))}
        {simTrades.length === 0 && !simComplete && (
          <div className="text-gray-500 text-center py-4">Waiting for signals...</div>
        )}
      </div>
      
      {/* Total Trades Metric below trade area */}
      <div className={`px-4 py-2 text-xs font-bold text-center border-t ${darkMode ? "border-[#2d2d2d] bg-[#1a1a1a] text-gray-400" : "border-[#e5e7eb] bg-gray-50 text-gray-500"}`}>
        {simIndex} Trades Executed Total
      </div>

      {/* Footer completion action */}
      <div className={`p-4 border-t flex justify-end transition-all ${simComplete ? "opacity-100" : "opacity-0 pointer-events-none"} ${darkMode ? "border-[#2d2d2d] bg-[#1a1a1a]" : "border-[#e5e7eb] bg-white"}`}>
        <button
          onClick={() => router.push("/BacktestResultsPage")}
          className="flex items-center gap-2 px-6 py-2 bg-[#f90606] text-white font-bold rounded-lg hover:bg-red-700 transition"
        >
          View Full Report 
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
