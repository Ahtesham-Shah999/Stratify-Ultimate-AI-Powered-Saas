"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function GlobalLoader() {
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Trigger the loader whenever the route changes
  useEffect(() => {
    setIsLoading(true);

    // Keep it visible for at least 1.5s to show the animation, then fade it out
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!isLoading && typeof window !== "undefined") {
    // Return null completely if we don't need it in the DOM anymore, or let it fade out
  }

  return (
    <div
      id="zevenz-loading-screen"
      className={isLoading ? "" : "fade-out"}
    >
      <div className="loader-orb loader-orb-1"></div>
      <div className="loader-orb loader-orb-2"></div>
      <div className="loader-content">
        <div className="zevenz-logo-loader">
          <span className="logo-letter">S</span>
          <span className="logo-letter">T</span>
          <span className="logo-letter">R</span>
          <span className="logo-letter">A</span>
          <span className="logo-letter">T</span>
          <span className="logo-letter">I</span>
          <span className="logo-letter">F</span>
          <span className="logo-letter">Y</span>
        </div>
        <div className="loader-tagline">AI Crypto Trading</div>
        <div className="loader-bar">
          <div className="loader-progress"></div>
        </div>
      </div>
    </div>
  );
}
