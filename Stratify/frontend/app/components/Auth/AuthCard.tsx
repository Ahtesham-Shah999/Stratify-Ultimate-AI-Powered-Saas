"use client";

import { useEffect, useState } from "react";
import AuthToggle from "./AuthToggle";
import AuthFields from "./AuthFields";
import SocialButtons from "./SocialButtons";
import AuthFooter from "./AuthFooter";

export default function AuthCard({ mode, setMode, darkMode }: any) {
  const [animKey, setAnimKey] = useState(0);

  // Re-trigger section animation on mode change
  useEffect(() => {
    setAnimKey(k => k + 1);
  }, [mode]);

  return (
    <div
      className={`w-full rounded-2xl border p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden transition-all duration-500 ${
        darkMode
          ? "border-white/[0.07] bg-black/60 shadow-black/60"
          : "border-white/20 bg-white/10 shadow-black/30"
      }`}
      style={{ boxShadow: darkMode ? "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)" : undefined }}
    >
      <style>{`
        @keyframes cardShimmer {
          0% { background-position: -300% center; }
          100% { background-position: 300% center; }
        }
        @keyframes logoGlow {
          0%, 100% { box-shadow: 0 0 16px rgba(232,17,45,0.4); }
          50% { box-shadow: 0 0 32px rgba(232,17,45,0.7), 0 0 60px rgba(232,17,45,0.2); }
        }
        @keyframes sectionFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes topBorderGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .card-logo-shimmer {
          background: linear-gradient(90deg, #fff 0%, #E8112D 35%, #C9A84C 65%, #fff 100%);
          background-size: 250% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: cardShimmer 4.5s linear infinite;
        }
        .card-section-reveal {
          animation: sectionFadeUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>

      {/* Top glowing border accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(232,17,45,0.8), rgba(201,168,76,0.5), transparent)",
          animation: "topBorderGlow 3s ease-in-out infinite",
        }}
      />

      {/* Bottom red glow bleed */}
      <div
        className="absolute -bottom-12 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "70%", height: "80px",
          background: "radial-gradient(ellipse, rgba(232,17,45,0.12) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/* Logo */}
      <div
        className="flex flex-col items-center pb-6 card-section-reveal"
        style={{ animationDelay: "0.05s" }}
      >
        <div className="flex items-center gap-2.5 mb-1.5">
          {/* <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #E8112D, #7a0010)",
              animation: "logoGlow 3s ease-in-out infinite",
            }}
          >
            📈
          </div> */}
          <span
            className="card-logo-shimmer font-black tracking-widest"
            style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", fontSize: "1.7rem", letterSpacing: "0.06em" }}
          >
            STRATIFY
          </span>
        </div>
        <p className={`text-xs font-semibold tracking-widest uppercase ${darkMode ? "text-white/35" : "text-white/50"}`}>
          AI-Powered Trading Intelligence
        </p>
      </div>

      {/* Tabs */}
      <div className="card-section-reveal" style={{ animationDelay: "0.1s" }}>
        <AuthToggle mode={mode} setMode={setMode} darkMode={darkMode} />
      </div>

      {/* Mode heading */}
      <div
        key={`heading-${animKey}`}
        className="card-section-reveal mb-1"
        style={{ animationDelay: "0.15s" }}
      >
        <h2
          className="text-white font-black tracking-wide mt-2 mb-0.5"
          style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", fontSize: "1.55rem", letterSpacing: "0.04em" }}
        >
          {mode === "login" ? "WELCOME BACK" : "CREATE ACCOUNT"}
        </h2>
        <p className={`text-xs ${darkMode ? "text-white/35" : "text-white/45"} mb-0`}>
          {mode === "login"
            ? "Sign in to access your trading terminal"
            : "Join 124,000+ traders building smarter strategies"}
        </p>
      </div>

      {/* Form Fields */}
      <div key={`fields-${animKey}`} className="card-section-reveal" style={{ animationDelay: "0.2s" }}>
        <AuthFields mode={mode} darkMode={darkMode} />
      </div>

      {/* Divider — login only */}
      {mode === "login" && (
        <div
          key={`divider-${animKey}`}
          className="relative flex items-center py-5 card-section-reveal"
          style={{ animationDelay: "0.25s" }}
        >
          <div className="flex-grow border-t border-white/10" />
          <span className="mx-4 text-xs font-semibold tracking-widest uppercase text-white/30">
            Or continue with
          </span>
          <div className="flex-grow border-t border-white/10" />
        </div>
      )}

      {mode === "login" && (
        <div className="card-section-reveal" style={{ animationDelay: "0.3s" }}>
          <SocialButtons darkMode={darkMode} />
        </div>
      )}

      {/* Footer */}
      <div className="card-section-reveal" style={{ animationDelay: "0.35s" }}>
        <AuthFooter mode={mode} setMode={setMode} darkMode={darkMode} />
      </div>
    </div>
  );
}