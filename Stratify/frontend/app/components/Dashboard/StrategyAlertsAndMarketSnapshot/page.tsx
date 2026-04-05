import React from "react";
import { useTheme } from "@/context/theme-context";

const StrategyAlertsAndMarketSnapshot = () => {
  const { darkMode } = useTheme();

  // Hardcoded alerts
  const alerts = [
    { type: "BUY", pair: "BTC/USDT", strategy: "Momentum Cross" },
    { type: "SELL", pair: "ETH/USDT", strategy: "RSI Divergence" },
  ];

  // Hardcoded market snapshot
  const marketSnapshot = [
    { coin: "BTC", price: "$68,123.45", change: "+2.5%" },
    { coin: "ETH", price: "$3,456.78", change: "-1.2%" },
    { coin: "SOL", price: "$150.99", change: "+5.8%" },
  ];

  return (
    <div className="space-y-6">
      {/* Strategy Alerts & Signals */}
      <div
        className={`rounded-xl shadow-sm p-6 border ${
          darkMode ? "bg-[#1a1a1a] border-[#2d2d2d]" : "bg-[#ffffff] border-[#e5e7eb]"
        }`}
      >
        <h3 className={`${darkMode ? "text-white" : "text-gray-900"} text-lg font-bold mb-4`}>
          Strategy Alerts & Signals
        </h3>
        <ul className="space-y-3">
          {alerts.map((alert, idx) => (
            <li key={idx} className="flex items-center gap-3 text-sm">
              <span
                className={`material-symbols-outlined ${
                  alert.type === "BUY" ? "text-green-500" : "text-red-500"
                }`}
              >
                {alert.type === "BUY" ? "arrow_upward" : "arrow_downward"}
              </span>
              <div>
                <p className={`${darkMode ? "text-white" : "text-gray-900"} font-semibold`}>
                  {alert.type} {alert.pair}
                </p>
                <p className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-xs`}>
                  {alert.strategy}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Market Snapshot */}
      <div
        className={`rounded-xl shadow-sm p-6 border ${
          darkMode ? "bg-[#1a1a1a] border-[#2d2d2d]" : "bg-[#ffffff] border-[#e5e7eb]"
        }`}
      >
        <h3 className={`${darkMode ? "text-white" : "text-gray-900"} text-lg font-bold mb-4`}>
          Market Snapshot
        </h3>
        <ul className="space-y-3">
          {marketSnapshot.map((item, idx) => (
            <li key={idx} className="flex items-center justify-between text-sm gap-3">
              <div className="flex items-center gap-3">
                <img
                  className="w-6 h-6"
                  src={`https://cryptoicons.org/api/icon/${item.coin.toLowerCase()}/50`}
                  alt={item.coin}
                />
                <div>
                  <p className={`${darkMode ? "text-white" : "text-gray-900"} font-semibold`}>
                    {item.coin}
                  </p>
                  <p className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-xs`}>
                    {item.price}
                  </p>
                </div>
              </div>
              <span
                className={`font-semibold w-12 text-right ${
                  item.change.startsWith("+") ? "text-green-500" : "text-red-500"
                }`}
              >
                {item.change}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default StrategyAlertsAndMarketSnapshot;
