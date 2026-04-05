"use client";
import React, { useState } from "react";
import { useTheme } from "@/context/theme-context";

const ACTION_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  DELETE:  { bg: "bg-red-900/40 border-red-700/40",     text: "text-red-300",     icon: "person_remove" },
  LOGIN:   { bg: "bg-blue-900/40 border-blue-700/40",   text: "text-blue-300",    icon: "login" },
  REGISTER:{ bg: "bg-emerald-900/40 border-emerald-700/40", text: "text-emerald-300", icon: "person_add" },
};

const PAGE_SIZE = 10;

export default function LogsTable({ logs = [] }: { logs: any[] }) {
  const { darkMode } = useTheme();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const paginated  = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const th = "py-3 px-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap";
  const td = "px-4 py-3 align-middle text-sm";

  const getActionStyle = (action: string) =>
    ACTION_STYLES[action] ?? { bg: "bg-gray-800/60 border-gray-700/40", text: "text-gray-400", icon: "info" };

  return (
    <div className={`rounded-xl border overflow-hidden
      ${darkMode ? "bg-[#111] border-[#1f1f1f]" : "bg-white border-gray-200"}`}>

      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center justify-between
        ${darkMode ? "border-[#1f1f1f]" : "border-gray-100"}`}>
        <div>
          <h2 className={`text-base font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Audit Logs
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Complete system event trail — {logs.length} records
          </p>
        </div>
        <div className="text-xs text-gray-500">
          Page {page} of {totalPages}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className={`w-full text-left ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          <thead className={darkMode ? "bg-[#161616] border-b border-[#1f1f1f]" : "bg-gray-50 border-b border-gray-200"}>
            <tr>
              <th className={th}>Action</th>
              <th className={th}>User</th>
              <th className={th}>Target</th>
              <th className={th}>Details</th>
              <th className={th}>Timestamp</th>
            </tr>
          </thead>
          <tbody className={darkMode ? "divide-y divide-[#1a1a1a]" : "divide-y divide-gray-100"}>
            {paginated.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500 text-sm">
                  No audit logs recorded yet.
                </td>
              </tr>
            )}
            {paginated.map((log, idx) => {
              const style = getActionStyle(log.action);
              return (
                <tr
                  key={log._id ?? idx}
                  className={`transition-colors duration-150
                    ${darkMode ? "hover:bg-[#181818]" : "hover:bg-gray-50"}`}
                >
                  {/* Action badge */}
                  <td className={td}>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1
                      text-xs font-semibold rounded-full border ${style.bg} ${style.text}`}>
                      <span className="material-symbols-outlined text-sm leading-none">
                        {style.icon}
                      </span>
                      {log.action}
                    </span>
                  </td>

                  {/* User */}
                  <td className={td}>
                    {log.user_id ? (
                      <div>
                        <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                          {log.user_id.username}
                        </p>
                        <p className="text-xs text-gray-500">{log.user_id.email}</p>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs italic">System</span>
                    )}
                  </td>

                  {/* Target */}
                  <td className={`${td} text-gray-500`}>
                    {log.target ?? "—"}
                  </td>

                  {/* Details */}
                  <td className={`${td} max-w-xs`}>
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"} truncate`}>
                      {log.details}
                    </p>
                  </td>

                  {/* Timestamp */}
                  <td className={`${td} text-gray-500 whitespace-nowrap text-xs`}>
                    {log.timestamp
                      ? new Date(log.timestamp).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className={`flex justify-between items-center px-6 py-4 border-t
        ${darkMode ? "border-[#1f1f1f]" : "border-gray-100"}`}>
        <span className="text-xs text-gray-500">
          Showing {Math.min((page - 1) * PAGE_SIZE + 1, logs.length)}–
          {Math.min(page * PAGE_SIZE, logs.length)} of {logs.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors
              ${page === 1
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-red-600/10 hover:border-red-500/40 hover:text-red-400"}
              ${darkMode ? "border-[#2d2d2d] text-gray-400" : "border-gray-300 text-gray-600"}`}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className="text-gray-500 text-xs px-1">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`w-8 h-8 text-xs rounded-md border transition-colors
                    ${page === p
                      ? "bg-red-600 border-red-600 text-white"
                      : `${darkMode
                          ? "border-[#2d2d2d] text-gray-400 hover:bg-red-600/10 hover:text-red-400"
                          : "border-gray-300 text-gray-600 hover:bg-red-50"}`}`}
                >
                  {p}
                </button>
              )
            )}

          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors
              ${page === totalPages
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-red-600/10 hover:border-red-500/40 hover:text-red-400"}
              ${darkMode ? "border-[#2d2d2d] text-gray-400" : "border-gray-300 text-gray-600"}`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
