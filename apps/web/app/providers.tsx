"use client";

import { SWRConfig } from "swr";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        // Global SWR configuration for better caching
        dedupingInterval: 10000, // Dedupe requests within 10 seconds
        focusThrottleInterval: 30000, // Throttle focus revalidation to every 30 seconds
        errorRetryCount: 2, // Only retry failed requests twice
        errorRetryInterval: 5000, // Wait 5 seconds between retries
        revalidateOnFocus: false, // Don't revalidate when window regains focus
        revalidateOnReconnect: true, // Revalidate when network reconnects
        keepPreviousData: true, // Keep showing previous data while fetching new data
      }}
    >
      {children}
    </SWRConfig>
  );
}

