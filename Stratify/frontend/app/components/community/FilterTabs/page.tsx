"use client";
import React from "react";
import { useTheme } from "@/context/theme-context";
import { motion } from "framer-motion";

type Tab = "new" | "top";

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: { label: string; value: Tab; icon: string }[] = [
  { label: "New", value: "new", icon: "new_releases" },
  { label: "Top", value: "top", icon: "trending_up" },
];

export default function FilterTabs({ activeTab, onTabChange }: Props) {
  const { darkMode } = useTheme();

  return (
    <div
      className="flex gap-2 pb-4 border-b"
      style={{ borderColor: darkMode ? "#2d2d2d" : "#e5e7eb" }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <motion.button
            key={tab.value}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onTabChange(tab.value)}
            className="relative flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-md px-4 text-sm font-medium overflow-hidden"
            style={{
              backgroundColor: isActive
                ? darkMode
                  ? "#1f1f1f"
                  : "#f3f4f6"
                : "transparent",
              color: darkMode ? "#ffffff" : "#000000",
            }}
          >
            {/* Active indicator pill */}
            {isActive && (
              <motion.span
                layoutId="filterPill"
                className="absolute inset-0 rounded-md"
                style={{
                  background: darkMode
                    ? "rgba(249,6,6,0.10)"
                    : "rgba(249,6,6,0.07)",
                  border: "1px solid rgba(249,6,6,0.25)",
                }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span
              className="material-symbols-outlined relative z-10"
              style={{
                fontSize: 18,
                color: isActive
                  ? "#F90606"
                  : darkMode
                  ? "#A3A3A3"
                  : "#6B7280",
              }}
            >
              {tab.icon}
            </span>
            <span className="relative z-10">{tab.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
