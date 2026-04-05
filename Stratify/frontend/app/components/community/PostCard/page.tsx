"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/theme-context";
import { votePost } from "@/lib/post";

interface PostCardPost {
  _id: string;
  user: { name: string; avatar: string; id: string };
  time: string;
  title: string;
  body: string;
  upvotes: number;
  downvotes: number;
  upvoted_by: string[];
  downvoted_by: string[];
  net_score: number;
  backtest_metrics?: {
    total_profit?: number | null;
    initial_capital?: number | null;
    win_rate?: number | null;
    sharpe_ratio?: number | null;
    max_drawdown?: number | null;
    trades_count?: number | null;
    timeframe?: string | null;
  } | null;
}

interface Props {
  post: PostCardPost;
  onVoteUpdate?: (postId: string, upvotes: number, downvotes: number, net_score: number) => void;
}

const FALLBACK_AVATAR =
  "https://ui-avatars.com/api/?background=f90606&color=fff&bold=true&name=";

export default function PostCard({ post, onVoteUpdate }: Props) {
  const { darkMode } = useTheme();

  // Colours
  const bg           = darkMode ? "#0F0F0F" : "#FFFFFF";
  const border       = darkMode ? "#2d2d2d" : "#E5E7EB";
  const textPrimary  = darkMode ? "#FFFFFF" : "#000000";
  const textSecondary = darkMode ? "#A3A3A3" : "#6B7280";
  const metricsBg    = darkMode ? "#1a1a1a" : "#fafafa";
  const metricsBdr   = darkMode ? "#2d2d2d" : "#e5e7eb";

  // ── Vote state ────────────────────────────────────────────────────────────
  const [upvotes,   setUpvotes]   = useState(post.upvotes   ?? 0);
  const [downvotes, setDownvotes] = useState(post.downvotes ?? 0);
  const [netScore,  setNetScore]  = useState(post.net_score ?? 0);
  const [userVote,  setUserVote]  = useState<"up" | "down" | null>(null);
  const [voting,    setVoting]    = useState(false);

  // Determine initial vote state for current user
  useEffect(() => {
    const rawUser = typeof window !== "undefined" ? localStorage.getItem("userData") : null;
    if (!rawUser) return;
    try {
      const user = JSON.parse(rawUser);
      const uid = user._id ?? user.id;
      if (post.upvoted_by?.includes(uid))   setUserVote("up");
      if (post.downvoted_by?.includes(uid)) setUserVote("down");
    } catch { /* noop */ }
  }, [post.upvoted_by, post.downvoted_by]);

  const handleVote = async (vote: "up" | "down") => {
    if (voting) return;
    const rawUser = typeof window !== "undefined" ? localStorage.getItem("userData") : null;
    if (!rawUser) return;
    const user = JSON.parse(rawUser);
    const uid = user._id ?? user.id;

    setVoting(true);
    try {
      const res = await votePost(post._id, uid, vote);
      setUpvotes(res.upvotes);
      setDownvotes(res.downvotes);
      setNetScore(res.net_score);
      // Toggle logic for local display
      setUserVote((prev) => (prev === vote ? null : vote));
      onVoteUpdate?.(post._id, res.upvotes, res.downvotes, res.net_score);
    } catch { /* noop */ } finally {
      setVoting(false);
    }
  };

  // ── Backtest metrics ───────────────────────────────────────────────────────
  const m = post.backtest_metrics;
  const hasMetrics = m && Object.values(m).some((v) => v !== null && v !== undefined);

  // Score colour
  const scoreColor =
    netScore > 0
      ? darkMode ? "#4ade80" : "#16a34a"
      : netScore < 0
      ? "#f90606"
      : textSecondary;

  return (
    <div
      className="flex gap-3 rounded-xl p-5 transition-all duration-300 hover:shadow-xl"
      style={{ backgroundColor: bg, border: `1px solid ${border}` }}
    >
      {/* ── Reddit-style vote column ─────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-1 pt-1 select-none" style={{ minWidth: 36 }}>
        {/* Upvote */}
        <button
          onClick={() => handleVote("up")}
          disabled={voting}
          title="Upvote"
          className="flex items-center justify-center w-8 h-8 rounded-md transition-all"
          style={{
            color: userVote === "up" ? "#f90606" : textSecondary,
            backgroundColor: userVote === "up"
              ? darkMode ? "rgba(249,6,6,0.12)" : "rgba(249,6,6,0.08)"
              : "transparent",
          }}
          onMouseEnter={(e) => { if (userVote !== "up") e.currentTarget.style.color = "#f90606"; }}
          onMouseLeave={(e) => { if (userVote !== "up") e.currentTarget.style.color = textSecondary; }}
        >
          <span className="material-symbols-outlined text-xl leading-none">arrow_upward</span>
        </button>

        {/* Net score */}
        <span
          className="text-sm font-black tabular-nums"
          style={{ color: scoreColor }}
        >
          {netScore > 0 ? `+${netScore}` : netScore}
        </span>

        {/* Downvote */}
        <button
          onClick={() => handleVote("down")}
          disabled={voting}
          title="Downvote"
          className="flex items-center justify-center w-8 h-8 rounded-md transition-all"
          style={{
            color: userVote === "down" ? "#60a5fa" : textSecondary,
            backgroundColor: userVote === "down"
              ? darkMode ? "rgba(96,165,250,0.12)" : "rgba(96,165,250,0.08)"
              : "transparent",
          }}
          onMouseEnter={(e) => { if (userVote !== "down") e.currentTarget.style.color = "#60a5fa"; }}
          onMouseLeave={(e) => { if (userVote !== "down") e.currentTarget.style.color = textSecondary; }}
        >
          <span className="material-symbols-outlined text-xl leading-none">arrow_downward</span>
        </button>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 flex-1 min-w-0">

        {/* User info */}
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          {post.user.avatar ? (
            <div
              className={`h-9 w-9 rounded-full bg-cover bg-center shrink-0 ring-2 ${darkMode ? "ring-[#2d2d2d]" : "ring-[#e5e7eb]"}`}
              style={{
                backgroundImage: `url(${post.user.avatar})`,
              }}
            />
          ) : (
            <img
              src={`${FALLBACK_AVATAR}${encodeURIComponent(post.user.name)}`}
              alt={post.user.name}
              className="h-9 w-9 rounded-full shrink-0"
            />
          )}
          <div>
            <p className="font-bold text-sm" style={{ color: textPrimary }}>
              {post.user.name}
            </p>
            <p className="text-xs" style={{ color: textSecondary }}>
              {post.time}
            </p>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-extrabold tracking-tight leading-snug" style={{ color: textPrimary }}>
          {post.title}
        </h3>

        {/* Body */}
        <p className="text-sm line-clamp-3 leading-relaxed" style={{ color: textSecondary }}>
          {post.body}
        </p>

        {/* ── Backtest metrics panel ─────────────────────────────────────── */}
        {hasMetrics && (
          <div
            className="rounded-lg border p-3 grid grid-cols-2 sm:grid-cols-4 gap-3"
            style={{ backgroundColor: metricsBg, borderColor: metricsBdr }}
          >
            {[
              {
                label: "Total Profit",
                value:
                  m!.total_profit != null
                    ? `${m!.total_profit >= 0 ? "+" : ""}$${Math.abs(m!.total_profit).toFixed(2)}`
                    : "—",
                color: (m!.total_profit ?? 0) >= 0 ? "#4ade80" : "#f90606",
                icon: "trending_up",
              },
              {
                label: "Initial Capital",
                value:
                  m!.initial_capital != null
                    ? `$${Number(m!.initial_capital).toLocaleString()}`
                    : "—",
                color: darkMode ? "#a3a3a3" : "#6b7280",
                icon: "payments",
              },
              {
                label: "Win Rate",
                value:
                  m!.win_rate != null
                    ? `${(m!.win_rate * 100).toFixed(1)}%`
                    : "—",
                color: "#60a5fa",
                icon: "percent",
              },
              {
                label: "Sharpe Ratio",
                value: m!.sharpe_ratio != null ? m!.sharpe_ratio.toFixed(3) : "—",
                color: "#a78bfa",
                icon: "analytics",
              },
            ].map((metric) => (
              <div key={metric.label} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]" style={{ color: metric.color }}>
                    {metric.icon}
                  </span>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: textSecondary }}>
                    {metric.label}
                  </p>
                </div>
                <p className="text-sm font-bold" style={{ color: metric.color }}>
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Vote counts row */}
        <div className="flex items-center gap-4 text-xs" style={{ color: textSecondary }}>
          <span>{upvotes} upvote{upvotes !== 1 ? "s" : ""}</span>
          <span>·</span>
          <span>{downvotes} downvote{downvotes !== 1 ? "s" : ""}</span>
          {m?.timeframe && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">schedule</span>
                {m.timeframe}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
