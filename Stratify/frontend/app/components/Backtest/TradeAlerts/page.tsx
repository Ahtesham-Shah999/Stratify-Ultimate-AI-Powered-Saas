"use client";
import React from "react";
import { useTheme } from "@/context/theme-context";
import { useAlertStore } from "@/app/store/alertStore";

export default function TradeAlerts() {
  const { darkMode } = useTheme();
  // Get global alerts from store
  const { alerts, notificationsEnabled } = useAlertStore();

  return (
    <div
      className={`rounded-xl border p-6 ${
        darkMode
          ? "border-white/20 bg-[#1a1a1a] text-gray-200"
          : "border-[#F8F5F5] border-b border-solid border-2 bg-white"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Trade Alerts</h3>
        {!notificationsEnabled && (
          <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-500 font-medium border border-red-500/20 shadow-sm flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">notifications_off</span>
            MUTED
          </span>
        )}
      </div>

      <div className="max-h-48 overflow-y-auto space-y-3 pr-2 text-sm">
        {!notificationsEnabled ? (
          <p className="text-sm text-gray-500 italic">Alerts are currently disabled.</p>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No alerts yet.</p>
        ) : (
          alerts.map((a: any, i: number) => (
            <div key={i} className="flex items-start gap-3">
              <span
                className={`material-symbols-outlined mt-0.5 text-base ${
                  a.type === "buy" ? "text-green-500" : "text-red-500"
                }`}
              >
                {a.type === "buy" ? "arrow_upward" : "arrow_downward"}
              </span>

              <div>
                <p
                  className={`font-semibold ${
                    a.type === "buy" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {a.text}
                </p>
                <p
                  className={`text-xs ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {a.time}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
