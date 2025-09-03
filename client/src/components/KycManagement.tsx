import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Clock, 
  Eye, 
  Search,
  User as UserIcon,
  Mail,
  Calendar,
  AlertTriangle,
  FileSearch
} from "lucide-react";
import type { User } from "@shared/schema";

export default function KycManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedKycUser, setSelectedKycUser] = useState<any>(null);
  const [documentSearchId, setDocumentSearchId] = useState("");
  const [documentSearchResult, setDocumentSearchResult] = useState<any>(null);
  const [isSearchingDocument, setIsSearchingDocument] = useState(false);
  const [activeKycTab, setActiveKycTab] = useState("basic");

  // Fetch KYC data
  const { data: basicUsers = [] } = useQuery({
    queryKey: ["/api/admin/kyc/basic"],
    enabled: !!((user as any)?.isAdmin || (user as any)?.isSupport),
    retry: false,
  }) as { data: any[] };

  const { data: pendingKyc = [] } = useQuery({
    queryKey: ["/api/admin/kyc/pending"],
    enabled: !!((user as any)?.isAdmin || (user as any)?.isSupport),
    retry: false,
  }) as { data: any[] };


  const { data: suspendedUsers = [] } = useQuery({
    queryKey: ["/api/admin/users/suspended"],
    enabled: !!((user as any)?.isAdmin || (user as any)?.isSupport),
    retry: false,
  }) as { data: any[] };

  // Temporarily disable all users query - will be implemented later
  const allUsers: any[] = [];

  // KYC Mutations
  const approveKycMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log("🚀 Frontend: Starting KYC approval for user:", userId);
      try {
        const response = await apiRequest("POST", `/api/admin/kyc/${userId}/approve`, {});
        console.log("✅ Frontend: KYC approval successful:", response);
        return response;
      } catch (error) {
        console.error("❌ Frontend: KYC approval failed:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("🎉 Frontend: KYC approval mutation succeeded");
      toast({ title: "KYC Approved", description: "User KYC has been approved." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/verified"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/my-works/analytics"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
import('@/lib/loginModal').then(m => m.openLoginModal());        return;
      }
      toast({ title: "Error", description: "Failed to approve KYC.", variant: "destructive" });
    },
  });

  const rejectKycMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/kyc/${userId}/reject`, {});
    },
    onSuccess: () => {
      toast({ title: "KYC Rejected", description: "User KYC has been rejected." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/rejected"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/my-works/analytics"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
import('@/lib/loginModal').then(m => m.openLoginModal());        return;
      }
      toast({ title: "Error", description: "Failed to reject KYC.", variant: "destructive" });
    },
  });

  const claimKycMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/kyc/${userId}/claim`, {});
    },
    onSuccess: () => {
      toast({ title: "KYC Claimed", description: "KYC request has been claimed and moved to your work queue." });
      // Immediately remove all caches to force refetch
      queryClient.removeQueries({ queryKey: ["/api/admin/kyc/pending"] });
      queryClient.removeQueries({ queryKey: ["/api/admin/kyc/my-work"] });
      queryClient.removeQueries({ queryKey: ["/api/admin/my-works/kyc"] });
      queryClient.removeQueries({ queryKey: ["/api/admin/my-works/kyc-claimed"] });
      queryClient.removeQueries({ queryKey: ["/api/admin/my-works/analytics"] });
      queryClient.removeQueries({ queryKey: ["/api/admin/kyc/basic"] });
      queryClient.removeQueries({ queryKey: ["/api/admin/kyc/verified"] });
      queryClient.removeQueries({ queryKey: ["/api/admin/kyc/rejected"] });
      // Force immediate refetch to update the UI
      queryClient.refetchQueries({ queryKey: ["/api/admin/kyc/pending"] });
      queryClient.refetchQueries({ queryKey: ["/api/admin/my-works/kyc-claimed"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
import('@/lib/loginModal').then(m => m.openLoginModal());        return;
      }
      toast({ title: "Error", description: "Failed to claim KYC request.", variant: "destructive" });
    },
  });

  // Document search function
  const searchDocuments = async () => {
    if (!documentSearchId.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a user ID to search.",
        variant: "destructive",
      });
      return;
    }

    setIsSearchingDocument(true);
    try {
      const user = allUsers.find(u => u.id === documentSearchId.trim());
      if (user) {
        setDocumentSearchResult(user);
      } else {
        setDocumentSearchResult(null);
        toast({
          title: "User Not Found",
          description: "No user found with that ID.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to search for user documents.",
        variant: "destructive",
      });
    } finally {
      setIsSearchingDocument(false);
    }
  };

  const getKycStatusBadge = (status: string, user?: any) => {
    const hasKycDocuments = user?.governmentIdUrl || user?.proofOfAddressUrl;
    
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800" data-testid="badge-kyc-verified">Verified</Badge>;
      case 'pending':
        if (hasKycDocuments) {
          return <Badge className="bg-yellow-100 text-yellow-800" data-testid="badge-kyc-pending">Pending</Badge>;
        } else {
          return <Badge className="bg-gray-100 text-gray-800" data-testid="badge-kyc-basic">Basic</Badge>;
        }
      case 'on_progress':
        return <Badge className="bg-blue-100 text-blue-800" data-testid="badge-kyc-on-progress">On Progress</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800" data-testid="badge-kyc-rejected">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800" data-testid="badge-kyc-basic">Basic</Badge>;
    }
  };

  const getKycStats = () => {
    const verified = allUsers.filter(u => u.kycStatus === 'verified').length;
    const pending = pendingKyc.length;
    const rejected = allUsers.filter(u => u.kycStatus === 'rejected').length;
    const notSubmitted = allUsers.filter(u => !u.kycStatus || u.kycStatus === 'not_submitted').length;
    
    return { verified, pending, rejected, notSubmitted, total: allUsers.length };
  };

  const kycStats = getKycStats();

  const renderDocumentViewer = (kycUser: any) => (
    <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Complete KYC Details - {kycUser.firstName} {kycUser.lastName}
        </DialogTitle>
      </DialogHeader>
      
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="verification">Verification Status</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Picture Section */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {kycUser.profileImageUrl ? (
                    <img 
                      src={kycUser.profileImageUrl} 
                      alt={`${kycUser.firstName} ${kycUser.lastName}`}
                      className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(kycUser.firstName + ' ' + kycUser.lastName)}&size=128&background=e3f2fd&color=1976d2`;
                      }}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-blue-100 border-4 border-blue-200 shadow-lg flex items-center justify-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {kycUser.firstName?.charAt(0)}{kycUser.lastName?.charAt(0)}
                      </div>
                    </div>
                  )}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <Badge variant={kycUser.kycStatus === 'verified' ? 'default' : 'secondary'} className="text-xs">
                      {(() => {
                        const hasKycDocuments = kycUser.governmentIdUrl || kycUser.proofOfAddressUrl;
                        if (kycUser.kycStatus === 'verified') return '✓ Verified';
                        if (kycUser.kycStatus === 'pending' && hasKycDocuments) return '⏳ Pending';
                        if (kycUser.kycStatus === 'on_progress') return '🔄 In Progress';
                        if (kycUser.kycStatus === 'rejected') return '✗ Rejected';
                        return '📋 Basic';
                      })()}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                  <p className="text-sm font-medium">{kycUser.firstName} {kycUser.middleInitial ? kycUser.middleInitial + ' ' : ''}{kycUser.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email Address</Label>
                  <p className="text-sm">{kycUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                  <p className="text-sm">{kycUser.phoneNumber || kycUser.contactNumber || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Birthday</Label>
                  <p className="text-sm">{kycUser.birthday ? new Date(kycUser.birthday).toLocaleDateString() : 'Not provided'}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-600">Address</Label>
                  <p className="text-sm">{kycUser.address || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">User ID</Label>
                  <p className="text-sm font-mono">{kycUser.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">User Display ID</Label>
                  <p className="text-sm font-mono">{kycUser.userDisplayId || 'Not assigned'}</p>
                </div>
              </div>
              
              {kycUser.funFacts && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Fun Facts</Label>
                  <p className="text-sm">{kycUser.funFacts}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional Information Tab */}
        <TabsContent value="professional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Profession/Job Title</Label>
                  <p className="text-sm">{kycUser.profession || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Organization Name</Label>
                  <p className="text-sm">{kycUser.organizationName || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Organization Type</Label>
                  <p className="text-sm">{kycUser.organizationType || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">LinkedIn Profile</Label>
                  {kycUser.linkedinProfile ? (
                    <a href={kycUser.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      {kycUser.linkedinProfile}
                    </a>
                  ) : (
                    <p className="text-sm">Not provided</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Educational Background</Label>
                <p className="text-sm">{kycUser.education || 'Not provided'}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Work Experience</Label>
                <p className="text-sm whitespace-pre-wrap">{kycUser.workExperience || 'Not provided'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Status Tab */}
        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">KYC Verification Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Current Status</Label>
                  <div className="mt-1">
                    {getKycStatusBadge(kycUser.kycStatus || 'not_submitted', kycUser)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date Requested</Label>
                  <p className="text-sm">{kycUser.dateRequested ? new Date(kycUser.dateRequested).toLocaleString() : 'Not submitted'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date Claimed</Label>
                  <p className="text-sm">{kycUser.dateClaimed ? new Date(kycUser.dateClaimed).toLocaleString() : 'Not claimed'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date Evaluated</Label>
                  <p className="text-sm">{kycUser.dateEvaluated ? new Date(kycUser.dateEvaluated).toLocaleString() : 'Not evaluated'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Claimed By</Label>
                  <p className="text-sm">{(kycUser as any).claimed_by || 'Not claimed'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Processed By Admin</Label>
                  <p className="text-sm">{kycUser.processedByAdmin || 'Not processed'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Processed At</Label>
                  <p className="text-sm">{kycUser.processedAt ? new Date(kycUser.processedAt).toLocaleString() : 'Not processed'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Account Created</Label>
                  <p className="text-sm">{kycUser.createdAt ? new Date(kycUser.createdAt).toLocaleString() : 'Unknown'}</p>
                </div>
              </div>
              
              {kycUser.rejectionReason && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Rejection Reason</Label>
                  <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{kycUser.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Account Balances */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-600 mb-2 block">Account Balances</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-md">
                    <p className="text-xs text-gray-600">PHP Balance</p>
                    <p className="text-lg font-bold text-blue-700">₱{parseFloat(kycUser.phpBalance || '0').toLocaleString()}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-md">
                    <p className="text-xs text-gray-600">Tips Balance</p>
                    <p className="text-lg font-bold text-green-700">₱{parseFloat(kycUser.tipsBalance || '0').toLocaleString()}</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-md">
                    <p className="text-xs text-gray-600">Contributions Balance</p>
                    <p className="text-lg font-bold text-purple-700">₱{parseFloat(kycUser.contributionsBalance || '0').toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Community Scores */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-600 mb-2 block">Community Scores</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-orange-50 rounded-md">
                    <p className="text-xs text-gray-600">Social Score</p>
                    <p className="text-lg font-bold text-orange-700">{kycUser.socialScore || 0} points</p>
                  </div>
                  <div className="text-center p-3 bg-indigo-50 rounded-md">
                    <p className="text-xs text-gray-600">Reliability Score</p>
                    <p className="text-lg font-bold text-indigo-700">{parseFloat(kycUser.reliabilityScore || '0').toFixed(2)}/5.00</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">KYC Documents for Review</CardTitle>
            </CardHeader>
            <CardContent>
              {kycUser.kycDocuments && kycUser.kycDocuments.trim() !== '' && kycUser.kycDocuments !== '{}' ? (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h4 className="font-semibold mb-3 text-red-700 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    KYC Documents for Review
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {(() => {
                      try {
                        const docs = JSON.parse(kycUser.kycDocuments);
                        return (
                          <>
                            {/* Government ID */}
                            {docs.valid_id && (
                              <div className="space-y-2">
                                <p className="font-medium text-sm text-gray-700">Government ID</p>
                                <div className="border rounded-lg p-2 bg-white">
                                  <img 
                                    src={docs.valid_id} 
                                    alt="Government ID"
                                    className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => window.open(docs.valid_id, '_blank')}
                                  />
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="w-full mt-2"
                                    onClick={() => window.open(docs.valid_id, '_blank')}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View Full Size
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Proof of Address */}
                            {docs.proof_of_address && (
                              <div className="space-y-2">
                                <p className="font-medium text-sm text-gray-700">Proof of Address</p>
                                <div className="border rounded-lg p-2 bg-white">
                                  {docs.proof_of_address.toLowerCase().includes('.pdf') ? (
                                    <div className="flex items-center justify-center h-32 bg-gray-100 rounded">
                                      <div className="text-center">
                                        <FileText className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">PDF Document</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <img 
                                      src={docs.proof_of_address} 
                                      alt="Proof of Address"
                                      className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => window.open(docs.proof_of_address, '_blank')}
                                    />
                                  )}
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="w-full mt-2"
                                    onClick={() => window.open(docs.proof_of_address, '_blank')}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View Document
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      } catch (e) {
                        return <p className="text-sm text-gray-500">Unable to parse KYC documents</p>;
                      }
                    })()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-medium">No documents uploaded</p>
                  <p className="text-sm">Government ID and proof of address will appear here once uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );

  const renderKycUserCard = (kycUser: User, showActions: boolean = true) => (
    <div 
      key={kycUser.id}
      className="border rounded-lg p-4"
      data-testid={`kyc-user-${kycUser.id}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold" data-testid={`kyc-user-name-${kycUser.id}`}>
              {kycUser.firstName} {kycUser.lastName}
            </h3>
            {getKycStatusBadge(kycUser.kycStatus || 'not_submitted', kycUser)}
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>{kycUser.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Submitted: {new Date(kycUser.createdAt!).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <span>ID: {kycUser.id}</span>
            </div>
            {/* Show processor information for all processed statuses */}
            {(kycUser.kycStatus === 'on_progress' || kycUser.kycStatus === 'verified' || kycUser.kycStatus === 'rejected' || kycUser.kycStatus === 'suspended') && (
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">
                  {kycUser.kycStatus === 'on_progress' ? 'Currently being reviewed by: ' : 'Processed by: '}
                  {kycUser.processedByAdmin || (kycUser as any).processed_by_admin || 'Staff member'}
                </span>
              </div>
            )}
          </div>
          {kycUser.kycDocuments && (
            <div className="mt-2">
              <span className="text-sm font-medium">Documents:</span>
              <div className="text-sm text-muted-foreground">
                {Object.keys(JSON.parse(kycUser.kycDocuments)).join(", ")}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {showActions && (kycUser.kycStatus === 'pending' || kycUser.kycStatus === 'on_progress') && (
            <Button 
              size="sm"
              variant="outline"
              onClick={() => !(kycUser as any).claimed_by && claimKycMutation.mutate(kycUser.id)}
              disabled={claimKycMutation.isPending || !!(kycUser as any).claimed_by}
              className={(kycUser as any).claimed_by ? "opacity-50 cursor-not-allowed" : ""}
              data-testid={`button-claim-kyc-${kycUser.id}`}
            >
              <Clock className="w-4 h-4 mr-1" />
              {(kycUser as any).claimed_by ? "Claimed" : "Claim"}
            </Button>
          )}
          {showActions && kycUser.kycStatus === 'on_progress' && (
            <>
              <Button 
                size="sm"
                onClick={() => {
                  console.log("🖱️ Frontend: Approve button clicked for user:", kycUser.id);
                  approveKycMutation.mutate(kycUser.id);
                }}
                disabled={approveKycMutation.isPending}
                data-testid={`button-approve-kyc-${kycUser.id}`}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button 
                size="sm"
                variant="destructive"
                onClick={() => rejectKycMutation.mutate(kycUser.id)}
                disabled={rejectKycMutation.isPending}
                data-testid={`button-reject-kyc-${kycUser.id}`}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => setSelectedKycUser(kycUser)}
                data-testid={`button-view-documents-${kycUser.id}`}
              >
                <FileText className="w-4 h-4 mr-1" />
                View Docs
              </Button>
            </DialogTrigger>
            {renderDocumentViewer(kycUser)}
          </Dialog>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* KYC Management Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">KYC Management</h1>
        </div>
        <p className="text-gray-600">Manage and oversee all user verification processes on the platform</p>
      </div>

      {/* KYC Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-800" data-testid="stat-total-users">
                  {kycStats.total}
                </div>
                <div className="text-sm text-blue-600">Total Users</div>
              </div>
              <UserIcon className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-800" data-testid="stat-verified-kyc">
                  {kycStats.verified}
                </div>
                <div className="text-sm text-green-600">Verified</div>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-800" data-testid="stat-pending-kyc">
                  {kycStats.pending}
                </div>
                <div className="text-sm text-yellow-600">Pending</div>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-800" data-testid="stat-rejected-kyc">
                  {kycStats.rejected}
                </div>
                <div className="text-sm text-red-600">Rejected</div>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800" data-testid="stat-not-submitted-kyc">
                  {kycStats.notSubmitted}
                </div>
                <div className="text-sm text-gray-600">Not Submitted</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KYC Management Tabs */}
      <Tabs value={activeKycTab} onValueChange={setActiveKycTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" data-testid="tab-kyc-basic">
            Basic ({basicUsers.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-kyc-pending">
            Pending ({kycStats.pending})
          </TabsTrigger>
          <TabsTrigger value="verified" data-testid="tab-kyc-verified">
            Verified ({kycStats.verified})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-kyc-rejected">
            Rejected ({kycStats.rejected})
          </TabsTrigger>
          <TabsTrigger value="suspended" data-testid="tab-kyc-suspended">
            Suspended ({suspendedUsers.length})
          </TabsTrigger>
        </TabsList>

        {/* Basic Users Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Users</CardTitle>
              <CardDescription>Users who signed up but did not complete KYC verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {basicUsers && basicUsers.length > 0 ? (
                  basicUsers.map((basicUser: User) => renderKycUserCard(basicUser, false))
                ) : (
                  <div className="text-center py-12">
                    <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All Users Verified!</h3>
                    <p className="text-muted-foreground">All users have started their KYC verification process.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending KYC Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending KYC Verifications</CardTitle>
              <CardDescription>Review and approve or reject KYC submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingKyc && pendingKyc.length > 0 ? (
                  pendingKyc.map((kycUser: User) => renderKycUserCard(kycUser, true))
                ) : (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All Verified!</h3>
                    <p className="text-muted-foreground">No pending KYC verifications.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verified KYC Tab */}
        <TabsContent value="verified">
          <Card>
            <CardHeader>
              <CardTitle>Verified Users</CardTitle>
              <CardDescription>Users with approved KYC verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allUsers.filter(u => u.kycStatus === 'verified').map((kycUser: User) => 
                  renderKycUserCard(kycUser, false)
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rejected KYC Tab */}
        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected KYC</CardTitle>
              <CardDescription>Users with rejected KYC submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allUsers.filter(u => u.kycStatus === 'rejected').map((kycUser: User) => 
                  renderKycUserCard(kycUser, false)
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suspended Users Tab */}
        <TabsContent value="suspended">
          <Card>
            <CardHeader>
              <CardTitle>Suspended Accounts</CardTitle>
              <CardDescription>Users with suspended accounts due to policy violations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suspendedUsers && suspendedUsers.length > 0 ? (
                  suspendedUsers.map((suspendedUser: User) => renderKycUserCard(suspendedUser, false))
                ) : (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Suspended Accounts</h3>
                    <p className="text-muted-foreground">All user accounts are currently active.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}