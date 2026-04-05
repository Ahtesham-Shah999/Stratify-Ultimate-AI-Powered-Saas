"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header/page";
import { isLoggedIn } from "@/utils/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login"); // redirect if not authenticated
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  // Prevent rendering until authentication is checked
  if (!authChecked) return null;

  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
