"use client";
import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@/context/theme-context";

const LS_KEY = "admin_notif_seen_at";

const ACTION_ICON: Record<string, string> = {
  DELETE:   "person_remove",
  LOGIN:    "login",
  REGISTER: "person_add",
};
const ACTION_COLOR: Record<string, string> = {
  DELETE:   "text-red-400",
  LOGIN:    "text-blue-400",
  REGISTER: "text-emerald-400",
};

export default function Header({
  title,
  subtitle,
  logs = [],
}: {
  title?: string;
  subtitle?: string;
  logs?: any[];
}) {
  const { darkMode } = useTheme();

  /* ── admin identity from localStorage ── */
  const [adminUser, setAdminUser] = useState<{
    username: string;
    profile_pic?: string;
    role?: string;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("userData");
      if (raw) setAdminUser(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const resolveAvatar = (pic?: string) => {
    if (!pic) return null;
    return pic.startsWith("http") ? pic : `http://localhost:4000${pic}`;
  };

  const avatarSrc   = resolveAvatar(adminUser?.profile_pic);
  const displayName = adminUser?.username ?? "Administrator";
  const roleLabel   = adminUser?.role ?? "ADMIN";

  /* ── notification state ── */
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(LS_KEY) ?? "0", 10); }
    catch { return 0; }
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* unseen = logs newer than the last-seen timestamp */
  const unseenLogs = logs.filter(
    (l) => l.timestamp && new Date(l.timestamp).getTime() > seenAt
  );
  const unseenCount = unseenLogs.length;

  /* mark all as seen when dropdown opens */
  const handleBellClick = () => {
    const next = !open;
    setOpen(next);
    if (next && unseenCount > 0) {
      const now = Date.now();
      setSeenAt(now);
      try { localStorage.setItem(LS_KEY, String(now)); } catch { }
    }
  };

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* latest 6 logs to show in the panel (newest first) */
  const previewLogs = [...logs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  return (
    <>
      <style>{`
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)  scale(1);    }
        }
        .notif-dropdown { animation: notifSlideIn 0.18s ease both; }
      `}</style>

      <header
        className={`flex flex-wrap justify-between items-center gap-3 pb-6 border-b
          ${darkMode
            ? "bg-[#0a0a0a] text-white border-[#1f1f1f]"
            : "bg-[#F4F6FA] text-black border-gray-200"}`}
      >
        {/* Page title */}
        <div className="flex flex-col gap-0.5">
          <p className={`text-2xl font-bold tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>
            {title}
          </p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-5">

          {/* ── Notification Bell ── */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleBellClick}
              className={`relative transition-colors duration-200
                ${darkMode
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-500 hover:text-gray-900"}`}
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-[1.5rem]">notifications</span>

              {/* badge */}
              {unseenCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center
                    rounded-full bg-red-500 text-[10px] font-bold text-white leading-none"
                  style={{ boxShadow: "0 0 8px rgba(239,68,68,0.6)" }}
                >
                  {unseenCount > 9 ? "9+" : unseenCount}
                </span>
              )}
            </button>

            {/* ── Dropdown panel ── */}
            {open && (
              <div
                className={`notif-dropdown absolute right-0 top-10 z-50 w-80 rounded-xl border shadow-2xl overflow-hidden
                  ${darkMode
                    ? "bg-[#141414] border-[#2a2a2a]"
                    : "bg-white border-gray-200"}`}
              >
                {/* panel header */}
                <div className={`px-4 py-3 border-b flex items-center justify-between
                  ${darkMode ? "border-[#222]" : "border-gray-100"}`}>
                  <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    Recent Activity
                  </p>
                  <span className="text-xs text-gray-500">
                    {logs.length} total events
                  </span>
                </div>

                {/* log rows */}
                <div className="flex flex-col divide-y divide-[#1e1e1e]">
                  {previewLogs.length === 0 && (
                    <p className="px-4 py-6 text-center text-xs text-gray-500">
                      No activity recorded yet.
                    </p>
                  )}
                  {previewLogs.map((log, i) => {
                    const icon  = ACTION_ICON[log.action]  ?? "info";
                    const color = ACTION_COLOR[log.action] ?? "text-gray-400";
                    const isNew = log.timestamp && new Date(log.timestamp).getTime() > seenAt;
                    return (
                      <div
                        key={log._id ?? i}
                        className={`flex items-start gap-3 px-4 py-3 transition-colors
                          ${darkMode ? "hover:bg-[#1a1a1a]" : "hover:bg-gray-50"}`}
                      >
                        {/* icon dot */}
                        <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                          ${darkMode ? "bg-[#222]" : "bg-gray-100"}`}>
                          <span className={`material-symbols-outlined text-sm leading-none ${color}`}>
                            {icon}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate
                            ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                            <span className="font-bold">
                              {log.user_id?.username ?? "System"}
                            </span>
                            {" — "}{log.details}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {log.timestamp
                              ? new Date(log.timestamp).toLocaleString("en-US", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })
                              : ""}
                          </p>
                        </div>

                        {/* NEW dot for unseen */}
                        {isNew && (
                          <span
                            className="mt-1.5 w-2 h-2 rounded-full bg-red-500 flex-shrink-0"
                            style={{ boxShadow: "0 0 6px rgba(239,68,68,0.7)" }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* footer */}
                <div className={`px-4 py-2.5 border-t text-center
                  ${darkMode ? "border-[#222]" : "border-gray-100"}`}>
                  <p className="text-xs text-gray-500">
                    Showing latest {previewLogs.length} of {logs.length} events
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Admin identity ── */}
          <div className="flex items-center gap-3">
            {avatarSrc ? (
              <img
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-red-500/40 flex-shrink-0"
                src={avatarSrc}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center
                  ring-2 ring-red-500/40 flex-shrink-0"
                style={{ boxShadow: "0 0 12px rgba(229,62,62,0.35)" }}
              >
                <span className="text-white text-sm font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div>
              {/* real username from localStorage */}
              <p className={`text-sm font-semibold leading-tight
                ${darkMode ? "text-white" : "text-gray-900"}`}>
                {displayName}
              </p>
              {/* role label always underneath */}
              <p className="text-xs text-gray-500 leading-tight">
                Administrator &middot; {roleLabel}
              </p>
            </div>
          </div>

        </div>
      </header>
    </>
  );
}
