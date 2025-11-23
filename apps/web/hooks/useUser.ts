import  useSWR  from "swr";
import { api } from "../lib/api";
import { User } from "../types/index";

const fetcher = (url: string) => api<User>(url);

export function useUser() {
  const { data, error, isLoading } = useSWR("/auth/me", fetcher, {
    shouldRetryOnError: false,
  });

  return {
    user: data,
    isLoading,
    isError: error,
  };
}
