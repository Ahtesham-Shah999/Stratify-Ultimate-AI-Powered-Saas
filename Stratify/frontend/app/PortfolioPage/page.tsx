"use client";
import React, { useEffect, useState } from "react";
import { useTheme } from "@/context/theme-context";
import PortfolioCard from "@/app/components/portfolio/PortfolioCard/page";
import {
  getPortfoliosByUserApi,
  createPortfolioApi,
  updatePortfolioApi,
  deletePortfolioApi,
  Portfolio,
} from "@/lib/portfolioapi";

interface ModalState {
  open: boolean;
  mode: "create" | "edit";
  portfolio?: Portfolio;
}

export default function PortfolioPage() {
  const { darkMode } = useTheme();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ open: false, mode: "create" });
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPortfolios = async () => {
    try {
      const userId = localStorage.getItem("user_id") || localStorage.getItem("userId") || "";
      if (!userId) { setLoading(false); return; }
      const data = await getPortfoliosByUserApi(userId);
      setPortfolios(Array.isArray(data) ? data : []);
    } catch {
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPortfolios(); }, []);

  const openCreate = () => {
    setFormName("");
    setFormDescription("");
    setFormError("");
    setModal({ open: true, mode: "create" });
  };

  const openEdit = (portfolio: Portfolio) => {
    setFormName(portfolio.name);
    setFormDescription(portfolio.description || "");
    setFormError("");
    setModal({ open: true, mode: "edit", portfolio });
  };

  const closeModal = () => setModal({ open: false, mode: "create" });

  const handleSubmit = async () => {
    if (!formName.trim()) { setFormError("Portfolio name is required."); return; }
    setSubmitting(true);
    setFormError("");
    try {
      if (modal.mode === "create") {
        const userId = localStorage.getItem("user_id") || localStorage.getItem("userId") || "";
        const created = await createPortfolioApi({ user_id: userId, name: formName.trim(), description: formDescription.trim() });
        setPortfolios((prev) => [...prev, created]);
      } else if (modal.mode === "edit" && modal.portfolio) {
        const updated = await updatePortfolioApi(modal.portfolio._id, { name: formName.trim(), description: formDescription.trim() });
        setPortfolios((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      }
      closeModal();
    } catch (err: any) {
      setFormError(err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (portfolio_id: string) => {
    try {
      await deletePortfolioApi(portfolio_id);
      setPortfolios((prev) => prev.filter((p) => p._id !== portfolio_id));
    } catch {}
  };

  return (
    <main className={`flex-1 px-4 sm:px-8 md:px-10 py-10 min-h-screen ${
      darkMode ? "bg-black" : "bg-[#F8F5F5]"
    }`}>
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-10">
          <div className="flex flex-col gap-1">
            <p className={`text-3xl font-bold leading-tight tracking-[-0.033em] ${
              darkMode ? "text-white" : "text-black"
            }`}>
              My Portfolios
            </p>
            <p className="text-base font-normal leading-normal text-gray-400">
              Manage your crypto portfolios and track their performance.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-[#FF0000] text-white text-sm font-bold leading-normal tracking-[0.015em] gap-2 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span className="truncate">Create New Portfolio</span>
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <span className={`text-lg ${ darkMode ? "text-gray-400" : "text-gray-500" }`}>Loading portfolios...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && portfolios.length === 0 && (
          <div className={`flex flex-col items-center justify-center py-24 rounded-xl border border-dashed ${
            darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-300 bg-white"
          }`}>
            <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">account_balance_wallet</span>
            <p className={`text-xl font-semibold mb-2 ${ darkMode ? "text-white" : "text-gray-800" }`}>
              No Portfolios Yet
            </p>
            <p className="text-gray-400 mb-6 text-sm text-center max-w-xs">
              You haven&apos;t created any portfolios. Create one to start tracking your strategies.
            </p>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#FF0000] text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              Create New Portfolio
            </button>
          </div>
        )}

        {/* Portfolio Cards Grid */}
        {!loading && portfolios.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {portfolios.map((p) => (
              <PortfolioCard
                key={p._id}
                portfolio={p}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 mx-4 ${
            darkMode ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-200"
          }`}>
            <div className="flex justify-between items-center mb-5">
              <h2 className={`text-xl font-bold ${ darkMode ? "text-white" : "text-black" }`}>
                {modal.mode === "create" ? "Create New Portfolio" : "Edit Portfolio"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-200 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {formError && (
              <div className="mb-4 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                {formError}
              </div>
            )}

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1.5 ${ darkMode ? "text-gray-300" : "text-gray-700" }`}>
                Portfolio Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Aggressive Growth"
                className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF0000]/50 ${
                  darkMode
                    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                    : "bg-gray-50 border-gray-300 text-black placeholder-gray-400"
                }`}
              />
            </div>

            <div className="mb-6">
              <label className={`block text-sm font-medium mb-1.5 ${ darkMode ? "text-gray-300" : "text-gray-700" }`}>
                Description
              </label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe your portfolio strategy..."
                className={`w-full px-4 py-2.5 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF0000]/50 ${
                  darkMode
                    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                    : "bg-gray-50 border-gray-300 text-black placeholder-gray-400"
                }`}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeModal}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-[#FF0000] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? "Saving..." : modal.mode === "create" ? "Create" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
