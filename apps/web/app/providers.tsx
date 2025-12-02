"use client";

import { SWRConfig } from "swr";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        // Global SWR configuration
        dedupingInterval: 5000, // Dedupe identical requests within 5 seconds
        errorRetryCount: 2, // Only retry failed requests twice
        errorRetryInterval: 3000, // Wait 3 seconds between retries
        revalidateOnFocus: false, // Don't revalidate when window regains focus
        revalidateOnReconnect: true, // Revalidate when network reconnects
      }}
    >
      {children}
    </SWRConfig>
  );
}

