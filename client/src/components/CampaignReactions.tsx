import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ObjectUploader } from '@/components/ObjectUploader';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Share2, Flag, Upload, FileText, Eye, X } from 'lucide-react';
import { z } from 'zod';

interface Reaction {
  id: string;
  reactionType: string;
  userId: string;
  campaignId: string;
  createdAt: Date;
}

interface ReactionSummary {
  [key: string]: {
    count: number;
    users: string[];
  };
}

interface CampaignReactionsProps {
  campaignId: string;
  creatorId?: string; // Add creatorId to check if current user is the creator
}

const fraudReportSchema = z.object({
  reportType: z.string().min(1, "Report type is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  attachments: z.array(z.string()).optional(),
});

const reactionTypes = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'support', emoji: '🤝', label: 'Support' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'angry', emoji: '😠', label: 'Angry' },
];

export default function CampaignReactions({ campaignId, creatorId }: CampaignReactionsProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showFraudReportModal, setShowFraudReportModal] = useState(false);
  
  const fraudReportForm = useForm<z.infer<typeof fraudReportSchema>>({
    resolver: zodResolver(fraudReportSchema),
    defaultValues: {
      reportType: '',
      description: '',
      attachments: [],
    },
  });
  
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // Fetch campaign reactions
  const { data: reactions = {} } = useQuery<ReactionSummary>({
    queryKey: ['/api/campaigns', campaignId, 'reactions'],
  });

  // Fetch user's current reaction
  const { data: userReaction } = useQuery<{ reaction: Reaction | null }>({
    queryKey: ['/api/campaigns', campaignId, 'reactions', 'user'],
    enabled: isAuthenticated,
  });

  // Toggle reaction mutation
  const toggleReactionMutation = useMutation({
    mutationFn: async (reactionType: string) => {
      if (!isAuthenticated) {
        throw new Error('Please log in to react to campaigns');
      }
      return apiRequest('POST', `/api/campaigns/${campaignId}/reactions`, { reactionType });
    },
    onSuccess: () => {
      // Invalidate and refetch reactions
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'reactions'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleReactionClick = (reactionType: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to react to campaigns',
        variant: 'destructive',
      });
      return;
    }

    toggleReactionMutation.mutate(reactionType);
  };

  const getUserReactionType = () => {
    return userReaction?.reaction?.reactionType || null;
  };

  const getTotalReactions = () => {
    return Object.values(reactions).reduce((total, reaction) => total + reaction.count, 0);
  };

  // Submit fraud report mutation
  const submitFraudReportMutation = useMutation({
    mutationFn: async (data: z.infer<typeof fraudReportSchema>) => {
      return apiRequest("POST", '/api/fraud-reports/campaign', {
        ...data,
        campaignId,
      });
    },
    onSuccess: () => {
      setShowFraudReportModal(false);
      fraudReportForm.reset();
      toast({
        title: "Report Submitted Successfully! 🛡️",
        description: "Thank you for helping keep the community safe. We'll review your report.",
      });
    },
    onError: (error: any) => {
      console.error('Error submitting fraud report:', error);
      const errorMessage = error?.message || 'Failed to submit report. Please try again.';
      toast({
        title: "Error Submitting Report",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmitFraudReport = (data: z.infer<typeof fraudReportSchema>) => {
    submitFraudReportMutation.mutate({
      ...data,
      attachments: uploadedFiles,
    });
  };

  const handleFileUploadComplete = (files: { uploadURL: string; name: string }[]) => {
    if (files && files.length > 0) {
      const newFiles = files.map(file => file.uploadURL);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      toast({
        title: "Files uploaded successfully",
        description: `${files.length} file(s) uploaded as evidence`,
      });
    }
  };

  const removeUploadedFile = (fileUrl: string) => {
    setUploadedFiles(prev => prev.filter(f => f !== fileUrl));
  };




  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800" data-testid="campaign-reactions">
      <div className="flex flex-col space-y-4">
        {/* Reaction Buttons and Actions */}
        <div className="flex justify-between items-center">
          {/* Left side - Reaction Buttons */}
          <div className="flex flex-wrap gap-2 items-center">
          {reactionTypes.map((reaction) => {
            const isActive = getUserReactionType() === reaction.type;
            const count = reactions[reaction.type]?.count || 0;
            
            return (
              <TooltipProvider key={reaction.type}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleReactionClick(reaction.type)}
                      disabled={toggleReactionMutation.isPending}
                      className={`flex items-center gap-1 ${
                        isActive 
                          ? "bg-blue-500 hover:bg-blue-600 text-white" 
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      data-testid={`reaction-${reaction.type}`}
                    >
                      <span className="text-lg">{reaction.emoji}</span>
                      {count > 0 && <span className="text-sm">{count}</span>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-semibold">{reaction.label}</p>
                      {reactions[reaction.type]?.users && (
                        <div className="mt-1 text-sm">
                          {reactions[reaction.type].users.slice(0, 3).join(', ')}
                          {reactions[reaction.type].users.length > 3 && 
                            ` and ${reactions[reaction.type].users.length - 3} more`
                          }
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
          </div>
          
          {/* Right side - Share and Report */}
          <div className="flex items-center gap-2">
            {/* Share Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const campaignUrl = `${window.location.origin}/campaigns/${campaignId}`;
                      navigator.clipboard.writeText(campaignUrl);
                      toast({
                        title: 'Link copied!',
                        description: 'Campaign link copied to clipboard',
                      });
                    }}
                    className="flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-700 h-8 px-2"
                    data-testid="button-share"
                  >
                    <Share2 className="h-3 w-3" />
                    <span className="text-xs">Share</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share this campaign</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Report Button - Only show if user is NOT the campaign creator */}
            {isAuthenticated && (user as any)?.id !== creatorId && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!isAuthenticated) {
                          toast({
                            title: 'Please log in',
                            description: 'You need to be logged in to report campaigns',
                            variant: 'destructive',
                          });
                          return;
                        }
                        setShowFraudReportModal(true);
                      }}
                      className="flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 h-8 px-2"
                      data-testid="button-report"
                    >
                      <Flag className="h-3 w-3" />
                      <span className="text-xs">Report</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Report inappropriate content</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Reaction Summary */}
        {getTotalReactions() > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span data-testid="reaction-summary">
              {getTotalReactions()} {getTotalReactions() === 1 ? 'reaction' : 'reactions'}
            </span>
          </div>
        )}
      </div>

      {/* Fraud Report Modal */}
      <Dialog open={showFraudReportModal} onOpenChange={setShowFraudReportModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Report Campaign</DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              Please help us maintain community safety by reporting suspicious or fraudulent campaigns.
            </p>
          </DialogHeader>
          
          <Form {...fraudReportForm}>
            <form onSubmit={fraudReportForm.handleSubmit(onSubmitFraudReport)} className="space-y-4">
              <FormField
                control={fraudReportForm.control}
                name="reportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Report Type</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full" data-testid="select-report-type">
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fraud">Fraudulent Campaign</SelectItem>
                          <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                          <SelectItem value="fake">Fake Information</SelectItem>
                          <SelectItem value="spam">Spam</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={fraudReportForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide details about why you're reporting this campaign..."
                        {...field}
                        rows={4}
                        className="min-h-[100px] resize-none"
                        data-testid="textarea-report-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Upload Section */}
              <FormField
                control={fraudReportForm.control}
                name="attachments"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Supporting Evidence (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          Upload screenshots, documents, or other files that support your report. 
                          While attachments are optional, they can significantly help our team verify 
                          and process your report more effectively.
                        </p>
                        
                        <ObjectUploader
                          maxNumberOfFiles={5}
                          maxFileSize={10485760} // 10MB
                          onGetUploadParameters={async () => {
                            const response: any = await apiRequest('POST', '/api/objects/upload');
                            const uploadUrl = response.uploadURL || response.url;
                            
                            if (!uploadUrl) {
                              throw new Error('No upload URL received from server');
                            }
                            
                            return {
                              method: 'PUT' as const,
                              url: uploadUrl,
                            };
                          }}
                          onComplete={handleFileUploadComplete}
                          buttonClassName="w-full bg-lime-400 hover:bg-lime-500 text-gray-900 font-medium py-3 rounded-lg"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Upload className="w-4 h-4" />
                            <span>Upload Evidence Files</span>
                          </div>
                        </ObjectUploader>

                        {/* Display uploaded files with previews */}
                        {uploadedFiles.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-sm font-medium">Uploaded Evidence ({uploadedFiles.length}):</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {uploadedFiles.map((fileUrl, index) => {
                                const fileName = `Evidence file ${index + 1}`;
                                const fileExtension = fileUrl.split('.').pop()?.toLowerCase() || '';
                                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension);
                                const isPdf = fileExtension === 'pdf';
                                
                                return (
                                  <div key={index} className="border rounded-lg p-3 bg-white">
                                    {/* File preview */}
                                    <div className="aspect-video bg-gray-50 rounded mb-2 flex items-center justify-center overflow-hidden">
                                      {isImage ? (
                                        <img 
                                          src={fileUrl} 
                                          alt={fileName}
                                          className="max-w-full max-h-full object-contain rounded"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                          }}
                                        />
                                      ) : isPdf ? (
                                        <div className="text-center p-4">
                                          <FileText className="h-8 w-8 mx-auto text-red-500 mb-2" />
                                          <p className="text-xs text-gray-600">PDF Document</p>
                                        </div>
                                      ) : (
                                        <div className="text-center p-4">
                                          <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                          <p className="text-xs text-gray-600">Document</p>
                                        </div>
                                      )}
                                      <div className="hidden text-center p-4">
                                        <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                        <p className="text-xs text-gray-600">Preview unavailable</p>
                                      </div>
                                    </div>
                                    
                                    {/* File info and actions */}
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-600 truncate flex-1">{fileName}</span>
                                      <div className="flex gap-1 ml-2">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => window.open(fileUrl, '_blank')}
                                          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                                          title="View full size"
                                        >
                                          <Eye className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeUploadedFile(fileUrl)}
                                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                          title="Remove file"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={() => setShowFraudReportModal(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitFraudReportMutation.isPending}
                  className="bg-red-500 hover:bg-red-600 px-6"
                  data-testid="button-submit-report"
                >
                  {submitFraudReportMutation.isPending ? "Submitting..." : "Submit Report"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}