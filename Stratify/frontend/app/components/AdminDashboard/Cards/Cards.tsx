"use client";
import React from "react";
import { useTheme } from "@/context/theme-context";

export default function Cards({ items = [] }:any) {
  const { darkMode } = useTheme();

  return (
    <>
      {items.map((c:any) => (
        <div
          key={c.id}
          className={`
            flex flex-col gap-4 rounded-lg p-6 border
            ${darkMode 
              ? "bg-[#1a1a1a] border-[#2d2d2d]" 
              : "bg-white border-gray-300"
            }
          `}
        >
          {/* Title + Icon */}
          <div className="flex justify-between items-center">
            <p className={`${darkMode ? "text-neutral-400" : "text-neutral-600"} text-sm font-medium`}>
              {c.title}
            </p>

            <span 
              className={`material-symbols-outlined text-xl 
                ${darkMode ? "text-red-500" : "text-red-600"}
              `}
            >
              {c.icon}
            </span>
          </div>

          {/* Value */}
          <p
            className={`
              text-3xl font-bold
              ${darkMode ? "text-white" : "text-black"}
            `}
          >
            {c.value}
          </p>
        </div>
      ))}
    </>
  );
}
