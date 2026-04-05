"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header/page";
import { useTheme } from "@/context/theme-context";
import { isLoggedIn } from "@/utils/auth"; // the helper we discussed

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { darkMode } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login"); 
    }
  }, [router]);

  // Optionally, prevent rendering the dashboard until login check completes
  if (!isLoggedIn()) return null;

  return (
    <div className={darkMode ? "bg-[#230f0f]" : "bg-[#f8f5f5]"}>
      <Header />
      <main className="p-6">{children}</main>
    </div>
  );
}
