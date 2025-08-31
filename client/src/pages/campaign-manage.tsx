import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft,
  Settings, 
  HandCoins, 
  Gift, 
  XCircle, 
  CheckCircle2,
  Eye,
  Users,
  TrendingUp,
  Wallet,
  AlertTriangle,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTipSchema } from "@shared/schema";
import { z } from "zod";
import type { Campaign, Tip } from "@shared/schema";

const claimTipSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
});

export default function CampaignManage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/campaigns/:id/manage");
  const campaignId = params?.id;
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isClaimTipModalOpen, setIsClaimTipModalOpen] = useState(false);
  const [isClaimContributionModalOpen, setIsClaimContributionModalOpen] = useState(false);

  // Fetch campaign data
  const { data: campaign, isLoading } = useQuery({
    queryKey: ["/api/campaigns", campaignId],
    enabled: !!campaignId,
  });

  // Fetch campaign tips
  const { data: tips = [] } = useQuery({
    queryKey: ["/api/campaigns", campaignId, "tips"],
    enabled: !!campaignId,
  });

  const totalTips = tips.reduce((sum: number, tip: Tip) => sum + parseFloat(tip.amount), 0);

  // Check if user is creator
  const isCreator = (user as any)?.id === campaign?.creatorId;
  const isKycVerified = ['verified', 'approved'].includes((user as any)?.kycStatus || '');
  const isActiveStatus = ['active', 'on_progress'].includes(campaign?.status || '');

  // Form for claiming tips
  const claimTipForm = useForm({
    resolver: zodResolver(claimTipSchema),
    defaultValues: {
      amount: "",
    },
  });

  // Claim tip mutation
  const claimTipMutation = useMutation({
    mutationFn: async (data: { amount: string }) => {
      return apiRequest("POST", "/api/users/claim-tips", { amount: data.amount });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Tips claimed successfully!",
      });
      queryClient.setQueryData(["/api/auth/user"], (prev: any) => ({ ...(prev || {}), balance: (prev?.balance ?? 0) }));
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "tips"] });
      setIsClaimTipModalOpen(false);
      claimTipForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to claim tips",
        variant: "destructive",
      });
    },
  });

  // Claim contributions mutation
  const claimContributionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/campaigns/${campaignId}/claim-contributions`);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Contributions claimed successfully!",
      });
      queryClient.setQueryData(["/api/auth/user"], (prev: any) => ({ ...(prev || {}), balance: (prev?.balance ?? 0) }));
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId] });
      setIsClaimContributionModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to claim contributions",
        variant: "destructive",
      });
    },
  });

  // Campaign status mutation
  const statusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      return apiRequest("PATCH", `/api/campaigns/${campaignId}/status`, { status });
    },
    onSuccess: (_, { status }) => {
      const statusMessage = status === 'completed' 
        ? 'Congratulations! Your campaign has been marked as completed.'
        : 'Your campaign has been ended successfully. All contributor refunds are being processed.';
      
      toast({
        title: "Success",
        description: statusMessage,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Action failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onClaimTip = (data: { amount: string }) => {
    claimTipMutation.mutate(data);
  };

  const onClaimContribution = () => {
    claimContributionMutation.mutate();
  };

  const handleStatusChange = (status: string, confirmMessage: string) => {
    if (confirm(confirmMessage)) {
      statusMutation.mutate({ status });
    }
  };

  if (!isAuthenticated) {
    return (
<div className="min-h-screen bg-background">        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please log in to manage your campaign.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
<div className="min-h-screen bg-background">        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading campaign...</div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
<div className="min-h-screen bg-background">        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Campaign not found.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!isCreator) {
    return (
<div className="min-h-screen bg-background">        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You can only manage campaigns that you created.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.min((parseFloat(campaign.currentAmount) / parseFloat(campaign.goalAmount)) * 100, 100);

  return (
<div className="min-h-screen bg-background">      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation(`/campaigns/${campaignId}`)}
            className="mb-4"
            data-testid="button-back-to-campaign"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaign
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Campaign Management</h1>
          </div>
          <p className="text-gray-600">Manage your campaign, claim funds, and update status</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Campaign Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{campaign.title}</h3>
                    <Badge variant={campaign.status === 'active' || campaign.status === 'on_progress' ? 'default' : 'secondary'}>
                      {campaign.status === 'on_progress' ? 'In Progress' : campaign.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progressPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>₱{parseFloat(campaign.currentAmount).toLocaleString()}</span>
                      <span>₱{parseFloat(campaign.goalAmount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ₱{parseFloat(campaign.currentAmount).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Contributions</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      ₱{totalTips.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Tips</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Management Actions */}
          <div className="space-y-6">
            {!isKycVerified && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Complete KYC verification to access financial actions.
                </AlertDescription>
              </Alert>
            )}

            {/* Financial Actions */}
            {isActiveStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Claim Funds
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    size="lg" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => setIsClaimContributionModalOpen(true)}
                    disabled={!isKycVerified}
                    data-testid="button-claim-contributions"
                  >
                    <HandCoins className="w-4 h-4 mr-2" />
                    CLAIM CONTRIBUTIONS
                  </Button>
                  
                  <Button 
                    size="lg" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => setIsClaimTipModalOpen(true)}
                    disabled={!isKycVerified || totalTips === 0}
                    data-testid="button-claim-tips"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    {totalTips === 0 ? 'NO TIPS TO CLAIM' : 'CLAIM TIPS'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Campaign Status Actions */}
            {isActiveStatus && (
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    size="lg"
                    variant="outline"
                    className="w-full border-green-500 text-green-600 hover:bg-green-50"
                    onClick={() => handleStatusChange(
                      'completed',
                      `🎯 MARK CAMPAIGN AS COMPLETED?

