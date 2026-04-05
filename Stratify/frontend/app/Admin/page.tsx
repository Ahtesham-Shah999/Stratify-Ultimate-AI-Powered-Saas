"use client";
import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "@/app/components/AdminDashboard/Sidebar/Sidebar";
import Header from "@/app/components/AdminDashboard/Header/Header";
import Cards from "@/app/components/AdminDashboard/Cards/Cards";
import UserTable from "@/app/components/AdminDashboard/UserTable/UserTable";
import StrategiesTable from "@/app/components/AdminDashboard/StrategiesTable/StrategiesTable";
import LogsTable from "@/app/components/AdminDashboard/LogsTable/LogsTable";
import { useTheme } from "@/context/theme-context";
import {
  getAllUsersApi,
  getAuditLogsApi,
  deleteUserApi,
  getAllStrategiesApi,
} from "@/lib/adminapi";

type Tab = "users" | "strategies" | "logs";

/* ─── smooth cross-fade when switching tabs ─── */
const tabTransitionStyle: React.CSSProperties = {
  animation: "adminTabFade 0.22s ease both",
};

export default function AdminPage() {
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("users");

  const [users,      setUsers]      = useState<any[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [auditLogs,  setAuditLogs]  = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);

  /* ── fetch everything once on mount ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedUsers, fetchedStrategies, fetchedLogs] = await Promise.all([
        getAllUsersApi(),
        getAllStrategiesApi(),
        getAuditLogsApi(),
      ]);
      setUsers(fetchedUsers);
      setStrategies(fetchedStrategies);
      setAuditLogs(fetchedLogs);
    } catch (e) {
      console.error("Admin fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── filter out ADMIN accounts from the user table ── */
  const nonAdminUsers = users.filter((u) => u.role !== "ADMIN");

  /* ── KPI cards at the top ── */
  const cardsData = [
    {
      id: "users",
      title: "Total Users",
      value: nonAdminUsers.length.toString(),
      icon: "group",
    },
    {
      id: "strategies",
      title: "Total Strategies",
      value: strategies.length.toString(),
      icon: "monitoring",
    },
    {
      id: "logs",
      title: "Audit Events",
      value: auditLogs.length.toString(),
      icon: "list_alt",
    },
  ];

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUserApi(id);
      await fetchAll();
    } catch (e) {
      alert("Failed to delete user: " + e);
    }
  };

  /* ── content pane switched by activeTab ── */
  const renderContent = () => {
    switch (activeTab) {
      case "users":
        return (
          <div key="users" style={tabTransitionStyle}>
            <UserTable users={nonAdminUsers} onDelete={handleDeleteUser} />
          </div>
        );
      case "strategies":
        return (
          <div key="strategies" style={tabTransitionStyle}>
            <StrategiesTable strategies={strategies} />
          </div>
        );
      case "logs":
        return (
          <div key="logs" style={tabTransitionStyle}>
            <LogsTable logs={auditLogs} />
          </div>
        );
    }
  };

  /* ── tab section titles ── */
  const tabMeta: Record<Tab, { title: string; subtitle: string }> = {
    users:      { title: "User Management",   subtitle: "Manage all registered users" },
    strategies: { title: "Global Strategies", subtitle: "Overview of all user-created strategies" },
    logs:       { title: "Audit Logs",        subtitle: "Full system event trail" },
  };

  return (
    <>
      {/* keyframe injected once */}
      <style>{`
        @keyframes adminTabFade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>

      <div
        className={`min-h-screen flex font-display
          ${darkMode ? "bg-[#0a0a0a] text-gray-300" : "bg-[#F4F6FA] text-gray-900"}`}
      >
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
          <div className="p-8 flex flex-col gap-8">

            {/* Header */}
            <Header
              title="Admin Dashboard"
              subtitle="System Overview & Controls"
              logs={auditLogs}
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Cards items={cardsData} />
            </div>

            {/* Tab section label */}
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  {tabMeta[activeTab].title}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {tabMeta[activeTab].subtitle}
                </p>
              </div>

              {/* Subtle refresh pill */}
              <button
                onClick={fetchAll}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border
                  transition-colors duration-200
                  ${darkMode
                    ? "border-[#2d2d2d] text-gray-500 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/5"
                    : "border-gray-300 text-gray-500 hover:text-red-500 hover:border-red-300"}`}
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Refresh
              </button>
            </div>

            {/* Main content area with loading skeleton */}
            {loading ? (
              <div
                className={`rounded-xl border p-12 flex items-center justify-center gap-3
                  ${darkMode ? "bg-[#111] border-[#1f1f1f]" : "bg-white border-gray-200"}`}
              >
                <span
                  className="material-symbols-outlined text-red-500 animate-spin"
                  style={{ fontSize: "2rem" }}
                >
                  progress_activity
                </span>
                <p className="text-sm text-gray-500">Loading data…</p>
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </main>
      </div>
    </>
  );
}
