"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SetTokenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      // Store token in localStorage (client-only)
      localStorage.setItem("token", token);

      // Immediately redirect to dashboard
      router.replace("/Dashboard");
    } else {
      // fallback if token missing
      router.replace("/login");
    }
  }, [token, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-600">Redirecting to Dashboard...</p>
    </div>
  );
}
