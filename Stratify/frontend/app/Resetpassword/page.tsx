// app/forgot-password/page.tsx
"use client";

import React from "react";
import ResetPassword from "@/app/components/Auth/ResetPassword"; // adjust path accordingly
import { useTheme } from "@/context/theme-context";

const ResetPasswordPage = () => {
  const { darkMode } = useTheme();

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${
        darkMode ? "bg-[#1e0101]" : "bg-[#F8F5F5]"
      }`}
    >
      <div className="w-full max-w-md">
        <ResetPassword />
      </div>
    </div>
  );
};

export default ResetPasswordPage;
