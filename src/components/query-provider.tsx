"use client";

import { useState } from "react";
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useUiStore } from "@/hooks/use-ui-store";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Server data only changes through our own mutations, which patch the
        // cache directly — so we rarely need to refetch.
        staleTime: 5 * 60_000,
        gcTime: 30 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
    // Surface any failed mutation in the shared transient error banner.
    mutationCache: new MutationCache({
      onError: (error) => {
        const message =
          error instanceof Error ? error.message : "Something went wrong";
        useUiStore.getState().setError(message);
        setTimeout(() => useUiStore.getState().setError(null), 4000);
      },
    }),
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // One client per provider mount (i.e. per authenticated session).
  const [client] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
