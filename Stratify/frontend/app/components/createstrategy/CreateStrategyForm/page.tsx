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
        setMaliciousError("⚠ Enter a valid trading strategy.");
        return;
      }

      // ✅ Store valid strategy
      const store = useStrategyStore.getState();
      store.setParsed(response.parsed_strategy);
      store.setValidated(response.validated_strategy);
      store.normalizeForUI();

      router.push("/editcreatestrategy");
    } catch (error) {
      console.error(error);
      setMaliciousError("⚠ Please Enter a valid strategy!");
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
          <div className="p-4 rounded-lg bg-red-100 border border-red-400 text-red-700 font-medium">
            {maliciousError}
          </div>
        )}

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
            className={`flex w-full min-h-36 p-4 rounded-lg outline-none ${
              inputError
                ? "border-red-500"
                : darkMode
                ? "bg-black border-[#2d2d2d] text-white"
                : "bg-[#f8f5f5] border-[#e5e7eb] text-black"
            } border`}
            placeholder="Describe your trading logic here..."
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

        {/* Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleGenerateStrategy}
            className="h-12 px-6 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700"
          >
            Generate Strategy
          </button>
        </div>
      </div>
    </div>
  );
}