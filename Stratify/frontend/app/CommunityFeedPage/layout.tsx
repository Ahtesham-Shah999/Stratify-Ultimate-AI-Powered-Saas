"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header/page";
import { isLoggedIn } from "@/utils/auth";


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login"); // redirect to login if not authenticated
    }
  }, [router]);

  // Prevent rendering dashboard until authentication is verified
  if (!isLoggedIn()) return null;

  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
