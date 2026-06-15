"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header/page";
import { useTheme } from "@/context/theme-context";
import { isLoggedIn } from "@/utils/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { darkMode } = useTheme();
  const router = useRouter();
  // authChecked stays false on the server → renders null (no mismatch).
  // useEffect only runs on the client, so localStorage is safe to access.
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  // Return null on the server AND on the first client render before the
  // effect runs. Both sides agree → no hydration mismatch.
  if (!authChecked) return null;

  return (
    <div className={darkMode ? "bg-[#230f0f]" : "bg-[#f8f5f5]"}>
      <Header />
      <main className="p-6">{children}</main>
    </div>
  );
}
