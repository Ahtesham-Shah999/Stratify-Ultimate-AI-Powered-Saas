"use client";
import React, { useRef, useState, useEffect } from "react";
import { useTheme } from "@/context/theme-context";
import { Portfolio, PortfolioStrategy, getStrategiesByPortfolioApi } from "@/lib/portfolioapi";
import { getStrategiesByUserApi, updateStrategyApi } from "@/lib/strategyapi";
import { motion } from "framer-motion";

interface Props {
  portfolio: Portfolio;
  onEdit: (portfolio: Portfolio) => void;
  onDelete: (portfolio_id: string) => void;
}

export default function PortfolioCard({ portfolio, onEdit, onDelete }: Props) {
  const { darkMode } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const [strategies, setStrategies] = useState<PortfolioStrategy[]>([]);
  const [loadingStrategies, setLoadingStrategies] = useState(true);
  
  // Add Strategy Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableStrategies, setAvailableStrategies] = useState<any[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch strategies belonging to this portfolio
  useEffect(() => {
    getStrategiesByPortfolioApi(portfolio._id)
      .then(setStrategies)
      .catch(() => setStrategies([]))
      .finally(() => setLoadingStrategies(false));
  }, [portfolio._id]);

  // Close 3-dot menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch available (unassigned) strategies for this user
  const openAddStrategyModal = async () => {
    setIsModalOpen(true);
    setLoadingAvailable(true);
    try {
      const allUserStrategies = await getStrategiesByUserApi(portfolio.user_id);
      // Build a set of IDs already in this portfolio (from the live strategies state)
      const alreadyInPortfolio = new Set(strategies.map((s) => s._id));
      // Filter out any strategy already present in this portfolio
      const unassigned = allUserStrategies.filter(
        (s: any) => !alreadyInPortfolio.has(s._id)
      );
      setAvailableStrategies(unassigned);
    } catch (error) {
      console.error("Failed to load available strategies:", error);
    } finally {
      setLoadingAvailable(false);
    }
  };

  // Add a selected strategy to this portfolio
  const handleAddStrategy = async (strategy: any) => {
    try {
      // 1. Update backend with new portfolio_id
      await updateStrategyApi(strategy._id, { portfolio_id: portfolio._id });

      // 2. Refresh strategies list in-place (no navigation)
      const updated = await getStrategiesByPortfolioApi(portfolio._id);
      setStrategies(updated);

      // 3. Also remove it from the available list
      setAvailableStrategies((prev: any[]) => prev.filter((s: any) => s._id !== strategy._id));

      // 4. Close modal
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding strategy to portfolio:", error);
    }
  };

  // Clicking an existing strategy row — stays on the portfolio page (no navigation)
  const handleStrategyClick = (_strategy: any) => {
    // No navigation — user stays on Portfolio page
  };

  const formattedDate = portfolio.created_at
    ? new Date(portfolio.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const totalCapital = strategies.reduce(
    (sum, s) => sum + (s.initial_capital ?? 0),
    0
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className={`flex flex-col gap-5 rounded-xl p-6 border shadow-sm transition-shadow hover:shadow-xl ${
          darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
        }`}
      >
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          <div className="flex-grow">
            <p
              className={`text-xl font-bold leading-tight tracking-[-0.015em] ${
                darkMode ? "text-white" : "text-black"
              }`}
            >
              {portfolio.name}
            </p>
            {portfolio.description && (
              <p className="text-sm font-normal mt-1 text-gray-400 line-clamp-2">
                {portfolio.description}
              </p>
            )}
          </div>

          {/* 3-dot menu */}
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className={`flex items-center justify-center rounded-lg h-9 w-9 transition-colors ${
                darkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-black"
              }`}
              aria-label="Portfolio options"
            >
              <span className="material-symbols-outlined text-xl">more_vert</span>
            </button>

            {menuOpen && (
              <div
                className={`absolute right-0 mt-1 w-36 rounded-xl shadow-lg border z-30 overflow-hidden ${
                  darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                }`}
              >
                <button
                  onClick={() => { setMenuOpen(false); onEdit(portfolio); }}
                  className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors ${
                    darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                  Edit
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(portfolio._id); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className={`flex flex-wrap gap-6 border-t border-b py-4 ${darkMode ? "border-white/10" : "border-gray-100"}`}>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Created</p>
            <p className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              {formattedDate}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Strategies</p>
            <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-black"}`}>
              {loadingStrategies ? "…" : strategies.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Capital</p>
            <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-black"}`}>
              {loadingStrategies ? "…" : `$${totalCapital.toLocaleString()}`}
            </p>
          </div>
        </div>

        {/* ── Strategies List ── */}
        <div>
          <h3 className={`text-sm font-semibold mb-3 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Strategies in this Portfolio
          </h3>

          {loadingStrategies ? (
            <p className="text-xs text-gray-500">Loading strategies…</p>
          ) : strategies.length === 0 ? (
            <div className={`flex items-center gap-2 rounded-lg px-4 py-3 border border-dashed ${
              darkMode ? "border-gray-700 text-gray-500" : "border-gray-300 text-gray-400"
            }`}>
              <span className="material-symbols-outlined text-base">info</span>
              <span className="text-xs">No strategies added yet</span>
            </div>
          ) : (
            <div className="space-y-2">
              {strategies.map((s) => (
                <motion.button
                  key={s._id}
                  onClick={() => handleStrategyClick(s)}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className={`w-full text-left flex items-center justify-between gap-3 rounded-lg px-4 py-3 cursor-pointer shadow-sm border transition-colors ${
                    darkMode ? "bg-[#1f1f1f] border-[#2d2d2d] hover:border-[#f90606]" : "bg-gray-50 border-gray-200 hover:border-[#f90606]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center rounded-lg shrink-0 size-8 bg-[#f90606]/10">
                      <span className="material-symbols-outlined text-sm text-[#f90606]">show_chart</span>
                    </div>
                    <div>
                      <p className={`text-sm font-medium line-clamp-1 group-hover:text-[#f90606] transition-colors ${darkMode ? "text-white" : "text-black"}`}>
                        {s.name}
                      </p>
                      <p className="text-xs text-gray-500">{s.engine_type ?? "BACKTEST"}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-black"}`}>
                      ${(s.initial_capital ?? 0).toLocaleString()}
                    </p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm uppercase tracking-wide mt-1 inline-block ${
                      s.visibility === "PUBLIC"
                        ? "bg-green-500/10 text-green-500 border border-green-500/20"
                        : darkMode ? "bg-white/10 text-gray-400 border border-white/10" : "bg-black/5 text-gray-500 border border-black/5"
                    }`}>
                      {s.visibility ?? "PRIVATE"}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer Actions ── */}
        <div className="flex items-center gap-3 mt-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openAddStrategyModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F90606] text-white text-sm font-bold tracking-wide shadow-lg shadow-red-500/20"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Strategy
          </motion.button>
          
          <div className="flex-1" /> {/* Spacer */}
        </div>
      </motion.div>

      {/* ── Add Strategy Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${
              darkMode ? "bg-[#1a1a1a] text-white" : "bg-white text-black"
            }`}
          >
            {/* Modal Header */}
            <div className={`px-6 py-4 flex items-center justify-between border-b ${darkMode ? "border-[#2d2d2d]" : "border-gray-100"}`}>
              <h2 className="text-lg font-bold">Add Strategy to Portfolio</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-1.5 rounded-full transition-colors ${
                  darkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                }`}
              >
                <span className="material-symbols-outlined text-xl block">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {loadingAvailable ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f90606]"></div>
                </div>
              ) : availableStrategies.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-5xl text-gray-400 mb-3">list_alt</span>
                  <p className={`text-base font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    No available strategies
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    You don't have any unassigned strategies left.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {availableStrategies.map((strategy) => (
                    <button
                      key={strategy._id}
                      onClick={() => handleAddStrategy(strategy)}
                      className={`w-full flex items-center justify-between gap-4 p-4 rounded-xl text-left border transition-all ${
                        darkMode 
                          ? "border-[#2d2d2d] bg-[#222] hover:border-[#f90606] hover:bg-[#2a2a2a]" 
                          : "border-gray-200 bg-gray-50 hover:border-[#f90606] hover:shadow-sm"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{strategy.name}</p>
                        <p className={`text-xs mt-1 truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {strategy.language_input ?? "No description"}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-[#f90606]">arrow_forward</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className={`px-6 py-4 flex justify-end border-t ${darkMode ? "border-[#2d2d2d] bg-[#111]" : "border-gray-100 bg-gray-50"}`}>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  darkMode ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-200 text-gray-600"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
