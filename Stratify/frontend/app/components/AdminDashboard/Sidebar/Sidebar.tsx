"use client";
import React from "react";
import { useTheme } from "@/context/theme-context";
import { useRouter } from "next/navigation";

type Tab = "users" | "strategies" | "logs";

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const navItems: { tab: Tab; icon: string; label: string }[] = [
  { tab: "users",      icon: "group",       label: "Users" },
  { tab: "strategies", icon: "monitoring",  label: "Strategies" },
  { tab: "logs",       icon: "list_alt",    label: "Logs" },
];

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { darkMode } = useTheme();
  const router = useRouter();

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      localStorage.removeItem("user_id");
      localStorage.removeItem("admin_notif_seen_at");
    } catch { }
    router.push("/login");
  };

  return (
    <aside
      className={`w-64 flex-shrink-0 flex flex-col h-screen sticky top-0
        ${darkMode ? "bg-[#0d0d0d] border-[#1f1f1f]" : "bg-white border-gray-200"}
        border-r`}
    >
      <style>{`
        .sidebar-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .sidebar-item .accent-bar {
          position: absolute;
          left: 0;
          top: 20%;
          height: 60%;
          width: 3px;
          border-radius: 0 4px 4px 0;
          transition: opacity 0.3s ease;
          background: var(--sidebar-accent, #e53e3e);
          opacity: 0;
        }
        .sidebar-item.active .accent-bar {
          opacity: 1;
        }
        .sidebar-item.active {
          background: rgba(229, 62, 62, 0.1);
          color: #e53e3e;
          box-shadow: 0 0 18px rgba(229, 62, 62, 0.18);
        }
        .sidebar-item:not(.active):hover {
          background: rgba(229, 62, 62, 0.05);
          color: #e53e3e;
        }
        .sidebar-icon {
          transition: transform 0.2s ease;
          font-size: 1.25rem;
        }
        .sidebar-item:hover .sidebar-icon {
          transform: scale(1.15);
        }
      `}</style>

      <div className="flex flex-col justify-between h-full p-4">
        {/* Brand */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 px-2 pt-2 pb-4 border-b border-[#1f1f1f]">
            <div
              className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: "0 0 14px rgba(229,62,62,0.4)" }}
            >
              <span className="material-symbols-outlined text-white text-base">
                shield_person
              </span>
            </div>
            <div>
              <h1
                className={`text-sm font-bold tracking-wide ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Stratify
              </h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1">
            <p
              className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1"
              style={{ color: "#555" }}
            >
              Navigation
            </p>
            {navItems.map(({ tab, icon, label }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`sidebar-item ${activeTab === tab ? "active" : ""} ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                <div className="accent-bar" />
                <span className={`material-symbols-outlined sidebar-icon`}>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom */}
        <div
          className={`flex flex-col gap-1 pt-4 border-t ${
            darkMode ? "border-[#1f1f1f]" : "border-gray-200"
          }`}
        >
          <button
            className={`sidebar-item w-full text-left ${
              darkMode ? "text-red-500/70 hover:text-red-400" : "text-red-500 hover:text-red-600"
            }`}
            onClick={handleLogout}
          >
            <span className="material-symbols-outlined sidebar-icon">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
