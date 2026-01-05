"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationLoader() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  // Listen for route changes
  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    // These events don't exist in Next.js 14 app router
    // We'll use a different approach with pathname changes
    return () => {};
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
      <div className="h-1 bg-gradient-to-r from-casino-brand via-emerald-400 to-casino-brand bg-[length:200%_100%] animate-[shimmer_1s_ease-in-out_infinite]" />
    </div>
  );
}
