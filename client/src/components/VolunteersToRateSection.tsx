import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Star, Users, Calendar, MessageCircle, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { VolunteerRatingModal } from "./VolunteerRatingModal";
import { formatDistanceToNow } from "date-fns";
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

interface VolunteersToRateSectionProps {
  campaignId: string;
  campaignTitle: string;
}

export function VolunteersToRateSection({ campaignId, campaignTitle }: VolunteersToRateSectionProps) {
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedVolunteerForReport, setSelectedVolunteerForReport] = useState<Volunteer | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: volunteers = [], isLoading } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}/volunteers-to-rate`],
    enabled: !!campaignId,
  });

  const handleRateVolunteer = (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
    setIsRatingModalOpen(true);
  };

  const handleCloseRatingModal = () => {
    setSelectedVolunteer(null);
    setIsRatingModalOpen(false);
  };

  const handleReportVolunteer = (volunteer: Volunteer) => {
    setSelectedVolunteerForReport(volunteer);
    setIsReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setSelectedVolunteerForReport(null);
    setIsReportModalOpen(false);
    setReportReason("");
    setReportDescription("");
  };

  // Report volunteer mutation
  const reportVolunteerMutation = useMutation({
    mutationFn: async (data: { volunteerId: string; reason: string; description: string }) => {
      return await apiRequest("POST", `/api/campaigns/${campaignId}/report-volunteer`, data);
    },
    onSuccess: () => {
      toast({
        title: "Volunteer Reported",
        description: "The volunteer has been reported and the admin team will review it.",
      });
      handleCloseReportModal();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to report volunteer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitReport = () => {
    if (!selectedVolunteerForReport || !reportReason || !reportDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a reason and provide a description for the report.",
        variant: "destructive",
      });
      return;
    }

    reportVolunteerMutation.mutate({
      volunteerId: selectedVolunteerForReport.id,
      reason: reportReason,
      description: reportDescription,
    });
  };

  if (isLoading) {
    return (
      <Card data-testid="card-volunteers-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Rate Volunteer Reliability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (volunteers.length === 0) {
    return (
      <Card data-testid="card-no-volunteers">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Rate Volunteer Reliability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Volunteers to Rate
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              All approved volunteers for this campaign have been rated, or no volunteers have been approved yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card data-testid="card-volunteers-to-rate">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Rate Volunteer Reliability
            <Badge variant="secondary" className="ml-auto" data-testid="badge-volunteers-count">
              {volunteers.length} to rate
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Help improve volunteer safety by rating the reliability of volunteers who worked on your campaign.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="list-volunteers">
            {volunteers.map((volunteer: Volunteer) => (
              <div
                key={volunteer.id}
                className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                data-testid={`volunteer-card-${volunteer.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      {volunteer.profileImageUrl ? (
                        <img 
                          src={volunteer.profileImageUrl} 
                          alt={`${volunteer.firstName} ${volunteer.lastName}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-blue-600 font-semibold text-lg">
                          {volunteer.firstName[0]}{volunteer.lastName[0]}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100" data-testid={`text-volunteer-name-${volunteer.id}`}>
                          {volunteer.firstName} {volunteer.lastName}
                        </h4>
                        {volunteer.reliabilityScore && (
                          <div className="flex items-center gap-1" data-testid={`reliability-score-${volunteer.id}`}>
                            <Shield className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">
                              {volunteer.reliabilityScore}/5.00
                            </span>
                            <span className="text-xs text-gray-500">
                              ({volunteer.reliabilityRatingsCount || 0})
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span data-testid={`text-volunteer-email-${volunteer.id}`}>
                            {volunteer.email}
                          </span>
                          <span data-testid={`text-telegram-${volunteer.id}`}>
                            @{volunteer.application.telegramUsername}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span data-testid={`text-application-date-${volunteer.id}`}>
                            Applied {formatDistanceToNow(new Date(volunteer.application.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        
                        {volunteer.application.intent && (
                          <div className="flex items-start gap-2 text-sm">
                            <MessageCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-gray-600 dark:text-gray-400 line-clamp-2" data-testid={`text-intent-${volunteer.id}`}>
                              {volunteer.application.intent}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      onClick={() => handleReportVolunteer(volunteer)}
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      data-testid={`button-report-${volunteer.id}`}
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Report Volunteer
                    </Button>
                    <Button
                      onClick={() => handleRateVolunteer(volunteer)}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid={`button-rate-${volunteer.id}`}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Rate Volunteer
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <VolunteerRatingModal
        isOpen={isRatingModalOpen}
        onClose={handleCloseRatingModal}
        volunteer={selectedVolunteer}
        campaignId={campaignId}
        campaignTitle={campaignTitle}
      />

      {/* Report Volunteer Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-600" />
              Report Volunteer
            </DialogTitle>
          </DialogHeader>
          
          {selectedVolunteerForReport && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Reporting:</p>
                <p className="font-medium">
                  {selectedVolunteerForReport.firstName} {selectedVolunteerForReport.lastName}
                </p>
                <p className="text-sm text-gray-500">{selectedVolunteerForReport.email}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Report</Label>
                <Select value={reportReason} onValueChange={setReportReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inappropriate_behavior">Inappropriate Behavior</SelectItem>
                    <SelectItem value="unreliable">Unreliable/No Show</SelectItem>
                    <SelectItem value="poor_communication">Poor Communication</SelectItem>
                    <SelectItem value="violated_guidelines">Violated Guidelines</SelectItem>
                    <SelectItem value="fraud_suspicious">Fraud/Suspicious Activity</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please provide details about the issue..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleCloseReportModal}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReport}
                  disabled={reportVolunteerMutation.isPending || !reportReason || !reportDescription.trim()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {reportVolunteerMutation.isPending ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}