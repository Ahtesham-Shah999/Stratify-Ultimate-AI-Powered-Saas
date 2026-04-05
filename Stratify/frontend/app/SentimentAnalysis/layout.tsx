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
      router.push("/login"); // redirect if not logged in
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  if (!authChecked) return null; // don't render until auth is verified

  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
