import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { data: user, isLoading, status } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    throwOnError: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
  });
  const isAuthenticated = !!user;
  
  // Check if user has admin or support access
  const clientAdminAllowlist = [
    'trexia.olaya@pdax.ph',
    'mariatrexiaolaya@gmail.com',
    'trexiaamable@gmail.com',
    'ronaustria08@gmail.com',
  ];
  const userEmail = ((user as any)?.email || '').toLowerCase();
  const hasAdminAccess =
    (user as any)?.isAdmin === true ||
    (user as any)?.isSupport === true ||
    clientAdminAllowlist.includes(userEmail);

  // Loading state
  if (isLoading || status === 'loading') {
    console.log('AdminRoute: Loading user data...');
    return (
<div className="min-h-screen bg-background flex items-center justify-center">        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Remove dev debug banner and render normally

  // Access denied for non-admin users (this check works in both dev and production)
  if (!user || !hasAdminAccess) {
    console.log('AdminRoute: Access denied', { 
      user: user?.email, 
      isAdmin: (user as any)?.isAdmin, 
      isSupport: (user as any)?.isSupport,
      userEmail,
      hasAdminAccess 
    });
    return (
<div className="min-h-screen bg-background flex items-center justify-center">        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-16 w-16 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access the admin panel. This area is restricted to administrators and support staff only.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('AdminRoute: Access granted', { user: user?.email });
  return <>{children}</>;
}