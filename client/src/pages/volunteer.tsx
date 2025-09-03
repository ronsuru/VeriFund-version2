import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { CampaignManagement } from "@/components/CampaignManagement";
import { 
  Archive,
  Search, 
  Users, 
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Heart,
  UserPlus,
  MessageSquare,
  Eye
} from "lucide-react";

interface VolunteerOpportunity {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  location: string;
  category: string;
  startDate: string;
  endDate: string;
  slotsNeeded: number;
  slotsFilled: number;
  status: string;
  duration: number;
  createdAt: string;
}

interface VolunteerApplication {
  id: string;
  campaignId: string;
  volunteerId: string;
  status: string;
  intent: string;
  telegramDisplayName: string;
  telegramUsername: string;
  rejectionReason?: string;
  createdAt: string;
  campaign?: {
    title: string;
    category: string;
    status: string;
  };
}

export default function Volunteer() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation variant="sticky-compact" />
        <div className="flex items-center justify-center min-h-[50vh] mt-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="sticky-compact" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-volunteer-title">
            Volunteer Opportunities
          </h1>
          <p className="text-lg text-muted-foreground">
            Find and apply for volunteer opportunities to make a difference in your community
          </p>
        </div>

        {/* Volunteer Opportunities Tabs */}
        <Tabs defaultValue="opportunities" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="opportunities" data-testid="tab-opportunities">
              <UserPlus className="w-4 h-4 mr-2" />
              Available Opportunities
            </TabsTrigger>
            <TabsTrigger value="applications" data-testid="tab-applications">
              <Archive className="w-4 h-4 mr-2" />
              Inactive Volunteer Opportunities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities">
            <VolunteerOpportunitiesView />
          </TabsContent>

          <TabsContent value="applications">
            <MyApplicationsView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Available Volunteer Opportunities View
