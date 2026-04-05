"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/theme-context";
import { useStrategyStore } from "@/app/store/strategyStore";

import BasicInfo from "@/app/components/createstrategy/editinfo/BasicInfo";
import ConditionsTable from "@/app/components/createstrategy/ConditionsTable/ConditionsTable";
import AdvancedSettings from "@/app/components/createstrategy/AdvancedSettings/AdvancedSettings";
import { createStrategyApi, updateStrategyApi } from "@/lib/strategyapi";

// Decode user_id from the JWT stored in localStorage
function getUserIdFromToken(): string {
  try {
    const token = localStorage.getItem("token");
    if (!token) return "";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload._id ?? payload.id ?? payload.userId ?? payload.user_id ?? "";
  } catch {
    return "";
  }
}

export default function EditStrategyPage() {
  const { darkMode } = useTheme();
  const router = useRouter();

  const { ui, parsed, strategyDbId, setUI } = useStrategyStore();

  const [editedStrategy, setEditedStrategy] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (ui) {
      setEditedStrategy(structuredClone(ui));
    }
  }, [ui]);

  // ─── Build API payload ───────────────────────────────────────────────────────
  const buildPayload = () => {
    const strategyName = editedStrategy?.strategy_name || "Untitled Strategy";
    const languageInput = parsed?.language_input || strategyName;
    const user_id = getUserIdFromToken();

    return {
      user_id,
      name: strategyName,
      description: editedStrategy?.description ?? "",
      language_input: languageInput,
      generated_rules: {
        pair: editedStrategy?.pair ?? null,
        indicator: editedStrategy?.indicator ?? null,
        buy: editedStrategy?.buy ?? null,
        sell: editedStrategy?.sell ?? null,
        stop_loss: editedStrategy?.stop_loss ? Number(editedStrategy.stop_loss) : null,
        take_profit: editedStrategy?.take_profit ? Number(editedStrategy.take_profit) : null,
      },
      initial_capital: editedStrategy?.capital ? Number(editedStrategy.capital) : undefined,
      engine_type: "BACKTEST" as const,
      // Always PUBLIC — when shared to community it's automatically shared
      visibility: "PUBLIC" as const,
      conditions: editedStrategy?.conditions ?? [],
    };
  };

  // ─── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!editedStrategy) return;
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      setSaveLoading(true);
      const payload = buildPayload();
      let savedResult;
      if (strategyDbId) {
        const { user_id, ...updatePayload } = payload as any;
        savedResult = await updateStrategyApi(strategyDbId, updatePayload);
      } else {
        savedResult = await createStrategyApi(payload as any);
        if (savedResult?.strategy?._id) {
          useStrategyStore.getState().setStrategyDbId(savedResult.strategy._id);
        }
      }
      setUI(structuredClone(editedStrategy));
      setSuccessMsg("Strategy saved! Redirecting…");
      setTimeout(() => router.push("/BacktestPage"), 800);
    } catch (error: any) {
      setErrorMsg(error?.message ?? "Failed to save strategy.");
    } finally {
      setSaveLoading(false);
    }
  };

  // ─── Run Backtest ─────────────────────────────────────────────────────────
  const handleRunBacktest = async () => {
    if (!editedStrategy) return;
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      setBacktestLoading(true);
      const payload = buildPayload();
      let savedStrategy;
      if (strategyDbId) {
        const { user_id, ...updatePayload } = payload as any;
        savedStrategy = await updateStrategyApi(strategyDbId, updatePayload);
      } else {
        savedStrategy = await createStrategyApi(payload as any);
        if (savedStrategy?.strategy?._id) {
          useStrategyStore.getState().setStrategyDbId(savedStrategy.strategy._id);
        }
      }
      setUI(structuredClone(editedStrategy));
      setSuccessMsg("Strategy saved! Launching Backtest…");
      setTimeout(() => router.push("/BacktestPage"), 800);
    } catch (error: any) {
      setErrorMsg(error?.message ?? "Failed to start backtest.");
    } finally {
      setBacktestLoading(false);
    }
  };

  // ─── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = () => {
    if (ui) {
      setEditedStrategy(structuredClone(ui));
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  };

  if (!editedStrategy) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${darkMode ? "bg-[#0d0d0d]" : "bg-[#f8f5f5]"}`}>
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-5xl text-[#f90606] animate-spin">sync</span>
          <p className={`text-lg font-semibold ${darkMode ? "text-white" : "text-black"}`}>Loading strategy…</p>
        </div>
      </div>
    );
  }

  return (
    <main className={`min-h-screen ${darkMode ? "bg-[#0d0d0d] text-gray-100" : "bg-[#f8f5f5] text-gray-900"}`}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">

        {/* ── Page Header ── */}
        <div className={`rounded-xl p-6 border ${darkMode ? "bg-[#1a1a1a] border-[#2d2d2d]" : "bg-white border-[#e5e7eb] shadow-sm"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[#f90606]">strategy</span>
                <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                  Strategy Editor
                </span>
              </div>
              <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${darkMode ? "text-white" : "text-black"}`}>
                {editedStrategy.strategy_name || "Untitled Strategy"}
              </h1>
              <p className={`text-sm mt-1 ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                Review and refine the conditions for your automated trading strategy.
              </p>
            </div>
            {/* Status badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 self-start">
              <span className="material-symbols-outlined text-green-500 text-base">public</span>
              <span className="text-green-500 text-xs font-bold">PUBLIC</span>
            </div>
          </div>
        </div>

        {/* ── Status Messages ── */}
        {successMsg && (
          <div className="flex items-center gap-3 rounded-xl bg-green-500/10 border border-green-500/30 px-5 py-3 text-green-500 text-sm font-medium">
            <span className="material-symbols-outlined text-base">check_circle</span>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/30 px-5 py-3 text-red-500 text-sm font-medium">
            <span className="material-symbols-outlined text-base">error</span>
            {errorMsg}
          </div>
        )}

        {/* ── Form Sections ── */}
        <BasicInfo data={editedStrategy} onChange={setEditedStrategy} />

        <ConditionsTable
          data={editedStrategy.conditions || []}
          onChange={(newRows) => setEditedStrategy({ ...editedStrategy, conditions: newRows })}
        />

        <AdvancedSettings data={editedStrategy} onChange={setEditedStrategy} />

        {/* ── Footer Actions ── */}
        <div className={`rounded-xl p-5 border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
          darkMode ? "bg-[#1a1a1a] border-[#2d2d2d]" : "bg-white border-[#e5e7eb] shadow-sm"
        }`}>
          <button
            onClick={handleReset}
            className={`flex items-center justify-center gap-2 flex-1 sm:flex-none sm:w-auto px-6 py-3 rounded-lg text-sm font-bold border transition-all ${
              darkMode
                ? "bg-transparent border-[#2d2d2d] text-white hover:bg-white/5"
                : "bg-transparent border-[#e5e7eb] text-black hover:bg-gray-50"
            }`}
          >
            <span className="material-symbols-outlined text-base">restart_alt</span>
            Reset
          </button>

          <div className="flex flex-col sm:flex-row gap-3 flex-1 sm:flex-none">
            <button
              onClick={handleSave}
              disabled={saveLoading || backtestLoading}
              className={`flex items-center justify-center gap-2 flex-1 px-6 py-3 rounded-lg text-sm font-bold border transition-all disabled:opacity-50 ${
                darkMode
                  ? "bg-[#111] border-[#2d2d2d] text-white hover:bg-white/5"
                  : "bg-black text-white border-transparent hover:bg-gray-900"
              }`}
            >
              <span className="material-symbols-outlined text-base">save</span>
              {saveLoading ? "Saving…" : strategyDbId || editedStrategy?.id ? "Update Strategy" : "Save Strategy"}
            </button>

            <button
              onClick={handleRunBacktest}
              disabled={saveLoading || backtestLoading}
              className="flex items-center justify-center gap-2 flex-1 px-6 py-3 rounded-lg text-sm font-bold bg-[#f90606] text-white hover:bg-red-700 transition-all disabled:opacity-50 shadow-lg shadow-red-500/20"
            >
              <span className="material-symbols-outlined text-base">play_arrow</span>
              {backtestLoading ? "Starting…" : "Run Backtest"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}