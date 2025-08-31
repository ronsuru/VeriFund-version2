import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/navigation";
import CampaignCard from "@/components/campaign-card";
import { useAuth } from "@/hooks/useAuth";
import { Search, TrendingUp, Heart, Award, Users, Filter, Archive, CheckCircle2, XCircle, MapPin } from "lucide-react";
import type { CampaignWithCreator } from "@shared/schema";
import { getAllRegions } from "@shared/regionUtils";

const categoryLabels = {
  animal_welfare: "Animal Welfare",
  community: "Community Development",
  education: "Education",
  emergency: "Emergency Relief",
  environment: "Environment",
  funeral_support: "Memorial & Funeral Support",
  healthcare: "Healthcare",
  sports: "Sports"
};

export default function BrowseCampaigns() {
  const { isAuthenticated, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedStartMonth, setSelectedStartMonth] = useState("all");
  const [activeTab, setActiveTab] = useState("featured");
  
  // Applied filter states (what's actually used for filtering)
  const [appliedCategory, setAppliedCategory] = useState("all");
  const [appliedRegion, setAppliedRegion] = useState("all");
  const [appliedStartMonth, setAppliedStartMonth] = useState("all");

  // Fetch high-credibility campaigns (featured)
  const { data: featuredCampaigns, isLoading: featuredLoading } = useQuery({
    queryKey: ["/api/campaigns/featured"],
  }) as { data: CampaignWithCreator[] | undefined; isLoading: boolean };

  // Fetch personalized recommendations
  const { data: recommendedCampaigns, isLoading: recommendedLoading } = useQuery({
    queryKey: ["/api/campaigns/recommended"],
    enabled: isAuthenticated,
  }) as { data: CampaignWithCreator[] | undefined; isLoading: boolean };

  // Get top 10 featured campaigns (all statuses) and apply search, category, region, and month filters
  const top10FeaturedCampaigns = (featuredCampaigns || [])
    .filter((campaign: CampaignWithCreator) => {
      const matchesSearch = !searchTerm || 
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (campaign.creatorFirstName && campaign.creatorFirstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (campaign.creatorLastName && campaign.creatorLastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (campaign.creatorEmail && campaign.creatorEmail.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = appliedCategory === "all" || campaign.category === appliedCategory;
      const matchesRegion = appliedRegion === "all" || 
        (campaign.region && campaign.region.toLowerCase() === appliedRegion.toLowerCase());
      const matchesStartMonth = appliedStartMonth === "all" || 
        (campaign.createdAt && new Date(campaign.createdAt).getMonth() === parseInt(appliedStartMonth));
      return matchesSearch && matchesCategory && matchesRegion && matchesStartMonth;
    })
    .slice(0, 10); // Limit to top 10 featured campaigns

  // Filter recommended campaigns to only show active ones and apply search, category, region, and month filters
  const activeRecommendedCampaigns = (recommendedCampaigns || []).filter((campaign: CampaignWithCreator) => {
    const isActive = campaign.status === 'active' || campaign.status === 'on_progress';
    
    const matchesSearch = !searchTerm || 
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.creatorFirstName && campaign.creatorFirstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (campaign.creatorLastName && campaign.creatorLastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (campaign.creatorEmail && campaign.creatorEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = appliedCategory === "all" || campaign.category === appliedCategory;
    const matchesRegion = appliedRegion === "all" || 
      (campaign.region && campaign.region.toLowerCase() === appliedRegion.toLowerCase());
    const matchesStartMonth = appliedStartMonth === "all" || 
      (campaign.createdAt && new Date(campaign.createdAt).getMonth() === parseInt(appliedStartMonth));
    return isActive && matchesSearch && matchesCategory && matchesRegion && matchesStartMonth;
  });

  // Fetch all campaigns for search/filter
  const { data: allCampaigns, isLoading: allLoading } = useQuery({
    queryKey: ["/api/campaigns"],
    enabled: isAuthenticated,
  }) as { data: CampaignWithCreator[] | undefined; isLoading: boolean };

  // Check if user is admin or support
  const isAdminOrSupport = (user as any)?.isAdmin || (user as any)?.isSupport;

  // Filter campaigns based on status
  // Include flagged campaigns with active since they're still under evaluation
  const activeCampaigns = (allCampaigns || []).filter((campaign: CampaignWithCreator) => 
    campaign.status === 'active' || campaign.status === 'on_progress' || campaign.status === 'flagged'
  );

  // Inactive campaigns - different visibility based on user role
  const inactiveCampaigns = (allCampaigns || []).filter((campaign: CampaignWithCreator) => {
    if (isAdminOrSupport) {
      // Admin/Support can see all inactive campaigns
      return campaign.status === 'completed' || 
             campaign.status === 'cancelled' || 
             campaign.status === 'rejected' || 
             campaign.status === 'closed_with_refund';
    } else {
      // Regular users only see completed and closed campaigns
      return campaign.status === 'completed' || 
             campaign.status === 'closed_with_refund';
    }
  });

  const completedCampaigns = inactiveCampaigns.filter((campaign: CampaignWithCreator) => 
    campaign.status === 'completed'
  );

  const closedCampaigns = inactiveCampaigns.filter((campaign: CampaignWithCreator) => 
    campaign.status === 'cancelled' || 
    campaign.status === 'closed_with_refund'
  );

  // Apply Filters handler
  const handleApplyFilters = () => {
    setAppliedCategory(selectedCategory);
    setAppliedRegion(selectedRegion);
    setAppliedStartMonth(selectedStartMonth);
  };

  // Clear Filters handler
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedRegion("all");
    setSelectedStartMonth("all");
    setAppliedCategory("all");
    setAppliedRegion("all");
    setAppliedStartMonth("all");
  };

  // Filter active campaigns based on search, applied category, applied region, and applied month
  const filteredActiveCampaigns = activeCampaigns.filter((campaign: CampaignWithCreator) => {
    const matchesSearch = !searchTerm || 
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.creatorFirstName && campaign.creatorFirstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (campaign.creatorLastName && campaign.creatorLastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (campaign.creatorEmail && campaign.creatorEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = appliedCategory === "all" || campaign.category === appliedCategory;
    
    const matchesRegion = appliedRegion === "all" || 
      (campaign.region && campaign.region.toLowerCase() === appliedRegion.toLowerCase());
    
    const matchesStartMonth = appliedStartMonth === "all" || 
      (campaign.createdAt && new Date(campaign.createdAt).getMonth() === parseInt(appliedStartMonth));
    
    return matchesSearch && matchesCategory && matchesRegion && matchesStartMonth;
  });

  // Filter ALL campaigns for the "All Campaigns" tab - complete directory
  const filteredAllCampaigns = (allCampaigns || []).filter((campaign: CampaignWithCreator) => {
    // For admin/support, show all campaigns including flagged ones
    // For regular users, hide rejected and cancelled campaigns
    if (!isAdminOrSupport) {
      if (campaign.status === 'rejected' || campaign.status === 'cancelled') {
        return false;
      }
    }

    const matchesSearch = !searchTerm || 
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.creatorFirstName && campaign.creatorFirstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (campaign.creatorLastName && campaign.creatorLastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (campaign.creatorEmail && campaign.creatorEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = appliedCategory === "all" || campaign.category === appliedCategory;
    
    const matchesRegion = appliedRegion === "all" || 
      (campaign.region && campaign.region.toLowerCase() === appliedRegion.toLowerCase());
    
    const matchesStartMonth = appliedStartMonth === "all" || 
      (campaign.createdAt && new Date(campaign.createdAt).getMonth() === parseInt(appliedStartMonth));
    
    return matchesSearch && matchesCategory && matchesRegion && matchesStartMonth;
  });

  // Filter inactive campaigns based on search, applied category, applied region, and applied month
  const filteredInactiveCampaigns = inactiveCampaigns.filter((campaign: CampaignWithCreator) => {
    const matchesSearch = !searchTerm || 
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.creatorFirstName && campaign.creatorFirstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (campaign.creatorLastName && campaign.creatorLastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (campaign.creatorEmail && campaign.creatorEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = appliedCategory === "all" || campaign.category === appliedCategory;
    
    const matchesRegion = appliedRegion === "all" || 
      (campaign.region && campaign.region.toLowerCase() === appliedRegion.toLowerCase());
    
    const matchesStartMonth = appliedStartMonth === "all" || 
      (campaign.createdAt && new Date(campaign.createdAt).getMonth() === parseInt(appliedStartMonth));
    
    return matchesSearch && matchesCategory && matchesRegion && matchesStartMonth;
  });

  const filteredCompletedCampaigns = completedCampaigns.filter((campaign: CampaignWithCreator) => {
    const matchesSearch = !searchTerm || 
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.creatorFirstName && campaign.creatorFirstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (campaign.creatorLastName && campaign.creatorLastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (campaign.creatorEmail && campaign.creatorEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = appliedCategory === "all" || campaign.category === appliedCategory;
    
    const matchesRegion = appliedRegion === "all" || 
      (campaign.region && campaign.region.toLowerCase() === appliedRegion.toLowerCase());
    
    const matchesStartMonth = appliedStartMonth === "all" || 
      (campaign.createdAt && new Date(campaign.createdAt).getMonth() === parseInt(appliedStartMonth));
    
    return matchesSearch && matchesCategory && matchesRegion && matchesStartMonth;
  });

  const filteredClosedCampaigns = closedCampaigns.filter((campaign: any) => {
    const matchesSearch = !searchTerm || 
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.creatorFirstName && campaign.creatorFirstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (campaign.creatorLastName && campaign.creatorLastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (campaign.creatorEmail && campaign.creatorEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = appliedCategory === "all" || campaign.category === appliedCategory;
    
    const matchesRegion = appliedRegion === "all" || 
      (campaign.region && campaign.region.toLowerCase() === appliedRegion.toLowerCase());
    
    const matchesStartMonth = appliedStartMonth === "all" || 
      (campaign.createdAt && new Date(campaign.createdAt).getMonth() === parseInt(appliedStartMonth));
    
    return matchesSearch && matchesCategory && matchesRegion && matchesStartMonth;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Sign in to Browse Campaigns</h1>
            <p className="text-muted-foreground mb-4">Discover campaigns tailored to your interests</p>
<Button onClick={() => import('@/lib/loginModal').then(m => m.openLoginModal())}>              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="page-title">Browse Campaigns</h1>
          <p className="text-muted-foreground">
            Discover campaigns from trusted creators and find causes that match your interests
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6 space-y-4">
            {/* First Row: Search Only */}
            <div className="grid grid-cols-1 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search campaigns, creators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            
            {/* Second Row: Category, Region, Month, and Actions */}
            <div className="grid md:grid-cols-5 gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="select-category">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger data-testid="select-region">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {getAllRegions().map((region) => (
                    <SelectItem key={region.value} value={region.value}>{region.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedStartMonth} onValueChange={setSelectedStartMonth}>
                <SelectTrigger data-testid="select-start-month">
                  <SelectValue placeholder="Start Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  <SelectItem value="0">January</SelectItem>
                  <SelectItem value="1">February</SelectItem>
                  <SelectItem value="2">March</SelectItem>
                  <SelectItem value="3">April</SelectItem>
                  <SelectItem value="4">May</SelectItem>
                  <SelectItem value="5">June</SelectItem>
                  <SelectItem value="6">July</SelectItem>
                  <SelectItem value="7">August</SelectItem>
                  <SelectItem value="8">September</SelectItem>
                  <SelectItem value="9">October</SelectItem>
                  <SelectItem value="10">November</SelectItem>
                  <SelectItem value="11">December</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleApplyFilters}
                data-testid="button-apply-filters"
              >
                <Filter className="w-4 h-4 mr-2" />
                Apply Filter
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                data-testid="button-clear-filters"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="featured" data-testid="tab-featured">
              <Award className="w-4 h-4 mr-2" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="recommended" data-testid="tab-recommended">
              <Heart className="w-4 h-4 mr-2" />
              For You
            </TabsTrigger>
            <TabsTrigger value="browse" data-testid="tab-browse">
              <TrendingUp className="w-4 h-4 mr-2" />
              All Campaigns
            </TabsTrigger>
            <TabsTrigger value="inactive" data-testid="tab-inactive">
              <Archive className="w-4 h-4 mr-2" />
              Inactive
            </TabsTrigger>
          </TabsList>

          {/* Featured Campaigns Tab */}
          <TabsContent value="featured" className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <Award className="w-5 h-5 mr-2" />
                  Top 10 Featured Campaigns
                </CardTitle>
                <p className="text-blue-600 text-sm">
                  Our curated selection of the most impactful campaigns from trusted creators
                </p>
              </CardHeader>
              <CardContent>
                {featuredLoading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : (top10FeaturedCampaigns && top10FeaturedCampaigns.length > 0) ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {top10FeaturedCampaigns.map((campaign: CampaignWithCreator) => (
                      <div key={campaign.id} className="relative">
                        <Badge className="absolute top-2 left-2 z-10 bg-blue-600 text-white border-blue-700">
                          <Award className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                        <CampaignCard campaign={campaign} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Award className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">No Featured Campaigns Yet</h3>
                    <p className="text-blue-600">Check back soon for campaigns from our top creators!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommended Campaigns Tab */}
          <TabsContent value="recommended" className="space-y-6">
            <Card className="bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                  <Heart className="w-5 h-5 mr-2" />
                  Recommended for You
                </CardTitle>
                <p className="text-green-600 text-sm">
                  Campaigns matching your interests based on your contribution history
                </p>
              </CardHeader>
              <CardContent>
                {recommendedLoading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : (activeRecommendedCampaigns && activeRecommendedCampaigns.length > 0) ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeRecommendedCampaigns.map((campaign: CampaignWithCreator) => (
                      <div key={campaign.id} className="relative">
                        <Badge className="absolute top-2 left-2 z-10 bg-green-600 text-white border-green-700">
                          <Heart className="w-3 h-3 mr-1" />
                          For You
                        </Badge>
                        <CampaignCard campaign={campaign} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-green-800 mb-2">No Recommendations Yet</h3>
                    <p className="text-green-600 mb-4">
                      Start contributing to campaigns to receive personalized recommendations!
                    </p>
                    <Button 
                      onClick={() => setActiveTab("browse")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Browse All Campaigns
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Browse All Tab */}
          <TabsContent value="browse" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold">Complete Campaign Directory</h2>
                <Badge variant="secondary" data-testid="campaigns-count">
                  {filteredAllCampaigns.length} {filteredAllCampaigns.length === 1 ? 'campaign' : 'campaigns'}
                </Badge>
              </div>
            </div>

            {/* Campaign Status Legend */}
            <div className="flex items-center justify-center space-x-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">On Progress</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Closed</span>
              </div>
            </div>

            {allLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : filteredAllCampaigns.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAllCampaigns.map((campaign: CampaignWithCreator) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No campaigns found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search terms or filters
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Inactive Campaigns Tab */}
          <TabsContent value="inactive" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Archive className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold">Inactive Campaigns</h2>
                <Badge variant="secondary" data-testid="inactive-campaigns-count">
                  {filteredInactiveCampaigns.length} {filteredInactiveCampaigns.length === 1 ? 'campaign' : 'campaigns'}
                </Badge>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Completed Campaigns Panel */}
              <div className="space-y-4">
                <div className="flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-bold text-gray-900">Completed Campaigns</h3>
                  <span className="ml-3 bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                    {filteredCompletedCampaigns.length}
                  </span>
                </div>
                {allLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredCompletedCampaigns.length > 0 ? (
                  <div className="space-y-4">
                    {filteredCompletedCampaigns.map((campaign: CampaignWithCreator) => (
                      <CampaignCard key={campaign.id} campaign={campaign} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Completed Campaigns</h4>
                    <p className="text-gray-500 text-sm">No campaigns have been completed yet.</p>
                  </div>
                )}
              </div>

              {/* Closed Campaigns Panel */}
              <div className="space-y-4">
                <div className="flex items-center justify-center mb-6">
                  <XCircle className="w-6 h-6 text-red-600 mr-3" />
                  <h3 className="text-lg font-bold text-gray-900">Closed & Rejected Campaigns</h3>
                  <span className="ml-3 bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                    {filteredClosedCampaigns.length}
                  </span>
                </div>
                {allLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredClosedCampaigns.length > 0 ? (
                  <div className="space-y-4">
                    {filteredClosedCampaigns.map((campaign: CampaignWithCreator) => (
                      <CampaignCard key={campaign.id} campaign={campaign} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Closed Campaigns</h4>
                    <p className="text-gray-500 text-sm">No campaigns have been closed or cancelled.</p>
                  </div>
                )}
              </div>
            </div>

            {/* No inactive campaigns at all state */}
            {!allLoading && filteredInactiveCampaigns.length === 0 && (
              <div className="text-center py-16">
                <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No inactive campaigns found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or check back later
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}