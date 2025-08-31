import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, ShieldAlert, MessageCircle, Award, Lock, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const supportRequestSchema = z.object({
  requestType: z.string().min(1, "Request type is required"),
  reason: z.string().min(50, "Please provide a detailed reason (minimum 50 characters)"),
});

export function CredibilityWarning() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSupportDialog, setShowSupportDialog] = useState(false);

  const { data: credibilityData, isLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/credibility-score`],
    enabled: !!user?.id,
  });

  const form = useForm<z.infer<typeof supportRequestSchema>>({
    resolver: zodResolver(supportRequestSchema),
    defaultValues: {
      requestType: "account_reactivation",
      reason: "",
    },
  });

  const supportRequestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof supportRequestSchema>) => {
      return await apiRequest("/api/support-requests", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Support Request Submitted",
        description: "Your request has been submitted. Minimum 1 month processing time.",
      });
      setShowSupportDialog(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/credibility-score`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit support request",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !credibilityData) return null;

  const { credibilityScore, accountStatus, remainingCampaignChances, canCreateCampaign } = credibilityData;

  // Don't show warning if user can create campaigns normally
  if (canCreateCampaign && accountStatus === 'active') return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'blocked': return 'destructive';
      case 'suspended': return 'destructive';
      case 'limited': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'blocked': return <Lock className="h-4 w-4" />;
      case 'suspended': return <ShieldAlert className="h-4 w-4" />;
      case 'limited': return <AlertTriangle className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
          {getStatusIcon(accountStatus)}
          Campaign Creation Status
        </CardTitle>
        <CardDescription>
          Your credibility score affects your ability to create campaigns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Credibility Score Display */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Credibility Score</span>
            <Badge variant={credibilityScore >= 80 ? 'default' : credibilityScore >= 65 ? 'secondary' : 'destructive'}>
              {credibilityScore}%
            </Badge>
          </div>
          <Progress value={credibilityScore} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Need 80%+ for unlimited campaign creation
          </p>
        </div>

        {/* Account Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Account Status</span>
          <Badge variant={getStatusColor(accountStatus)} className="capitalize">
            {accountStatus}
          </Badge>
        </div>

        {/* Status-specific messaging */}
        {accountStatus === 'blocked' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Account Blocked</AlertTitle>
            <AlertDescription>
              Your credibility score is {credibilityScore}% (≤65%). You cannot create campaigns until your account is reactivated through support.
            </AlertDescription>
          </Alert>
        )}

        {accountStatus === 'suspended' && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Account Suspended</AlertTitle>
            <AlertDescription>
              Your credibility score is {credibilityScore}% (65-74%). You cannot create campaigns until your account is reactivated through support.
            </AlertDescription>
          </Alert>
        )}

        {accountStatus === 'limited' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Limited Campaign Creation</AlertTitle>
            <AlertDescription>
              Your credibility score is {credibilityScore}% (75-80%). You have {remainingCampaignChances} campaign creation chances remaining.
              Maintain 80%+ credibility score for unlimited access.
            </AlertDescription>
          </Alert>
        )}

        {/* Support Request Button for blocked/suspended users */}
        {(accountStatus === 'blocked' || accountStatus === 'suspended') && (
          <Dialog open={showSupportDialog} onOpenChange={setShowSupportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                Request Account Reactivation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Account Reactivation Request</DialogTitle>
                <DialogDescription>
                  Submit a detailed request for account reactivation. Minimum processing time is 1 month.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => supportRequestMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="requestType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Request Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select request type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="account_reactivation">Account Reactivation</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detailed Reason</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please explain why your account should be reactivated. Include any evidence or improvements you've made to your campaign management practices..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Minimum 1 month processing time</span>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowSupportDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={supportRequestMutation.isPending}>
                      {supportRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}

        {/* Improvement tips */}
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          <strong>💡 Improve your credibility score:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Submit detailed progress reports for active campaigns</li>
            <li>Engage with volunteers and contributors positively</li>
            <li>Complete campaigns successfully and reach minimum operational amounts</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}