function VolunteerOpportunitiesView() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch campaigns with volunteer slots (active and on_progress)
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["/api/campaigns"],
  }) as { data: any[] | undefined; isLoading: boolean };

  // Filter campaigns that need volunteers and have available slots
  const campaignsWithVolunteerSlots = (campaigns || []).filter((campaign) =>
    campaign.needsVolunteers && 
    campaign.volunteerSlots > 0 &&
    (campaign.status === 'active' || campaign.status === 'on_progress') &&
    (campaign.volunteerSlotsFilledCount || 0) < campaign.volunteerSlots
  );

  const filteredOpportunities = campaignsWithVolunteerSlots.filter((campaign) =>
    campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading volunteer opportunities...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, category, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-opportunities"
            />
          </div>
        </CardContent>
      </Card>

      {/* Opportunities List */}
      {filteredOpportunities.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No volunteer opportunities found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Try adjusting your search terms" : "Check back later for new opportunities"}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities.map((campaign) => (
            <CampaignVolunteerCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}

// Campaign Volunteer Card
function CampaignVolunteerCard({ campaign }: { campaign: any }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [intent, setIntent] = useState("");
  const [telegramDisplayName, setTelegramDisplayName] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");

  const availableSlots = campaign.volunteerSlots - (campaign.volunteerSlotsFilledCount || 0);
  const isFullyBooked = availableSlots <= 0;

  const applyMutation = useMutation({
    mutationFn: (applicationData: any) => 
      apiRequest("POST", `/api/campaigns/${campaign.id}/volunteer`, applicationData),
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your volunteer application has been submitted successfully!",
      });
      setIsDialogOpen(false);
      setIntent("");
      setTelegramDisplayName("");
      setTelegramUsername("");
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/volunteer-applications/user"] });
    },
    onError: (error: any) => {
      console.error("❌ Application submission error:", error);
      const errorMessage = error?.response?.data?.message || error.message || "Failed to submit volunteer application";
      toast({
        title: "Application Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleApply = () => {
    console.log("🎯 Attempting to submit volunteer application:", {
      intent: intent.trim(),
      telegramDisplayName: telegramDisplayName.trim(),
      telegramUsername: telegramUsername.trim(),
      campaignId: campaign.id
    });

    if (!intent.trim()) {
      toast({
        title: "Intent Required",
        description: "Please explain why you want to volunteer for this campaign",
        variant: "destructive",
      });
      return;
    }

    if (!telegramDisplayName.trim() || !telegramUsername.trim()) {
      toast({
        title: "Telegram Info Required",
        description: "Please provide your Telegram display name and username for communication",
        variant: "destructive",
      });
      return;
    }

    const applicationData = {
      intent: intent.trim(),
      telegramDisplayName: telegramDisplayName.trim(),
      telegramUsername: telegramUsername.trim(),
    };

    console.log("📤 Submitting application data:", applicationData);
    applyMutation.mutate(applicationData);
  };

  // Helper function to normalize image URL
  function normalizeImageUrl(raw?: string | null): string | undefined {
    if (!raw) return undefined;
    if (/^https?:\/\//i.test(raw)) return raw;
    // Tolerate missing leading slash
    if (raw.startsWith('api/upload')) raw = '/' + raw;
    if (raw.startsWith('objects/')) raw = '/' + raw;
    // If path includes bucket prefix, strip it once
    if (/^verifund-assets\//i.test(raw)) {
      raw = raw.replace(/^verifund-assets\//i, '');
    }
    // If it's our upload URL, extract objectPath and convert to public URL
    if (raw.startsWith('/api/upload')) {
      try {
        const u = new URL(raw, window.location.origin);
        const objectPath = u.searchParams.get('objectPath');
        if (objectPath) {
          const bucket = (import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET || import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'verifund-assets';
          const url = import.meta.env.VITE_SUPABASE_URL;
          if (url) {
            const path = objectPath.replace(/^\/+/, '');
            return `${url}/storage/v1/object/public/${bucket}/${path}`;
          }
        }
      } catch {}
    }
    // If it's an objects path, treat the rest as objectPath
    if (raw.startsWith('/objects/')) {
      const bucket = (import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET || import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'verifund-assets';
      const url = import.meta.env.VITE_SUPABASE_URL;
      if (url) {
        const path = raw.replace(/^\/objects\//, '').replace(/^\/+/, '');
        return `${url}/storage/v1/object/public/${bucket}/${path}`;
      }
    }
    // If it's a public-objects path, keep it as-is (server proxy route)
    if (raw.startsWith('/public-objects/')) {
      return raw; // Keep the original URL for server proxy handling
    }
    // If it's a public path, convert to Supabase URL
    if (/^(public|evidence|profiles)\//i.test(raw)) {
      const bucket = (import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET || import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'verifund-assets';
      const url = import.meta.env.VITE_SUPABASE_URL;
      if (url) {
        const path = raw.replace(/^\/+/, '');
        return `${url}/storage/v1/object/public/${bucket}/${path}`;
      }
    }
    return raw;
  }

  // Category fallback images
  const categoryImages: { [key: string]: string } = {
    emergency: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    education: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    healthcare: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    community: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    environment: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  };

  // Extract campaign image
  let imageUrlRaw = campaign.images ? 
    (campaign.images.startsWith('[') ? 
      ((): string | undefined => { try { const arr = JSON.parse(campaign.images); return Array.isArray(arr) ? arr.find((x: any) => !!x) : undefined; } catch { return undefined; } })() : 
      (campaign.images.includes(',') ? 
        campaign.images.split(',').map((s: string) => s.trim()).find(Boolean) : 
        campaign.images
      )
    ) : 
    undefined;
  if (!imageUrlRaw) {
    imageUrlRaw = categoryImages[campaign.category as keyof typeof categoryImages];
  }
  const fallbackImage = categoryImages[campaign.category as keyof typeof categoryImages] || 'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=800&h=400&q=60';
  const imageUrl = normalizeImageUrl(imageUrlRaw) || fallbackImage;

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      {/* Campaign Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={imageUrl}
          alt={campaign.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to category image if campaign image fails to load
            (e.currentTarget as HTMLImageElement).src = categoryImages[campaign.category] || categoryImages.community;
          }}
        />
        {/* Category Badge Overlay */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/90 text-gray-800 backdrop-blur-sm">
            {campaign.category}
          </Badge>
        </div>
      </div>
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 mb-2" data-testid={`text-campaign-title-${campaign.id}`}>
              {campaign.title}
            </CardTitle>
            {!campaign.imageUrl && (
              <Badge variant="secondary" className="mb-2">
                {campaign.category}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-campaign-description-${campaign.id}`}>
          {campaign.description}
        </p>

        <div className="space-y-2 text-sm">
          {campaign.location && (
            <div className="flex items-center text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{campaign.location}</span>
            </div>
          )}
          <div className="flex items-center text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Target: {new Date(campaign.targetDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Users className="w-4 h-4 mr-2" />
            <span>{availableSlots} volunteer slots available</span>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Apply Button */}
            {!isFullyBooked ? (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex-1 text-xs min-w-0" data-testid={`button-apply-volunteer-${campaign.id}`}>
                    <UserPlus className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">APPLY TO VOLUNTEER</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Apply to Volunteer</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="intent">Why do you want to volunteer for this campaign? *</Label>
                      <Textarea
                        id="intent"
                        placeholder="Share your motivation and how you can contribute..."
                        value={intent}
                        onChange={(e) => setIntent(e.target.value)}
                        className="min-h-[100px]"
                        data-testid="textarea-volunteer-intent"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telegramDisplayName">Telegram Display Name *</Label>
                      <Input
                        id="telegramDisplayName"
                        placeholder="Your display name on Telegram"
                        value={telegramDisplayName}
                        onChange={(e) => setTelegramDisplayName(e.target.value)}
                        className="mt-1"
                        data-testid="input-telegram-display-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telegramUsername">Telegram Username *</Label>
                      <Input
                        id="telegramUsername"
                        placeholder="@yourusername"
                        value={telegramUsername}
                        onChange={(e) => setTelegramUsername(e.target.value)}
                        className="mt-1"
                        data-testid="input-telegram-username"
                      />
                    </div>
                    <Button 
                      onClick={handleApply} 
                      className="w-full"
                      disabled={applyMutation.isPending}
                      data-testid="button-submit-application"
                    >
                      {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Button disabled className="flex-1 text-xs min-w-0">
                <XCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">FULLY BOOKED</span>
              </Button>
            )}

            {/* View Campaign Details Button */}
            <Button 
              variant="outline" 
              className="flex-1 text-xs min-w-0"
              onClick={() => setLocation(`/campaigns/${campaign.id}`)}
              data-testid={`button-view-campaign-details-${campaign.id}`}
            >
              <Eye className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate">VIEW CAMPAIGN DETAILS</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Individual Volunteer Opportunity Card (keeping for backwards compatibility)
function VolunteerOpportunityCard({ opportunity }: { opportunity: VolunteerOpportunity }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [intent, setIntent] = useState("");
  const [telegramDisplayName, setTelegramDisplayName] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");

  const availableSlots = opportunity.slotsNeeded - opportunity.slotsFilled;
  const isFullyBooked = availableSlots <= 0;

  const applyMutation = useMutation({
    mutationFn: (applicationData: any) => 
      apiRequest("POST", `/api/volunteer-opportunities/${opportunity.id}/apply`, applicationData),
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your volunteer application has been submitted successfully!",
      });
      setIsDialogOpen(false);
      setIntent("");
      setTelegramDisplayName("");
      setTelegramUsername("");
      queryClient.invalidateQueries({ queryKey: ["/api/volunteer-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/volunteer-applications/user"] });
    },
    onError: (error: any) => {
      console.error("❌ Application submission error:", error);
      const errorMessage = error?.response?.data?.message || error.message || "Failed to submit volunteer application";
      toast({
        title: "Application Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleApply = () => {
    console.log("🎯 Attempting to submit volunteer application:", {
      intent: intent.trim(),
      telegramDisplayName: telegramDisplayName.trim(),
      telegramUsername: telegramUsername.trim(),
      opportunityId: opportunity.id,
      campaignId: opportunity.campaignId
    });

    if (!intent.trim()) {
      toast({
        title: "Intent Required",
        description: "Please explain why you want to volunteer for this opportunity",
        variant: "destructive",
      });
      return;
    }

    if (!telegramDisplayName.trim() || !telegramUsername.trim()) {
      toast({
        title: "Telegram Info Required",
        description: "Please provide your Telegram display name and username for communication",
        variant: "destructive",
      });
      return;
    }

    const applicationData = {
      intent: intent.trim(),
      telegramDisplayName: telegramDisplayName.trim(),
      telegramUsername: telegramUsername.trim(),
    };

    console.log("📤 Submitting application data:", applicationData);
    applyMutation.mutate(applicationData);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 mb-2" data-testid={`text-opportunity-title-${opportunity.id}`}>
              {opportunity.title}
            </CardTitle>
            <Badge variant="secondary" className="mb-2">
              {opportunity.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-opportunity-description-${opportunity.id}`}>
          {opportunity.description}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{opportunity.location}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{new Date(opportunity.startDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="w-4 h-4 mr-2" />
            <span>{opportunity.duration} days</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Users className="w-4 h-4 mr-2" />
            <span>{availableSlots} of {opportunity.slotsNeeded} slots available</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="flex-1 text-xs min-w-0" 
                disabled={isFullyBooked || applyMutation.isPending}
                data-testid={`button-apply-${opportunity.id}`}
              >
                <span className="truncate">{isFullyBooked ? "Fully Booked" : "Apply to Volunteer"}</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Apply for Volunteer Opportunity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="intent">Why do you want to volunteer? *</Label>
                <Textarea
                  id="intent"
                  placeholder="Explain your motivation and how you can contribute..."
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  className="mt-1"
                  data-testid="textarea-intent"
                />
              </div>
              <div>
                <Label htmlFor="telegramDisplayName">Telegram Display Name *</Label>
                <Input
                  id="telegramDisplayName"
                  placeholder="Your display name on Telegram"
                  value={telegramDisplayName}
                  onChange={(e) => setTelegramDisplayName(e.target.value)}
                  className="mt-1"
                  data-testid="input-telegram-display-name"
                />
              </div>
              <div>
                <Label htmlFor="telegramUsername">Telegram Username *</Label>
                <Input
                  id="telegramUsername"
                  placeholder="@yourusername"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  className="mt-1"
                  data-testid="input-telegram-username"
                />
              </div>
              <Button 
                onClick={handleApply} 
                className="w-full"
                disabled={applyMutation.isPending}
                data-testid="button-submit-application"
              >
                {applyMutation.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Campaign Details Dialog */}
        <Button 
          variant="outline" 
          className="flex-1 text-xs min-w-0"
          onClick={() => setLocation(`/campaigns/${opportunity.campaignId}`)}
          data-testid={`button-view-campaign-details-${opportunity.id}`}
        >
          <Eye className="w-3 h-3 mr-1 flex-shrink-0" />
          <span className="truncate">VIEW CAMPAIGN DETAILS</span>
        </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Inactive Volunteer Opportunities View
function MyApplicationsView() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all campaigns and filter for completed/closed ones with volunteer slots
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["/api/campaigns"],
  }) as { data: any[] | undefined; isLoading: boolean };

  // Filter campaigns that are completed/closed and had volunteer slots
  const inactiveCampaignsWithVolunteerSlots = (campaigns || []).filter((campaign) =>
    (campaign.status === 'completed' || campaign.status === 'closed') &&
    campaign.volunteerSlots > 0 &&
    campaign.needsVolunteers
  );

  const filteredOpportunities = inactiveCampaignsWithVolunteerSlots.filter((campaign) =>
    campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading inactive volunteer opportunities...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inactive volunteer opportunities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-inactive-opportunities"
            />
          </div>
        </CardContent>
      </Card>

      {/* Opportunities List */}
      {filteredOpportunities.length === 0 ? (
        <div className="text-center py-12">
          <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No inactive volunteer opportunities found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Try adjusting your search terms" : "Volunteer opportunities from completed or closed campaigns will appear here"}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities.map((campaign) => (
            <InactiveCampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}

// Inactive Campaign Card (for completed/closed campaigns)
function InactiveCampaignCard({ campaign }: { campaign: any }) {
  const [, setLocation] = useLocation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <Archive className="w-4 h-4" />;
      default: return <Archive className="w-4 h-4" />;
    }
  };

  const totalSlots = campaign.volunteerSlots || 0;
  const filledSlots = campaign.volunteerSlotsFilledCount || 0;

  // Helper function to normalize image URL
  function normalizeImageUrl(raw?: string | null): string | undefined {
    if (!raw) return undefined;
    if (/^https?:\/\//i.test(raw)) return raw;
    // Tolerate missing leading slash
    if (raw.startsWith('api/upload')) raw = '/' + raw;
    if (raw.startsWith('objects/')) raw = '/' + raw;
    // If path includes bucket prefix, strip it once
    if (/^verifund-assets\//i.test(raw)) {
      raw = raw.replace(/^verifund-assets\//i, '');
    }
    // If it's our upload URL, extract objectPath and convert to public URL
    if (raw.startsWith('/api/upload')) {
      try {
        const u = new URL(raw, window.location.origin);
        const objectPath = u.searchParams.get('objectPath');
        if (objectPath) {
          const bucket = (import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET || import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'verifund-assets';
          const url = import.meta.env.VITE_SUPABASE_URL;
          if (url) {
            const path = objectPath.replace(/^\/+/, '');
            return `${url}/storage/v1/object/public/${bucket}/${path}`;
          }
        }
      } catch {}
    }
    // If it's an objects path, treat the rest as objectPath
    if (raw.startsWith('/objects/')) {
      const bucket = (import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET || import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'verifund-assets';
      const url = import.meta.env.VITE_SUPABASE_URL;
      if (url) {
        const path = raw.replace(/^\/objects\//, '').replace(/^\/+/, '');
        return `${url}/storage/v1/object/public/${bucket}/${path}`;
      }
    }
    // If it's a public-objects path, keep it as-is (server proxy route)
    if (raw.startsWith('/public-objects/')) {
      return raw; // Keep the original URL for server proxy handling
    }
    // If it's a public path, convert to Supabase URL
    if (/^(public|evidence|profiles)\//i.test(raw)) {
      const bucket = (import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET || import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'verifund-assets';
      const url = import.meta.env.VITE_SUPABASE_URL;
      if (url) {
        const path = raw.replace(/^\/+/, '');
        return `${url}/storage/v1/object/public/${bucket}/${path}`;
      }
    }
    return raw;
  }

  // Category fallback images
  const categoryImages: { [key: string]: string } = {
    emergency: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    education: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    healthcare: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    community: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    environment: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  };

  // Extract campaign image
  let imageUrlRaw = campaign.images ? 
    (campaign.images.startsWith('[') ? 
      ((): string | undefined => { try { const arr = JSON.parse(campaign.images); return Array.isArray(arr) ? arr.find((x: any) => !!x) : undefined; } catch { return undefined; } })() : 
      (campaign.images.includes(',') ? 
        campaign.images.split(',').map((s: string) => s.trim()).find(Boolean) : 
        campaign.images
      )
    ) : 
    undefined;
  if (!imageUrlRaw) {
    imageUrlRaw = categoryImages[campaign.category as keyof typeof categoryImages];
  }
  const fallbackImage = categoryImages[campaign.category as keyof typeof categoryImages] || 'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=800&h=400&q=60';
  const imageUrl = normalizeImageUrl(imageUrlRaw) || fallbackImage;

  return (
    <Card className="hover:shadow-lg transition-shadow opacity-75 overflow-hidden">
      {/* Campaign Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={imageUrl}
          alt={campaign.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to category image if campaign image fails to load
            (e.currentTarget as HTMLImageElement).src = categoryImages[campaign.category] || categoryImages.community;
          }}
        />
        {/* Category Badge Overlay */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/90 text-gray-800 backdrop-blur-sm">
            {campaign.category}
          </Badge>
        </div>
        {/* Status Badge Overlay */}
        <div className="absolute top-3 right-3">
          <Badge className={`${getStatusColor(campaign.status)} backdrop-blur-sm`}>
            {getStatusIcon(campaign.status)}
            <span className="ml-1 capitalize">{campaign.status}</span>
          </Badge>
        </div>
      </div>
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 mb-2" data-testid={`text-inactive-campaign-title-${campaign.id}`}>
              {campaign.title}
            </CardTitle>
            {!campaign.imageUrl && (
              <div className="flex gap-2 mb-2">
                <Badge variant="secondary">
                  {campaign.category}
                </Badge>
                <Badge className={getStatusColor(campaign.status)}>
                  {getStatusIcon(campaign.status)}
                  <span className="ml-1 capitalize">{campaign.status}</span>
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-inactive-campaign-description-${campaign.id}`}>
          {campaign.description}
        </p>

        <div className="space-y-2 text-sm">
          {campaign.location && (
            <div className="flex items-center text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{campaign.location}</span>
            </div>
          )}
          <div className="flex items-center text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Target: {new Date(campaign.targetDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Users className="w-4 h-4 mr-2" />
            <span>{filledSlots} of {totalSlots} volunteer slots filled</span>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button 
            variant="outline" 
            className="w-full text-xs"
            onClick={() => setLocation(`/campaigns/${campaign.id}`)}
            data-testid={`button-view-inactive-campaign-${campaign.id}`}
          >
            <Eye className="w-3 h-3 mr-1" />
            VIEW CAMPAIGN DETAILS
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Completed Opportunity Card (for opportunities from completed/closed campaigns)
function CompletedOpportunityCard({ opportunity }: { opportunity: any }) {
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Heart className="w-4 h-4" />;
      case 'closed': return <Archive className="w-4 h-4" />;
      default: return <Archive className="w-4 h-4" />;
    }
  };

  // Fetch campaign details for the dialog
  const { data: campaignDetails } = useQuery({
    queryKey: ["/api/campaigns", opportunity.campaignId],
    enabled: showCampaignDialog,
  }) as { data: any | undefined };

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1" data-testid={`text-opportunity-title-${opportunity.id}`}>
              {opportunity.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">{opportunity.description}</p>
            <Badge variant="secondary" className="mb-2">
              {opportunity.campaign?.category || "Category"}
            </Badge>
          </div>
          <Badge className={`${getStatusColor(opportunity.status)} flex items-center gap-1`}>
            {getStatusIcon(opportunity.status)}
            {opportunity.status === 'completed' ? 'Campaign Completed' : 'Campaign Closed'}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Campaign:</span>
              <div className="font-medium">{opportunity.campaign?.title || 'N/A'}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Location:</span>
              <div className="font-medium">{opportunity.location || 'Not specified'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Slots Available:</span>
              <div className="font-medium">{opportunity.slotsNeeded || 0}</div>
            </div>
            <div>
              <span className="text-muted-foreground">End Date:</span>
              <div className="font-medium">{new Date(opportunity.endDate).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Campaign ended on {new Date(opportunity.campaign?.updatedAt || opportunity.endDate).toLocaleDateString()}
            </div>
            
            {/* VIEW CAMPAIGN Button */}
            <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid={`button-view-campaign-${opportunity.id}`}>
                  <Eye className="w-4 h-4 mr-1" />
                  VIEW CAMPAIGN
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Campaign Details (Completed)
                  </DialogTitle>
                </DialogHeader>
                {campaignDetails && (
                  <div className="space-y-6">
                    <CampaignManagement 
                      campaign={campaignDetails} 
                      variant="detail"
                    />
                    
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Campaign Status</h4>
                      <p className="text-sm text-blue-700">
                        This campaign has been completed and is no longer accepting contributions or volunteers.
                      </p>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Individual Application Card
function ApplicationCard({ application }: { application: VolunteerApplication }) {
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const { user } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <Heart className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Fetch campaign details for the dialog
  const { data: campaignDetails } = useQuery({
    queryKey: ["/api/campaigns", application.campaignId],
    enabled: showCampaignDialog,
  }) as { data: any | undefined };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1" data-testid={`text-application-title-${application.id}`}>
              {application.campaign?.title || "Campaign Title"}
            </h3>
            <Badge variant="secondary" className="mb-2">
              {application.campaign?.category || "Category"}
            </Badge>
          </div>
          <Badge className={`${getStatusColor(application.status)} flex items-center gap-1`}>
            {getStatusIcon(application.status)}
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Your Intent:</h4>
            <p className="text-sm" data-testid={`text-application-intent-${application.id}`}>
              {application.intent}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Telegram Display:</span>
              <div className="font-medium">{application.telegramDisplayName}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Telegram Username:</span>
              <div className="font-medium">{application.telegramUsername}</div>
            </div>
          </div>

          {application.rejectionReason && (
            <div className="p-3 bg-red-50 rounded-lg">
              <h4 className="font-medium text-sm text-red-800 mb-1">Rejection Reason:</h4>
              <p className="text-sm text-red-700">{application.rejectionReason}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Applied on {new Date(application.createdAt).toLocaleDateString()}
            </div>
            
            {/* VIEW CAMPAIGN Button */}
            <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  data-testid={`button-view-campaign-${application.id}`}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  VIEW CAMPAIGN
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Campaign Details
                  </DialogTitle>
                </DialogHeader>
                {campaignDetails && (
                  <div className="space-y-6">
                    {/* Campaign Management Information Card */}
                    <CampaignManagement 
                      campaign={campaignDetails} 
                      variant="detail"
                    />

                    {/* Creator Profile Section */}
                    {campaignDetails.creator && (
                      <Card className="border-2 border-primary/20">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Campaign Creator Profile
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-16 h-16">
                              <AvatarImage 
                                src={campaignDetails.creator.profileImageUrl} 
                                alt={`${campaignDetails.creator.firstName} ${campaignDetails.creator.lastName}`} 
                              />
                              <AvatarFallback>
                                {campaignDetails.creator.firstName?.[0]}{campaignDetails.creator.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold">
                                {campaignDetails.creator.firstName} {campaignDetails.creator.lastName}
                              </h4>
                              <p className="text-sm text-muted-foreground">{campaignDetails.creator.email}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={campaignDetails.creator.kycStatus === 'verified' ? 'default' : 'secondary'}>
                                  {campaignDetails.creator.kycStatus === 'verified' ? 'KYC Verified' : 'KYC Pending'}
                                </Badge>
                                {campaignDetails.creator.organizationName && (
                                  <Badge variant="outline">{campaignDetails.creator.organizationType}</Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div>
                                <h5 className="font-medium text-sm mb-2">Professional Information</h5>
                                <div className="space-y-1 text-sm">
                                  {campaignDetails.creator.profession && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Profession:</span>
                                      <span className="font-medium">{campaignDetails.creator.profession}</span>
                                    </div>
                                  )}
                                  {campaignDetails.creator.education && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Education:</span>
                                      <span className="font-medium">{campaignDetails.creator.education}</span>
                                    </div>
                                  )}
                                  {campaignDetails.creator.organizationName && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Organization:</span>
                                      <span className="font-medium">{campaignDetails.creator.organizationName}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <h5 className="font-medium text-sm mb-2">Campaign History</h5>
                                <div className="space-y-1 text-sm">
                                  {campaignDetails.creator.totalCampaigns !== undefined && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Total Campaigns:</span>
                                      <span className="font-medium">{campaignDetails.creator.totalCampaigns}</span>
                                    </div>
                                  )}
                                  {campaignDetails.creator.completedCampaigns !== undefined && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Completed:</span>
                                      <span className="font-medium">{campaignDetails.creator.completedCampaigns}</span>
                                    </div>
                                  )}
                                  {campaignDetails.creator.totalRaised && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Total Raised:</span>
                                      <span className="font-medium">₱{Number(campaignDetails.creator.totalRaised).toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {campaignDetails.creator.workExperience && (
                            <div>
                              <h5 className="font-medium text-sm mb-2">Experience</h5>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {campaignDetails.creator.workExperience}
                              </p>
                            </div>
                          )}

                          {campaignDetails.creator.linkedinProfile && (
                            <div>
                              <h5 className="font-medium text-sm mb-2">LinkedIn Profile</h5>
                              <a 
                                href={campaignDetails.creator.linkedinProfile} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm"
                              >
                                View LinkedIn Profile
                              </a>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Basic Campaign Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Campaign Information</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Goal Amount:</span>
                              <span className="font-medium">₱{Number(campaignDetails.goalAmount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Current Amount:</span>
                              <span className="font-medium">₱{Number(campaignDetails.currentAmount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status:</span>
                              <Badge variant="secondary">{campaignDetails.status}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Category:</span>
                              <span className="font-medium">{campaignDetails.category}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Created:</span>
                              <span className="font-medium">{new Date(campaignDetails.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Volunteer Information</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Slots Needed:</span>
                              <span className="font-medium">{campaignDetails.volunteerSlots || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Slots Filled:</span>
                              <span className="font-medium">{campaignDetails.volunteerSlotsFilledCount || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Available Slots:</span>
                              <span className="font-medium">{(campaignDetails.volunteerSlots || 0) - (campaignDetails.volunteerSlotsFilledCount || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Location:</span>
                              <span className="font-medium">{campaignDetails.location || 'Not specified'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Campaign Description */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Description</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {campaignDetails.description}
                      </p>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}