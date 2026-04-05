import React from "react";
import { useTheme } from "@/context/theme-context"; // assume you have a theme provider

const AISentimentSnapshot = () => {
  const { darkMode } = useTheme();

  return (
    <div className={`rounded-xl shadow-sm p-6 border ${darkMode ? "bg-[#1a1a1a] border-[#2d2d2d]" : "bg-[#ffffff] border-[#e5e7eb]"}`}>
      <h2 className={`${darkMode ? "text-white" : "text-gray-900"} text-xl font-bold mb-4`}>AI Sentiment Snapshot</h2>
      <div className="space-y-4">
        {/* Bullish */}
        <div className={`flex items-center p-3 rounded-lg border ${darkMode ? "border-[#2d2d2d] bg-[#1a1a1a]" : "border-[#e5e7eb] bg-[#ffffff]"} ring-1 ring-[#f90606]`}>
          <div className="flex-grow">
            <p className={`${darkMode ? "text-white" : "text-gray-900"} font-bold`}>Bullish</p>
            <p className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-xs`}>Confidence: 82%</p>
          </div>
          <span className="material-symbols-outlined text-[#f90606] text-2xl">trending_up</span>
        </div>
        {/* Neutral */}
        <div className={`flex items-center p-3 rounded-lg border ${darkMode ? "border-[#2d2d2d] bg-[#151515]" : "border-[#e5e7eb] bg-[#f8f5f5]"}`}>
          <div className="flex-grow">
            <p className={`${darkMode ? "text-white" : "text-gray-900"} font-bold`}>Neutral</p>
            <p className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-xs`}>Confidence: 65%</p>
          </div>
          <span className={`${darkMode ? "text-gray-400" : "text-gray-400"} material-symbols-outlined text-2xl`}>horizontal_rule</span>
        </div>
        {/* Bearish */}
        <div className={`flex items-center p-3 rounded-lg border ${darkMode ? "border-[#2d2d2d] bg-[#151515]" : "border-[#e5e7eb] bg-[#f8f5f5]"} relative overflow-hidden`}>
          <div className="absolute inset-y-0 left-0 w-1 bg-[#f90606]"></div>
          <div className="flex-grow pl-3">
            <p className={`${darkMode ? "text-white" : "text-gray-900"} font-bold`}>Bearish</p>
            <p className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-xs`}>Confidence: 34%</p>
          </div>
          <span className="material-symbols-outlined text-[#f90606] text-2xl">trending_down</span>
        </div>
      </div>
    </div>
  );
};

export default AISentimentSnapshot;
