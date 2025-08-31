import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Edit,
  Wallet,
  Target,
  TrendingUp,
  Award,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Camera,
  History,
  Heart,
  Box,
  TrendingDown,
  Gift,
  Users,
  Star,
  MessageCircle,
  Upload,
  X,
LifeBuoy,
  RefreshCw} from "lucide-react";
import { format } from "date-fns";
import UserVerifiedBadge from "@/components/UserVerifiedBadge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertSupportTicketSchema } from "@shared/schema";
import { WithdrawalModal } from "@/components/withdrawal-modal";
import { ObjectUploader } from "@/components/ObjectUploader";
import { ProfileImageCropper } from "@/components/ProfileImageCropper";const claimTipFormSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 && num <= 999999;
    },
    "Amount must be a positive number (max 999,999)"
  ),
});

const claimContributionFormSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 && num <= 999999;
    },
    "Amount must be a positive number (max 999,999)"
  ),
});

const supportTicketFormSchema = insertSupportTicketSchema.extend({
  attachments: z.string().optional(),
  relatedCampaignId: z.string().optional(),
  relatedTransactionId: z.string().optional(),
  relatedUserId: z.string().optional(),
});

type SupportTicketFormData = z.infer<typeof supportTicketFormSchema>;

export default function MyProfile() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { data: serverUser } = useQuery({ queryKey: ["/api/auth/user"] });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Campaign slots data
  const { data: campaignSlotsData } = useQuery({
    queryKey: ["/api/user/campaign-slots"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/campaign-slots");
      return response.json();
    },
    enabled: isAuthenticated,
  });
  const [isClaimTipsModalOpen, setIsClaimTipsModalOpen] = useState(false);
  const [isClaimContributionsModalOpen, setIsClaimContributionsModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isSupportTicketModalOpen, setIsSupportTicketModalOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
const [showCropper, setShowCropper] = useState(false);
  const [pfpCacheBust, setPfpCacheBust] = useState<number>(0);  // Tip claiming form setup
  const claimTipForm = useForm<z.infer<typeof claimTipFormSchema>>({
    resolver: zodResolver(claimTipFormSchema),
    defaultValues: {
      amount: "",
    },
  });

  // Contribution claiming form setup
  const claimContributionForm = useForm<z.infer<typeof claimContributionFormSchema>>({
    resolver: zodResolver(claimContributionFormSchema),
    defaultValues: {
      amount: "",
    },
  });

  // Support ticket form setup
  const supportTicketForm = useForm<SupportTicketFormData>({
    resolver: zodResolver(supportTicketFormSchema),
    defaultValues: {
      subject: "",
      message: "",
      category: "general",
      priority: "medium",
      attachments: "",
      relatedCampaignId: "",
      relatedTransactionId: "",
      relatedUserId: "",
    },
  });

  const { data: userTransactions = [] } = useQuery({
    queryKey: ["/api/transactions/user"],
    enabled: isAuthenticated,
  }) as { data: any[] };

  const { data: userCampaigns = [] } = useQuery({
    queryKey: ["/api/user/campaigns"],
    enabled: isAuthenticated,
  }) as { data: any[] };

  const { data: userContributions = [] } = useQuery({
    queryKey: ["/api/user/contributions"],
    enabled: isAuthenticated,
  }) as { data: any[] };

  // Fetch user scores
  const { data: creditScoreData } = useQuery({
    queryKey: ["/api/auth/user/credit-score"],
    enabled: isAuthenticated,
  }) as { data: { averageScore: number } | undefined };

  const { data: averageRatingData } = useQuery({
    queryKey: ["/api/users", (user as any)?.id, "creator-rating"],
    enabled: Boolean(isAuthenticated && (user as any)?.id),
  }) as { data: { averageRating: number; totalRatings: number } | undefined };

  const claimTipsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof claimTipFormSchema>) => {
      return await apiRequest("POST", "/api/users/claim-tips", {
        amount: parseFloat(data.amount)
      });
    },
    onSuccess: async (response: any) => {
      const data = await response.json();
      const claimedAmount = parseFloat(data.claimedAmount || '0');
      const feeAmount = parseFloat(data.feeAmount || '0');
      
      toast({
        title: "Tips Claimed Successfully! 🎉",
        description: `₱${claimedAmount.toLocaleString()} has been transferred to your PHP wallet. (₱${feeAmount.toLocaleString()} fee applied)`,
      });
      setIsClaimTipsModalOpen(false);
      claimTipForm.reset();
      
      // Refresh user data to show updated balances
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/user"] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error Claiming Tips",
        description: error.message || "Failed to claim tips. Please try again.",
        variant: "destructive",
      });
    },
  });

  const claimContributionsMutation = useMutation({
    mutationFn: async (data: { amount: string }) => {
      return await apiRequest("POST", "/api/wallet/claim-contributions", {
        amount: parseFloat(data.amount)
      });
    },
    onSuccess: (data: any) => {
      const claimedAmount = parseFloat(data.amount || '0');
      toast({
        title: "Contributions Claimed Successfully!",
        description: `₱${claimedAmount.toLocaleString()} has been transferred to your PHP wallet.`,
      });
      setIsClaimContributionsModalOpen(false);
      claimContributionForm.reset();
      
      // Update cached user balances without forcing refetch
      queryClient.setQueryData(["/api/auth/user"], (prev: any) => ({ ...(prev || {}), balance: data?.newBalance ?? (prev?.balance ?? 0) }));
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/contributions"] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error Claiming Contributions",
        description: error.message || "Failed to claim contributions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const profileImageMutation = useMutation({
    mutationFn: async (data: { profileImageUrl: string }) => {
      return await apiRequest("PUT", "/api/profile/image", data);
    },
    onSuccess: () => {
      // Update cached user profile image without refetch
      queryClient.setQueryData(["/api/auth/user"], (prev: any) => ({ ...(prev || {}), profileImageUrl: (prev?.profileImageUrl ?? null) }));
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      console.error('Profile image update error:', error);
    },
  });

  const createSupportTicketMutation = useMutation({
    mutationFn: async (data: SupportTicketFormData) => {
      const attachmentUrls = attachments.length > 0 
        ? JSON.stringify(attachments.map(file => `attachment:${file.name}`))
        : undefined;

      return await apiRequest("POST", "/api/support/tickets", {
        ...data,
        attachments: attachmentUrls,
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Support Ticket Created",
        description: `Your ticket has been submitted successfully. You'll receive an email confirmation shortly.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets/my"] });
      setIsSupportTicketModalOpen(false);
      supportTicketForm.reset();
      setAttachments([]);
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/login"; }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to create support ticket",
        variant: "destructive",
      });
    },
  });

  // File handling for support tickets
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Support ticket handler
  const onSubmitSupportTicket = (data: SupportTicketFormData) => {
    createSupportTicketMutation.mutate(data);
  };

  // Tip claiming handler
  const onClaimTip = (data: z.infer<typeof claimTipFormSchema>) => {
    claimTipsMutation.mutate(data);
  };

  // Contribution claiming handler
  const onClaimContribution = (data: z.infer<typeof claimContributionFormSchema>) => {
    claimContributionsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh] mt-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh] mt-24">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Please sign in to view your profile.</p>
<Button onClick={() => import('@/lib/loginModal').then(m => m.openLoginModal())}>              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getKycStatusBadge = () => {
    const status = (user as any)?.kycStatus;
    switch (status) {
      case "verified":
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Not Started
          </Badge>
        );
    }
  };

  // Calculate user statistics
  const totalContributed = (userTransactions as any[]).reduce((sum: number, contrib: any) => sum + parseFloat(contrib.amount || "0"), 0);
  const totalRaised = (userCampaigns as any[]).reduce((sum: number, campaign: any) => sum + parseFloat(campaign.currentAmount || "0"), 0);
  const successfulCampaigns = (userCampaigns as any[]).filter((campaign: any) => campaign.status === "active" && parseFloat(campaign.currentAmount || "0") >= parseFloat(campaign.goalAmount || "1")).length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 mt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account information and track your VeriFund journey</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="relative mx-auto mb-4">
                  <div className="w-24 h-24 bg-gray-300 rounded-full overflow-hidden flex items-center justify-center mx-auto relative group">
{(serverUser as any)?.profileImageUrl ? (
                      <img 
                        src={`${(/^https?:\/\//.test(((serverUser as any).profileImageUrl || '')) ? (serverUser as any).profileImageUrl : (((serverUser as any).profileImageUrl || '').startsWith('/') ? (serverUser as any).profileImageUrl : '/' + ((serverUser as any).profileImageUrl || '')))}${pfpCacheBust ? `?ts=${pfpCacheBust}` : ''}`}                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-medium text-gray-600">
                        {(user as any)?.firstName?.charAt(0) || 'U'}
                      </span>
                    )}
{/* Upload overlay -> open cropper modal */}
                    <button
                      type="button"
                      onClick={() => setShowCropper(true)}
                      className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                      aria-label="Upload profile picture"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </button>                  </div>
                  {(user as any)?.kycStatus === "verified" && (
                    <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 border-2 border-white shadow-lg">
                      <Shield className="w-4 h-4 text-white fill-current" />
                    </div>
                  )}
                </div>
                <CardTitle className="flex items-center justify-center space-x-2">
                  <span>{(user as any)?.firstName} {(user as any)?.lastName}</span>
                </CardTitle>
                <div className="flex justify-center mt-2">
                  {getKycStatusBadge()}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-xs">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{(user as any)?.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-mono text-xs">
                      User ID: {(user as any)?.userDisplayId || (user as any)?.id?.slice(0, 8) + '...'}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText((user as any)?.userDisplayId || (user as any)?.id || '');
                        toast({
                          title: "User ID Copied",
                          description: "Your user ID has been copied to clipboard",
                        });
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs underline"
                      title="Click to copy full User ID"
                      data-testid="button-copy-user-id"
                    >
                      Copy
                    </button>
                  </div>
                  {(user as any)?.profession && (
                    <div className="flex items-center space-x-2 text-xs">
                      <Briefcase className="w-4 h-4 text-gray-500" />
                      <span>{(user as any).profession}</span>
                    </div>
                  )}
                  {(user as any)?.location && (
                    <div className="flex items-center space-x-2 text-xs">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{(user as any).location}</span>
                    </div>
                  )}
                  {(user as any)?.phoneNumber && (
                    <div className="flex items-center space-x-2 text-xs">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{(user as any).phoneNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-xs">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>Joined {format(new Date((user as any)?.createdAt || Date.now()), "MMMM yyyy")}</span>
                  </div>
                </div>
                
                {(user as any)?.kycStatus !== "verified" && (
                  <Button 
                    className="w-full"
                    onClick={() => window.location.href = "/profile-verification"}
                  >
                    Complete Verification
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* User Scores Section */}
            <Card>
              <CardHeader>
<div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Award className="w-5 h-5" />
                      <span>My Scores</span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Your performance metrics and community ratings
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                      toast({
                        title: "Scores Refreshed",
                        description: "Your scores have been updated with the latest data.",
                      });
                    }}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Scores
                  </Button>
                </div>              </CardHeader>
              <CardContent className="space-y-4">
                {/* Credit Score */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-900">Credit Score</h3>
                      <p className="text-xs text-blue-700">Document quality rating</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600" data-testid="text-credit-score">
                      {creditScoreData?.averageScore ? `${Math.round(creditScoreData.averageScore)}%` : '0%'}
                    </div>
                    <div className="text-xs text-blue-600">Average</div>
                  </div>
                </div>

                {/* Social Score */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-900">Social Score</h3>
                      <p className="text-xs text-green-700">Community safety points</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600" data-testid="text-social-score">
                      {(user as any)?.socialScore || 0}
                    </div>
                    <div className="text-xs text-green-600">Points</div>
                  </div>
                </div>

                {/* Average Star Rating */}
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Award className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-yellow-900">Creator Rating</h3>
                      <p className="text-xs text-yellow-700">Community star rating</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 justify-end">
                      <div className="text-2xl font-bold text-yellow-600" data-testid="text-creator-rating">
                        {averageRatingData?.averageRating && averageRatingData.averageRating > 0 
                          ? averageRatingData.averageRating.toFixed(1) 
                          : '0'}
                      </div>
                    </div>
                    <div className="text-xs text-yellow-600">
                      {averageRatingData?.totalRatings ? `${averageRatingData.totalRatings} ratings` : '0 ratings'}
                    </div>
                  </div>
                </div>

                {/* Reliability Score */}
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-purple-900">Reliability Score</h3>
                      <p className="text-xs text-purple-700">Volunteer safety rating</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 justify-end">
                      <div className="text-2xl font-bold text-purple-600" data-testid="text-reliability-score">
                        {(user as any)?.reliabilityScore && parseFloat((user as any).reliabilityScore.toString()) > 0 
                          ? parseFloat((user as any).reliabilityScore.toString()).toFixed(1) 
                          : '0.0'}
                      </div>
                    </div>
                    <div className="text-xs text-purple-600">
                      {(user as any)?.reliabilityRatingsCount ? `${(user as any).reliabilityRatingsCount} ratings` : '0 ratings'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Slots Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Campaign Slots</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Your campaign creation limits and remaining slots (resets every 30 days from first campaign)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Month Status */}
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-indigo-900">This Month</h3>
                      <p className="text-xs text-indigo-700">
                        {campaignSlotsData?.isFirstMonth ? "First month bonus slots" : "Monthly allocation"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {campaignSlotsData?.slotsRemaining || 0}
                    </div>
                    <div className="text-xs text-indigo-600">
                      of {campaignSlotsData?.maxAllowed || 0} slots left
                    </div>
                  </div>
                </div>



                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Used: {campaignSlotsData?.campaignsCreated || 0}</span>
                    <span className="text-gray-600">Total: {campaignSlotsData?.maxAllowed || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${campaignSlotsData?.maxAllowed ? (campaignSlotsData.campaignsCreated / campaignSlotsData.maxAllowed) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  {campaignSlotsData?.totalCampaignsCreated !== undefined && (
                    <div className="text-xs text-gray-500 text-center">
                      Total campaigns created: {campaignSlotsData.totalCampaignsCreated}
                    </div>
                  )}
                </div>

                {/* Countdown Timer */}
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-orange-900">Reset Countdown</h3>
                      <p className="text-xs text-orange-700">Slots refresh every 30 days from first campaign</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">
                      {campaignSlotsData?.daysUntilReset || 0}
                    </div>
                    <div className="text-xs text-orange-600">days left</div>
                  </div>
                </div>

                {/* Next Tier Info */}
                {campaignSlotsData?.nextTierInfo && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        {campaignSlotsData.nextTierInfo.message}
                      </span>
                    </div>
                    {campaignSlotsData.nextTierInfo.nextTier && (
                      <div className="mt-2 text-xs text-green-700">
                        Current: {campaignSlotsData.creditScore}% → Target: {campaignSlotsData.nextTierInfo.nextTier}
                      </div>
                    )}
                  </div>
                )}

                {/* Paid Slots Info */}
                {campaignSlotsData?.paidSlotsAvailable > 0 && (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-2">
                      <Wallet className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        Paid Slots Available
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-yellow-700">
                      {campaignSlotsData.paidSlotsAvailable} slots for ₱{campaignSlotsData.paidSlotPrice.toLocaleString()}
                    </div>
                    <Button 
                      size="sm" 
                      className="mt-2 w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                      onClick={() => toast({
                        title: "Coming Soon",
                        description: "Paid slot purchase will be available soon!",
                      })}
                    >
                      Purchase Slots
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* KYC Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>KYC Verification Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
<div className={`w-8 h-8 rounded-full flex items-center justify-center ${((user as any)?.kycStatus === 'verified' || (serverUser as any)?.profileImageUrl) ? "bg-green-100" : "bg-gray-100"}`}>
                        {((user as any)?.kycStatus === 'verified' || (serverUser as any)?.profileImageUrl) ? (                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Camera className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Profile Picture</p>
                        <p className="text-xs text-gray-600">Upload a clear photo of yourself</p>
                      </div>
                    </div>
                    <div className="text-right">
{((user as any)?.kycStatus === 'verified' || (user as any)?.profileImageUrl) ? (                        <Badge className="bg-green-100 text-green-800">Complete</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
<div className={`w-8 h-8 rounded-full flex items-center justify-center ${((user as any)?.kycStatus === 'verified' || (user as any)?.profession) ? "bg-green-100" : "bg-gray-100"}`}>
                        {((user as any)?.kycStatus === 'verified' || (user as any)?.profession) ? (                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <User className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Professional Information</p>
                        <p className="text-xs text-gray-600">Complete your professional details</p>
                      </div>
                    </div>
                    <div className="text-right">
{((user as any)?.kycStatus === 'verified' || (user as any)?.profession) ? (                        <Badge className="bg-green-100 text-green-800">Complete</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
<div className={`w-8 h-8 rounded-full flex items-center justify-center ${(["verified","approved"].includes(((user as any)?.kycStatus || '').toLowerCase())) ? "bg-green-100" : "bg-gray-100"}`}>
                        {(["verified","approved"].includes(((user as any)?.kycStatus || '').toLowerCase())) ? (                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Shield className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Identity Verification</p>
                        <p className="text-xs text-gray-600">Submit valid ID and proof of address</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getKycStatusBadge()}
                    </div>
                  </div>

{!["verified","approved"].includes(((user as any)?.kycStatus || '').toLowerCase()) && (                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800 mb-3">
                        <strong>Complete your verification to unlock all features:</strong>
                      </p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Create fundraising campaigns</li>
                        <li>• Withdraw funds to your bank account</li>
                        <li>• Access premium analytics</li>
                        <li>• Build trust with contributors</li>
                      </ul>
                      <Button 
                        className="mt-3"
                        onClick={() => window.location.href = "/profile-verification"}
                      >
                        Complete Verification
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5" />
                  <span>Wallet Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      ₱{parseFloat((user as any)?.phpBalance || "0").toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">PHP Wallet</div>
                    <div className="text-xs text-gray-500 mb-2">Your available money for withdrawal</div>
                    <Button 
                      size="sm" 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => setIsWithdrawalModalOpen(true)}
                      data-testid="button-withdraw"
                    >
                      WITHDRAW
                    </Button>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ₱{parseFloat((user as any)?.tipsBalance || "0").toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Tips Balance</div>
                    <div className="text-xs text-gray-500 mb-2">Tips received from supporters</div>
                    <Dialog open={isClaimTipsModalOpen} onOpenChange={setIsClaimTipsModalOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className="w-full bg-yellow-600 hover:bg-yellow-700"
                          disabled={parseFloat((user as any)?.tipsBalance || '0') <= 0}
                          data-testid="button-claim-tips"
                        >
                          <Gift className="w-4 h-4 mr-2" />
                          CLAIM
                        </Button>
                      </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Claim Your Tips</DialogTitle>
                            <p className="text-sm text-muted-foreground">
                              Specify the amount of tips you want to claim
                            </p>
                          </DialogHeader>
                          <Form {...claimTipForm}>
                            <form onSubmit={claimTipForm.handleSubmit(onClaimTip)} className="space-y-4">
                              <FormField
                                control={claimTipForm.control}
                                name="amount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Amount to Claim (₱)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="Enter tip amount to claim"
                                        type="number"
                                        min="1"
                                        {...field}
                                        data-testid="input-claim-tip-amount"
                                      />
                                    </FormControl>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Available to claim: ₱{parseFloat((user as any)?.tipsBalance || '0').toLocaleString()}<br/>
                                      Tips will be transferred to your PHP wallet
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex gap-2 pt-4">
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  className="flex-1"
                                  onClick={() => setIsClaimTipsModalOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  type="submit"
                                  className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                                  disabled={claimTipsMutation.isPending}
                                  data-testid="button-confirm-claim-tips"
                                >
                                  {claimTipsMutation.isPending ? "Claiming..." : "Claim Tips"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                    </Dialog>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      ₱{parseFloat((user as any)?.contributionsBalance || "0").toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Contributions Balance</div>
                    <div className="text-xs text-gray-500 mb-2">Money from contributions you can get back</div>
                    <Dialog open={isClaimContributionsModalOpen} onOpenChange={setIsClaimContributionsModalOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          disabled={parseFloat((user as any)?.contributionsBalance || '0') <= 0}
                          data-testid="button-claim-contributions"
                        >
                          <Gift className="w-4 h-4 mr-2" />
                          CLAIM
                        </Button>
                      </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Claim Your Contributions</DialogTitle>
                            <p className="text-sm text-muted-foreground">
                              Specify the amount of contributions you want to claim
                            </p>
                          </DialogHeader>
                          <Form {...claimContributionForm}>
                            <form onSubmit={claimContributionForm.handleSubmit(onClaimContribution)} className="space-y-4">
                              <FormField
                                control={claimContributionForm.control}
                                name="amount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Amount to Claim (₱)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="Enter contribution amount to claim"
                                        type="number"
                                        min="1"
                                        {...field}
                                        data-testid="input-claim-contribution-amount"
                                      />
                                    </FormControl>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Available to claim: ₱{parseFloat((user as any)?.contributionsBalance || '0').toLocaleString()}<br/>
                                      • 1% claiming fee will be deducted (minimum ₱1)<br/>
                                      • Net amount will be transferred to your PHP wallet
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex gap-2 pt-4">
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  className="flex-1"
                                  onClick={() => setIsClaimContributionsModalOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  type="submit"
                                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                                  disabled={claimContributionsMutation.isPending}
                                  data-testid="button-confirm-claim-contributions"
                                >
                                  {claimContributionsMutation.isPending ? "Claiming..." : "Claim Contributions"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics & Milestones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Campaigns Created</span>
                    <span className="font-semibold">{(userCampaigns as any[]).length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Raised</span>
                    <span className="font-semibold">₱{totalRaised.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Contributed</span>
                    <span className="font-semibold">₱{totalContributed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Successful Campaigns</span>
                    <span className="font-semibold">{successfulCampaigns}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Transactions</span>
                    <span className="font-semibold">{(userTransactions as any[]).length}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Milestones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span>Milestones</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className={`flex items-center space-x-2 p-2 rounded ${(user as any)?.kycStatus === "verified" ? "bg-green-50" : "bg-gray-50"}`}>
                    <CheckCircle className={`w-4 h-4 ${(user as any)?.kycStatus === "verified" ? "text-green-600" : "text-gray-400"}`} />
                    <span className={`text-sm ${(user as any)?.kycStatus === "verified" ? "text-green-800" : "text-gray-600"}`}>
                      Identity Verified
                    </span>
                  </div>
                  <div className={`flex items-center space-x-2 p-2 rounded ${(userCampaigns as any[]).length > 0 ? "bg-green-50" : "bg-gray-50"}`}>
                    <Target className={`w-4 h-4 ${(userCampaigns as any[]).length > 0 ? "text-green-600" : "text-gray-400"}`} />
                    <span className={`text-sm ${(userCampaigns as any[]).length > 0 ? "text-green-800" : "text-gray-600"}`}>
                      First Campaign Created
                    </span>
                  </div>
                  <div className={`flex items-center space-x-2 p-2 rounded ${(userTransactions as any[]).length > 0 ? "bg-green-50" : "bg-gray-50"}`}>
                    <Wallet className={`w-4 h-4 ${(userTransactions as any[]).length > 0 ? "text-green-600" : "text-gray-400"}`} />
                    <span className={`text-sm ${(userTransactions as any[]).length > 0 ? "text-green-800" : "text-gray-600"}`}>
                      First Contribution Made
                    </span>
                  </div>
                  <div className={`flex items-center space-x-2 p-2 rounded ${successfulCampaigns > 0 ? "bg-green-50" : "bg-gray-50"}`}>
                    <Award className={`w-4 h-4 ${successfulCampaigns > 0 ? "text-green-600" : "text-gray-400"}`} />
                    <span className={`text-sm ${successfulCampaigns > 0 ? "text-green-800" : "text-gray-600"}`}>
                      Successful Campaign
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

                         {/* Recent Contributions & Tips */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Recent Contributions */}
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center space-x-2">
                     <Heart className="w-5 h-5" />
                     <span>Recent Contributions</span>
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="max-h-[300px] overflow-y-auto space-y-3">
                     {userContributions && (userContributions as any[]).length > 0 ? (
                       (userContributions as any[]).slice(0, 5).map((contribution: any) => (
                         <div key={contribution.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                           <div className="flex items-center space-x-3">
                             <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                               <Heart className="w-4 h-4 text-purple-600" />
                             </div>
                             <div>
                               <div className="font-medium text-sm text-purple-900">
                                 ₱{parseFloat(contribution.amount || '0').toLocaleString()}
                               </div>
                               <div className="text-xs text-purple-700 font-mono">
                                 ID: {contribution.id.slice(0, 8)}...
                               </div>
                             </div>
                           </div>
                           <div className="text-right">
                             <Badge className="bg-green-100 text-green-800 text-xs">
                               Completed
                             </Badge>
                           </div>
                         </div>
                       ))
                     ) : (
                       <div className="text-center py-8">
                         <Heart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                         <p className="text-sm text-gray-600">No contributions yet</p>
                       </div>
                     )}
                   </div>
                 </CardContent>
               </Card>

               {/* Recent Tips */}
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center space-x-2">
                     <Gift className="w-5 h-5" />
                     <span>Recent Tips</span>
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="max-h-[300px] overflow-y-auto space-y-3">
                     {userTransactions && (userTransactions as any[]).filter((t: any) => t.type === 'tip').length > 0 ? (
                       (userTransactions as any[]).filter((t: any) => t.type === 'tip').slice(0, 5).map((tip: any) => (
                         <div key={tip.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                           <div className="flex items-center space-x-3">
                             <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                               <Gift className="w-4 h-4 text-yellow-600" />
                             </div>
                             <div>
                               <div className="font-medium text-sm text-yellow-900">
                                 ₱{parseFloat(tip.amount || '0').toLocaleString()}
                               </div>
                               <div className="text-xs text-yellow-700 font-mono">
                                 ID: {tip.id.slice(0, 8)}...
                               </div>
                             </div>
                           </div>
                           <div className="text-right">
                             <Badge className="bg-green-100 text-green-800 text-xs">
                               Completed
                             </Badge>
                           </div>
                         </div>
                       ))
                     ) : (
                       <div className="text-center py-8">
                         <Gift className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                         <p className="text-sm text-gray-600">No tips received yet</p>
                       </div>
                     )}
                   </div>
                 </CardContent>
               </Card>
             </div>
                
                                 {/* Transaction Details Modal */}
                 <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
                   <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                     <DialogHeader>
                       <DialogTitle className="flex items-center space-x-2">
                         <History className="w-5 h-5" />
                         <span>Transaction Details</span>
                       </DialogTitle>
                     </DialogHeader>
                     
                     {selectedTransaction && (
                       <div className="space-y-6">
                         {/* Transaction Overview */}
                         <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                           <div className="flex items-center space-x-3">
                             <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                               selectedTransaction.type === 'deposit' ? 'bg-green-100' :
                               selectedTransaction.type === 'withdrawal' ? 'bg-blue-100' :
                               selectedTransaction.type === 'contribution' ? 'bg-purple-100' :
                               'bg-gray-100'
                             }`}>
                               {selectedTransaction.type === 'deposit' && <TrendingUp className="w-6 h-6 text-green-600" />}
                               {selectedTransaction.type === 'withdrawal' && <TrendingDown className="w-6 h-6 text-blue-600" />}
                               {selectedTransaction.type === 'contribution' && <Heart className="w-6 h-6 text-purple-600" />}
                               {!['deposit', 'withdrawal', 'contribution'].includes(selectedTransaction.type) && <Box className="w-6 h-6 text-gray-600" />}
                             </div>
                             <div>
                               <h3 className="text-xl font-semibold capitalize">
                                 {selectedTransaction.type.replace('_', ' ')}
                               </h3>
                               <p className="text-muted-foreground">
                                 {selectedTransaction.description}
                               </p>
                             </div>
                           </div>
                           <div className="text-right">
                             <div className="text-2xl font-bold">
                               ₱{parseFloat(selectedTransaction.amount || '0').toLocaleString()}
                             </div>
                             <Badge 
                               variant={
                                 selectedTransaction.status === 'completed' ? 'default' : 
                                 selectedTransaction.status === 'failed' ? 'destructive' : 
                                 'secondary'
                               }
                               className="mt-2"
                             >
                               {selectedTransaction.status}
                             </Badge>
                           </div>
                         </div>

                         {/* Transaction Details Grid */}
                         <div className="grid md:grid-cols-2 gap-6">
                           <div className="space-y-4">
                             <h4 className="font-semibold text-lg border-b pb-2">Transaction Information</h4>
                             
                             <div className="space-y-3">
                               <div className="flex justify-between items-center">
                                 <span className="text-muted-foreground font-medium">Transaction ID:</span>
                                 <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                   {selectedTransaction.id}
                                 </span>
                               </div>
                               
                               <div className="flex justify-between items-center">
                                 <span className="text-muted-foreground font-medium">Type:</span>
                                 <span className="capitalize font-medium">{selectedTransaction.type.replace('_', ' ')}</span>
                               </div>
                               
                               <div className="flex justify-between items-center">
                                 <span className="text-muted-foreground font-medium">Amount:</span>
                                 <span className="font-semibold">₱{parseFloat(selectedTransaction.amount || '0').toLocaleString()}</span>
                               </div>
                               
                               <div className="flex justify-between items-center">
                                 <span className="text-muted-foreground font-medium">Currency:</span>
                                 <span className="font-medium">{selectedTransaction.currency || 'PHP'}</span>
                               </div>
                               
                               {selectedTransaction.feeAmount && parseFloat(selectedTransaction.feeAmount) > 0 && (
                                 <div className="flex justify-between items-center">
                                   <span className="text-muted-foreground font-medium">Fees:</span>
                                   <span className="font-medium">₱{parseFloat(selectedTransaction.feeAmount).toLocaleString()}</span>
                                 </div>
                               )}
                             </div>
                           </div>
                           
                           <div className="space-y-4">
                             <h4 className="font-semibold text-lg border-b pb-2">Technical Details</h4>
                             
                             <div className="space-y-3">
                               {selectedTransaction.transactionHash && (
                                 <div>
                                   <span className="text-muted-foreground font-medium block mb-1">Transaction Hash:</span>
                                   <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                                     {selectedTransaction.transactionHash}
                                   </span>
                                 </div>
                               )}
                               
                               {selectedTransaction.blockNumber && (
                                 <div className="flex justify-between items-center">
                                   <span className="text-muted-foreground font-medium">Block Number:</span>
                                   <span className="font-mono">{selectedTransaction.blockNumber}</span>
                                 </div>
                               )}
                               
                               {selectedTransaction.paymentProvider && (
                                 <div className="flex justify-between items-center">
                                   <span className="text-muted-foreground font-medium">Payment Method:</span>
                                   <span className="capitalize font-medium">{selectedTransaction.paymentProvider}</span>
                                 </div>
                               )}
                               
                               {selectedTransaction.exchangeRate && (
                                 <div className="flex justify-between items-center">
                                   <span className="text-muted-foreground font-medium">Exchange Rate:</span>
                                   <span className="font-medium">₱{parseFloat(selectedTransaction.exchangeRate).toLocaleString()}</span>
                                 </div>
                               )}
                             </div>
                           </div>
                         </div>

                         {/* Timeline */}
                         <div className="space-y-4">
                           <h4 className="font-semibold text-lg border-b pb-2">Timeline</h4>
                           
                           <div className="space-y-3">
                             <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                               <div className="flex items-center space-x-2">
                                 <Clock className="w-4 h-4 text-gray-600" />
                                 <span className="font-medium">Created</span>
                               </div>
                               <span className="text-sm">
                                 {format(new Date(selectedTransaction.createdAt), "MMM d, yyyy 'at' h:mm a")}
                               </span>
                             </div>
                             
                             {selectedTransaction.updatedAt && selectedTransaction.updatedAt !== selectedTransaction.createdAt && (
                               <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                 <div className="flex items-center space-x-2">
                                   <CheckCircle className="w-4 h-4 text-green-600" />
                                   <span className="font-medium">Last Updated</span>
                                 </div>
                                 <span className="text-sm">
                                   {format(new Date(selectedTransaction.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                                 </span>
                               </div>
                             )}
                             
                             {/* Status indicator */}
                             <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                               <div className="flex items-center space-x-2">
                                 {selectedTransaction.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                                 {selectedTransaction.status === 'pending' && <Clock className="w-4 h-4 text-yellow-600" />}
                                 {selectedTransaction.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-600" />}
                                 <span className="font-medium">Status</span>
                               </div>
                               <Badge 
                                 variant={
                                   selectedTransaction.status === 'completed' ? 'default' : 
                                   selectedTransaction.status === 'failed' ? 'destructive' : 
                                   'secondary'
                                 }
                               >
                                 {selectedTransaction.status}
                               </Badge>
                             </div>
                           </div>
                         </div>
                       </div>
                     )}
                   </DialogContent>
                 </Dialog>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      <WithdrawalModal 
        isOpen={isWithdrawalModalOpen} 
        onClose={() => setIsWithdrawalModalOpen(false)} 
      />

      {/* Support Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-3 flex items-center justify-center gap-2">
              <LifeBuoy className="w-5 h-5" />
              Need Help?
            </h3>
            <p className="text-gray-300 mb-4 text-sm">
              Submit a support request and our team will get back to you within 24 hours.
            </p>
            <Button
              onClick={() => setIsSupportTicketModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
              data-testid="button-support-ticket"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              File Support Ticket
            </Button>
          </div>
        </div>
      </footer>

{/* Profile Image Cropper */}
      <ProfileImageCropper
        open={showCropper}
        onOpenChange={setShowCropper}
        onUploaded={(publicUrl) => {
          // update cached user with new image immediately (supports absolute URLs)
          const finalUrl = publicUrl;
          queryClient.setQueryData(["/api/auth/user"], (prev: any) => ({ ...(prev || {}), profileImageUrl: finalUrl }));
          setPfpCacheBust(Date.now());
          toast({ title: "Profile Picture Updated" });
        }}
      />      {/* Support Ticket Modal */}
      <Dialog open={isSupportTicketModalOpen} onOpenChange={setIsSupportTicketModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              File Support Ticket
            </DialogTitle>
            <DialogDescription>
              Submit a support request and our team will get back to you within 24 hours.
            </DialogDescription>
          </DialogHeader>

          <Form {...supportTicketForm}>
            <form onSubmit={supportTicketForm.handleSubmit(onSubmitSupportTicket)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={supportTicketForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General Support</SelectItem>
                          <SelectItem value="technical">Technical Issue</SelectItem>
                          <SelectItem value="billing">Billing & Payments</SelectItem>
                          <SelectItem value="account">Account Management</SelectItem>
                          <SelectItem value="bug_report">Bug Report</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={supportTicketForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={supportTicketForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Subject</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief description of your issue"
                        {...field}
                        data-testid="input-subject"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={supportTicketForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide detailed information about your issue, including steps to reproduce it if applicable..."
                        className="min-h-[120px] resize-none"
                        {...field}
                        data-testid="textarea-message"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Related IDs Section */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-medium">Related References (Optional)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={supportTicketForm.control}
                    name="relatedCampaignId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Campaign ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="CAM-001234"
                            {...field}
                            data-testid="input-campaign-id"
                          />
                        </FormControl>
                        <div className="text-xs text-gray-500">
                          If reporting about a specific campaign
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={supportTicketForm.control}
                    name="relatedTransactionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Transaction ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="TXN-001234"
                            {...field}
                            data-testid="input-transaction-id"
                          />
                        </FormControl>
                        <div className="text-xs text-gray-500">
                          If reporting about a payment/transaction
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* File Upload Section */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">Supporting Evidence (Optional)</Label>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Upload screenshots, documents, or other files that support your request.
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                    data-testid="input-file-upload"
                  />
                  <Button
                    type="button"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="w-full bg-lime-400 hover:bg-lime-500 text-gray-900 font-medium py-3 rounded-lg"
                    data-testid="button-upload-file"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Evidence Files
                  </Button>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Files:</Label>
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                            data-testid={`button-remove-attachment-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsSupportTicketModalOpen(false)}
                  className="px-6"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createSupportTicketMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 px-6"
                  data-testid="button-submit-ticket"
                >
                  {createSupportTicketMutation.isPending ? "Submitting..." : "Submit Ticket"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}