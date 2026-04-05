"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header/page";
import { isLoggedIn } from "@/utils/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  // Wait for hydration and authentication check
  useEffect(() => {
    setHydrated(true); // mark client-side hydration
    if (!isLoggedIn()) {
      router.push("/login"); // redirect to login if not authenticated
    } else {
      setAuthenticated(true); // allow rendering if authenticated
    }
  }, [router]);

  // If the page is still hydrating or checking authentication, show loading screen
  if (!hydrated || !authenticated) {
    return (
      null
    );
  }

  // After hydration and auth check, render the actual page content
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
