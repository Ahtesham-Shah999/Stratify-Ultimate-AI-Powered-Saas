// app/forgot-password/page.tsx
"use client";

import React from "react";
import ForgotPassword from "@/app/components/Auth/ForgotPassword"; // adjust path accordingly
import { useTheme } from "@/context/theme-context";

const ForgotPasswordPage = () => {
  const { darkMode } = useTheme();

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${
        darkMode ? "bg-[#1e0101]" : "bg-[#F8F5F5]"
      }`}
    >
      <div className="w-full max-w-md">
        <ForgotPassword />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
