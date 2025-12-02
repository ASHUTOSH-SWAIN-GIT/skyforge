import { useEffect } from "react";
import useSWR from "swr";
import { useRouter, usePathname } from "next/navigation";
import { api } from "../lib/api";
import { User } from "../types/index";

const fetcher = (url: string) => api<User>(url);

export function useUser() {
  const router = useRouter();
  const pathname = usePathname();
  const { data, error, isLoading } = useSWR("/auth/me", fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // Cache user data for 1 minute
    revalidateIfStale: false, // Don't revalidate stale data automatically
  });

  // Handle auth errors by redirecting to login (only on protected routes)
  useEffect(() => {
    if (error) {
      // Check if it's an auth error (401 Unauthorized or 404 Not Found for /auth/me)
      const status = (error as any)?.status;
      if (status === 401 || status === 404) {
        // Only redirect if we're on a protected route (dashboard)
        // Don't redirect from landing page or other public pages
        const isProtectedRoute = pathname?.startsWith("/dashboard");
        if (isProtectedRoute) {
          // Clear the cookie and redirect
          document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          router.push("/login");
        }
      }
    }
  }, [error, router, pathname]);

  return {
    user: data,
    isLoading,
    isError: error,
  };
}
