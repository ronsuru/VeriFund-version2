import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import CampaignCard from "@/components/campaign-card";
import CampaignManagement from "@/components/CampaignManagement";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Play, Clock, CheckCircle2, XCircle, Shield, CheckCircle, Trash2 } from "lucide-react";import type { Campaign } from "@shared/schema";

export default function Campaigns() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedStartMonth, setSelectedStartMonth] = useState("all");
  
  // Applied filters (for Apply Filter button functionality)
  const [appliedCategory, setAppliedCategory] = useState("all");
  const [appliedLocation, setAppliedLocation] = useState("all");
  const [appliedStartMonth, setAppliedStartMonth] = useState("all");

  const { data: campaigns, isLoading } = useQuery({
queryKey: ["/api/user/campaigns", appliedCategory, appliedLocation, appliedStartMonth],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("status", "all");
      if (appliedCategory && appliedCategory !== "all") params.append("category", appliedCategory);
      const res = await (await import("@/lib/queryClient")).apiRequest('GET', `/api/user/campaigns?${params.toString()}`);
      try {
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    staleTime: 0,
    gcTime: 0,
  }) as { data: any[] | undefined; isLoading: boolean };

  const campaignsArray: any[] = Array.isArray(campaigns) ? campaigns : [];
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);  // Admin functionality - fetch pending campaigns for review
  const { data: pendingCampaigns = [] } = useQuery({
    queryKey: ["/api/admin/campaigns/pending"],
    enabled: !!((user as any)?.isAdmin || (user as any)?.isSupport),
    retry: false,
  }) as { data: any[] };

  // Admin mutations for campaign management
  const approveCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return await apiRequest("POST", `/api/admin/campaigns/${campaignId}/approve`, {});
    },
    onSuccess: () => {
      toast({ title: "Campaign Approved", description: "Campaign has been approved and is now active." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to approve campaign.", variant: "destructive" });
    },
  });

  const rejectCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return await apiRequest("POST", `/api/admin/campaigns/${campaignId}/reject`, {});
    },
    onSuccess: () => {
      toast({ title: "Campaign Rejected", description: "Campaign has been rejected." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns/pending"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to reject campaign.", variant: "destructive" });
    },
  });

  const flagCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return await apiRequest("POST", `/api/admin/campaigns/${campaignId}/flag`, {});
    },
    onSuccess: () => {
      toast({ title: "Campaign Flagged", description: "Campaign has been flagged for review." });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to flag campaign.", variant: "destructive" });
    },
  });

