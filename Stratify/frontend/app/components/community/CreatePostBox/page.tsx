"use client";
import React, { useEffect, useState } from "react";
import { useTheme } from "@/context/theme-context";
import { motion } from "framer-motion";

const FALLBACK =
  "https://ui-avatars.com/api/?background=f90606&color=fff&bold=true&name=";

export default function CreatePostBox() {
  const { darkMode } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [username, setUsername] = useState("User");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("userData");
    if (!raw) return;
    try {
      const user = JSON.parse(raw);
      setUsername(user.username || "User");
      if (user.profile_pic) {
        setAvatarUrl(`http://localhost:4000${user.profile_pic}`);
      }
    } catch { /* noop */ }
  }, []);

  const bgColor = darkMode ? "#1a1a1a" : "#ffffff";
  const borderColor = darkMode ? "#2d2d2d" : "#e5e7eb";
  const textPrimary = darkMode ? "#ffffff" : "#000000";
  const textSecondary = darkMode ? "#d1d5db" : "#6b7280";
  const hoverColor = darkMode ? "#2d2d2d" : "#f3f4f6";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex items-start gap-4 rounded-xl border p-4"
      style={{ backgroundColor: bgColor, borderColor: borderColor }}
    >
      {/* Avatar — real user pic */}
      <div
        className="mt-1 h-10 w-10 shrink-0 rounded-full bg-cover bg-center ring-2"
        style={{
          backgroundImage: avatarUrl
            ? `url('${avatarUrl}')`
            : `url('${FALLBACK}${encodeURIComponent(username)}')`,
          ringColor: borderColor,
        }}
      />

      {/* Input + Buttons */}
      <div className="flex w-full flex-col">
        <textarea
          className={`w-full resize-none border-0 bg-transparent p-0 text-base focus:outline-none focus:ring-0 ${
            darkMode ? "placeholder:text-white/40" : "placeholder:text-black/40"
          }`}
          placeholder="Share your latest strategy or ask a question..."
          rows={2}
          style={{ color: textPrimary, caretColor: textPrimary }}
        />

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1" style={{ color: textSecondary }}>
            {["image", "attach_file"].map((icon) => (
              <motion.button
                key={icon}
                whileHover={{ scale: 1.15, color: "#f90606" }}
                whileTap={{ scale: 0.9 }}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                style={{ color: textSecondary }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = hoverColor)}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <span className="material-symbols-outlined text-xl">{icon}</span>
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="h-8 px-4 rounded-md bg-[#F90606] text-white text-sm font-bold shadow-md shadow-red-500/20"
          >
            Post
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
