import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, Clock } from "lucide-react";
import type { VolunteerOpportunity } from "@shared/schema";

interface VolunteerCardProps {
  opportunity: VolunteerOpportunity;
  onApply: (id: string) => void;
}

const categoryColors = {
  emergency: "bg-red-100 text-red-800",
  education: "bg-blue-100 text-blue-800",
  healthcare: "bg-green-100 text-green-800",
  community: "bg-purple-100 text-purple-800",
  environment: "bg-green-100 text-green-800",
} as const;

const getCategoryDisplayName = (category: string) => {
  const categoryMap: Record<string, string> = {
    emergency: "Emergency",
    education: "Education",
    healthcare: "Healthcare", 
    community: "Community",
    environment: "Environment",
  };
  return categoryMap[category] || "Other";
};

export default function VolunteerCard({ opportunity, onApply }: VolunteerCardProps) {
  const slotsAvailable = opportunity.slotsNeeded - (opportunity.slotsFilled || 0);
  const category = (opportunity as any).category || 'emergency';
  const categoryColorClass = categoryColors[category as keyof typeof categoryColors] || categoryColors.emergency;
  
  return (
    <Card className="hover:shadow-lg transition-shadow" data-testid={`card-volunteer-${opportunity.id}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge 
            className={`text-xs px-2 py-1 ${categoryColorClass}`}
            data-testid={`badge-volunteer-category-${opportunity.id}`}
          >
            {getCategoryDisplayName(category)}
          </Badge>
          <span className="text-sm text-muted-foreground" data-testid={`text-slots-${opportunity.id}`}>
            {slotsAvailable} needed
          </span>
        </div>
        
        <h3 className="text-xl font-semibold mb-3" data-testid={`text-volunteer-title-${opportunity.id}`}>
          {opportunity.title}
        </h3>
        
        <p className="text-muted-foreground mb-4" data-testid={`text-volunteer-description-${opportunity.id}`}>
          {opportunity.description}
        </p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground mr-2" />
            <span data-testid={`text-volunteer-location-${opportunity.id}`}>{opportunity.location}</span>
          </div>
          <div className="flex items-center text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
            <span data-testid={`text-volunteer-dates-${opportunity.id}`}>
              {new Date(opportunity.startDate).toLocaleDateString()} - {new Date(opportunity.endDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <Clock className="w-4 h-4 text-muted-foreground mr-2" />
            <span data-testid={`text-volunteer-time-${opportunity.id}`}>
              {(opportunity as any).duration ? `${(opportunity as any).duration} days commitment` : 'Full day commitment'}
            </span>
          </div>
        </div>
        
        <Button 
          className="w-full"
          onClick={() => onApply(opportunity.id)}
          disabled={slotsAvailable === 0}
          data-testid={`button-apply-volunteer-${opportunity.id}`}
        >
          {slotsAvailable === 0 ? "Fully Booked" : "Apply to Volunteer"}
        </Button>
      </CardContent>
    </Card>
  );
}
