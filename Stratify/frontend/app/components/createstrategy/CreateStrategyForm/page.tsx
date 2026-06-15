"use client";

import React, { useState } from "react";
import { useTheme } from "@/context/theme-context";
import { useRouter } from "next/navigation";
import AILoader from "@/app/components/createstrategy/AILoader/AILoader";
import { parsedStrategyApi } from "@/lib/strategyapi";
import { useStrategyStore } from "@/app/store/strategyStore";

export default function CreateStrategyForm() {
  const { darkMode } = useTheme();
  const router = useRouter();
  const { setParsed } = useStrategyStore();

  const [loading, setLoading] = useState(false);
  const [languageInput, setLanguageInput] = useState("");
  const [inputError, setInputError] = useState(false);
  const [maliciousError, setMaliciousError] = useState("");

  // -----------------------
  // HANDLE GENERATE
  // -----------------------
  async function handleGenerateStrategy() {
    if (!languageInput.trim()) {
      setInputError(true);
      return;
    }

    setLoading(true);
    setInputError(false);
    setMaliciousError("");

    try {
      const userId = localStorage.getItem("user_id") || localStorage.getItem("userId") || "";
      const response = await parsedStrategyApi({
        language_input: languageInput,
        user_id: userId,
      });

      // ✅ Robust invalid strategy detection
      const isInvalidStrategy =
        response?.message?.toLowerCase().includes("invalid") ||
        response?.python_response?.description
          ?.toLowerCase()
          .includes("non-trading");

      if (isInvalidStrategy) {
        setMaliciousError(
          response?.message || "⚠ Enter a valid trading strategy."
        );
        return;
      }

      // ✅ Store valid strategy
      const store = useStrategyStore.getState();
      store.setParsed(response.parsed_strategy);
      store.setValidated(response.validated_strategy);
      store.normalizeForUI();

      router.push("/editcreatestrategy");
    } catch (error: any) {
      console.error(error);
      setMaliciousError(
        error?.message || "⚠ Please Enter a valid strategy!"
      );
    } finally {
      setLoading(false);
    }
  }

  // -----------------------
  // LOADER
  // -----------------------
  if (loading) {
    return (
      <div className="p-6">
        <AILoader />
      </div>
    );
  }

  // -----------------------
  // MAIN UI
  // -----------------------
  return (
    <div
      className={`${
        darkMode
          ? "bg-[#1a1a1a] border-[#2d2d2d]"
          : "bg-[#ffffff] border-[#e5e7eb]"
      } rounded-xl border p-6 sm:p-8`}
    >
      <div className="flex flex-col gap-6">
        
        {/* 🔴 Error Box */}
        {maliciousError && (
          <div className="p-4 rounded-lg bg-red-100 border border-red-400 text-red-700 font-medium whitespace-pre-wrap">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[20px]">warning</span>
              <strong>Strategy Rejected</strong>
            </div>
            {maliciousError}
          </div>
        )}

        {/* 💡 Strategy Guide */}
        <div className={`p-4 rounded-lg border ${darkMode ? "bg-[#252525] border-[#3d3d3d]" : "bg-blue-50 border-blue-200"}`}>
          <h3 className={`font-semibold flex items-center gap-2 ${darkMode ? "text-white" : "text-blue-800"}`}>
            <span className="material-symbols-outlined text-blue-500 text-[20px]">lightbulb</span>
            Rules for a Valid Strategy
          </h3>
          <ul className={`mt-2 ml-6 list-disc space-y-1 text-sm ${darkMode ? "text-gray-300" : "text-blue-900"}`}>
            <li><strong>Forex Pair:</strong> Must include a standard pair (e.g., EURUSD, GBPUSD).</li>
            <li><strong>Timeframe:</strong> Must specify duration (e.g., 1h, 15m, 1D).</li>
            <li><strong>Capital:</strong> Must include initial investment amount (e.g., 1000).</li>
            <li><strong>Action:</strong> Must contain actionable triggers (e.g., buy, sell).</li>
            <li><strong>Supported Indicators:</strong> Only RSI, MACD, SMA, Bollinger Bands, or Stochastic.</li>
          </ul>
        </div>

        {/* Strategy Description */}
        <label className="flex flex-col">
          <p
            className={`${
              darkMode ? "text-white" : "text-black"
            } font-medium pb-2`}
          >
            Strategy Description
          </p>

          <textarea
            className={`flex w-full min-h-40 p-5 rounded-xl outline-none transition-all duration-200 resize-none ${
              inputError
                ? "border-red-500 ring-4 ring-red-500/10"
                : darkMode
                ? "bg-[#111111] border-[#333333] text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                : "bg-[#f8f9fa] border-[#e5e7eb] text-black focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
            } border`}
            placeholder="E.g., Buy EURUSD on 1h timeframe when RSI is below 30 and MACD crosses above signal line. Initial capital is $1000..."
            value={languageInput}
            onChange={(e) => {
              setLanguageInput(e.target.value);
              if (inputError) setInputError(false);
              if (maliciousError) setMaliciousError("");
            }}
          />

          {inputError && (
            <span className="text-red-500 text-sm mt-1">
              Strategy description is required.
            </span>
          )}
        </label>

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={handleGenerateStrategy}
            className="h-12 px-8 rounded-xl bg-red-600 text-white font-bold tracking-wide shadow-lg shadow-red-600/30 hover:bg-red-500 hover:-translate-y-0.5 hover:shadow-red-600/40 active:translate-y-0 transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            Generate Strategy
          </button>
        </div>
      </div>
    </div>
  );
}