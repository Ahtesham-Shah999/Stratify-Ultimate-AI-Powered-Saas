'use client'
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTheme } from "@/context/theme-context";
import SentimentCard from "@/app/components/SentimentCard/SentimentCard";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Article {
  title: string;
  url: string;
  source: string;
  label: string;
  score: number;
}

interface SentimentResult {
  pair: string;
  signal: string;
  score: number;
  explanation: string;
  total_analyzed: number;
  base_news: Article[];
  quote_news: Article[];
}

// ─── News Card ─────────────────────────────────────────────────────────────────
function NewsArticleCard({ art, darkMode }: { art: Article; darkMode: boolean }) {
  const isPositive = art.label === "positive";
  const isNegative = art.label === "negative";

  const badgeColor = isPositive
    ? "bg-green-500/10 text-green-400 border border-green-500/20"
    : isNegative
    ? "bg-red-500/10 text-red-400 border border-red-500/20"
    : "bg-blue-500/10 text-blue-400 border border-blue-500/20";

  const scoreColor = isPositive ? "text-green-400" : isNegative ? "text-red-400" : "text-blue-400";
  const signedStr = (art.score >= 0 ? "+" : "") + art.score.toFixed(3);

  return (
    <div
      className={`rounded-xl border p-4 transition-colors duration-200 ${
        darkMode
          ? "bg-[#111] border-[#2d2d2d] hover:border-[#444]"
          : "bg-white border-[#e5e7eb] hover:border-[#d1d5db] shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${badgeColor}`}>
          {art.label}
        </span>
        <a
          href={art.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-sm font-medium leading-snug hover:underline ${
            darkMode ? "text-gray-200 hover:text-white" : "text-gray-800 hover:text-black"
          }`}
        >
          {art.title}
        </a>
      </div>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">
          <span className="material-symbols-outlined text-sm">language</span>
          {art.source}
        </span>
        <span className={`font-mono text-xs font-bold ${scoreColor}`}>{signedStr}</span>
      </div>
    </div>
  );
}

// ─── News Column ───────────────────────────────────────────────────────────────
function NewsColumn({
  title,
  articles,
  darkMode,
}: {
  title: string;
  articles: Article[];
  darkMode: boolean;
}) {
  const [visibleCount, setVisibleCount] = useState(5);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 5);
      setLoadingMore(false);
    }, 600);
  };

  const visible = articles.slice(0, visibleCount);
  const hasMore = visibleCount < articles.length;

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-5 ${
        darkMode ? "bg-[#1a1a1a] border-[#2d2d2d]" : "bg-[#f8f5f5] border-[#e5e7eb]"
      }`}
    >
      <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>
        {title}
      </p>

      {articles.length === 0 ? (
        <p className={`text-sm py-4 text-center ${darkMode ? "text-neutral-600" : "text-neutral-400"}`}>
          No articles found.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {visible.map((art, i) => (
              <NewsArticleCard key={i} art={art} darkMode={darkMode} />
            ))}
          </div>

          {hasMore && (
            <div className="pt-2 text-center">
              {loadingMore ? (
                <div className="flex justify-center py-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#f90606] border-t-transparent" />
                </div>
              ) : (
                <button
                  onClick={handleLoadMore}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                    darkMode
                      ? "border-[#2d2d2d] text-neutral-400 hover:border-[#444] hover:bg-[#2d2d2d] hover:text-white"
                      : "border-[#e5e7eb] text-neutral-500 hover:border-[#d1d5db] hover:bg-gray-100 hover:text-black"
                  }`}
                >
                  Show More ({articles.length - visibleCount} remaining)
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page Content ─────────────────────────────────────────────────────────
function SentimentAnalysisContent() {
  const searchParams = useSearchParams();
  const initialSymbol = searchParams.get("symbol") || "";
  const { darkMode } = useTheme();
  const router = useRouter();

  const [pair] = useState(initialSymbol);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<SentimentResult | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (initialSymbol) {
      runAnalysis(initialSymbol);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSymbol]);

  const runAnalysis = async (searchPair: string) => {
    const targetPair = searchPair.trim();
    if (!targetPair) return;

    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await fetch("http://localhost:4000/api/sentiment/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pair: targetPair, page_size: 50 }),
      });

      const rawText = await res.text();
      if (!rawText || !rawText.trim()) {
        throw new Error(`Server returned an empty response (HTTP ${res.status}).`);
      }

      let json;
      try {
        json = JSON.parse(rawText);
      } catch {
        throw new Error(`Server returned non-JSON (HTTP ${res.status}): ${rawText.slice(0, 200)}`);
      }

      if (!res.ok) {
        throw new Error(json.error || json.detail || `HTTP ${res.status}`);
      }

      setData(json);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Map signal to SentimentCard format
  const signalToType = (signal: string) => {
    if (signal === "BUY") return "Bullish";
    if (signal === "SELL") return "Bearish";
    return "Neutral";
  };

  const signalToEmoji = (signal: string) => {
    if (signal === "BUY") return "📈";
    if (signal === "SELL") return "📉";
    return "⚖️";
  };

  const baseSym = data?.pair?.split("/")[0] ?? "Base";
  const quoteSym = data?.pair?.split("/")[1] ?? "Quote";

  // Convert score (-1..+1) to confidence percentage (0..100)
  const confidencePct = data ? Math.round(Math.abs(data.score) * 100) : 0;

  const sentimentCardData = data
    ? {
        source: data.pair,
        type: signalToType(data.signal),
        confidence: confidencePct,
        emoji: signalToEmoji(data.signal),
        summary: data.explanation,
      }
    : null;

  return (
    <main
      className={`flex-1 min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-[#0d0d0d] text-gray-200" : "bg-[#f8f5f5] text-gray-900"
      }`}
    >
      <div
        className={`container mx-auto px-4 py-10 transition-all duration-500 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => {
              if (window.history.length > 1) router.back();
              else window.close();
            }}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${
              darkMode
                ? "border-[#2d2d2d] text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
                : "border-[#e5e7eb] text-gray-500 hover:bg-gray-100 hover:text-black"
            }`}
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>

          <div>
            <h1 className="text-4xl font-black tracking-tight">Sentiment Analysis</h1>
            <p className={`mt-1 text-sm ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>
              {pair ? `Analyzing market sentiment for ${pair}` : "AI-powered news sentiment for your trading pair"}
            </p>
          </div>
        </div>

        {/* ── Info Strip Removed per request ───────────────────────────────── */}

        {/* ── Loading ────────────────────────────────────────────────────────── */}
        {loading && (
          <div
            className={`mb-8 flex flex-col items-center justify-center gap-6 rounded-xl border py-20 text-center ${
              darkMode ? "bg-[#1a1a1a] border-[#2d2d2d]" : "bg-white border-[#e5e7eb] shadow-sm"
            }`}
          >
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#f90606] border-t-transparent shrink-0" />
            <div>
              <p className="font-black text-2xl md:text-3xl">Fetching news analysis…</p>
              <p className={`text-base mt-2 ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>
                Please wait, this may take 30–90 seconds
              </p>
            </div>
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────────────────────── */}
        {error && !loading && (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-5">
            <span className="material-symbols-outlined text-red-400 shrink-0">error</span>
            <div>
              <p className="font-bold text-red-400">Analysis Failed</p>
              <p className={`text-sm mt-1 ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>{error}</p>
            </div>
          </div>
        )}

        {/* ── Results ───────────────────────────────────────────────────────── */}
        {data && !loading && !error && (
          <div className="animate-fade-in flex flex-col gap-8">

            {/* Primary Signal using SentimentCard */}
            <div className="flex flex-col items-center">
              <div className="w-full max-w-3xl">
                <p className={`mb-3 text-xs font-bold uppercase tracking-widest text-center ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>
                  Primary Trading Signal
                </p>
                <SentimentCard sentiment={sentimentCardData} />
              </div>
            </div>

            {/* Sentiment Score Meter */}
            <div
              className={`rounded-xl border p-5 ${
                darkMode ? "bg-[#1a1a1a] border-[#2d2d2d]" : "bg-white border-[#e5e7eb] shadow-sm"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>
                  Raw Sentiment Score
                </p>
                <span className={`font-mono text-lg font-black ${data.score > 0 ? "text-green-400" : data.score < 0 ? "text-red-400" : "text-blue-400"}`}>
                  {data.score >= 0 ? "+" : ""}{data.score.toFixed(4)}
                </span>
              </div>
              {/* Score bar: -1 to +1 mapped to 0–100% */}
              <div className={`h-2.5 w-full rounded-full ${darkMode ? "bg-[#2d2d2d]" : "bg-gray-200"}`}>
                <div
                  className={`h-2.5 rounded-full transition-all duration-700 ${
                    data.score > 0 ? "bg-green-500" : data.score < 0 ? "bg-red-500" : "bg-blue-400"
                  }`}
                  style={{ width: `${Math.abs(data.score) * 100}%`, marginLeft: data.score < 0 ? `${(1 + data.score) * 100}%` : "50%" }}
                />
              </div>
              <div className={`mt-2 flex justify-between text-xs ${darkMode ? "text-neutral-600" : "text-neutral-400"}`}>
                <span>−1.0 (Max Bearish)</span>
                <span>0 (Neutral)</span>
                <span>+1.0 (Max Bullish)</span>
              </div>
            </div>

            {/* News Grid */}
            <div>
              <p className={`mb-4 text-xs font-bold uppercase tracking-widest ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>
                Supporting News Articles
              </p>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <NewsColumn title={`${baseSym} News`} articles={data.base_news} darkMode={darkMode} />
                <NewsColumn title={`${quoteSym} News`} articles={data.quote_news} darkMode={darkMode} />
              </div>
            </div>

          </div>
        )}

        {/* ── Empty state when no analysis yet ─────────────────────────────── */}
        {!loading && !error && !data && (
          <div
            className={`flex flex-col items-center justify-center gap-4 rounded-xl border py-20 text-center ${
              darkMode ? "bg-[#1a1a1a] border-[#2d2d2d]" : "bg-white border-[#e5e7eb] shadow-sm"
            }`}
          >
            <span className="material-symbols-outlined text-5xl text-[#f90606]">analytics</span>
            <div>
              <p className="text-lg font-bold">Ready to Analyze</p>
              <p className={`mt-1 text-sm ${darkMode ? "text-neutral-500" : "text-neutral-500"}`}>
                Click the <strong>Analyze</strong> button in the Backtest sidebar to start.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Global animation */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.4s ease both; }
      `}</style>
    </main>
  );
}

// ─── Export ─────────────────────────────────────────────────────────────────────
export default function SentimentAnalysis() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-[#0d0d0d]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f90606] border-t-transparent" />
      </main>
    }>
      <SentimentAnalysisContent />
    </Suspense>
  );
}