// Delete a single draft campaign
  const deleteDraftMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return await apiRequest("DELETE", `/api/campaigns/${campaignId}`, {});
    },
    onSuccess: async (_, campaignId) => {
      // Optimistically remove from local list while cache updates
      toast({ title: "Draft deleted" });
      setSelectedDraftIds(prev => prev.filter(id => id !== campaignId));
      await queryClient.invalidateQueries({ queryKey: ["/api/user/campaigns"], exact: false });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "You are logged out. Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to delete draft.", variant: "destructive" });
    }
  });

  // Batch delete selected drafts
  const batchDeleteDraftsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return await apiRequest("POST", "/api/campaigns/batch-delete", { ids });
    },
    onSuccess: async () => {
      toast({ title: "Drafts deleted" });
      setSelectedDraftIds([]);
      await queryClient.invalidateQueries({ queryKey: ["/api/user/campaigns"], exact: false });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete selected drafts.", variant: "destructive" });
    }
  });  // Region to provinces/cities mapping
  const regionMapping: { [key: string]: string[] } = {
    "ncr": ["manila", "quezon city", "makati", "taguig", "pasig", "mandaluyong", "san juan", "marikina", "pasay", "paranaque", "las pinas", "muntinlupa", "caloocan", "malabon", "navotas", "valenzuela", "pateros"],
    "central luzon": ["bulacan", "nueva ecija", "pampanga", "tarlac", "zambales", "aurora", "bataan", "malolos", "san fernando", "cabanatuan", "tarlac city", "olongapo", "balanga"],
    "calabarzon": ["cavite", "laguna", "batangas", "rizal", "quezon", "antipolo", "dasmarinas", "bacoor", "calamba", "santa rosa", "binan", "san pedro", "cabuyao", "lucena", "batangas city"],
    "ilocos": ["ilocos norte", "ilocos sur", "la union", "pangasinan", "laoag", "vigan", "san fernando", "dagupan", "alaminos", "urdaneta"],
    "cagayan valley": ["cagayan", "isabela", "nueva vizcaya", "quirino", "tuguegarao", "ilagan", "cauayan", "santiago", "bayombong"],
    "bicol": ["albay", "camarines norte", "camarines sur", "catanduanes", "masbate", "sorsogon", "legazpi", "naga", "iriga", "tabaco", "ligao"],
    "western visayas": ["aklan", "antique", "capiz", "guimaras", "iloilo", "negros occidental", "iloilo city", "bacolod", "kalibo", "roxas", "san jose"],
    "central visayas": ["bohol", "cebu", "negros oriental", "siquijor", "cebu city", "mandaue", "lapu-lapu", "talisay", "dumaguete", "bago", "tagbilaran"],
    "eastern visayas": ["biliran", "eastern samar", "leyte", "northern samar", "samar", "southern leyte", "tacloban", "ormoc", "maasin", "baybay", "calbayog"],
    "zamboanga peninsula": ["zamboanga del norte", "zamboanga del sur", "zamboanga sibugay", "zamboanga city", "pagadian", "dipolog"],
    "northern mindanao": ["bukidnon", "camiguin", "lanao del norte", "misamis occidental", "misamis oriental", "cagayan de oro", "iligan", "malaybalay", "oroquieta", "tangub"],
    "davao": ["davao del norte", "davao del sur", "davao occidental", "davao oriental", "davao de oro", "davao city", "tagum", "panabo", "samal", "digos"],
    "soccsksargen": ["cotabato", "sarangani", "south cotabato", "sultan kudarat", "general santos", "koronadal", "kidapawan", "tacurong"],
    "caraga": ["agusan del norte", "agusan del sur", "dinagat islands", "surigao del norte", "surigao del sur", "butuan", "cabadbaran", "bayugan", "surigao", "tandag"],
    "car": ["abra", "apayao", "benguet", "ifugao", "kalinga", "mountain province", "baguio", "tabuk", "bangued", "la trinidad"],
    "armm": ["basilan", "lanao del sur", "maguindanao", "sulu", "tawi-tawi", "marawi", "lamitan", "jolo"],
    "mimaropa": ["marinduque", "occidental mindoro", "oriental mindoro", "palawan", "romblon", "puerto princesa", "calapan", "mamburao", "boac", "romblon"]
  };

