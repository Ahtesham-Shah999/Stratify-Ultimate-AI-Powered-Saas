"use client";

import React, { useEffect, useState } from "react";
import { z } from "zod";
import { SetNewPasswordSchema } from "@/lib/validations";
import { useTheme } from "@/context/theme-context";
import { useRouter } from "next/navigation";
import { updateUserApi } from "@/lib/userapi";

type FormValues = {
  newPassword: string;
  confirmPassword: string;
};

export default function ResetPassword() {
  const router = useRouter();
  const { darkMode } = useTheme();

  const [email, setEmail] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<FormValues>({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Load email from localStorage
  useEffect(() => {
    const storedEmail = localStorage.getItem("otpEmail");

    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      setApiError("Invalid reset request. Email not found.");
    }
  }, []);

  const handleChange = (field: keyof FormValues, value: string) => {
    setFormValues({ ...formValues, [field]: value });

    try {
      SetNewPasswordSchema.parse({ ...formValues, [field]: value });
      setErrors({ ...errors, [field]: "" });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldError = err.issues.find((e) => e.path[0] === field);
        setErrors({ ...errors, [field]: fieldError ? fieldError.message : "" });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setApiError("Email not found. Cannot reset password.");
      return;
    }

    try {
      SetNewPasswordSchema.parse(formValues);
      setErrors({});
      setApiError(null);
      setLoading(true);

      // Send ONLY password to backend
      const payload = {
        password: formValues.newPassword,
      };

      await updateUserApi(email, payload);

      // Clear stored email

      router.push("/login?reset=success");
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const formErrors: Partial<FormValues> = {};
        err.issues.forEach((issue) => {
          formErrors[issue.path[0] as keyof FormValues] = issue.message;
        });
        setErrors(formErrors);
      } else {
        setApiError(err?.message || "Something went wrong!");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputBaseClasses =
    "w-full rounded-lg border px-4 py-3.5 text-white placeholder:text-gray-500 focus:ring-2 transition";

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="absolute inset-x-0 top-0 h-1/2 w-full bg-gradient-to-b from-primary/30 via-primary/10 to-transparent blur-3xl"></div>

      <div
        className={`relative z-10 w-full max-w-md rounded-xl border p-8 shadow-2xl backdrop-blur-lg ${
          darkMode ? "border-white/10 bg-black" : "border-gray-300/30 bg-white"
        }`}
      >
        <div className="text-center mb-8">
          <h1
            className={`tracking-tight text-3xl font-bold ${
              darkMode ? "text-white" : "text-black"
            }`}
          >
            Reset Your Password
          </h1>
          <p
            className={`text-base mt-2 ${
              darkMode ? "text-gray-400" : "text-gray-700"
            }`}
          >
            Create a new strong password for your account
          </p>
        </div>

        {apiError && (
          <p className="text-red-500 text-sm mb-4 text-center">{apiError}</p>
        )}

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* New Password */}
          <div className="flex flex-col gap-2">
            <label
              className={`text-sm font-medium ${
                darkMode ? "text-white" : "text-black"
              }`}
              htmlFor="new-password"
            >
              New Password
            </label>
            <div className="relative flex w-full items-center">
              <input
                id="new-password"
                type={showNew ? "text" : "password"}
                placeholder="Enter new password"
                value={formValues.newPassword}
                onChange={(e) => handleChange("newPassword", e.target.value)}
                className={`${inputBaseClasses} ${
                  darkMode
                    ? "border-white/20 bg-white/5"
                    : "border-gray-300/30 bg-gray-50 text-black"
                }`}
              />
              <div
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 text-white/40 cursor-pointer"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                  {showNew ? "visibility" : "visibility_off"}
                </span>
              </div>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-sm pt-1">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-2">
            <label
              className={`text-sm font-medium ${
                darkMode ? "text-white" : "text-black"
              }`}
              htmlFor="confirm-password"
            >
              Confirm Password
            </label>
            <div className="relative flex w-full items-center">
              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm new password"
                value={formValues.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                className={`${inputBaseClasses} ${
                  darkMode
                    ? "border-white/20 bg-white/5"
                    : "border-gray-300/30 bg-gray-50 text-black"
                }`}
              />
              <div
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 text-white/40 cursor-pointer"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                  {showConfirm ? "visibility" : "visibility_off"}
                </span>
              </div>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm pt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-lg bg-[#F90606] text-white font-bold tracking-wide hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a
            className={`text-sm font-medium hover:text-primary transition ${
              darkMode ? "text-gray-400" : "text-gray-700"
            }`}
            href="/login"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
