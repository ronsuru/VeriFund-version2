import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  UserCheck, 
  Mail, 
  Clock, 
  RotateCcw, 
  XCircle, 
  Users, 
  TrendingUp, 
  BarChart3,
  Eye,
  Edit,
  Shield,
  Star,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  MessageSquare,
  FileText,
  Award,
  Check,
  X,
  Send,
  UserPlus
} from "lucide-react";

interface SupportInvitation {
  id: string;
  email: string;
  invitedBy: string;
  token: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  revokedAt?: string;
}

interface SupportStaff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
  isSupport: boolean;
  dateInvited?: string;
  dateJoined?: string;
  invitedBy?: string;
  supportStatus?: string;
  workExperienceDetails?: string;
  skills?: string;
  certifications?: string;
  previousRoles?: string;
  bio?: string;
  interests?: string;
  languages?: string;
  location?: string;
  createdAt: string;
}

interface PerformanceMetrics {
  userId: string;
  name: string;
  email: string;
  role: string;
  dateJoined: string;
  supportTickets: {
    count: number;
    avgResponseTime: number;
    resolutionRate: number;
  };
  documents: {
    reviewed: number;
    approved: number;
    flagged: number;
  };
  campaigns: {
    handled: number;
    approved: number;
    rejected: number;
  };
}

