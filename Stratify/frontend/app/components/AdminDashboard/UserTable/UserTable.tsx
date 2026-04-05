// components/UserTable.jsx
"use client";
import React, { useState } from "react";
import { useTheme } from "@/context/theme-context";

const PAGE_SIZE = 8;

export default function UserTable({
  users = [],
  onDelete,
}: {
  users: any[];
  onDelete?: (id: string) => void;
}) {
  const { darkMode } = useTheme();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const paginated  = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* reset to page 1 if users list shrinks (e.g. after delete) */
  React.useEffect(() => {
    if (page > Math.max(1, Math.ceil(users.length / PAGE_SIZE))) {
      setPage(1);
    }
  }, [users.length]);

  const start = users.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end   = Math.min(page * PAGE_SIZE, users.length);

  return (
    <div className={`rounded-xl border overflow-hidden
      ${darkMode ? "bg-[#111] border-[#1f1f1f]" : "bg-white border-gray-200"}`}>

      {/* Table header bar */}
      <div className={`px-6 py-4 border-b flex items-center justify-between
        ${darkMode ? "border-[#1f1f1f]" : "border-gray-100"}`}>
        <div>
          <h2 className={`text-base font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Registered Users
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {users.length} non-admin {users.length === 1 ? "user" : "users"} on the platform
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className={`w-full text-left ${darkMode ? "text-gray-300" : "text-gray-800"}`}>
          <thead className={darkMode
            ? "bg-[#161616] border-b border-[#1f1f1f]"
            : "bg-gray-50 border-b border-gray-200"}>
            <tr>
              <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider">User</th>
              <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider">Role</th>
              <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider">Status</th>
              <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider">Last Active</th>
              <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={darkMode ? "divide-y divide-[#1a1a1a]" : "divide-y divide-gray-100"}>
            {paginated.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500 text-sm">
                  No users found.
                </td>
              </tr>
            )}
            {paginated.map((u, idx) => (
              <tr
                key={u._id ?? idx}
                className={`transition-colors duration-150
                  ${darkMode ? "hover:bg-[#181818]" : "hover:bg-gray-50"}`}
              >
                {/* Avatar + name */}
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full bg-cover bg-center border border-gray-700 flex-shrink-0"
                      style={{
                        backgroundImage: u.profile_pic
                          ? u.profile_pic.startsWith("http")
                            ? `url('${u.profile_pic}')`
                            : `url('http://localhost:4000${u.profile_pic}')`
                          : "url('https://ui-avatars.com/api/?name=" +
                            encodeURIComponent(u.username ?? "U") +
                            "&background=222&color=fff')",
                      }}
                    />
                    <div>
                      <span className={`font-medium text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {u.username}
                      </span>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="px-4 py-3 align-middle">
                  <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full
                    ${darkMode ? "bg-gray-800 text-gray-400 border border-gray-700" : "bg-gray-100 text-gray-600"}`}>
                    {u.role}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3 align-middle">
                  <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full
                    ${darkMode ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700/40"
                               : "bg-green-100 text-green-800"}`}>
                    Active
                  </span>
                </td>

                {/* Last active */}
                <td className={`px-4 py-3 text-sm align-middle ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {u.last_login
                    ? new Date(u.last_login).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                      })
                    : "New"}
                </td>

                {/* Delete */}
                <td className="px-4 py-3 align-middle text-right">
                  <button
                    onClick={() => {
                      if (
                        window.confirm(`Permanently delete user "${u.username}"?`) &&
                        onDelete
                      ) {
                        onDelete(u._id);
                      }
                    }}
                    className="text-xs font-medium px-3 py-1.5 rounded-md border
                      border-red-700/40 text-red-400 hover:bg-red-500/10 hover:text-red-300
                      transition-colors duration-150"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Real Pagination ── */}
      <div className={`flex justify-between items-center px-6 py-4 border-t
        ${darkMode ? "border-[#1f1f1f]" : "border-gray-100"}`}>
        <span className="text-xs text-gray-500">
          {users.length === 0
            ? "No users"
            : `Showing ${start}–${end} of ${users.length} users`}
        </span>

        <div className="flex items-center gap-2">
          {/* Previous */}
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors
              ${page === 1
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-red-600/10 hover:border-red-500/40 hover:text-red-400"}
              ${darkMode ? "border-[#2d2d2d] text-gray-400" : "border-gray-300 text-gray-600"}`}
          >
            Previous
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`ell-${i}`} className="text-gray-500 text-xs px-1">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`w-8 h-8 text-xs rounded-md border transition-colors
                    ${page === p
                      ? "bg-red-600 border-red-600 text-white shadow-[0_0_10px_rgba(229,62,62,0.4)]"
                      : `${darkMode
                          ? "border-[#2d2d2d] text-gray-400 hover:bg-red-600/10 hover:text-red-400"
                          : "border-gray-300 text-gray-600 hover:bg-red-50"}`}`}
                >
                  {p}
                </button>
              )
            )}

          {/* Next */}
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
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
