"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/context/theme-context";
import { useRouter } from "next/navigation";
import { getStrategiesByUserApi } from "@/lib/strategyapi";
import { useStrategyStore } from "@/app/store/strategyStore";
import { jwtDecode } from "jwt-decode";

const MyStrategies = () => {
  const { darkMode } = useTheme();
  const router = useRouter();
  const { setParsed, setStrategyDbId, normalizeForUI } = useStrategyStore();

  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchStrategies = async () => {
    try {
      if (typeof window === "undefined") return;

      const storedUser = localStorage.getItem("userData");
      console.log("Stored userData:", storedUser);

      if (!storedUser) {
        console.warn("No userData found in localStorage");
        return;
      }

      const user = JSON.parse(storedUser);

      if (!user?.id) {
        console.warn("User ID missing");
        return;
      }

      const strategies = await getStrategiesByUserApi(user.id);
      setStrategies(strategies || []);

    } catch (error) {
      console.error("Failed to fetch strategies", error);
    } finally {
      setLoading(false);
    }
  };

  fetchStrategies();
}, []);

  const handleEdit = (strategy: any) => {
    setStrategyDbId(strategy._id);

    setParsed({
      name: strategy.name,
      description: strategy.description,
      generated_rules: strategy.generated_rules ?? {},
      initial_capital: strategy.initial_capital,
      meta: {
        timeframe: strategy.generated_rules?.timeframe || "1h",
        symbols: strategy.generated_rules?.pair
          ? [strategy.generated_rules.pair]
          : [],
      },
      language_input: strategy.language_input ?? strategy.name,
    });

    normalizeForUI();

    const store = useStrategyStore.getState();
    store.setUI({
      ...store.ui,
      visibility: strategy.visibility ?? "PRIVATE",
    });

    router.push("/editcreatestrategy");
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Backtesting":
        return "bg-[#462D16] text-[#FDE047]";
      case "Inactive":
        return "bg-[#292E36] text-[#BDC1C7]";
      case "Active":
      default:
        return "bg-green-900/50 text-green-300";
    }
  };

  return (
    <div
      className={`rounded-xl shadow-lg p-6 border ${
        darkMode
          ? "bg-[#1a1a1a] border-[#2d2d2d]"
          : "bg-[#ffffff] border-[#e5e7eb]"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2
          className={`${
            darkMode ? "text-white" : "text-gray-900"
          } text-xl font-bold`}
        >
          My Strategies
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-6 text-sm text-gray-500">
          Loading strategies...
        </div>
      ) : strategies.length === 0 ? (
        <div className="text-center py-6 text-sm text-gray-500">
          No strategies found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-border-dark">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">
                  Strategy Name
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">
                  Last Updated
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-dark">
              {strategies.map((strategy) => (
                <tr key={strategy._id}>
                  <td
                    className={`${
                      darkMode ? "text-white" : "text-gray-900"
                    } px-4 py-4 text-sm font-medium`}
                  >
                    {strategy.name}
                  </td>

                  <td
                    className={`${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    } px-4 py-4 text-sm`}
                  >
                    {strategy.visibility || "PRIVATE"}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(
                        "Active"
                      )}`}
                    >
                      Active
                    </span>
                  </td>

                  <td
                    className={`${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    } px-4 py-4 text-sm`}
                  >
                    {new Date(
                      strategy.updated_at || strategy.created_at
                    ).toLocaleDateString()}
                  </td>

                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => handleEdit(strategy)}
                      className="text-xs font-bold px-3 py-1.5 bg-[#f90606] text-white hover:opacity-70 rounded-md transition-opacity"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyStrategies;