"use client";
import React, { useEffect, useState } from "react";
import "./loader.css";

export default function StratifyLoader() {
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Hold the loader for at least 2.5 seconds to show the animation,
    // then fade it out.
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(() => setHidden(true), 500); // Wait for CSS opacity transition
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (hidden) return null;

  return (
    <div id="loading-screen" className={fading ? "fade-out" : ""}>
      {/* Orbs */}
      <div className="loader-orb loader-orb-1" />
      <div className="loader-orb loader-orb-2" />

      {/* Content */}
      <div className="loader-content">
        <div className="zevenz-logo-loader">
          {"STRATIFY".split("").map((letter, i) => (
            <span key={i} className="logo-letter">
              {letter}
            </span>
          ))}
        </div>
        <div className="loader-tagline">Quantitative Trading Platform</div>
        <div className="loader-bar">
          <div className="loader-progress" />
        </div>
      </div>
    </div>
  );
}
