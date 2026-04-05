"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header/page";
import { isLoggedIn } from "@/utils/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login"); // redirect if not logged in
    }
  }, [router]);

  // Prevent rendering content until login check completes
  if (!isLoggedIn()) return null;

  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
