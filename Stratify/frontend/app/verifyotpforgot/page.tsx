"use client";

import React from "react";
import Verifyotpforgot from "@/app/components/Auth/verifyotpforgot";
import { useTheme } from "@/context/theme-context";

const otpverification = () => {
  const { darkMode } = useTheme();

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${
        darkMode ? "bg-black" : "bg-[#F8F5F5]"
      }`}
    >
      <div className="w-full max-w-md">
        <Verifyotpforgot />
      </div>
    </div>
  );
};

export default otpverification;
