import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, Box, Settings, MapPin, Calendar } from "lucide-react";
import UserVerifiedBadge from "@/components/UserVerifiedBadge";
import { format } from "date-fns";
import { Link } from "wouter";
import type { CampaignWithCreator } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import CampaignManagement from "@/components/CampaignManagement";
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
    const objectPath = raw.replace(/^\/objects\//, '');
    const bucket = (import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET || import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'verifund-assets';
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (url) {
      const path = objectPath.replace(/^\/+/, '');
      return `${url}/storage/v1/object/public/${bucket}/${path}`;
    }
  }
  // Handle Supabase public subfolders like "public/", "evidence/", "profiles/"
  if (/^(public|evidence|profiles)\//i.test(raw)) {
    const bucket = (import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET || import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'verifund-assets';
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (url) {
      const path = raw.replace(/^\/+/, '');
      return `${url}/storage/v1/object/public/${bucket}/${path}`;
    }
  }
  const bucket = (import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET || import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'verifund-assets';
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (url) {
    const path = raw.replace(/^\/+/, '');
    return `${url}/storage/v1/object/public/${bucket}/${path}`;
  }
  return raw;
}interface CampaignCardProps {
  campaign: CampaignWithCreator;
}

const categoryColors = {
  emergency: "bg-red-100 text-red-800",
  education: "bg-blue-100 text-blue-800",
  healthcare: "bg-green-100 text-green-800",
  community: "bg-purple-100 text-purple-800",
  environment: "bg-green-100 text-green-800",
};

const statusColors = {
  active: "bg-green-100 text-green-800",
  on_progress: "bg-blue-100 text-blue-800", 
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
};

const statusLabels = {
  active: "Active",
  on_progress: "On Progress",
  completed: "Completed", 
  cancelled: "Cancelled",
  pending: "Pending",
};

const categoryImages = {
  emergency: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
  education: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
  healthcare: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
  community: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
  environment: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
};

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const { user } = useAuth();
  const isCreator = (user as any)?.id === campaign.creatorId;
  const currentAmount = parseFloat(campaign.currentAmount || '0');
  const goalAmount = parseFloat(campaign.goalAmount || '0');
  const progress = (currentAmount / goalAmount) * 100;
  
  const daysLeft = campaign.endDate ? 
    Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;

let imageUrlRaw = campaign.images ? 
    (campaign.images.startsWith('[') ? 
      ((): string | undefined => { try { const arr = JSON.parse(campaign.images); return Array.isArray(arr) ? arr.find((x: any) => !!x) : undefined; } catch { return undefined; } })() : 
      (campaign.images.includes(',') ? 
        campaign.images.split(',').map(s => s.trim()).find(Boolean) : 
        campaign.images
      )
    ) : 
    undefined;
  if (!imageUrlRaw) {
    imageUrlRaw = categoryImages[campaign.category as keyof typeof categoryImages];
  }
  const fallbackImage = categoryImages[campaign.category as keyof typeof categoryImages] || 'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=400&h=200&q=60';
  const imageUrl = normalizeImageUrl(imageUrlRaw) || fallbackImage;  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow" data-testid={`card-campaign-${campaign.id}`}>
      <img 
        src={imageUrl} 
        alt={campaign.title}
        className="w-full h-48 object-cover"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = categoryImages[campaign.category as keyof typeof categoryImages]; }}
      />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Campaign ID */}
            {campaign.campaignDisplayId && (
              <>
                <Badge variant="outline" className="text-xs px-2 py-1 bg-gray-50 text-gray-600 font-mono border-gray-300" data-testid={`badge-campaign-id-${campaign.id}`}>
                  {campaign.campaignDisplayId}
                </Badge>
                <span className="text-gray-400">•</span>
              </>
            )}
            {/* Creator's Name */}
            <span className="text-sm font-medium text-gray-700" data-testid={`text-creator-${campaign.id}`}>
              {campaign.creatorFirstName && campaign.creatorLastName 
                ? `${campaign.creatorFirstName} ${campaign.creatorLastName}`
                : campaign.creatorEmail || 'Unknown Creator'
              }
            </span>
            <span className="text-gray-400">•</span>
            <Badge 
              className={`text-xs px-2 py-1 ${categoryColors[campaign.category as keyof typeof categoryColors]}`}
              data-testid={`badge-category-${campaign.category}`}
            >
              {campaign.category.charAt(0).toUpperCase() + campaign.category.slice(1)}
            </Badge>
            <span className="text-gray-400">•</span>
            <Badge 
              className={`text-xs px-2 py-1 ${statusColors[campaign.status as keyof typeof statusColors]}`}
              data-testid={`badge-status-${campaign.status}`}
            >
              {statusLabels[campaign.status as keyof typeof statusLabels] || campaign.status}
            </Badge>
          </div>
          {campaign.tesVerified && (
            <div className="flex items-center text-sm text-muted-foreground">
              <UserVerifiedBadge size="md" className="mr-1" />
              <span>TES Verified</span>
            </div>
          )}
        </div>
        
        <h3 className="text-xl font-semibold mb-3" data-testid={`text-title-${campaign.id}`}>
          {campaign.title}
        </h3>
        
        <p className="text-muted-foreground mb-4 line-clamp-3" data-testid={`text-description-${campaign.id}`}>
          {campaign.description}
        </p>
        
        {/* Progress Bars */}
        <div className="mb-4 space-y-3">
          {/* Total Goal Progress */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Total Goal</span>
              <span className="text-muted-foreground text-xs">{daysLeft} days left</span>
            </div>
            <div className="flex justify-between text-xs mb-1">
              <span data-testid={`text-current-${campaign.id}`}>₱{currentAmount.toLocaleString()}</span>
              <span className="text-muted-foreground" data-testid={`text-goal-${campaign.id}`}>₱{goalAmount.toLocaleString()}</span>
            </div>
            <Progress value={progress} className="h-2" data-testid={`progress-${campaign.id}`} />
            <div className="text-xs text-muted-foreground mt-1">
              {progress.toFixed(0)}% of total goal
              {campaign.minimumAmount && parseFloat(campaign.minimumAmount) > 0 && (
                <div className="mt-1">
                  <span className={parseFloat(campaign.minimumAmount) <= currentAmount ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
                    {parseFloat(campaign.minimumAmount) <= currentAmount 
                      ? `✅ Operational (₱${parseFloat(campaign.minimumAmount).toLocaleString()})`
                      : `🎯 Needs ₱${parseFloat(campaign.minimumAmount).toLocaleString()} operational`
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Event Details Section */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="space-y-2">
            {/* Event Location */}
            {(campaign.street || campaign.barangay || campaign.city || campaign.province) && (
              <div className="flex items-start gap-2">
                <MapPin className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-gray-600 leading-relaxed">
                  <div className="font-medium text-gray-800">Location:</div>
                  <div className="line-clamp-2">
                    {[campaign.street, campaign.barangay, campaign.city, campaign.province]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                </div>
              </div>
            )}

            {/* Event Timeline */}
            {(campaign.startDate || campaign.endDate) && (
              <div className="flex items-start gap-2">
                <Calendar className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-gray-600 leading-relaxed">
                  <div className="font-medium text-gray-800">Timeline:</div>
                  <div className="space-y-0.5">
                    {campaign.startDate && (
                      <div>Start: {format(new Date(campaign.startDate), 'MMM dd, yyyy')}</div>
                    )}
                    {campaign.endDate && (
                      <div>End: {format(new Date(campaign.endDate), 'MMM dd, yyyy')}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Volunteer Information */}
            {campaign.needsVolunteers && (
              <div className="flex items-start gap-2">
                <Users className="w-3 h-3 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-gray-600 leading-relaxed">
                  <div className="font-medium text-gray-800">Volunteers:</div>
                  <div>
                    {campaign.volunteerSlotsFilledCount || 0}/{campaign.volunteerSlots || 0} slots filled
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        
        <CampaignManagement 
          campaign={campaign}
          variant="card"
        />
      </CardContent>
    </Card>
  );
}