function InviteManagement() {
  const [inviteEmail, setInviteEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending invitations
  const { data: invitations = [], isLoading } = useQuery<SupportInvitation[]>({
    queryKey: ["/api/admin/support/invitations"],
    retry: false,
  });

  // Invite support staff mutation
  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest("/api/admin/support/invite", {
        method: "POST",
        body: { email },
      });
    },
    onSuccess: () => {
      toast({ 
        title: "Invitation Sent", 
        description: "Support invitation has been sent successfully. The invitation will expire in 72 hours." 
      });
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/invitations"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to Send Invitation", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Resend invitation mutation
  const resendMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      return apiRequest(`/api/admin/access/invitations/${invitationId}/resend`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({ title: "Invitation Resent", description: "Invitation has been resent successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/invitations"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Resend", description: error.message, variant: "destructive" });
    },
  });

  // Revoke invitation mutation
  const revokeMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      return apiRequest(`/api/admin/access/invitations/${invitationId}/revoke`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({ title: "Invitation Revoked", description: "Invitation has been revoked successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/invitations"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Revoke", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (invitation: SupportInvitation) => {
    const now = new Date();
    const expiresAt = new Date(invitation.expiresAt);
    
    if (invitation.status === "revoked") {
      return <Badge variant="destructive">Revoked</Badge>;
    }
    if (invitation.status === "accepted") {
      return <Badge variant="default">Accepted</Badge>;
    }
    if (expiresAt < now) {
      return <Badge variant="secondary">Expired</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading invitations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Send New Invitation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5" />
            <span>Invite Support Staff</span>
          </CardTitle>
          <CardDescription>
            Send an invitation to join the support team. Invitations expire after 72 hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              type="email"
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
              data-testid="input-invite-email"
            />
            <Button 
              onClick={() => inviteMutation.mutate(inviteEmail)}
              disabled={inviteMutation.isPending || !inviteEmail}
              data-testid="button-send-invite"
            >
              <Send className="w-4 h-4 mr-2" />
              {inviteMutation.isPending ? "Sending..." : "Send Invite"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Invitations</CardTitle>
          <CardDescription>View and manage pending support staff invitations</CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending support invitations.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(invitations as SupportInvitation[]).map((invitation: SupportInvitation) => {
                const isExpired = new Date(invitation.expiresAt) < new Date();
                const canResend = invitation.status === "pending" || isExpired;
                const canRevoke = invitation.status === "pending";
                
                return (
                  <Card key={invitation.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{invitation.email}</h4>
                            {getStatusBadge(invitation)}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>Sent: {new Date(invitation.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Expires: {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                            </div>
                            {invitation.acceptedAt && (
                              <div className="flex items-center space-x-1">
                                <Check className="w-3 h-3" />
                                <span>Accepted: {new Date(invitation.acceptedAt).toLocaleDateString()}</span>
                              </div>
                            )}
                            {invitation.revokedAt && (
                              <div className="flex items-center space-x-1">
                                <X className="w-3 h-3" />
                                <span>Revoked: {new Date(invitation.revokedAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {canResend && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resendMutation.mutate(invitation.id)}
                              disabled={resendMutation.isPending}
                              data-testid={`button-resend-${invitation.id}`}
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Resend
                            </Button>
                          )}
                          {canRevoke && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => revokeMutation.mutate(invitation.id)}
                              disabled={revokeMutation.isPending}
                              data-testid={`button-revoke-${invitation.id}`}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Revoke
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StaffDirectory() {
  const [selectedStaff, setSelectedStaff] = useState<SupportStaff | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<SupportStaff>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all support staff
  const { data: staff = [], isLoading } = useQuery<SupportStaff[]>({
    queryKey: ["/api/admin/access/staff"],
    retry: false,
  });

  // Update staff profile mutation
  const updateMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<SupportStaff> }) => {
      return apiRequest(`/api/admin/access/staff/${userId}`, {
        method: "PUT",
        body: data,
      });
    },
    onSuccess: () => {
      toast({ title: "Profile Updated", description: "Staff profile has been updated successfully." });
      setEditMode(false);
      setSelectedStaff(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/access/staff"] });
    },
    onError: (error: Error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (staff: SupportStaff) => {
    setSelectedStaff(staff);
    setEditForm(staff);
    setEditMode(true);
  };

  const handleSave = () => {
    if (selectedStaff) {
      updateMutation.mutate({ userId: selectedStaff.id, data: editForm });
    }
  };

  const parseJsonField = (field: string | undefined) => {
    if (!field) return [];
    try {
      return JSON.parse(field);
    } catch {
      return field.split(',').map(item => item.trim()).filter(Boolean);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading staff directory...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Support Staff Directory</span>
          </CardTitle>
          <CardDescription>
            View and manage all support staff members and their profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No support staff members found.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(staff as SupportStaff[]).map((member: SupportStaff) => (
                <Card key={member.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{member.firstName} {member.lastName}</h3>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {member.isAdmin ? (
                            <Badge variant="default">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Support
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {member.location && (
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{member.location}</span>
                        </div>
                      )}
                      
                      {member.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{member.bio}</p>
                      )}
                      
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>Joined: {new Date(member.dateJoined || member.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{member.firstName} {member.lastName}</DialogTitle>
                              <DialogDescription>{member.email}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Role</Label>
                                  <p className="text-sm">{member.isAdmin ? 'Administrator' : 'Support Staff'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Status</Label>
                                  <p className="text-sm">{member.supportStatus || 'Active'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Date Joined</Label>
                                  <p className="text-sm">{new Date(member.dateJoined || member.createdAt).toLocaleDateString()}</p>
                                </div>
                                {member.location && (
                                  <div>
                                    <Label className="text-sm font-medium">Location</Label>
                                    <p className="text-sm">{member.location}</p>
                                  </div>
                                )}
                              </div>
                              
                              {member.bio && (
                                <div>
                                  <Label className="text-sm font-medium">Bio</Label>
                                  <p className="text-sm">{member.bio}</p>
                                </div>
                              )}
                              
                              {member.workExperienceDetails && (
                                <div>
                                  <Label className="text-sm font-medium">Work Experience</Label>
                                  <p className="text-sm">{member.workExperienceDetails}</p>
                                </div>
                              )}
                              
                              {member.skills && (
                                <div>
                                  <Label className="text-sm font-medium">Skills</Label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {parseJsonField(member.skills).map((skill: string, index: number) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {member.languages && (
                                <div>
                                  <Label className="text-sm font-medium">Languages</Label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {parseJsonField(member.languages).map((lang: string, index: number) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {lang}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(member)}
                          data-testid={`button-edit-${member.id}`}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Staff Dialog */}
      <Dialog open={editMode} onOpenChange={setEditMode}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Staff Profile</DialogTitle>
            <DialogDescription>
              Update staff member profile information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName || ""}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName || ""}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editForm.bio || ""}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Short personal bio..."
              />
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={editForm.location || ""}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                placeholder="e.g., Manila, Philippines"
              />
            </div>
            
            <div>
              <Label htmlFor="workExperience">Work Experience</Label>
              <Textarea
                id="workExperience"
                value={editForm.workExperienceDetails || ""}
                onChange={(e) => setEditForm({ ...editForm, workExperienceDetails: e.target.value })}
                placeholder="Detailed work experience..."
              />
            </div>
            
            <div>
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                value={typeof editForm.skills === 'string' ? editForm.skills : parseJsonField(editForm.skills).join(', ')}
                onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                placeholder="e.g., Customer Service, Technical Support, Communication"
              />
            </div>
            
            <div>
              <Label htmlFor="languages">Languages (comma-separated)</Label>
              <Input
                id="languages"
                value={typeof editForm.languages === 'string' ? editForm.languages : parseJsonField(editForm.languages).join(', ')}
                onChange={(e) => setEditForm({ ...editForm, languages: e.target.value })}
                placeholder="e.g., English, Filipino, Tagalog"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateMutation.isPending}
                data-testid="button-save-profile"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PerformanceAnalytics() {
  const { data: metrics = [], isLoading } = useQuery<PerformanceMetrics[]>({
    queryKey: ["/api/admin/access/performance"],
    retry: false,
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading performance analytics...</div>;
  }

  const metricsArray = metrics as PerformanceMetrics[];
  const totalTickets = metricsArray.reduce((sum: number, m: PerformanceMetrics) => sum + m.supportTickets.count, 0);
  const totalDocuments = metricsArray.reduce((sum: number, m: PerformanceMetrics) => sum + m.documents.reviewed, 0);
  const totalCampaigns = metricsArray.reduce((sum: number, m: PerformanceMetrics) => sum + m.campaigns.handled, 0);
  const avgResolutionRate = metricsArray.length > 0 
    ? metricsArray.reduce((sum: number, m: PerformanceMetrics) => sum + m.supportTickets.resolutionRate, 0) / metricsArray.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalTickets}</p>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{totalDocuments}</p>
                <p className="text-sm text-muted-foreground">Documents Reviewed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{totalCampaigns}</p>
                <p className="text-sm text-muted-foreground">Campaigns Handled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{avgResolutionRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Avg Resolution Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Individual Performance</span>
          </CardTitle>
          <CardDescription>
            Detailed performance metrics for each support staff member
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metricsArray.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No performance data available.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {metricsArray.map((member: PerformanceMetrics) => (
                <Card key={member.userId} className="border">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{member.name}</h3>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <Badge variant={member.role === 'Admin' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Support Tickets */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium">Support Tickets</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Total Handled:</span>
                              <span className="font-medium">{member.supportTickets.count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Avg Response Time:</span>
                              <span className="font-medium">{member.supportTickets.avgResponseTime.toFixed(1)}h</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Resolution Rate:</span>
                              <span className="font-medium">{member.supportTickets.resolutionRate.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Documents */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">Documents</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Reviewed:</span>
                              <span className="font-medium">{member.documents.reviewed}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Approved:</span>
                              <span className="font-medium">{member.documents.approved}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Flagged:</span>
                              <span className="font-medium">{member.documents.flagged}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Campaigns */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Award className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium">Campaigns</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Handled:</span>
                              <span className="font-medium">{member.campaigns.handled}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Approved:</span>
                              <span className="font-medium">{member.campaigns.approved}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Rejected:</span>
                              <span className="font-medium">{member.campaigns.rejected}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AccessPanel() {
  const [activeTab, setActiveTab] = useState("invitations");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <span>Access Panel</span>
        </CardTitle>
        <CardDescription>
          Comprehensive support staff management system with invitation controls, staff directory, and performance analytics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="invitations" data-testid="tab-invitations">
              <Mail className="w-4 h-4 mr-2" />
              Invitations
            </TabsTrigger>
            <TabsTrigger value="directory" data-testid="tab-directory">
              <Users className="w-4 h-4 mr-2" />
              Staff Directory
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invitations" className="mt-6">
            <InviteManagement />
          </TabsContent>

          <TabsContent value="directory" className="mt-6">
            <StaffDirectory />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <PerformanceAnalytics />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}