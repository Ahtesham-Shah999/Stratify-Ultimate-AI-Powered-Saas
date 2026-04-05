"use client";

import { useEffect, useRef, useState } from "react";

export default function AuthToggle({ mode, setMode, darkMode }: any) {
  const [pillStyle, setPillStyle] = useState({ left: "4px", width: "50%" });
  const loginRef = useRef<HTMLButtonElement>(null);
  const signupRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeRef = mode === "login" ? loginRef : signupRef;
    const container = containerRef.current;
    const btn = activeRef.current;
    if (!btn || !container) return;

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    setPillStyle({
      left: `${btnRect.left - containerRect.left}px`,
      width: `${btnRect.width}px`,
    });
  }, [mode]);

  return (
    <div className="flex w-full py-3">
      <style>{`
        @keyframes tabPillGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(232,17,45,0.35); }
          50% { box-shadow: 0 0 24px rgba(232,17,45,0.6), 0 2px 16px rgba(232,17,45,0.25); }
        }
        .toggle-pill {
          animation: tabPillGlow 2.5s ease-in-out infinite;
        }
      `}</style>
      <div
        ref={containerRef}
        className="relative flex h-11 flex-1 items-stretch rounded-xl p-1"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Sliding pill */}
        <div
          className="toggle-pill absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            ...pillStyle,
            background: "linear-gradient(135deg, #E8112D 0%, #b00020 100%)",
            zIndex: 0,
          }}
        />

        {(["login", "signup"] as const).map((m) => {
          const isActive = mode === m;
          return (
            <button
              key={m}
              ref={m === "login" ? loginRef : signupRef}
              onClick={() => setMode(m)}
              className="relative z-10 flex flex-1 cursor-pointer items-center justify-center rounded-md px-2 text-sm font-bold tracking-wide transition-colors duration-200"
              style={{
                color: isActive ? "#fff" : "rgba(255,255,255,0.45)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontSize: "0.78rem",
                background: "none",
                border: "none",
                fontFamily: "inherit",
              }}
            >
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          );
        })}
      </div>
    </div>
  );
}