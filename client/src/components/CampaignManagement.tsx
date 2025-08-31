import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { 
  Settings, 
  HandCoins, 
  Gift, 
  XCircle, 
  CheckCircle2,
  Eye,
  Flag,
  AlertTriangle,
  AlertCircle,
  Shield,
  TrendingDown,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { CampaignWithCreator } from '@shared/schema';

interface CampaignManagementProps {
  campaign: CampaignWithCreator;
  variant?: 'card' | 'detail' | 'admin';
  onClaimContribution?: () => void;
  onClaimTip?: () => void;
  onTipVolunteers?: () => void;
  totalTips?: number;
  className?: string;
  hasApprovedVolunteers?: boolean;
  isLoadingVolunteers?: boolean;
}

export function CampaignManagement({ 
  campaign, 
  variant = 'card',
  onClaimContribution,
  onClaimTip,
  onTipVolunteers,
  totalTips = 0,
  className = '',
  hasApprovedVolunteers = false,
  isLoadingVolunteers = false
}: CampaignManagementProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Modal state
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isCreator = (user as any)?.id === campaign?.creatorId;
  const isAdmin = (user as any)?.isAdmin;
  const isKycVerified = ['verified', 'approved'].includes((user as any)?.kycStatus || '');
  const isActiveStatus = ['active', 'on_progress'].includes(campaign?.status || '');

  // Handle campaign status changes
  const handleStatusChange = async (status: string, successMessage: string) => {
    setIsProcessing(true);
    try {
      await apiRequest("PATCH", `/api/campaigns/${campaign?.id}/status`, { status });
      toast({
        title: "Success",
        description: successMessage,
      });
      // Invalidate all campaign-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaign?.id] });
      
      // Close modals
      setShowCloseModal(false);
      setShowCompleteModal(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Action failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle admin actions
  const handleAdminAction = async (action: 'approve' | 'reject' | 'flag', confirmMessage: string) => {
    if (confirm(confirmMessage)) {
      try {
        await apiRequest("POST", `/api/admin/campaigns/${campaign?.id}/${action}`, {});
        toast({
          title: "Success",
          description: `Campaign ${action}d successfully.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns/pending"] });
        queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to ${action} campaign. Please try again.`,
          variant: "destructive",
        });
      }
    }
  };

  // Card variant - Simple manage/contribute button
  if (variant === 'card') {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <Link href={`/campaigns/${campaign?.id}`}>
          <Button 
            size="sm"
            variant={isCreator ? "outline" : "default"}
            data-testid={`button-${isCreator ? 'manage' : 'contribute'}-${campaign?.id}`}
          >
            {isCreator ? (
              <>
                <Settings className="w-4 h-4 mr-2" />
                MANAGE
              </>
            ) : (
              "Contribute"
            )}
          </Button>
        </Link>
      </div>
    );
  }

  // Admin variant - Admin specific actions
  if (variant === 'admin') {
    return (
      <div className={`space-y-2 ${className}`}>
        {campaign?.status === 'pending' && (
          <div className="grid grid-cols-3 gap-2">
            <Button 
              size="sm" 
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleAdminAction('approve', 'Approve this campaign?')}
              data-testid={`button-admin-approve-${campaign?.id}`}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              APPROVE
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => handleAdminAction('reject', 'Reject this campaign?')}
              data-testid={`button-admin-reject-${campaign?.id}`}
            >
              <XCircle className="w-4 h-4 mr-1" />
              REJECT
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
              onClick={() => handleAdminAction('flag', 'Flag this campaign for review?')}
              data-testid={`button-admin-flag-${campaign?.id}`}
            >
              <Flag className="w-4 h-4 mr-1" />
              FLAG
            </Button>
          </div>
        )}
        <Link href={`/campaigns/${campaign?.id}`}>
          <Button 
            size="sm" 
            variant="outline"
            className="w-full"
            data-testid={`button-admin-view-${campaign?.id}`}
          >
            <Eye className="w-4 h-4 mr-2" />
            VIEW DETAILS
          </Button>
        </Link>
      </div>
    );
  }

  // Detail variant - Full management interface
  if (variant === 'detail' && isAuthenticated && isCreator && isActiveStatus) {
    return (
      <>
        <div className={`space-y-4 ${className}`}>
          {/* Claim Buttons */}
          <div className="space-y-2">
            <Button 
              size="lg" 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={onClaimContribution}
              disabled={!isKycVerified}
              data-testid="button-claim-contributions-main"
            >
              <HandCoins className="w-4 h-4 mr-2" />
              CLAIM CONTRIBUTION
            </Button>
            <Button 
              size="lg" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={onClaimTip}
              disabled={!isKycVerified || totalTips === 0}
              data-testid="button-claim-tips-main"
            >
              <Gift className="w-4 h-4 mr-2" />
              {totalTips === 0 ? 'ALL TIPS CLAIMED' : 'CLAIM TIP'}
            </Button>
            <Button 
              size="lg" 
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={onTipVolunteers}
              disabled={!isKycVerified || !hasApprovedVolunteers || isLoadingVolunteers}
              data-testid="button-tip-volunteers"
              title={isLoadingVolunteers ? "Loading volunteer data..." : !hasApprovedVolunteers ? "No approved volunteers to tip or authentication error" : "Tip your approved volunteers"}
            >
              <Gift className="w-4 h-4 mr-2" />
              {isLoadingVolunteers ? 'LOADING...' : 'TIP VOLUNTEERS'}
              {!hasApprovedVolunteers && !isLoadingVolunteers && (
                <span className="text-xs ml-2 opacity-75">(No approved volunteers)</span>
              )}
            </Button>
          </div>

          {/* Campaign Management Actions */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50 min-w-[120px] text-xs"
                onClick={() => setShowCloseModal(true)}
                data-testid="button-end-campaign"
              >
                <XCircle className="w-4 h-4 mr-1" />
                CLOSE CAMPAIGN
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                className="border-green-500 text-green-600 hover:bg-green-50 min-w-[130px] text-xs"
                onClick={() => setShowCompleteModal(true)}
                data-testid="button-complete-campaign"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                CAMPAIGN COMPLETE
              </Button>
            </div>
          </div>
        </div>

        {/* Close Campaign Modal */}
        <Dialog open={showCloseModal} onOpenChange={setShowCloseModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                <span>Close Campaign - Critical Warning</span>
              </DialogTitle>
              <DialogDescription className="text-left">
                This action will permanently close your campaign and trigger automatic refunds to all contributors.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Critical Warning Alert */}
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 font-semibold">
                  This action is PERMANENT and cannot be undone. All contributors will receive automatic refunds.
                </AlertDescription>
              </Alert>

              {/* Refund Process */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span>Automatic Refund Process</span>
                </h4>
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm">All funds automatically distributed to contributors</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm">Process cannot be reversed once initiated</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm">No further contributions accepted</span>
                  </div>
                </div>
              </div>

              {/* Fraud Detection */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span>Fraud Detection & Consequences</span>
                </h4>
                <div className="bg-orange-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm">If contributors receive full refunds: You will NOT be flagged for fraud</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <span className="text-sm">If NOT all contributors receive full refunds: You WILL be flagged for fraud and your account WILL be suspended</span>
                  </div>
                </div>
              </div>

              {/* Credit Score Impact */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg flex items-center space-x-2">
                  <TrendingDown className="w-5 h-5 text-purple-600" />
                  <span>Credit Score Impact on Future Access</span>
                </h4>
                <div className="bg-purple-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>80-100% credit score:</span>
                    <span className="font-semibold text-green-600">5 free slots/month</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>75-79%:</span>
                    <span className="font-semibold text-blue-600">3 free slots/month</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>65-74%:</span>
                    <span className="font-semibold text-yellow-600">1 free slot/month</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>50-64%:</span>
                    <span className="font-semibold text-orange-600">0 free slots, buy up to 3 slots (₱9,000)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>35-49%:</span>
                    <span className="font-semibold text-red-600">0 free slots, buy up to 2 slots (₱6,000)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>20-34%:</span>
                    <span className="font-semibold text-red-600">0 free slots, buy 1 slot (₱3,000)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Below 20%:</span>
                    <span className="font-semibold text-red-600">0 free slots, no paid slots available</span>
                  </div>
                </div>
              </div>

              {/* Appeal Process */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <span>Suspension Appeal Process</span>
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Creators can request an appeal of suspended accounts by filing a support ticket through our help center.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleStatusChange(
                    'cancelled',
                    'Your campaign pool has been closed. Automatic refund processing has begun. All contributors will receive their funds back.'
                  )}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Close Campaign
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Complete Campaign Modal */}
        <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-green-600">
                <CheckCircle2 className="w-6 h-6" />
                <span>Mark Campaign as Completed</span>
              </DialogTitle>
              <DialogDescription className="text-left">
                Complete your campaign to mark it as successfully finished and unlock your funds.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Success Alert */}
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 font-semibold">
                  Congratulations! You're ready to complete your campaign successfully.
                </AlertDescription>
              </Alert>

              {/* Completion Effects */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span>What Happens When You Complete</span>
                </h4>
                <div className="bg-green-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm">Campaign will be marked as successfully completed</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm">No further contributions will be accepted</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm">Funds remain available for your withdrawal</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm">Contributors can still view your completed progress</span>
                  </div>
                </div>
              </div>

              {/* Credit Score Impact */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg flex items-center space-x-2">
                  <TrendingDown className="w-5 h-5 text-purple-600" />
                  <span>Credit Score Impact on Future Access</span>
                </h4>
                <div className="bg-purple-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>80-100% credit score:</span>
                    <span className="font-semibold text-green-600">5 free slots/month</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>75-79%:</span>
                    <span className="font-semibold text-blue-600">3 free slots/month</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>65-74%:</span>
                    <span className="font-semibold text-yellow-600">1 free slot/month</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>50-64%:</span>
                    <span className="font-semibold text-orange-600">0 free slots, buy up to 3 slots (₱9,000)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>35-49%:</span>
                    <span className="font-semibold text-red-600">0 free slots, buy up to 2 slots (₱6,000)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>20-34%:</span>
                    <span className="font-semibold text-red-600">0 free slots, buy 1 slot (₱3,000)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Below 20%:</span>
                    <span className="font-semibold text-red-600">0 free slots, no paid slots available</span>
                  </div>
                </div>
              </div>

              {/* Appeal Process */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <span>Suspension Appeal Process</span>
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Creators can request an appeal of suspended accounts by filing a support ticket through our help center.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleStatusChange(
                    'completed',
                    'Congratulations! Your campaign has been marked as completed.'
                  )}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Complete Campaign
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}

export default CampaignManagement;