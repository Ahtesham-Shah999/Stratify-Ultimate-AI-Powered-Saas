"use client";
import React, { useEffect, useState } from "react";
import { useTheme } from "@/context/theme-context";
import { getStrategiesByUserApi } from "@/lib/strategyapi";
import { getBacktestsByStrategyApi } from "@/lib/backtest";

// Normalizes an array of values into SVG Y coordinates within [yMin, yMax]
function toSvgY(val: number, min: number, max: number, yMin: number, yMax: number) {
  if (max === min) return (yMin + yMax) / 2;
  return yMax - ((val - min) / (max - min)) * (yMax - yMin);
}

const StrategyPerformance = () => {
  const { darkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [chartPoints, setChartPoints] = useState<{ x: number; y: number }[]>([]);
  const [profitPoints, setProfitPoints] = useState<{ x: number; y: number }[]>([]);
  const [summary, setSummary] = useState<{
    totalCapital: number;
    totalProfit: number;
    bestWinRate: number;
  }>({ totalCapital: 0, totalProfit: 0, bestWinRate: 0 });

  const SVG_W = 500;
  const SVG_H = 200;

  useEffect(() => {
    const fetchPerformance = async () => {
      if (typeof window === "undefined") return;
      const raw = localStorage.getItem("userData");
      if (!raw) return;
      const user = JSON.parse(raw);
      const userId = user?.id || user?._id;
      if (!userId) return;

      try {
        const strategies = await getStrategiesByUserApi(userId).catch(() => []);
        if (!strategies || strategies.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch backtests for all strategies in parallel
        const allBacktestArrays = await Promise.all(
          strategies.map((s: any) =>
            getBacktestsByStrategyApi(s._id).catch(() => [])
          )
        );

        const allBacktests = allBacktestArrays.flat();

        if (allBacktests.length === 0) {
          setLoading(false);
          return;
        }

        // ── aggregate per-strategy: latest backtest final capital ──────────
        // Build equity curve from final capitals per backtest (one point per BT)
        const sortedBTs = [...allBacktests].sort(
          (a, b) =>
            new Date(a.created_at || 0).getTime() -
            new Date(b.created_at || 0).getTime()
        );

        // Capital growth line
        let runningCapital = 0;
        const capitalSeries: number[] = [];
        sortedBTs.forEach((bt) => {
          const finalCapital =
            Number(bt.final_capital ?? bt.initial_capital) || 0;
          runningCapital += finalCapital;
          capitalSeries.push(runningCapital);
        });

        // P/L growth line
        const plSeries: number[] = [];
        let runningPL = 0;
        sortedBTs.forEach((bt) => {
          runningPL += Number(bt.total_profit ?? 0);
          plSeries.push(runningPL);
        });

        // compute SVG coords for capital growth
        const capMin = Math.min(...capitalSeries);
        const capMax = Math.max(...capitalSeries);
        const plMin = Math.min(...plSeries, 0);
        const plMax = Math.max(...plSeries, 0);

        const n = capitalSeries.length;
        const capPts = capitalSeries.map((v, i) => ({
          x: n === 1 ? SVG_W / 2 : (i / (n - 1)) * SVG_W,
          y: toSvgY(v, capMin, capMax, 20, 180),
        }));
        const plPts = plSeries.map((v, i) => ({
          x: n === 1 ? SVG_W / 2 : (i / (n - 1)) * SVG_W,
          y: toSvgY(v, plMin, plMax, 20, 180),
        }));

        setChartPoints(capPts);
        setProfitPoints(plPts);

        // Summary stats
        const totalProfit = sortedBTs.reduce(
          (s, b) => s + Number(b.total_profit ?? 0),
          0
        );
        const bestWinRate =
          Math.max(...sortedBTs.map((b) => Number(b.win_rate ?? 0))) * 100;
        const totalCapital = strategies.reduce(
          (s: number, st: any) => s + Number(st.initial_capital || 0),
          0
        );
        setSummary({ totalCapital, totalProfit, bestWinRate });
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, []);

  const toPolylineStr = (pts: { x: number; y: number }[]) =>
    pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const cardBg = darkMode ? "bg-[#1a1a1a] border-[#2d2d2d]" : "bg-white border-[#e5e7eb]";
  const textMain = darkMode ? "text-white" : "text-gray-900";
  const textSub = darkMode ? "text-gray-400" : "text-gray-500";
  const chartBg = darkMode ? "bg-[#151515]" : "bg-[#f8f5f5]";
  const gridColor = darkMode ? "#2d2d2d" : "#e5e7eb";

  return (
    <div className={`rounded-xl shadow-sm p-6 border ${cardBg}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5">
        <h2 className={`${textMain} text-xl font-bold`}>Strategy Performance</h2>
        <div className="flex items-center gap-5 text-xs mt-2 sm:mt-0">
          <span className="flex items-center gap-1.5">
            <span
              style={{
                display: "inline-block",
                width: 24,
                height: 2,
                background: darkMode ? "#e5e7eb" : "#111",
                borderRadius: 2,
              }}
            />
            <span className={textSub}>Capital Growth</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              style={{
                display: "inline-block",
                width: 24,
                height: 2,
                background: "#f90606",
                borderRadius: 2,
              }}
            />
            <span className={textSub}>P/L Over Time</span>
          </span>
        </div>
      </div>

      {/* Summary row */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            {
              label: "Total Capital",
              val: `$${summary.totalCapital.toLocaleString()}`,
              color: textMain,
            },
            {
              label: "Total P/L",
              val: `${summary.totalProfit >= 0 ? "+" : ""}$${summary.totalProfit.toFixed(2)}`,
              color: summary.totalProfit >= 0 ? "#00e676" : "#f90606",
            },
            {
              label: "Best Win Rate",
              val:
                summary.bestWinRate > 0
                  ? `${summary.bestWinRate.toFixed(1)}%`
                  : "—",
              color: summary.bestWinRate >= 50 ? "#00e676" : "#f90606",
            },
          ].map((item) => (
            <div key={item.label} className={`rounded-lg p-3 ${chartBg}`}>
              <p className={`text-xs ${textSub} mb-1`}>{item.label}</p>
              <p
                className="text-base font-bold tabular-nums"
                style={{ color: item.color }}
              >
                {item.val}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className={`rounded-lg p-2 ${chartBg}`}>
        {loading ? (
          <div
            className={`h-64 rounded-lg animate-pulse ${
              darkMode ? "bg-[#2d2d2d]" : "bg-gray-200"
            }`}
          />
        ) : chartPoints.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2">
            <span className="text-3xl">📈</span>
            <p className={`text-sm ${textSub}`}>
              No backtest data yet. Run a backtest to see performance here.
            </p>
          </div>
        ) : (
          <svg
            className="w-full"
            style={{ height: SVG_H }}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            preserveAspectRatio="none"
          >
            {/* Grid */}
            <g stroke={gridColor} strokeWidth="0.5" strokeDasharray="3,4">
              {[40, 80, 120, 160].map((y) => (
                <line key={y} x1="0" x2={SVG_W} y1={y} y2={y} />
              ))}
              {[100, 200, 300, 400].map((x) => (
                <line key={x} x1={x} x2={x} y1="0" y2={SVG_H} />
              ))}
            </g>

            {/* Gradient fills */}
            <defs>
              <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={darkMode ? "#ffffff" : "#111111"}
                  stopOpacity="0.15"
                />
                <stop
                  offset="100%"
                  stopColor={darkMode ? "#ffffff" : "#111111"}
                  stopOpacity="0"
                />
              </linearGradient>
              <linearGradient id="plGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f90606" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#f90606" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Capital growth area fill */}
            {chartPoints.length > 1 && (
              <polygon
                points={`${chartPoints[0].x.toFixed(1)},${SVG_H} ${toPolylineStr(chartPoints)} ${chartPoints[chartPoints.length - 1].x.toFixed(1)},${SVG_H}`}
                fill="url(#capGrad)"
              />
            )}

            {/* P/L area fill */}
            {profitPoints.length > 1 && (
              <polygon
                points={`${profitPoints[0].x.toFixed(1)},${SVG_H} ${toPolylineStr(profitPoints)} ${profitPoints[profitPoints.length - 1].x.toFixed(1)},${SVG_H}`}
                fill="url(#plGrad)"
              />
            )}

            {/* Capital growth line */}
            {chartPoints.length > 1 && (
              <polyline
                points={toPolylineStr(chartPoints)}
                fill="none"
                stroke={darkMode ? "#e5e7eb" : "#111"}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {/* P/L line */}
            {profitPoints.length > 1 && (
              <polyline
                points={toPolylineStr(profitPoints)}
                fill="none"
                stroke="#f90606"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {/* Dots at each data point */}
            {chartPoints.map((pt, i) => (
              <circle
                key={`c${i}`}
                cx={pt.x}
                cy={pt.y}
                r="3"
                fill={darkMode ? "#fff" : "#111"}
              />
            ))}
            {profitPoints.map((pt, i) => (
              <circle
                key={`p${i}`}
                cx={pt.x}
                cy={pt.y}
                r="3"
                fill="#f90606"
              />
            ))}
          </svg>
        )}
      </div>
    </div>
  );
};

export default StrategyPerformance;
