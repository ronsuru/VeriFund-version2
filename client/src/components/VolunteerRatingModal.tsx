import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Shield, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Volunteer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
  reliabilityScore?: string;
  reliabilityRatingsCount?: number;
  application: {
    id: string;
    intent: string;
    telegramDisplayName: string;
    telegramUsername: string;
    status: string;
    createdAt: string;
  };
}

interface VolunteerRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  volunteer: Volunteer | null;
  campaignId: string;
  campaignTitle: string;
}

export function VolunteerRatingModal({ 
  isOpen, 
  onClose, 
  volunteer, 
  campaignId, 
  campaignTitle 
}: VolunteerRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const rateVolunteerMutation = useMutation({
    mutationFn: async (data: { campaignId: string; rating: number; feedback?: string }) => {
      return await apiRequest("POST", `/api/volunteers/${volunteer?.id}/rate`, data);
    },
    onSuccess: () => {
      toast({
        title: "Volunteer Rated Successfully! ⭐",
        description: `You've rated ${volunteer?.firstName}'s reliability. This helps improve volunteer safety for everyone.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/volunteers-to-rate`] });
      queryClient.invalidateQueries({ queryKey: [`/api/volunteers/${volunteer?.id}/reliability-ratings`] });
// Also invalidate any rating status queries
      queryClient.invalidateQueries({ queryKey: ["volunteer-rating-statuses"] });
      // Invalidate user auth query to refresh reliability score in profile
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Rating Failed",
        description: error.message || "Failed to rate volunteer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!volunteer || rating === 0) {
      toast({
        title: "Please Select a Rating",
        description: "Choose a star rating from 1-5 to rate this volunteer's reliability.",
        variant: "destructive",
      });
      return;
    }

    rateVolunteerMutation.mutate({
      campaignId,
      rating,
      feedback: feedback.trim() || undefined,
    });
  };

  const handleClose = () => {
    setRating(0);
    setFeedback("");
    setHoveredRating(0);
    onClose();
  };

  if (!volunteer) return null;

  const displayRating = hoveredRating || rating;

  const getRatingDescription = (stars: number) => {
    switch (stars) {
      case 1: return "Poor - Did not meet expectations";
      case 2: return "Below Average - Some issues encountered";
      case 3: return "Average - Met basic expectations";
      case 4: return "Good - Exceeded expectations";
      case 5: return "Excellent - Outstanding volunteer work";
      default: return "Select a rating";
    }
  };

  const getRatingColor = (stars: number) => {
    switch (stars) {
      case 1: return "text-red-500";
      case 2: return "text-orange-500";
      case 3: return "text-yellow-500";
      case 4: return "text-blue-500";
      case 5: return "text-green-500";
      default: return "text-gray-400";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" data-testid="modal-rate-volunteer">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Rate Volunteer Reliability
          </DialogTitle>
          <DialogDescription>
            Help improve volunteer safety by rating their reliability and performance during your campaign.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Volunteer Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4" data-testid="section-volunteer-info">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                {volunteer.profileImageUrl ? (
                  <img 
                    src={volunteer.profileImageUrl} 
                    alt={`${volunteer.firstName} ${volunteer.lastName}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg" data-testid="text-volunteer-name">
                  {volunteer.firstName} {volunteer.lastName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-volunteer-email">
                  {volunteer.email}
                </p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-gray-500" data-testid="text-telegram-info">
                    Telegram: @{volunteer.application.telegramUsername}
                  </span>
                  {volunteer.reliabilityScore && (
                    <div className="flex items-center gap-1" data-testid="section-current-reliability">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">
                        {volunteer.reliabilityScore}/5.00
                      </span>
                      <span className="text-xs text-gray-500">
                        ({volunteer.reliabilityRatingsCount || 0} ratings)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Context */}
          <div className="text-center" data-testid="section-campaign-context">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Rating volunteer performance for campaign:
            </p>
            <p className="font-medium text-gray-900 dark:text-gray-100" data-testid="text-campaign-title">
              "{campaignTitle}"
            </p>
          </div>

          {/* Star Rating */}
          <div className="text-center space-y-4" data-testid="section-star-rating">
            <Label className="text-base font-medium">
              How would you rate this volunteer's reliability and performance?
            </Label>
            
            <div className="flex justify-center items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 transition-transform hover:scale-110"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  data-testid={`button-star-${star}`}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= displayRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            {displayRating > 0 && (
              <p className={`text-sm font-medium ${getRatingColor(displayRating)}`} data-testid="text-rating-description">
                {getRatingDescription(displayRating)}
              </p>
            )}
          </div>

          {/* Feedback */}
          <div className="space-y-2" data-testid="section-feedback">
            <Label htmlFor="feedback">
              Additional Feedback (Optional)
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share specific details about this volunteer's reliability, communication, and performance..."
              className="min-h-[100px]"
              maxLength={500}
              data-testid="input-feedback"
            />
            <p className="text-xs text-gray-500 text-right" data-testid="text-feedback-count">
              {feedback.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4" data-testid="section-actions">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={rateVolunteerMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={rating === 0 || rateVolunteerMutation.isPending}
              data-testid="button-submit-rating"
            >
              {rateVolunteerMutation.isPending ? "Submitting..." : "Submit Rating"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}