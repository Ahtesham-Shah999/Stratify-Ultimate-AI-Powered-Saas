"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useTheme } from "@/context/theme-context";
import { AnimatePresence, motion } from "framer-motion";
import FilterTabs from "@/app/components/community/FilterTabs/page";
import PostCard from "@/app/components/community/PostCard/page";
import { getAllPosts } from "@/lib/post";

type Tab = "new" | "top";

interface Post {
  _id: string;
  user_id: { _id: string; username: string; profile_pic?: string } | null;
  strategy_id: string;
  strategy_name?: string;
  title: string;
  body: string;
  published_at: string;
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

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const PAGE_SIZE = 2;

export default function CommunityPage() {
  const { darkMode } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("new");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    setVisibleCount(PAGE_SIZE);
    try {
      const data = await getAllPosts();
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load community posts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // ── Sorting ───────────────────────────────────────────────────────────────
  const sortedPosts = [...posts].sort((a, b) => {
    if (activeTab === "new") {
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    }
    // "top" → highest win_rate first, fallback to net_score
    const wrA = a.backtest_metrics?.win_rate ?? -Infinity;
    const wrB = b.backtest_metrics?.win_rate ?? -Infinity;
    if (wrB !== wrA) return (wrB as number) - (wrA as number);
    return (b.net_score ?? 0) - (a.net_score ?? 0);
  });

  const visiblePosts = sortedPosts.slice(0, visibleCount);
  const hasMore = visibleCount < sortedPosts.length;

  const handleLoadMore = async () => {
    setLoadingMore(true);
    // Simulated short delay so user sees the spinner
    await new Promise((res) => setTimeout(res, 600));
    setVisibleCount((c) => c + PAGE_SIZE);
    setLoadingMore(false);
  };

  const handleVoteUpdate = (
    postId: string,
    upvotes: number,
    downvotes: number,
    net_score: number
  ) => {
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId ? { ...p, upvotes, downvotes, net_score } : p
      )
    );
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <main
      className={`flex w-full justify-center py-10 transition-colors duration-300 ${
        darkMode ? "bg-black text-gray-200" : "bg-white text-gray-900"
      }`}
    >
      <div className="flex w-full max-w-3xl flex-col gap-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p
              className={`text-3xl font-bold leading-tight tracking-[-0.033em] ${
                darkMode ? "text-white" : "text-black"
              }`}
            >
              Community Feed
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Share backtest results, strategies, and market insights.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.07, rotate: 20 }}
            whileTap={{ scale: 0.93 }}
            onClick={fetchPosts}
            className={`flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-semibold transition-colors ${
              darkMode
                ? "text-neutral-400 hover:text-white hover:bg-white/10"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Refresh
          </motion.button>
        </div>

        {/* Filter Tabs */}
        <FilterTabs activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className={`h-40 rounded-xl animate-pulse ${
                  darkMode ? "bg-[#1a1a1a]" : "bg-gray-100"
                }`}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            className={`flex flex-col items-center justify-center py-16 gap-3 rounded-xl border ${
              darkMode ? "border-[#2d2d2d] bg-[#1a1a1a]" : "border-gray-200 bg-gray-50"
            }`}
          >
            <span className="material-symbols-outlined text-4xl text-[#f90606]">
              error_outline
            </span>
            <p className={`text-sm ${darkMode ? "text-neutral-400" : "text-gray-500"}`}>
              {error}
            </p>
            <button
              onClick={fetchPosts}
              className="mt-1 text-sm font-semibold text-[#f90606] hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && posts.length === 0 && (
          <div
            className={`flex flex-col items-center justify-center py-20 gap-4 rounded-xl border ${
              darkMode ? "border-[#2d2d2d] bg-[#1a1a1a]" : "border-gray-200 bg-gray-50"
            }`}
          >
            <span className="material-symbols-outlined text-5xl text-[#f90606]">forum</span>
            <p className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
              No posts yet
            </p>
            <p className={`text-sm text-center max-w-xs ${darkMode ? "text-neutral-400" : "text-gray-500"}`}>
              Be the first to share your backtest results with the community!
            </p>
          </div>
        )}

        {/* Posts — animated list */}
        {!loading && !error && visiblePosts.length > 0 && (
          <div className="flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {visiblePosts.map((post, idx) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, delay: idx * 0.06, ease: "easeOut" }}
                >
                  <PostCard
                    post={{
                      ...post,
                      time: timeAgo(post.published_at),
                      user: {
                        name: post.user_id?.username ?? "Anonymous",
                        avatar: post.user_id?.profile_pic
                          ? `http://localhost:4000${post.user_id.profile_pic}`
                          : "",
                        id: post.user_id?._id ?? "",
                      },
                    }}
                    onVoteUpdate={handleVoteUpdate}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Load More */}
        {!loading && hasMore && (
          <div className="flex justify-center pt-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLoadMore}
              disabled={loadingMore}
              className={`relative h-10 min-w-[140px] cursor-pointer items-center justify-center rounded-lg border px-6 text-sm font-semibold transition-all overflow-hidden ${
                darkMode
                  ? "border-gray-700 text-gray-300 hover:border-[#f90606] hover:text-[#f90606] bg-[#0f0f0f]"
                  : "border-gray-300 text-gray-700 hover:border-[#f90606] hover:text-[#f90606] bg-white"
              }`}
            >
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-[#f90606]"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-20"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Loading...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  Load More
                  <span className="text-xs opacity-60">
                    ({sortedPosts.length - visibleCount} left)
                  </span>
                </span>
              )}
            </motion.button>
          </div>
        )}
      </div>
    </main>
  );
}
