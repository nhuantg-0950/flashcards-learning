"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface UseLogoutReturn {
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useLogout(): UseLogoutReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // API returned an error - do NOT redirect, keep user logged in
        setError(data.error || "Failed to logout. Please try again.");
        return;
      }

      // Success - redirect to login page
      // Use router.push + router.refresh to ensure client state is cleared
      router.push("/login");
      router.refresh();
    } catch (err) {
      // Network error or unexpected failure - do NOT redirect
      console.error("Logout error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return {
    logout,
    isLoading,
    error,
  };
}
