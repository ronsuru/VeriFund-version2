import { useQuery } from "@tanstack/react-query";
import { auth } from "@/supabaseClient";

export function useAuth() {
// Rely on server auth shape so we get roles, kycStatus, etc.
  const { data: serverUser, isLoading, status, error } = useQuery({
    queryKey: ["/api/auth/user"],
    // Always re-check auth on mount so KYC/roles are fresh after admin actions
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Default query fn returns null on 401; treat null as unauthenticated
  const isAuthenticated = !!serverUser && status === "success";

  return {
    user: serverUser || null,
    isLoading: status === "loading" || isLoading,
    isAuthenticated,
    error: serverUser ? null : error,  };
}
