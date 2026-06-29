"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useState } from "react";

// App-wide TanStack Query provider. All server/async state in client components
// flows through this client (see AGENTS.md) rather than hand-rolled
// useState/useEffect fetch logic.
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <>
      <SpeedInsights />
      <Analytics />
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </>
  );
}
