import { useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { User } from "../types/index";

const fetcher = (url: string) => api<User>(url);

export function useUser() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR("/auth/me", fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  // Handle auth errors by redirecting to login (only once)
  useEffect(() => {
    if (error) {
      // Check if it's an auth error (401 Unauthorized or 404 Not Found for /auth/me)
      const status = (error as any)?.status;
      if (status === 401 || status === 404) {
        // Clear the cookie and redirect
        document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push("/login");
      }
    }
  }, [error, router]);

  return {
    user: data,
    isLoading,
    isError: error,
  };
}
