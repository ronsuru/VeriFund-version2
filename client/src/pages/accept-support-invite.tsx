import { useEffect, useState } from "react";
import { useLocation, useRouter } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";

function AcceptSupportInvite() {
  const [location] = useLocation();
  const [, setLocation] = useRouter();
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    throwOnError: false
  });
  const isAuthenticated = !!user;
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);

  // Extract token from URL path
  useEffect(() => {
    const pathParts = location.split('/');
    const tokenFromPath = pathParts[pathParts.length - 1];
    setToken(tokenFromPath);
  }, [location]);

  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationToken: string) => {
      return await apiRequest('/api/accept-support-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: invitationToken }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "🎉 Welcome to the Support Team!",
        description: data.message,
        duration: 5000,
      });
      
      // Redirect to home page after successful acceptance
      setTimeout(() => {
        setLocation('/');
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Invitation Error",
        description: error.message || "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAcceptInvitation = () => {
    if (token) {
      acceptInvitationMutation.mutate(token);
    }
  };

  // If still loading auth, show loading state
  if (isLoading) {
    return (
<div className="min-h-screen bg-background">        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    window.location.href = `/login${token ? `?invitation=${token}` : ''}`;
    return (
<div className="min-h-screen bg-background">        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-muted-foreground">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
<div className="min-h-screen bg-background">      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-primary">
                🎉 Support Staff Invitation
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    Welcome to VeriFund Support Team!
                  </h3>
                  <p className="text-blue-700">
                    You've been invited to join as a Support Staff member. 
                    As part of the support team, you'll help users, manage tickets, 
                    and assist with platform operations.
                  </p>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p><strong>Logged in as:</strong> {user?.email}</p>
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    onClick={handleAcceptInvitation}
                    disabled={!token || acceptInvitationMutation.isPending}
                    className="px-8"
                    data-testid="button-accept-invitation"
                  >
                    {acceptInvitationMutation.isPending 
                      ? "Accepting..." 
                      : "Accept Invitation"
                    }
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setLocation('/')}
                    data-testid="button-decline-invitation"
                  >
                    Decline
                  </Button>
                </div>

                {acceptInvitationMutation.isPending && (
                  <div className="text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-2"></div>
                    Processing your invitation...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AcceptSupportInvite;