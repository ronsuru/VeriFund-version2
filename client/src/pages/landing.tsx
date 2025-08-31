import Navigation from "@/components/navigation";
import Hero from "@/components/hero";
import CampaignCard from "@/components/campaign-card";
import VolunteerCard from "@/components/volunteer-card";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Heart, DollarSign, Users, TrendingUp, Star, MessageSquare, RefreshCw, AlertCircle, Target, UserCheck } from "lucide-react";
import { Link } from "wouter";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Landing() {
  const [campaignCurrentSlide, setCampaignCurrentSlide] = useState(0);
  const [volunteerCurrentSlide, setVolunteerCurrentSlide] = useState(0);
  const [storiesCurrentSlide, setStoriesCurrentSlide] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const [showVolunteerSignInDialog, setShowVolunteerSignInDialog] = useState(false);
  
  const campaignScrollRef = useRef<HTMLDivElement>(null);
  const volunteerScrollRef = useRef<HTMLDivElement>(null);
  const storiesScrollRef = useRef<HTMLDivElement>(null);

  // Fetch live platform statistics
  const { data: platformStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ["/api/platform/stats"],
queryFn: async () => {
      const res = await fetch("/api/platform/stats", { cache: 'no-cache' });
      return res.json();
    },    refetchInterval: autoRefresh ? 300000 : false, // Refresh every 5 minutes
    staleTime: 240000, // Consider data stale after 4 minutes
  });

  // Fetch featured campaigns (includes both active and on_progress)
  const { data: campaigns, isLoading: campaignsLoading, error: campaignsError, refetch: refetchCampaigns } = useQuery({
    queryKey: ["/api/campaigns/featured"],
queryFn: async () => {
      const res = await fetch("/api/campaigns/featured", { cache: 'no-cache' });
      return res.json();
    },    refetchInterval: autoRefresh ? 300000 : false,
    staleTime: 240000,
  });

  // Fetch volunteer opportunities
  const { data: opportunities, isLoading: opportunitiesLoading, error: opportunitiesError, refetch: refetchOpportunities } = useQuery({
    queryKey: ["/api/volunteer-opportunities"],
queryFn: async () => {
      const res = await fetch("/api/volunteer-opportunities?status=active&limit=10", { cache: 'no-cache' });
      return res.json();
    },    refetchInterval: autoRefresh ? 300000 : false,
    staleTime: 240000,
  });

  // Fetch latest news and updates
  const { data: featuredStories, isLoading: newsLoading, error: newsError, refetch: refetchNews } = useQuery({
    queryKey: ["/api/platform/news"],
queryFn: async () => {
      const res = await fetch("/api/platform/news?limit=6", { cache: 'no-cache' });
      return res.json();
    },    refetchInterval: autoRefresh ? 600000 : false, // Refresh every 10 minutes for news
    staleTime: 480000, // Consider news stale after 8 minutes
  });

  // Manual refresh function
  const handleManualRefresh = () => {
    refetchStats();
    refetchCampaigns();
    refetchOpportunities();
    refetchNews();
  };

  // Auto-refresh toggle
  useEffect(() => {
    const interval = setInterval(() => {
      if (autoRefresh) {
        handleManualRefresh();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const scrollCarousel = (direction: 'left' | 'right', ref: any, currentSlide: number, setCurrentSlide: any, maxSlides: number) => {
    const container = ref.current;
    if (!container) return;

    const slideWidth = container.children[0]?.clientWidth || 0;
    const newSlide = direction === 'left' 
      ? Math.max(0, currentSlide - 1)
      : Math.min(maxSlides - 1, currentSlide + 1);
    
    container.scrollTo({
      left: newSlide * slideWidth,
      behavior: 'smooth'
    });
    setCurrentSlide(newSlide);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f8f8' }}>
<Navigation variant="sticky-compact" topOffsetClass="top-4" />      <Hero />
      
      {/* Platform Metrics */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Live Platform Analytics</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-refresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="auto-refresh" className="text-sm text-muted-foreground">
                  Auto-refresh
                </label>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleManualRefresh}
                disabled={statsLoading}
                data-testid="button-refresh-stats"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {statsError ? (
            <Card className="p-6 border-red-200 bg-red-50">
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span>Failed to load platform statistics. Please try refreshing.</span>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-4 gap-6 text-center">
              {/* Row 1: Total Contributions, Total Tips, Active Campaigns, Total Campaigns */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-6 w-20 mb-2" />
                ) : (
                  <h3 className="text-xl font-bold mb-2" data-testid="stat-total-contributions">
                    {platformStats?.totalContributions || '₱0'}
                  </h3>
                )}
                <p className="text-sm text-muted-foreground">Total Contributions</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-green-600" />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-6 w-20 mb-2" />
                ) : (
                  <h3 className="text-xl font-bold mb-2" data-testid="stat-total-tips">
                    {platformStats?.totalTips || '₱0'}
                  </h3>
                )}
                <p className="text-sm text-muted-foreground">Total Tips</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-6 w-16 mb-2" />
                ) : (
                  <h3 className="text-xl font-bold mb-2" data-testid="stat-active-campaigns">
                    {platformStats?.activeCampaigns || '0'}
                  </h3>
                )}
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <Target className="w-8 h-8 text-indigo-600" />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-6 w-16 mb-2" />
                ) : (
                  <h3 className="text-xl font-bold mb-2" data-testid="stat-total-campaigns">
                    {platformStats?.totalCampaigns || '0'}
                  </h3>
                )}
                <p className="text-sm text-muted-foreground">Total Campaigns</p>
              </div>
              
              {/* Row 2: Total Contributors, Total Tippers, Total Creators, Total Volunteers */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                  <UserCheck className="w-8 h-8 text-pink-600" />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-6 w-16 mb-2" />
                ) : (
                  <h3 className="text-xl font-bold mb-2" data-testid="stat-total-contributors">
                    {platformStats?.totalContributors || '0'}
                  </h3>
                )}
                <p className="text-sm text-muted-foreground">Total Contributors</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-cyan-600" />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-6 w-16 mb-2" />
                ) : (
                  <h3 className="text-xl font-bold mb-2" data-testid="stat-total-tippers">
                    {platformStats?.totalTippers || '0'}
                  </h3>
                )}
                <p className="text-sm text-muted-foreground">Total Tippers</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Star className="w-8 h-8 text-orange-600" />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-6 w-16 mb-2" />
                ) : (
                  <h3 className="text-xl font-bold mb-2" data-testid="stat-total-creators">
                    {platformStats?.totalCreators || '0'}
                  </h3>
                )}
                <p className="text-sm text-muted-foreground">Total Creators</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-6 w-16 mb-2" />
                ) : (
                  <h3 className="text-xl font-bold mb-2" data-testid="stat-total-volunteers">
                    {platformStats?.totalVolunteers || '0'}
                  </h3>
                )}
                <p className="text-sm text-muted-foreground">Total Volunteers</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Campaigns</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Support verified causes and track your impact with complete transparency
            </p>
          </div>
          
          <div className="relative">
            <div 
              ref={campaignScrollRef}
              className="flex overflow-x-hidden scroll-smooth gap-6"
            >
              {campaignsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex-none w-80">
                    <Card>
                      <Skeleton className="h-48 w-full" />
                      <CardContent className="p-4 space-y-3">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-8 w-full" />
                      </CardContent>
                    </Card>
                  </div>
                ))
              ) : campaignsError ? (
                <Card className="w-full p-6 border-red-200 bg-red-50">
                  <div className="flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>Failed to load campaigns. Please try refreshing.</span>
                  </div>
                </Card>
              ) : campaigns && campaigns.length > 0 ? (
                campaigns.map((campaign: any) => (
                  <div key={campaign.id} className="flex-none w-80">
                    <CampaignCard campaign={campaign} />
                  </div>
                ))
              ) : (
                <div className="w-full text-center py-12">
                  <p className="text-muted-foreground">No active campaigns at the moment</p>
                </div>
              )}
            </div>
            
            {campaigns && campaigns.length > 3 && (
              <>
                <button
                  onClick={() => scrollCarousel('left', campaignScrollRef, campaignCurrentSlide, setCampaignCurrentSlide, campaigns.length)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => scrollCarousel('right', campaignScrollRef, campaignCurrentSlide, setCampaignCurrentSlide, campaigns.length)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
          
          <div className="text-center mt-12">
            <Dialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
              <DialogTrigger asChild>
                <button 
                  className="border border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors"
                  data-testid="button-browse-campaigns"
                >
                  Browse More Campaigns
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-center text-xl font-bold text-gray-900">
                    Discover Amazing Campaigns
                  </DialogTitle>
                  <DialogDescription className="text-center text-gray-600 mt-2">
                    Sign in now to view all campaigns and support causes that matter to you!
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-4">
                      Join thousands of supporters making a real difference
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowSignInDialog(false)}
                      variant="outline"
                      className="flex-1"
                      data-testid="button-cancel-signin"
                    >
                      Not Now
                    </Button>
                    <Button
onClick={() => import('@/lib/loginModal').then(m => m.openLoginModal())}                      className="flex-1 bg-primary hover:bg-primary/90"
                      data-testid="button-signin-now"
                    >
                      Sign In
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Volunteer Opportunities */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Volunteer Opportunities</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Make hands-on difference by volunteering for causes that matter to you
            </p>
          </div>
          
          <div className="relative">
            <div 
              ref={volunteerScrollRef}
              className="flex overflow-x-hidden scroll-smooth gap-6"
            >
              {opportunitiesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex-none w-80">
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-8 w-full" />
                      </CardContent>
                    </Card>
                  </div>
                ))
              ) : opportunitiesError ? (
                <Card className="w-full p-6 border-red-200 bg-red-50">
                  <div className="flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>Failed to load volunteer opportunities. Please try refreshing.</span>
                  </div>
                </Card>
              ) : opportunities && opportunities.length > 0 ? (
                opportunities.map((opportunity: any) => (
                  <div key={opportunity.id} className="flex-none w-80">
                    <VolunteerCard 
                      opportunity={opportunity}
onApply={() => import('@/lib/loginModal').then(m => m.openLoginModal())}                    />
                  </div>
                ))
              ) : (
                <div className="w-full text-center py-12">
                  <p className="text-muted-foreground">No volunteer opportunities available</p>
                </div>
              )}
            </div>
            
            {opportunities && opportunities.length > 3 && (
              <>
                <button
                  onClick={() => scrollCarousel('left', volunteerScrollRef, volunteerCurrentSlide, setVolunteerCurrentSlide, opportunities.length)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => scrollCarousel('right', volunteerScrollRef, volunteerCurrentSlide, setVolunteerCurrentSlide, opportunities.length)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
          
          <div className="text-center mt-12">
            <Dialog open={showVolunteerSignInDialog} onOpenChange={setShowVolunteerSignInDialog}>
              <DialogTrigger asChild>
                <button 
                  className="border border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors"
                  data-testid="button-browse-volunteer-opportunities"
                >
                  Browse More Volunteer Opportunities
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-center text-xl font-bold text-gray-900">
                    Find Your Perfect Opportunity
                  </DialogTitle>
                  <DialogDescription className="text-center text-gray-600 mt-2">
                    Sign in now to view all volunteer opportunities and make a real impact in your community!
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-4">
                      Connect with meaningful causes and use your skills to help others
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowVolunteerSignInDialog(false)}
                      variant="outline"
                      className="flex-1"
                      data-testid="button-cancel-volunteer-signin"
                    >
                      Not Now
                    </Button>
                    <Button
onClick={() => import('@/lib/loginModal').then(m => m.openLoginModal())}                      className="flex-1 bg-primary hover:bg-primary/90"
                      data-testid="button-volunteer-signin-now"
                    >
                      Sign In
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Latest News & Updates */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Latest News & Updates</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Stay updated with the latest news, success stories, and platform updates
            </p>
          </div>
          
          <div className="relative">
            <div 
              ref={storiesScrollRef}
              className="flex overflow-x-hidden scroll-smooth gap-6"
            >
              {newsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex-none w-80">
                    <Card>
                      <Skeleton className="h-48 w-full" />
                      <CardContent className="p-6 space-y-3">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-4 w-20" />
                      </CardContent>
                    </Card>
                  </div>
                ))
              ) : newsError ? (
                <Card className="w-full p-6 border-red-200 bg-red-50">
                  <div className="flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>Failed to load latest news. Please try refreshing.</span>
                  </div>
                </Card>
              ) : featuredStories && featuredStories.length > 0 ? (
                featuredStories.map((story: any) => (
                  <div key={story.id} className="flex-none w-80">
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <img 
                        src={story.image} 
                        alt={story.title}
                        className="w-full h-48 object-cover"
                      />
                      <CardContent className="p-6">
                        <div className="text-sm text-muted-foreground mb-2">{story.date}</div>
                        <h3 className="text-xl font-semibold mb-3">{story.title}</h3>
                        <p className="text-muted-foreground mb-4">{story.excerpt}</p>
                        <button 
onClick={() => import('@/lib/loginModal').then(m => m.openLoginModal())}                          className="text-primary font-semibold hover:underline"
                          data-testid={`button-read-story-${story.id}`}
                        >
                          Read More →
                        </button>
                      </CardContent>
                    </Card>
                  </div>
                ))
              ) : (
                <div className="w-full text-center py-12">
                  <p className="text-muted-foreground">No news updates available</p>
                </div>
              )}
            </div>
            
            {featuredStories && featuredStories.length > 3 && (
              <>
                <button
                  onClick={() => scrollCarousel('left', storiesScrollRef, storiesCurrentSlide, setStoriesCurrentSlide, featuredStories?.length || 0)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => scrollCarousel('right', storiesScrollRef, storiesCurrentSlide, setStoriesCurrentSlide, featuredStories?.length || 0)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
          
          <div className="text-center mt-12">
            <button 
onClick={() => import('@/lib/loginModal').then(m => m.openLoginModal())}              className="border border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors"
            >
              Read More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <img 
                src="/verifund-logo.png"
                alt="VeriFund Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-2xl font-bold text-green-500">VeriFund</span>
            </div>
            <p className="text-gray-400 text-sm">Every Story Matters</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6 max-w-md mx-auto">
            <div className="text-center">
              <h3 className="text-sm font-semibold mb-3">What you can do:</h3>
              <ul className="space-y-1 text-gray-300 text-xs">
                <li>Launch and manage campaigns</li>
                <li>Contribute to community initiatives</li>
                <li>Tip and support your favorite creators</li>
                <li>Volunteer for meaningful campaigns</li>
              </ul>
            </div>
            
            <div className="text-center">
              <h3 className="text-sm font-semibold mb-3">Support:</h3>
              <p className="text-gray-300 mb-3 text-xs">support@verifund.org</p>
              <Link 
                href="/support/tickets/new"
                className="text-green-400 hover:text-green-300 text-xs underline transition-colors"
              >
                File Support Ticket
              </Link>
              
              <div className="flex space-x-2 justify-center">
                <a href="#" className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <MessageSquare className="w-3 h-3" />
                </a>
                <a href="#" className="w-6 h-6 bg-blue-800 rounded-full flex items-center justify-center hover:bg-blue-900 transition-colors">
                  <Users className="w-3 h-3" />
                </a>
                <a href="#" className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors">
                  <MessageSquare className="w-3 h-3" />
                </a>
                <a href="#" className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
                  <Users className="w-3 h-3" />
                </a>
                <a href="#" className="w-6 h-6 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors">
                  <MessageSquare className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-4 text-center text-gray-400">
            <p className="text-xs">copyright 2024 | Philippines</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
