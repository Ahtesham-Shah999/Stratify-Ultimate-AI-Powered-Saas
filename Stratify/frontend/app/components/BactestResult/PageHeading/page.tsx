"use client";
import React, { useState } from "react";
import { useTheme } from "@/context/theme-context";
import { useBacktestResultStore, Trade } from "@/app/store/backtestResultStore";
import { shareBacktestResults } from "@/lib/post";
import { getStrategyByIdApi } from "@/lib/strategyapi";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ModalState = "idle" | "checking" | "private-warn" | "form";

export default function PageHeading() {
  const { darkMode } = useTheme();
  const { currentBacktest } = useBacktestResultStore();

  const [modalState, setModalState] = useState<ModalState>("idle");
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const INPUT_CLS = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
    darkMode
      ? "bg-[#111] border-[#333] text-white placeholder:text-neutral-600 focus:border-[#f90606]"
      : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#f90606]"
  }`;

  // ── Open modal: check visibility first ───────────────────────────────────
  const openModal = async () => {
    const defaultTitle = currentBacktest?.strategy_id
      ? `Backtest Results — ${currentBacktest.timeframe ?? ""}`
      : "My Backtest Results";
    setTitle(defaultTitle);
    setBody("Check out my latest backtest results! Here's what the strategy returned.");
    setError(null);
    setShared(false);

    if (!currentBacktest?.strategy_id) {
      setModalState("form");
      return;
    }

    setModalState("checking");
    try {
      const strategy = await getStrategyByIdApi(currentBacktest.strategy_id);
      const visibility =
        strategy?.visibility ?? strategy?.data?.visibility ?? "PRIVATE";
      if (visibility !== "PUBLIC") {
        setModalState("private-warn");
      } else {
        setModalState("form");
      }
    } catch {
      // If fetch fails, still allow sharing (best-effort)
      setModalState("form");
    }
  };

  const closeModal = () => setModalState("idle");

  // ── Share handler ─────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!title.trim() || !body.trim()) { setError("Title and description are required."); return; }

    let userId = "";
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("userData") : null;
      const u = raw ? JSON.parse(raw) : null;
      userId = u?._id ?? u?.id ?? "";
    } catch { /* ignore */ }

    if (!userId) { setError("You must be logged in to share."); return; }
    if (!currentBacktest) { setError("Run a backtest first before sharing results."); return; }

    setSharing(true);
    setError(null);
    try {
      await shareBacktestResults({
        user_id: userId,
        strategy_id: currentBacktest.strategy_id ?? "",
        strategy_name: title,
        title,
        body,
        backtest_metrics: {
          total_profit:    currentBacktest.profit_loss,
          initial_capital: currentBacktest.initial_capital,
          final_capital:   currentBacktest.final_capital,
          win_rate:        currentBacktest.win_rate,
          sharpe_ratio:    currentBacktest.sharpe_ratio,
          max_drawdown:    currentBacktest.max_drawdown,
          trades_count:    currentBacktest.trades_count,
          timeframe:       currentBacktest.timeframe,
        },
      });
      setShared(true);
      setTimeout(() => setModalState("idle"), 1800);
    } catch {
      setError("Failed to share. Please try again.");
    } finally {
      setSharing(false);
    }
  };
  // ── PDF Export ────────────────────────────────────────────────────────────
  const handleExportPDF = () => {
    if (!currentBacktest) return;

    const doc = new jsPDF();
    const isDark = darkMode;
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(isDark ? 50 : 0, isDark ? 50 : 0, isDark ? 50 : 0);
    doc.text("Stratify — Backtest Results", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleString();
    doc.text(`Generated on: ${dateStr}`, 14, 28);
    
    // Metrics Summary
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40);
    doc.text("Performance Summary", 14, 40);

    const metrics = [
      ["Timeframe", currentBacktest.timeframe ?? "—"],
      ["Initial Capital", `$${(currentBacktest.initial_capital ?? 0).toLocaleString()}`],
      ["Final Capital", currentBacktest.final_capital != null ? `$${currentBacktest.final_capital.toLocaleString()}` : "—"],
      ["Net Profit/Loss", `${(currentBacktest.profit_loss ?? 0) >= 0 ? "+" : ""}$${(currentBacktest.profit_loss ?? 0).toFixed(2)}`],
      ["Win Rate", `${((currentBacktest.win_rate ?? 0) * 100).toFixed(1)}%`],
      ["Max Drawdown", `${((currentBacktest.max_drawdown ?? 0) * 100).toFixed(2)}%`],
      ["Sharpe Ratio", (currentBacktest.sharpe_ratio ?? 0).toFixed(3)],
      ["Total Trades", (currentBacktest.trades_count ?? 0).toString()]
    ];

    autoTable(doc, {
      startY: 45,
      head: [["Metric", "Value"]],
      body: metrics,
      theme: "grid",
      headStyles: { fillColor: [249, 6, 6] }, // Red brand color
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 80 } },
    });

    // Trades Log
    const tradesStartY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Trade Log", 14, tradesStartY);

    if (currentBacktest.trades && currentBacktest.trades.length > 0) {
      const tradeData = currentBacktest.trades.map((t: Trade, i: number) => [
        i + 1,
        t.action,
        `$${t.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        t.time,
        t.profit != null ? `${t.profit >= 0 ? "+" : ""}$${t.profit.toFixed(2)}` : "—"
      ]);

      autoTable(doc, {
        startY: tradesStartY + 5,
        head: [["#", "Action", "Price", "Time", "Profit/Loss"]],
        body: tradeData,
        theme: "striped",
        headStyles: { fillColor: [40, 40, 40] },
        styles: { fontSize: 9 },
        didParseCell: (hookData: any) => {
          if (hookData.section === 'body' && hookData.column.index === 1) {
            // Color code Action
            const val = hookData.cell.raw as string;
            if (val === 'BUY') hookData.cell.styles.textColor = [34, 197, 94]; // Green
            if (val === 'SELL') hookData.cell.styles.textColor = [239, 68, 68]; // Red
          }
          if (hookData.section === 'body' && hookData.column.index === 4) {
             // Color code Profit
             const val = hookData.cell.raw as string;
             if (val.startsWith('+')) hookData.cell.styles.textColor = [34, 197, 94];
             else if (val.startsWith('-')) hookData.cell.styles.textColor = [239, 68, 68];
          }
        }
      });
    } else {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("No trades executed during this backtest.", 14, tradesStartY + 8);
    }

    doc.save(`Stratify_Backtest_${currentBacktest.timeframe ?? "Export"}.pdf`);
  };

  const hasResults = !!currentBacktest;
  const showModal = modalState !== "idle";

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-4">
        {/* Title */}
        <div className="flex flex-col gap-2">
          <p
            className="text-4xl font-black tracking-[-0.033em]"
            style={{ color: darkMode ? "#FFFFFF" : "#000000" }}
          >
            Backtest Results
          </p>
          <p
            className="text-base font-normal"
            style={{ color: darkMode ? "#D1D5DB" : "#4B5563" }}
          >
            A comprehensive analysis of your strategy's performance.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <motion.button
            onClick={handleExportPDF}
            disabled={!hasResults}
            whileHover={hasResults ? { scale: 1.04 } : {}}
            whileTap={hasResults ? { scale: 0.96 } : {}}
            className={`flex items-center gap-2 justify-center h-10 px-4 rounded-lg text-sm font-bold transition-opacity ${
              hasResults ? "opacity-100" : "opacity-50 cursor-not-allowed"
            }`}
            style={{
              backgroundColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
              color: darkMode ? "#FFFFFF" : "#000000",
            }}
          >
            Export Results
          </motion.button>

          <motion.button
            whileHover={hasResults ? { scale: 1.05, boxShadow: "0 0 20px rgba(249,6,6,0.4)" } : {}}
            whileTap={hasResults ? { scale: 0.95 } : {}}
            onClick={openModal}
            disabled={!hasResults || modalState === "checking"}
            className={`flex items-center gap-2 justify-center h-10 px-5 rounded-lg text-sm font-bold text-white transition-all ${
              hasResults
                ? "bg-[#f90606] shadow-lg shadow-red-600/20"
                : "bg-gray-400 cursor-not-allowed opacity-60"
            }`}
          >
            {modalState === "checking" ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <span className="material-symbols-outlined text-[18px]">share</span>
            )}
            Share to Community
          </motion.button>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
            />

            {/* ── PRIVATE WARNING ──────────────────────────────────────── */}
            {modalState === "private-warn" && (
              <motion.div
                key="private-warn"
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ type: "spring", stiffness: 340, damping: 30 }}
                className="relative z-10 w-full max-w-md rounded-2xl border p-6 flex flex-col gap-5 shadow-2xl"
                style={{
                  backgroundColor: darkMode ? "#0F0F0F" : "#FFFFFF",
                  borderColor: darkMode ? "#2d2d2d" : "#e5e7eb",
                }}
              >
                {/* Icon */}
                <div className="flex flex-col items-center gap-4 py-2">
                  <motion.div
                    animate={{ rotate: [0, -6, 6, -4, 4, 0] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(249,6,6,0.1)", border: "1px solid rgba(249,6,6,0.25)" }}
                  >
                    <span className="material-symbols-outlined text-4xl text-[#f90606]">lock</span>
                  </motion.div>
                  <div className="text-center">
                    <h2 className={`text-lg font-black mb-1 ${darkMode ? "text-white" : "text-black"}`}>
                      Strategy is Private
                    </h2>
                    <p className={`text-sm leading-relaxed ${darkMode ? "text-neutral-400" : "text-gray-500"}`}>
                      Only <span className="font-bold text-[#f90606]">PUBLIC</span> strategies can
                      be shared to the community feed. Change your strategy's visibility to{" "}
                      <strong>Public</strong> first, then come back to share.
                    </p>
                  </div>
                </div>

                {/* Steps hint */}
                <div
                  className="rounded-xl border p-4 flex flex-col gap-2 text-sm"
                  style={{
                    backgroundColor: darkMode ? "#1a1a1a" : "#fafafa",
                    borderColor: darkMode ? "#2d2d2d" : "#e5e7eb",
                  }}
                >
                  {[
                    "Go to My Strategies or Strategy Builder",
                    "Open the strategy and change visibility to Public",
                    "Re-run your backtest and share the results",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span
                        className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5"
                        style={{ background: "#f90606" }}
                      >
                        {i + 1}
                      </span>
                      <span style={{ color: darkMode ? "#a3a3a3" : "#6b7280" }}>{step}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 justify-end">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={closeModal}
                    className={`h-10 px-5 rounded-lg text-sm font-bold ${
                      darkMode ? "text-neutral-400 hover:text-white hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    Got it
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: "0 0 16px rgba(249,6,6,0.35)" }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { closeModal(); window.location.href = "/CreateStrategyPage"; }}
                    className="h-10 px-5 rounded-lg text-sm font-bold text-white bg-[#f90606]"
                  >
                    Go to Strategy Builder
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ── SHARE FORM ───────────────────────────────────────────── */}
            {modalState === "form" && (
              <motion.div
                key="share-form"
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ type: "spring", stiffness: 340, damping: 30 }}
                className="relative z-10 w-full max-w-lg rounded-2xl border p-6 flex flex-col gap-5 shadow-2xl"
                style={{
                  backgroundColor: darkMode ? "#0F0F0F" : "#FFFFFF",
                  borderColor: darkMode ? "#2d2d2d" : "#e5e7eb",
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#f90606] text-xl">share</span>
                    <h2 className={`text-lg font-black ${darkMode ? "text-white" : "text-black"}`}>
                      Share to Community
                    </h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeModal}
                    className={`rounded-full p-1 transition-colors ${
                      darkMode ? "hover:bg-white/10 text-neutral-400" : "hover:bg-gray-100 text-gray-500"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </motion.button>
                </div>

                {/* Metrics Preview */}
                {currentBacktest && (
                  <div
                    className="rounded-xl border p-4 grid grid-cols-2 gap-3"
                    style={{
                      backgroundColor: darkMode ? "#1a1a1a" : "#fafafa",
                      borderColor: darkMode ? "#2d2d2d" : "#e5e7eb",
                    }}
                  >
                    {[
                      { label: "Total Profit", value: `${(currentBacktest.profit_loss ?? 0) >= 0 ? "+" : ""}$${Math.abs(currentBacktest.profit_loss ?? 0).toFixed(2)}`, color: (currentBacktest.profit_loss ?? 0) >= 0 ? "#4ade80" : "#f90606" },
                      { label: "Initial Capital", value: `$${(currentBacktest.initial_capital ?? 0).toLocaleString()}`, color: darkMode ? "#a3a3a3" : "#6b7280" },
                      { label: "Win Rate", value: `${((currentBacktest.win_rate ?? 0) * 100).toFixed(1)}%`, color: "#60a5fa" },
                      { label: "Sharpe Ratio", value: (currentBacktest.sharpe_ratio ?? 0).toFixed(3), color: "#a78bfa" },
                    ].map((m) => (
                      <div key={m.label}>
                        <p className="text-xs font-medium" style={{ color: darkMode ? "#71717a" : "#9ca3af" }}>{m.label}</p>
                        <p className="text-base font-bold" style={{ color: m.color }}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-400" : "text-gray-500"}`}>
                    Post Title
                  </label>
                  <input className={INPUT_CLS} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give your post a title…" />
                </div>

                {/* Body */}
                <div className="flex flex-col gap-1.5">
                  <label className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-neutral-400" : "text-gray-500"}`}>
                    Description
                  </label>
                  <textarea rows={3} className={`${INPUT_CLS} resize-none`} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share your thoughts on this strategy…" />
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-[#f90606] font-medium"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={closeModal}
                    className={`h-10 px-4 rounded-lg text-sm font-bold ${
                      darkMode ? "text-neutral-400 hover:text-white hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={!sharing && !shared ? { scale: 1.04, boxShadow: "0 0 16px rgba(249,6,6,0.4)" } : {}}
                    whileTap={!sharing && !shared ? { scale: 0.96 } : {}}
                    onClick={handleShare}
                    disabled={sharing || shared}
                    className={`flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-bold text-white transition-all ${
                      shared ? "bg-green-600" : "bg-[#f90606] hover:bg-red-700 disabled:opacity-70"
                    }`}
                  >
                    {sharing && (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {shared ? (
                      <>
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        Shared!
                      </>
                    ) : sharing ? "Sharing…" : "Share Post"}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
