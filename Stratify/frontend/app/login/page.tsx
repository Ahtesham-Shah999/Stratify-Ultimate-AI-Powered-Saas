"use client";

import React, { useState } from "react";
import AuthCard from "@/app/components/Auth/AuthCard";
import TermsNote from "@/app/components/Auth/TermsNote";

import { useTheme } from "@/context/theme-context";

export default function Page() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const { darkMode } = useTheme();

  return (
    <div
      className={`relative flex min-h-screen w-full items-center justify-center overflow-hidden ${
        darkMode ? "bg-background-dark" : "bg-background-light"
      }`}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-no-repeat bg-center"
        style={{
          backgroundImage: `
      linear-gradient(0deg, rgba(0,0,0,0.7), rgba(0,0,0,0.4)),
      url('/images/bglogin.png')
    `,
          backgroundSize: "cover", // <-- FIX
          backgroundPosition: "center 30%",
          backgroundAttachment: "fixed", // prevents movement
        }}
      ></div>

      {/* Content */}
      <div className="relative z-10 max-w-md w-full p-4">
        <AuthCard mode={mode} setMode={setMode} darkMode={darkMode} />
        <TermsNote darkMode={darkMode} />
      </div>
    </div>
  );
}
