import { useEffect, useState, useRef } from "react";

import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import CampaignCard from "@/components/campaign-card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Heart, Users, TrendingUp, Wallet, ArrowUpRight, CheckCircle, Coins, History, TrendingDown, Box, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { DepositModal } from "@/components/deposit-modal";
import { WithdrawalModal } from "@/components/withdrawal-modal";
import { Link } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const { toast } = useToast();
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    throwOnError: false
  });
  const isAuthenticated = !!user;
  const queryClient = useQueryClient();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [campaignCurrentSlide, setCampaignCurrentSlide] = useState(0);
  const campaignScrollRef = useRef<HTMLDivElement>(null);

  // Handle OAuth callback
  useEffect(() => {
    // Check if this is an OAuth callback
    if (window.location.hash.includes('access_token') || window.location.hash.includes('error')) {
      // Clear the hash from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Show success message
      if (window.location.hash.includes('access_token')) {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in with OAuth.",
          variant: "default",
        });
      }
    }
  }, [toast]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please sign in to continue.",
        variant: "destructive",
      });
import('@/lib/loginModal').then(m => m.openLoginModal());      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Redirect Admin/Support users to Admin Panel
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if ((user as any)?.isAdmin || (user as any)?.isSupport) {
        window.location.href = "/admin";
        return;
      }
    }
  }, [isAuthenticated, isLoading, user]);

  const { data: userCampaigns } = useQuery({
    queryKey: ["/api/user/campaigns"],
    retry: false,
  });

  const { data: userContributions } = useQuery({
    queryKey: ["/api/user/contributions"],
    retry: false,
  });

  const { data: userTransactions } = useQuery({
    queryKey: ["/api/transactions/user"],
    retry: false,
  });

  const { data: featuredCampaigns } = useQuery({
    queryKey: ["/api/campaigns/featured"],
  });

  if (isLoading) {
    return (
<div className="min-h-screen bg-background">
        <Navigation variant="sticky-compact" topOffsetClass="top-4" />
        <div className="flex items-center justify-center min-h-[50vh] mt-8">          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Carousel scroll function
  const scrollCarousel = (direction: 'left' | 'right', scrollRef: React.RefObject<HTMLDivElement>, currentSlide: number, setCurrentSlide: (slide: number) => void, totalItems: number) => {
    if (!scrollRef.current) return;
    
    const cardWidth = 320; // w-80 = 320px
    const gap = 24; // gap-6 = 24px
    const scrollAmount = cardWidth + gap;
    
    let newSlide = currentSlide;
    if (direction === 'left') {
      newSlide = Math.max(0, currentSlide - 1);
    } else {
      newSlide = Math.min(totalItems - 1, currentSlide + 1);
    }
    
    setCurrentSlide(newSlide);
    scrollRef.current.scrollTo({
      left: newSlide * scrollAmount,
      behavior: 'smooth'
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  const totalContributed = Array.isArray(userContributions) ? userContributions.reduce((sum: number, contribution: any) => 
    sum + parseFloat(contribution.amount), 0) : 0;

  const totalRaised = Array.isArray(userCampaigns) ? userCampaigns.reduce((sum: number, campaign: any) => 
    sum + parseFloat(campaign.currentAmount), 0) : 0;

  // Calculate total withdrawals from transactions
  const totalWithdrawals = Array.isArray(userTransactions) ? userTransactions.filter((transaction: any) => 
    transaction.type === 'withdrawal' || transaction.type === 'withdraw'
  ).reduce((sum: number, transaction: any) => 
    sum + parseFloat(transaction.amount || '0'), 0) : 0;


  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="sticky-compact" topOffsetClass="top-4" />
      
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-8">        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-welcome">
            Welcome back, {user?.firstName || "User"}!
          </h1>
          <p className="text-lg text-muted-foreground">
            Track your impact and discover new ways to make a difference
          </p>
        </div>

        {/* Stats Cards - First Row */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Campaigns Created</p>
                  <p className="text-xl font-bold text-primary" data-testid="stat-campaigns">
{Array.isArray(userCampaigns) ? userCampaigns.filter((c: any) => c.status === 'approved' || c.status === 'active' || c.status === 'on_progress' || c.status === 'completed').length : 0}                  </p>
                </div>
                <PlusCircle className="w-6 h-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Raised</p>
                  <p className="text-xl font-bold text-accent" data-testid="stat-raised">
                    ₱{totalRaised.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tips</p>
                  <p className="text-xl font-bold text-secondary" data-testid="stat-tips">
                    ₱{parseFloat(user?.tipsBalance || "0").toLocaleString()}
                  </p>
                </div>
                <Heart className="w-6 h-6 text-secondary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards - Second Row */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Campaign Contributions</p>
                  <p className="text-xl font-bold text-accent" data-testid="stat-contributions">
                    ₱{parseFloat(user?.contributionsBalance || "0").toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Campaign Tips</p>
                  <p className="text-xl font-bold text-secondary" data-testid="stat-campaign-tips">
                    ₱{parseFloat(user?.tipsBalance || "0").toLocaleString()}
                  </p>
                </div>
                <Heart className="w-6 h-6 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Withdrawals</p>
                  <p className="text-xl font-bold text-primary" data-testid="stat-withdrawals">
                    ₱{totalWithdrawals.toLocaleString()}
                  </p>
                </div>
                <Wallet className="w-6 h-6 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>


        {/* KYC Status removed - verification handled in navigation */}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Quick Actions */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
<Button className="w-full" data-testid="button-create-campaign" onClick={() => {
                    import('@/lib/createCampaignModal').then(m => m.openCreateCampaign());
                  }}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create New Campaign
                  </Button>                  <DepositModal />
                  <Link href="/browse-campaigns">
                    <Button className="w-full" data-testid="button-browse-campaigns">
                      <Users className="w-4 h-4 mr-2" />
                      Campaign Opportunities
                    </Button>
                  </Link>
                  <WithdrawalModal />
                </div>
              </CardContent>
            </Card>

            {/* Featured Campaigns */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Featured Campaigns</h2>
                <Link href="/browse-campaigns">
                  <Button variant="ghost" data-testid="button-view-all-campaigns">View All</Button>
                </Link>
              </div>
              
              <div className="relative">
                <div 
                  ref={campaignScrollRef}
                  className="flex overflow-x-hidden scroll-smooth gap-6"
                >
                  {featuredCampaigns && featuredCampaigns.length > 0 ? (
                    featuredCampaigns.map((campaign: any) => (
                      <div key={campaign.id} className="flex-none w-80">
                        <CampaignCard campaign={campaign} />
                      </div>
                    ))
                  ) : (
                    <div className="w-full text-center py-12">
                      <p className="text-muted-foreground">No campaigns available</p>
                    </div>
                  )}
                </div>
                
                {featuredCampaigns && featuredCampaigns.length > 3 && (
                  <>
                    <button
                      onClick={() => scrollCarousel('left', campaignScrollRef, campaignCurrentSlide, setCampaignCurrentSlide, featuredCampaigns.length)}
className="absolute left-0 top-1/2 -translate-y-1/2 bg-card shadow-lg rounded-full p-2 hover:bg-muted"                      data-testid="button-scroll-campaigns-left"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => scrollCarousel('right', campaignScrollRef, campaignCurrentSlide, setCampaignCurrentSlide, featuredCampaigns.length)}
className="absolute right-0 top-1/2 -translate-y-1/2 bg-card shadow-lg rounded-full p-2 hover:bg-muted"                      data-testid="button-scroll-campaigns-right"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* My Campaigns */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>My Campaigns</span>
<Badge variant="secondary">{
                    Array.isArray(userCampaigns)
                      ? (userCampaigns as any[]).filter((c: any) => {
                          const status = String(c?.status || '').toLowerCase();
                          return status === 'active' || status === 'on_progress' || status === 'completed';
                        }).length
                      : 0
                  }</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(userCampaigns) && (userCampaigns as any[]).some((c: any) => ['active','on_progress','completed'].includes(String(c?.status || '').toLowerCase())) ? (
                  <div className="space-y-3">
                    {(userCampaigns as any[])
                      .filter((c: any) => ['active','on_progress','completed'].includes(String(c?.status || '').toLowerCase()))
                      .slice(0, 3)
                      .map((campaign: any) => (                      <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                        <div className="p-3 border rounded-lg hover:bg-muted cursor-pointer" data-testid={`campaign-summary-${campaign.id}`}>
                          <h4 className="font-medium text-sm mb-1">{campaign.title}</h4>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>₱{parseFloat(campaign.currentAmount).toLocaleString()}</span>
                            <Badge variant="outline" className="text-xs">
                              {campaign.status}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
{Array.isArray(userCampaigns) && (userCampaigns as any[]).filter((c: any) => ['active','on_progress','completed'].includes(String(c?.status || '').toLowerCase())).length > 3 && (                      <Link href="/campaigns?creator=me">
                        <Button variant="ghost" size="sm" className="w-full">
                          View All My Campaigns
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-2">No campaigns yet</p>
                    <Link href="/create-campaign">
                      <Button size="sm" data-testid="button-create-first-campaign">Create Your First Campaign</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="w-5 h-5" />
                  <span>Transaction History</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Click on any transaction to view detailed information
                </p>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-y-auto space-y-3">
                  {Array.isArray(userTransactions) && userTransactions.length > 0 ? (
                    userTransactions?.map((transaction: any) => {
                      // Helper function to get readable transaction type
                      const getTransactionTypeLabel = (type: string) => {
                        const typeMap: { [key: string]: string } = {
                          'contribution': 'Contribute',
                          'tip': 'Tip',
                          'claim_tip': 'Claim Tip',
                          'claim_contribution': 'Claim Contribution',
                          'deposit': 'Deposit',
                          'withdrawal': 'Withdraw',
                          'withdraw': 'Withdraw',
                          'claim_tip_balance': 'Claim Tip Balance',
                          'claim_contribution_balance': 'Claim Contribution Balance',
                          'fee': 'Platform Fee',
                          'refund': 'Refund',
                          'transfer': 'Transfer',
                          'payout': 'Payout',
                          'conversion': 'Currency Conversion'
                        };
                        return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
                      };

                      return (
                        <div 
                          key={transaction.id}
                          onClick={() => setSelectedTransaction(transaction)}
                          className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-all hover:shadow-md"
                          data-testid={`transaction-detail-${transaction.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                transaction.type === 'deposit' ? 'bg-green-100' :
                                transaction.type === 'withdrawal' || transaction.type === 'withdraw' ? 'bg-blue-100' :
                                transaction.type === 'contribution' ? 'bg-purple-100' :
                                transaction.type === 'tip' ? 'bg-orange-100' :
                                transaction.type.includes('claim') ? 'bg-yellow-100' :
                                'bg-gray-100'
                              }`}>
                                {transaction.type === 'deposit' && <TrendingUp className="w-3 h-3 text-green-600" />}
                                {(transaction.type === 'withdrawal' || transaction.type === 'withdraw') && <TrendingDown className="w-3 h-3 text-blue-600" />}
                                {transaction.type === 'contribution' && <Heart className="w-3 h-3 text-purple-600" />}
                                {transaction.type === 'tip' && <Heart className="w-3 h-3 text-orange-600" />}
                                {transaction.type.includes('claim') && <CheckCircle className="w-3 h-3 text-yellow-600" />}
                                {!['deposit', 'withdrawal', 'withdraw', 'contribution', 'tip'].includes(transaction.type) && !transaction.type.includes('claim') && <Box className="w-3 h-3 text-gray-600" />}
                              </div>
                              <div>
                                <div className="font-medium text-sm">
                                  {getTransactionTypeLabel(transaction.type)}
                                </div>
                                <div className="font-semibold text-base text-gray-900">
                                  ₱{parseFloat(transaction.amount || '0').toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  ID: {transaction.id.slice(0, 8)}...
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant={
                                  transaction.status === 'completed' ? 'default' : 
                                  transaction.status === 'failed' ? 'destructive' : 
                                  'secondary'
                                }
                                className="text-xs"
                              >
                                {transaction.status}
                              </Badge>
                              <div className="text-xs text-muted-foreground mt-1">
                                {format(new Date(transaction.createdAt), "MMM d, yyyy")}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Transaction History</h3>
                      <p className="text-muted-foreground">
                        Your transaction history will appear here once you make your first contribution or withdrawal.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
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
<div className="flex items-start justify-between p-4 bg-card rounded-lg">                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedTransaction.type === 'deposit' ? 'bg-green-100' :
                      selectedTransaction.type === 'withdrawal' || selectedTransaction.type === 'withdraw' ? 'bg-blue-100' :
                      selectedTransaction.type === 'contribution' ? 'bg-purple-100' :
                      selectedTransaction.type === 'tip' ? 'bg-orange-100' :
                      selectedTransaction.type && selectedTransaction.type.includes('claim') ? 'bg-yellow-100' :
                      'bg-gray-100'
                    }`}>
                      {selectedTransaction.type === 'deposit' && <TrendingUp className="w-6 h-6 text-green-600" />}
                      {(selectedTransaction.type === 'withdrawal' || selectedTransaction.type === 'withdraw') && <TrendingDown className="w-6 h-6 text-blue-600" />}
                      {selectedTransaction.type === 'contribution' && <Heart className="w-6 h-6 text-purple-600" />}
                      {selectedTransaction.type === 'tip' && <Heart className="w-6 h-6 text-orange-600" />}
                      {selectedTransaction.type && selectedTransaction.type.includes('claim') && <CheckCircle className="w-6 h-6 text-yellow-600" />}
                      {!['deposit', 'withdrawal', 'withdraw', 'contribution', 'tip'].includes(selectedTransaction.type || '') && !(selectedTransaction.type || '').includes('claim') && <Box className="w-6 h-6 text-gray-600" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {selectedTransaction.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </h3>
                      <p className="text-2xl font-bold text-primary">
                        ₱{parseFloat(selectedTransaction.amount || '0').toLocaleString()}
                      </p>
                    </div>
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

                {/* Transaction Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono">{selectedTransaction.id.slice(0, 8)}...{selectedTransaction.id.slice(-4)}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedTransaction.id);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs underline"
                        title="Click to copy full Transaction ID"
                      >
                        Copy ID
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Transaction Type</label>
                    <p className="text-sm">{selectedTransaction.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                    <p className="text-sm">{format(new Date(selectedTransaction.createdAt), "PPP 'at' p")}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="text-sm">{selectedTransaction.status || 'Completed'}</p>
                  </div>
                  {selectedTransaction.fee && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fee</label>
                      <p className="text-sm">₱{parseFloat(selectedTransaction.fee).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedTransaction.campaignId && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Campaign ID</label>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono">{selectedTransaction.campaignId.slice(0, 8)}...{selectedTransaction.campaignId.slice(-4)}</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedTransaction.campaignId);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs underline"
                          title="Click to copy full Campaign ID"
                        >
                          Copy ID
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