⚠️ IMPORTANT: Your future pool creation access depends on your final credit score:

📊 CREDIT SCORE IMPACT:
• Below 65%: Account will be SUSPENDED immediately
• 66-75%: Only 2 more pools LIFETIME + must increase credit score to unlock monthly access
• 76-85%: Limited to 2 pools per month  
• 85-95%: Limited to 4 pools per month
• 96-100%: Can create up to 10 pools per month

💰 COMPLETION EFFECTS:
• Campaign will be marked as successfully completed
• No further contributions will be accepted
• Funds remain available for your withdrawal
• Contributors can still view your completed progress

⏰ SUSPENSION APPEAL PROCESS:
Creators can request an appeal of suspended accounts by filing a support ticket

This action closes the campaign permanently. Do you want to proceed with completion?`
                    )}
                    data-testid="button-complete-campaign"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    MARK COMPLETED
                  </Button>
                  
                  <Button 
                    size="lg"
                    variant="outline"
                    className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                    onClick={() => handleStatusChange(
                      'cancelled',
                      `Are you sure you want to end this campaign?

IMPORTANT: When you end a campaign:

• All contributor funds will be automatically refunded to their accounts
• Contributors with safe accounts will receive immediate refunds  
• Contributors with suspended accounts will have funds held securely until account verification
• No further contributions will be accepted
• This action cannot be undone

Do you want to proceed with ending this campaign?`
                    )}
                    data-testid="button-end-campaign"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    END CAMPAIGN
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Campaign Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span>{format(new Date(campaign.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="capitalize">{campaign.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Campaign ID:</span>
                    <span className="font-mono text-xs">{campaign.campaignDisplayId}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Claim Tips Modal */}
        <Dialog open={isClaimTipModalOpen} onOpenChange={setIsClaimTipModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Claim Campaign Tips</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Specify the amount of tips you want to claim (1% fee applies)
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
                          max={totalTips.toString()}
                          {...field}
                          data-testid="input-claim-tip-amount"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500">
                        Available tips: ₱{totalTips.toLocaleString()}
                      </p>
                    </FormItem>
                  )}
                />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsClaimTipModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={claimTipMutation.isPending}
                    className="flex-1"
                    data-testid="button-confirm-claim-tips"
                  >
                    {claimTipMutation.isPending ? "Claiming..." : "Claim Tips"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Claim Contributions Modal */}
        <Dialog open={isClaimContributionModalOpen} onOpenChange={setIsClaimContributionModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Claim Campaign Contributions</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Claim all available contributions from this campaign
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    ₱{parseFloat(campaign.currentAmount).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Available Contributions</div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsClaimContributionModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onClaimContribution}
                  disabled={claimContributionMutation.isPending}
                  className="flex-1"
                  data-testid="button-confirm-claim-contributions"
                >
                  {claimContributionMutation.isPending ? "Claiming..." : "Claim All"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}