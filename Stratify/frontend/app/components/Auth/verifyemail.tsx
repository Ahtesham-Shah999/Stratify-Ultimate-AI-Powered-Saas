"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OtpSchema } from "@/lib/validations";
import { z } from "zod";
import { verifyOtpApi, sendOtpApi } from "@/lib/auth";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

const VerifyEmail: React.FC = () => {
  const router = useRouter();
  const inputsRef = useRef<HTMLInputElement[]>([]);
  const [errors, setErrors] = useState<string[]>(["", "", "", "", "", ""]);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<"TRADER" | "ADMIN" | null>(null);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState("");

  // Read from localStorage on mount
  useEffect(() => {
    const storedEmail = localStorage.getItem("otpEmail");
    const storedRole = localStorage.getItem("otpRole") as "TRADER" | "ADMIN" | null;

    if (!storedEmail || !storedRole) {
      router.push("/login");
      return;
    }

    setEmail(storedEmail);
    setRole(storedRole);
  }, [router]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    const input = inputsRef.current[idx];
    if (!input) return;

    if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
    if (e.key === "Backspace" && input.value === "" && idx > 0) {
      inputsRef.current[idx - 1].focus();
      inputsRef.current[idx - 1].value = "";
      inputsRef.current[idx - 1].classList.remove("border-red-500", "success-glow");
    }

    if (e.key === "ArrowLeft" && idx > 0) inputsRef.current[idx - 1].focus();
    if (e.key === "ArrowRight" && idx < 5) inputsRef.current[idx + 1].focus();
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    const input = inputsRef.current[idx];
    if (!input) return;

    const value = input.value;
    if (value === "") {
      input.classList.remove("border-red-500", "success-glow");
      return;
    }

    if (!/^\d$/.test(value)) {
      input.classList.add("border-red-500");
      input.classList.remove("success-glow");
      return;
    }

    input.classList.remove("border-red-500");
    input.classList.add("success-glow");

    if (idx < 5) inputsRef.current[idx + 1].focus();
  };

  const handleSubmit = async () => {
    if (!email || !role) return;

    const values = inputsRef.current.map((inp) => inp.value);
    setServerError("");
    setLoading(true);

    try {
      OtpSchema.parse({
        otp1: values[0],
        otp2: values[1],
        otp3: values[2],
        otp4: values[3],
        otp5: values[4],
        otp6: values[5],
      });

      const otp = values.join("");

      await verifyOtpApi(role, email, otp);

      setShowOtpDialog(true);

      // Clear localStorage
     

      // Redirect after 5 seconds
      setTimeout(() => {
        router.push("/login");
      }, 5000);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const newErrors = ["", "", "", "", "", ""];
        err.issues.forEach((e: any) => {
          const field = e.path[0] as string;
          const index = Number(field.replace("otp", "")) - 1;
          newErrors[index] = e.message;
          inputsRef.current[index]?.classList.add("border-red-500");
          inputsRef.current[index]?.classList.remove("success-glow");
        });
        setErrors(newErrors);
      } else {
        setServerError(err?.message || "Failed to verify OTP");
      }
    }

    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (!email || !role) return;

    setResendError("");
    setResendLoading(true);

    try {
      await sendOtpApi(role, email, "Otp Verification");
      alert("OTP sent successfully!");
    } catch (err: any) {
      setResendError(err?.message || "Failed to resend OTP");
    }

    setResendLoading(false);
  };

  return (
    <div className="relative flex w-full flex-col items-center p-4">
      <div className="w-full rounded-xl border border-white/10 bg-black/50 p-6 shadow-2xl backdrop-blur-lg md:p-8">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-white text-[32px] font-bold leading-tight tracking-tight">
            Verify Your Email
          </h1>
          <p className="mt-2 text-base font-normal leading-normal text-white/80">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        {/* OTP Inputs */}
        <div className="mt-8 flex justify-center">
          <fieldset className="flex gap-2 sm:gap-3">
            {[...Array(6)].map((_, i) => (
              <input
                key={i}
                ref={(el) => {
                  if (el) inputsRef.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onKeyUp={(e) => handleKeyUp(e, i)}
                className={`h-12 w-10 sm:h-14 sm:w-12 rounded-lg border border-white/20
                  bg-[rgba(255,255,255,0.05)] text-center text-xl font-bold text-white
                  transition-all duration-200 appearance-none select-none
                  focus:border-[#f90606] focus:outline-none focus:ring-2 
                  focus:ring-[#f90606]/50`}
              />
            ))}
          </fieldset>
        </div>

        {/* API Error */}
        {serverError && <p className="mt-4 text-center text-sm text-red-500">{serverError}</p>}

        {/* Resend OTP */}
        <div className="mt-6 text-center">
          <p className="text-sm font-normal text-white/70">
            Didn’t receive a code?{" "}
            <span
              className="font-semibold text-[#f90606] underline transition-opacity hover:opacity-80 cursor-pointer"
              onClick={handleResendOtp}
            >
              {resendLoading ? "Resending..." : "Resend Code"}
            </span>
          </p>
          {resendError && <p className="mt-2 text-sm text-red-500">{resendError}</p>}
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex w-full flex-col items-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex h-12 w-full cursor-pointer items-center justify-center 
              rounded-lg bg-[#f90606] text-base font-bold text-white shadow-lg 
              shadow-[#f90606]/30 transition-all duration-300 hover:shadow-[#f90606]/50 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Continue"}
          </button>
        </div>
      </div>

      {/* Success Dialog */}
      {showOtpDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center bg-white rounded-lg p-6 shadow-lg animate-fadeIn">
            <CheckCircleIcon className="h-16 w-16 text-green-500 animate-bounce" />
            <h2 className="mt-4 text-xl font-bold text-green-600">Registered!</h2>
            <p className="mt-2 text-gray-700 text-center">OTP Verified! Redirecting to login...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyEmail;
