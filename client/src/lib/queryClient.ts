import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "../supabaseClient";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, {
    method,
    headers: { ...headers, 'Cache-Control': 'no-cache' },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    cache: 'no-store',
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    let requestUrl = queryKey.join("/") as string;
    if (requestUrl.startsWith('/api/auth/user')) {
      const sep = requestUrl.includes('?') ? '&' : '?';
      requestUrl = `${requestUrl}${sep}ts=${Date.now()}`;
    }

    const res = await fetch(requestUrl, {
      credentials: "include",
      headers: { ...headers, 'Cache-Control': 'no-cache' },
      cache: 'no-store',
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: Infinity, // Cache forever to prevent repeated calls
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Make queryClient available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).queryClient = queryClient;
}