const filteredCampaigns = campaignsArray.filter((campaign: any) => {    // First filter: Only show campaigns created by the current user
    const isUserCampaign = campaign.creatorId === (user as any)?.id;
    
    // Search term filter - includes campaigns titles, descriptions, and creator names
    const matchesSearch = !searchTerm || 
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.creatorFirstName && campaign.creatorFirstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (campaign.creatorLastName && campaign.creatorLastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (campaign.creatorEmail && campaign.creatorEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Location filter (client-side) - simplified using region field
    let matchesLocation = appliedLocation === "all";
    
    if (!matchesLocation && appliedLocation !== "all") {
      // Use the campaign's region field for direct matching
      const campaignRegion = campaign.region?.toLowerCase() || "";
      matchesLocation = campaignRegion === appliedLocation.toLowerCase();
    }
    
    // Start month filter (client-side)
    const matchesStartMonth = appliedStartMonth === "all" || 
                             (campaign.createdAt && 
                              new Date(campaign.createdAt).getMonth() === parseInt(appliedStartMonth));
    
    
    return isUserCampaign && matchesSearch && matchesLocation && matchesStartMonth;
  }) || [];

  // Apply Filters handler
  const handleApplyFilters = () => {
    setAppliedCategory(selectedCategory);
    setAppliedLocation(selectedLocation);
    setAppliedStartMonth(selectedStartMonth);
  };

  // Clear Filters handler
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedLocation("all");
    setSelectedStartMonth("all");
    setAppliedCategory("all");
    setAppliedLocation("all");
    setAppliedStartMonth("all");
  };

  // Check if user is admin or support
  const isAdminOrSupport = (user as any)?.isAdmin || (user as any)?.isSupport;

  // Group campaigns by status
  // Include flagged campaigns with active since they're still under evaluation
  const activeCampaigns = filteredCampaigns.filter((campaign: any) => 
    campaign.status === 'active' || campaign.status === 'flagged'
  );
  const onProgressCampaigns = filteredCampaigns.filter((campaign: any) => campaign.status === 'on_progress');
  
  // Closed campaigns - different visibility based on user role
  const closedCampaigns = filteredCampaigns.filter((campaign: any) => {
    if (isAdminOrSupport) {
      // Admin/Support can see all closed campaigns
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
// Show all drafts regardless of search/location filters so users don't miss them
  const draftCampaigns = campaignsArray.filter((campaign: any) => 
    campaign.creatorId === (user as any)?.id && (campaign.status === 'draft')
  );  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-campaigns-title">
            My Campaigns
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage and track your created campaigns
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          {/* First Row: Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns and creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-campaigns"
              />
            </div>
          </div>

          {/* Second Row: All Other Filters */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="animal_welfare">Animal Welfare</SelectItem>
                <SelectItem value="community">Community Development</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="emergency">Emergency Relief</SelectItem>
                <SelectItem value="environment">Environment</SelectItem>
                <SelectItem value="funeral_support">Memorial & Funeral Support</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger data-testid="select-location">
                <SelectValue placeholder="Province/Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces/Regions</SelectItem>
                <SelectItem value="ncr">National Capital Region (NCR)</SelectItem>
                <SelectItem value="calabarzon">CALABARZON (Region IV-A)</SelectItem>
                <SelectItem value="central luzon">Central Luzon (Region III)</SelectItem>
                <SelectItem value="ilocos">Ilocos Region (Region I)</SelectItem>
                <SelectItem value="cagayan valley">Cagayan Valley (Region II)</SelectItem>
                <SelectItem value="bicol">Bicol Region (Region V)</SelectItem>
                <SelectItem value="western visayas">Western Visayas (Region VI)</SelectItem>
                <SelectItem value="central visayas">Central Visayas (Region VII)</SelectItem>
                <SelectItem value="eastern visayas">Eastern Visayas (Region VIII)</SelectItem>
                <SelectItem value="zamboanga peninsula">Zamboanga Peninsula (Region IX)</SelectItem>
                <SelectItem value="northern mindanao">Northern Mindanao (Region X)</SelectItem>
                <SelectItem value="davao">Davao Region (Region XI)</SelectItem>
                <SelectItem value="soccsksargen">SOCCSKSARGEN (Region XII)</SelectItem>
                <SelectItem value="caraga">Caraga (Region XIII)</SelectItem>
                <SelectItem value="car">Cordillera Administrative Region (CAR)</SelectItem>
                <SelectItem value="armm">ARMM</SelectItem>
                <SelectItem value="mimaropa">MIMAROPA (Region IV-B)</SelectItem>
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
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-8">
            {/* Loading for each section */}
            {[1, 2, 3].map((section) => (
              <div key={section} className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm border animate-pulse">
                      <div className="h-48 bg-gray-200"></div>
                      <div className="p-6">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded mb-3"></div>
                        <div className="h-3 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded mb-4"></div>
                        <div className="h-2 bg-gray-200 rounded mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Tabs defaultValue="active" className="w-full">
<TabsList className={`grid w-full ${(user as any)?.isAdmin || (user as any)?.isSupport ? 'grid-cols-5' : 'grid-cols-4'}`}>              <TabsTrigger value="active" className="flex items-center space-x-2" data-testid="tab-active-campaigns">
                <Play className="w-4 h-4" />
                <span>Active</span>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  {activeCampaigns.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center space-x-2" data-testid="tab-progress-campaigns">
                <Clock className="w-4 h-4" />
                <span>On Progress</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {onProgressCampaigns.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="closed" className="flex items-center space-x-2" data-testid="tab-closed-campaigns">
                <CheckCircle2 className="w-4 h-4" />
                <span>Closed</span>
                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                  {closedCampaigns.length}
                </span>
              </TabsTrigger>
<TabsTrigger value="drafts" className="flex items-center space-x-2" data-testid="tab-draft-campaigns">
                <Clock className="w-4 h-4" />
                <span>Drafts</span>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                  {draftCampaigns.length}
                </span>
              </TabsTrigger>              {((user as any)?.isAdmin || (user as any)?.isSupport) && (
                <TabsTrigger value="admin-review" className="flex items-center space-x-2" data-testid="tab-admin-review">
                  <Shield className="w-4 h-4" />
                  <span>Admin Review</span>
                  <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                    {pendingCampaigns.length}
                  </span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="active" className="mt-6">
              {activeCampaigns.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeCampaigns.map((campaign: any) => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Campaigns</h3>
                  <p className="text-gray-500">You don't have any active campaigns yet.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="progress" className="mt-6">
              {onProgressCampaigns.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {onProgressCampaigns.map((campaign: any) => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaigns On Progress</h3>
                  <p className="text-gray-500">You don't have any campaigns currently in progress.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="closed" className="mt-6">
              {closedCampaigns.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {closedCampaigns.map((campaign: any) => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Closed Campaigns</h3>
                  <p className="text-gray-500">You haven't completed or ended any campaigns yet.</p>
                </div>
              )}
            </TabsContent>

<TabsContent value="drafts" className="mt-6">
              {draftCampaigns.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-muted-foreground">Selected: {selectedDraftIds.length}</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedDraftIds.length === draftCampaigns.length) {
                          setSelectedDraftIds([]);
                        } else {
                          setSelectedDraftIds(draftCampaigns.map((campaign: any) => campaign.id));
                        }
                      }}
                      data-testid="button-select-all-drafts"
                    >
                      {selectedDraftIds.length === draftCampaigns.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={selectedDraftIds.length === 0 || batchDeleteDraftsMutation.isPending}
                      onClick={() => batchDeleteDraftsMutation.mutate(selectedDraftIds)}
                      data-testid="button-batch-delete-drafts"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete Selected
                    </Button>
                  </div>
                </div>
              )}
              {draftCampaigns.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {draftCampaigns.map((campaign: any) => (
                    <Card key={campaign.id} className="overflow-hidden">
                      <div className="h-40 bg-gray-100">
                        {/* lightweight preview using CampaignCard image logic would be ideal; use title banner fallback */}
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          {campaign.title?.slice(0, 1) || 'C'}
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="font-semibold mb-1">{campaign.title || 'Untitled draft'}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2 mb-3">{campaign.description || 'No description yet.'}</div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedDraftIds.includes(campaign.id)}
                              onChange={(e) => {
                                setSelectedDraftIds(prev => e.target.checked ? [...prev, campaign.id] : prev.filter(id => id !== campaign.id));
                              }}
                              aria-label={`Select draft ${campaign.id}`}
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                import('@/lib/createCampaignModal').then(m => m.openCreateCampaign && m.openCreateCampaign(campaign));
                              }}
                              data-testid={`button-continue-draft-${campaign.id}`}
                            >
                              Continue Editing
                            </Button>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteDraftMutation.mutate(campaign.id)}
                            data-testid={`button-delete-draft-${campaign.id}`}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Drafts</h3>
                  <p className="text-gray-500">You don't have any draft campaigns yet.</p>
                </div>
              )}
            </TabsContent>            {/* Admin Review Tab - Only visible to admins and support */}
            {((user as any)?.isAdmin || (user as any)?.isSupport) && (
              <TabsContent value="admin-review" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span>Pending Campaign Reviews</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pendingCampaigns && pendingCampaigns.length > 0 ? (
                        pendingCampaigns.map((campaign: Campaign) => (
                          <div 
                            key={campaign.id}
                            className="border rounded-lg p-4"
                            data-testid={`pending-campaign-${campaign.id}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold mb-2" data-testid={`campaign-title-${campaign.id}`}>
                                  {campaign.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2" data-testid={`campaign-description-${campaign.id}`}>
                                  {campaign.description.slice(0, 200)}...
                                </p>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span>Goal: ₱{parseFloat(campaign.goalAmount || '0').toLocaleString()}</span>
                                  <span>Category: {campaign.category}</span>
                                  <span>Duration: {campaign.duration} days</span>
                                  <span>Submitted: {new Date(campaign.createdAt!).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <CampaignManagement 
                                campaign={campaign}
                                variant="admin"
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                          <p className="text-muted-foreground">No pending campaigns to review.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        )}

        {/* No campaigns at all state */}
        {!isLoading && filteredCampaigns.length === 0 && (
          <div className="text-center py-16 mt-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or create your first campaign
            </p>
            <Button 
              onClick={handleClearFilters}
              data-testid="button-reset-search"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
