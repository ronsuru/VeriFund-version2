import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  Mail, 
  Shield,
  UserPlus,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

export default function Support() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
description: "Please sign in to continue.",
        variant: "destructive",
      });
      import('@/lib/loginModal').then(m => m.openLoginModal());      return;
    }

    if (!isLoading && isAuthenticated && !(user as any)?.isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Fetch support invitations
  const { data: supportInvitations = [] } = useQuery({
    queryKey: ["/api/admin/support/invitations"],
    enabled: !!((user as any)?.isAdmin),
    retry: false,
  });

  // Invite support staff mutation
  const inviteSupportMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("POST", "/api/admin/support/invite", { email });
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: "Support invitation has been sent successfully.",
      });
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/invitations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

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

  return (
<div className="min-h-screen bg-background">      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-support-title">
            Support Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage support staff and invitations for the VeriFund platform
          </p>
        </div>

        {/* Support Management Cards */}
        <div className="space-y-6">
          {/* Platform Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <span>Support Team Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center">
                    <UserPlus className="w-5 h-5 mr-2 text-green-600" />
                    Support Team Purpose
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                      <span>Assist users with platform navigation and issues</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                      <span>Review and approve campaigns for compliance</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                      <span>Handle user support requests and inquiries</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                      <span>Monitor platform activity for community safety</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                    Support Staff Guidelines
                  </h3>
                  <div className="space-y-3">
                    <Alert className="border-blue-200 bg-blue-50">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        <strong>Limited Access:</strong> Support staff have restricted admin permissions and cannot invite other staff members.
                      </AlertDescription>
                    </Alert>
                    
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <strong>Invitation Expiry:</strong> Support invitations expire after 7 days. Resend if needed.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invite Support Staff */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>Invite Support Staff</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Input
                  type="email"
                  placeholder="Enter verified email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                  data-testid="input-invite-email"
                />
                <Button
                  onClick={() => inviteSupportMutation.mutate(inviteEmail)}
                  disabled={inviteSupportMutation.isPending || !inviteEmail}
                  data-testid="button-send-invite"
                >
                  {inviteSupportMutation.isPending ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Support staff can access the admin panel with limited permissions (cannot invite other support staff)
              </p>
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Pending Support Invitations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {supportInvitations && supportInvitations.length > 0 ? (
                <div className="space-y-4">
                  {supportInvitations.map((invitation: any) => (
                    <Card key={invitation.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium" data-testid={`invitation-email-${invitation.id}`}>
                              {invitation.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Invited {new Date(invitation.createdAt).toLocaleDateString()}
                              {' • Expires ' + new Date(invitation.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge 
                            variant={invitation.status === 'pending' ? 'outline' : 'secondary'}
                            data-testid={`invitation-status-${invitation.id}`}
                          >
                            {invitation.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending invitations</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Invite support staff members to help manage the platform
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}