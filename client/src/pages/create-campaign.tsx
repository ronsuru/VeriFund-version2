import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { ObjectUploader } from "@/components/ObjectUploader";
import { CredibilityWarning } from "@/components/credibility-warning";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  FileText, 
  CreditCard,
  Shield,
  Clock,
  ArrowLeft,
  ArrowRight,
  X,
  Users
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCampaignSchema } from "@shared/schema";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
// Removed UploadResult import since we're using a simpler upload interface"

const campaignFormSchema = insertCampaignSchema.extend({
  goalAmount: z.string().min(1, "Goal amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Goal amount must be a positive number"
  ),
  minimumAmount: z.string().min(1, "Minimum operational amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Minimum operational amount must be a positive number"
  ),
  duration: z.union([
    z.string().min(1, "Campaign duration is required").refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 365,
      "Campaign duration must be between 1 and 365 days"
    ),
    z.number().min(1, "Campaign duration must be at least 1 day").max(365, "Campaign duration cannot exceed 365 days")
  ]),
  volunteerSlots: z.string().optional().refine(
    (val) => {
      if (!val || val === "") return true;
      const num = Number(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    },
    "Volunteer slots must be a number between 0 and 100"
  ),
  // Location fields validation
  street: z.string().min(1, "Street address is required"),
  barangay: z.string().min(1, "Barangay is required"),
  city: z.string().min(1, "City/Municipality is required"),
  province: z.string().min(1, "Province/Region is required"),
  zipcode: z.string().min(4, "Zipcode must be at least 4 characters"),
  landmark: z.string().optional(),
  // Date fields validation
  startDate: z.string().min(1, "Campaign start date is required"),
  endDate: z.string().min(1, "Campaign end date is required"),
}).omit({ creatorId: true, volunteerSlotsFilledCount: true })
  .refine((data) => {
    const goalAmount = Number(data.goalAmount);
    const minimumAmount = Number(data.minimumAmount);
    return minimumAmount <= goalAmount;
  }, {
    message: "Minimum operational amount must be less than or equal to goal amount",
    path: ["minimumAmount"],
  })
  .refine((data) => {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return startDate < endDate;
  }, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

const steps = [
  { id: 1, title: "Basic Information", description: "Campaign details and goal" },
  { id: 2, title: "KYC Verification", description: "Identity verification" },
  { id: 3, title: "Review & Submit", description: "Final review and submission" }
];

export type CreateCampaignHandle = {
  hasUnsavedChanges: () => boolean;
  saveDraft: () => Promise<void>;
  discardChanges: () => Promise<void>;
};

type Props = { prefill?: any };

const CreateCampaign = forwardRef<CreateCampaignHandle, Props>(function CreateCampaign({ prefill }, ref) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [kycDocuments, setKycDocuments] = useState<{ [key: string]: string }>({});
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const form = useForm<z.infer<typeof campaignFormSchema>>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      goalAmount: "",
      minimumAmount: "",
      duration: "",
      images: "",
      needsVolunteers: false,
      volunteerSlots: "",
      // Location fields
      street: "",
      barangay: "",
      city: "",
      province: "",
      zipcode: "",
      landmark: "",
      // Date fields
      startDate: "",
      endDate: "",
    },
  });

  useEffect(() => {
    if (prefill) {
      try {
        form.reset({
          ...form.getValues(),
          ...prefill,
        } as any);
        if (prefill.images) {
          const imgs = Array.isArray(prefill.images)
            ? prefill.images
            : String(prefill.images).split(',').filter(Boolean);
          setUploadedImages(imgs);
        }
      } catch {}
    }
  }, [prefill]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
import('@/lib/loginModal').then(m => m.openLoginModal());      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);


  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/campaigns", data);
      try {
        return await res.json();
      } catch {
        return null as any;
      }
    },
    onSuccess: (campaign: any) => {
      // Refresh user campaigns so Drafts tab updates immediately (match any variants of this key)
      queryClient.invalidateQueries({ queryKey: ["/api/user/campaigns"], exact: false });
      if (campaign && (campaign.status || '').toLowerCase() === 'draft') {
        toast({
          title: "Draft saved",
          description: "Your draft was saved. You can continue editing from My Campaigns → Drafts.",
        });
        return;
      }
      toast({
        title: "Campaign Created Successfully",
        description: "Your campaign has been submitted for review. You'll be notified once it's approved.",
      });
      setLocation("/");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
import('@/lib/loginModal').then(m => m.openLoginModal());        }, 500);
        return;
      }
      toast({
        title: "Campaign Creation Failed",
        description: `Error: ${error.message || 'Something went wrong. Please try again.'}`,
        variant: "destructive",
      });
    },
  });
  // Imperative API for parent modal to handle close confirmations
  useImperativeHandle(ref, () => ({
    hasUnsavedChanges() {
      const values = form.getValues();
      const hasAnyField = Object.keys(values).some((key) => {
        const v: any = (values as any)[key];
        if (typeof v === 'string') return v.trim().length > 0;
        if (typeof v === 'number') return !isNaN(v) && v !== 0;
        if (typeof v === 'boolean') return v === true;
        if (Array.isArray(v)) return v.length > 0;
        return false;
      });
      const hasImages = uploadedImages.length > 0;
      const hasKycDocs = Object.keys(kycDocuments).length > 0;
      const isFormDirty = (form as any).formState?.isDirty;
      return Boolean(isFormDirty || hasAnyField || hasImages || hasKycDocs);
    },
    async saveDraft() {
      const formData = form.getValues();
      const coerceInt = (v: any, fallback = 0) => {
        const n = typeof v === 'string' ? parseInt(v) : typeof v === 'number' ? v : NaN;
        return Number.isFinite(n) && !Number.isNaN(n) ? n : fallback;
      };
      const campaignData = {
        // Required fields with safe defaults for drafts
        title: formData.title || 'Untitled draft',
        description: formData.description || '',
        category: formData.category || 'community',
        goalAmount: formData.goalAmount || '0',
        minimumAmount: formData.minimumAmount || '0',
        duration: formData.duration ? coerceInt(formData.duration, 1) : 1,
        // Optional/location fields
        street: formData.street || '',
        barangay: formData.barangay || '',
        city: formData.city || '',
        province: formData.province || '',
        zipcode: formData.zipcode || '',
        landmark: formData.landmark || '',
        startDate: formData.startDate || '',
        endDate: formData.endDate || '',
        needsVolunteers: !!formData.needsVolunteers,
        volunteerSlots: coerceInt(formData.volunteerSlots, 0),
        images: uploadedImages.length > 0 ? JSON.stringify(uploadedImages) : null,
        status: 'draft',
      } as any;
      // Use mutateAsync so caller can await completion
      await (createCampaignMutation as any).mutateAsync(campaignData);
    },
    async discardChanges() {
      // Clean up uploaded images from storage if any exist
      if (uploadedImages.length > 0) {
        try {
          await apiRequest("POST", "/api/campaigns/discard-draft", {
            imageUrls: uploadedImages
          });
          console.log('Successfully cleaned up images from storage');
        } catch (error) {
          console.warn('Failed to clean up images from storage:', error);
          // Don't throw error - we still want to close the modal
        }
      }
      // Clear local state
      setUploadedImages([]);
      return Promise.resolve();
    },
  }));

  const submitKycMutation = useMutation({
    mutationFn: async (documents: { [key: string]: string }) => {
      return await apiRequest("POST", "/api/user/kyc", { documents });
    },
    onSuccess: () => {
      toast({
        title: "KYC Documents Submitted",
        description: "Your identity verification documents have been submitted for review.",
      });
      setCurrentStep(3);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
import('@/lib/loginModal').then(m => m.openLoginModal());        }, 500);
        return;
      }
      toast({
        title: "KYC Submission Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof campaignFormSchema>) => {
    if (currentStep === 1) {
      if (["verified","approved"].includes(((user as any)?.kycStatus || '').toLowerCase())) {
        setCurrentStep(3);
      } else {
        setCurrentStep(2);
      }
    } else if (currentStep === 3) {
      const campaignData = {
        ...data,
        images: uploadedImages.length > 0 ? JSON.stringify(uploadedImages) : null,
      };
      createCampaignMutation.mutate(campaignData);
    }
  };

  const handleContinue = async () => {
    
    if (currentStep === 1) {
      // For step 1, we only need title and description to continue
      const title = form.getValues('title');
      const description = form.getValues('description');
      
      if (!title || !description) {
        toast({
          title: "Missing Information",
          description: "Please fill in the campaign title and description to continue.",
          variant: "destructive",
        });
        return;
      }
      
      if (["verified","approved"].includes(((user as any)?.kycStatus || '').toLowerCase())) {
        setCurrentStep(3);
      } else {
        setCurrentStep(2);
      }
    } else {
      // For other steps, use form submission
      await form.handleSubmit(onSubmit)();
    }
  };

  const handleKycSubmit = () => {
    if (Object.keys(kycDocuments).length < 2) {
      toast({
        title: "Incomplete KYC",
        description: "Please upload both valid ID and proof of address.",
        variant: "destructive",
      });
      return;
    }
    submitKycMutation.mutate(kycDocuments);
  };

  const handleFileUpload = (type: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload this to your file storage service
      // For now, we'll just store a mock URL
      const mockUrl = `https://mock-storage.com/${type}_${Date.now()}.${file.name.split('.').pop()}`;
      setKycDocuments(prev => ({ ...prev, [type]: mockUrl }));
      toast({
        title: "File Uploaded",
        description: `${type.replace('_', ' ')} uploaded successfully.`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-create-campaign-title">
            Create New Campaign
          </h1>
          <p className="text-lg text-muted-foreground">
            Start your fundraising journey with complete transparency
          </p>
        </div>

        {/* Progress Indicator */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step.id 
                        ? "bg-primary text-white" 
                        : "bg-gray-200 text-gray-500"
                    }`}>
                      {currentStep > step.id ? <CheckCircle className="w-4 h-4" /> : step.id}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-12 h-1 mx-2 ${
                        currentStep > step.id ? "bg-primary" : "bg-gray-200"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground" data-testid="text-step-indicator">
                Step {currentStep} of {steps.length}: {steps[currentStep - 1].description}
              </div>
            </div>
            <Progress value={progress} className="h-2" data-testid="progress-steps" />
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Campaign Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter a compelling title for your campaign"
                            {...field}
                            data-testid="input-campaign-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-campaign-category">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="animal_welfare">Animal Welfare</SelectItem>
                            <SelectItem value="community">Community Development</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="emergency">Emergency Relief</SelectItem>
                            <SelectItem value="environment">Environment</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="memorial">Memorial & Funeral Support</SelectItem>
                            <SelectItem value="sports">Sports</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="goalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Funding Goal (PHP)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="100000"
                              {...field}
                              data-testid="input-goal-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="minimumAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Operational Amount (PHP)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="40000"
                              {...field}
                              data-testid="input-minimum-amount"
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-gray-600">
                            Minimum amount needed to start operations. Campaign becomes "On Progress" when this is reached.
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Duration (days)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="e.g. 45"
                            {...field}
                            min="1"
                            max="365"
                            data-testid="input-campaign-duration"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || "")}
                            className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Choose how many days your campaign will run (1-365 days)
                        </p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={6}
                            placeholder="Tell your story... Why do you need funding? How will the funds be used?"
                            {...field}
                            data-testid="textarea-campaign-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Event Location Section */}
                  <Card className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-semibold">Event Location</h3>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="street"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Street Address</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g. 123 Rizal Street"
                                  {...field}
                                  data-testid="input-street"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="barangay"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Barangay</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g. Barangay San Miguel"
                                  {...field}
                                  data-testid="input-barangay"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City/Municipality</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g. Quezon City"
                                  {...field}
                                  data-testid="input-city"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="province"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Province/Region</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g. Metro Manila"
                                  {...field}
                                  data-testid="input-province"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="zipcode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Zipcode</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g. 1100"
                                  {...field}
                                  data-testid="input-zipcode"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="landmark"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Landmark (Optional but recommended)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g. Near SM Mall, Across from Church"
                                  {...field}
                                  data-testid="input-landmark"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Campaign Timeline Section */}
                  <Card className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">Campaign Timeline</h3>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target Start Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date"
                                  {...field}
                                  data-testid="input-start-date"
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-muted-foreground">
                                When do you plan to start the campaign activities?
                              </p>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target End Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date"
                                  {...field}
                                  data-testid="input-end-date"
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-muted-foreground">
                                When do you expect the campaign to end?
                              </p>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Volunteer Requirements Section */}
                  <Card className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">Volunteer Requirements</h3>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="needsVolunteers"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-needs-volunteers"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                This campaign needs volunteers
                              </FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Check this if your campaign requires volunteer help for activities, events, or support
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />

                      {form.watch("needsVolunteers") && (
                        <FormField
                          control={form.control}
                          name="volunteerSlots"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Volunteer Slots (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="e.g. 10"
                                  {...field}
                                  min="0"
                                  max="100"
                                  data-testid="input-volunteer-slots"
                                />
                              </FormControl>
                              <p className="text-sm text-muted-foreground">
                                Leave empty for unlimited volunteers. Maximum 100 slots.
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </Card>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Images
                    </label>
                    
                    {/* Show uploaded images */}
                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        {uploadedImages.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={(function(raw){
                                if (!raw) return '';
                                if (/^https?:\/\//i.test(raw)) return raw;
                                if (raw.startsWith('api/upload')) raw = '/' + raw;
                                if (raw.startsWith('objects/')) raw = '/' + raw;
                                if (/^verifund-assets\//i.test(raw)) raw = raw.replace(/^verifund-assets\//i, '');
                                try {
                                  if (raw.startsWith('/api/upload')) {
                                    const u = new URL(raw, window.location.origin);
                                    const p = u.searchParams.get('objectPath');
                                    if (p) {
                                      const b = (import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET || import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'verifund-assets';
                                      const su = import.meta.env.VITE_SUPABASE_URL;
                                      if (su) return `${su}/storage/v1/object/public/${b}/${p.replace(/^\/+/, '')}`;
                                    }
                                  }
                                } catch {}
                                if (raw.startsWith('/objects/')) {
                                  const p = raw.replace(/^\/objects\//,'');
                                  const b = (import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET || import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'verifund-assets';
                                  const su = import.meta.env.VITE_SUPABASE_URL;
                                  if (su) return `${su}/storage/v1/object/public/${b}/${p.replace(/^\/+/, '')}`;
                                }
                                if (/^(public|evidence|profiles)\//i.test(raw)) {
                                  const b = (import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET || import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'verifund-assets';
                                  const su = import.meta.env.VITE_SUPABASE_URL;
                                  if (su) return `${su}/storage/v1/object/public/${b}/${raw.replace(/^\/+/, '')}`;
                                }
                                const b = (import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET || import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'verifund-assets';
                                const su = import.meta.env.VITE_SUPABASE_URL;
                                if (su) return `${su}/storage/v1/object/public/${b}/${String(raw).replace(/^\/+/, '')}`;
                                return raw;
                              })(imageUrl)} 
                              alt={`Campaign image ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                            <button
                              type="button"
                              onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload button */}
                    {uploadedImages.length < 5 && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">Upload campaign images</p>
                        <p className="text-sm text-gray-400 mb-4">Cover photo only, up to 5MB</p>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880} // 5MB
                          disabled={uploadedImages.length >= 1}
                          onGetUploadParameters={async () => {
                            console.log("🔄 Getting upload parameters...");
                            const response = await apiRequest("POST", "/api/objects/upload");
                            const data = await response.json();
                            console.log("✅ Upload parameters received:", data);
                            return {
                              method: "PUT" as const,
                              url: data.uploadURL,
                            };
                          }}
                          onComplete={async (uploadedFiles: { uploadURL: string; name: string }[]) => {
                            const newImageUrls: string[] = [];
                            
                            for (const file of uploadedFiles) {
                              try {
                                // The upload URL already includes objectPath; extract it for storage
                                const u = new URL(file.uploadURL, window.location.origin);
                                const objectPath = u.searchParams.get('objectPath');
                                newImageUrls.push(objectPath || file.uploadURL.replace(/^.*objectPath=/, ''));
                              } catch (error) {
                                console.error("Error setting image ACL:", error);
                                toast({
                                  title: "Image Upload Warning",
                                  description: "Image uploaded but may not be accessible. Please try again.",
                                  variant: "destructive",
                                });
                              }
                            }
                            
                            // Replace existing images instead of adding to them (since we only allow 1)
                            setUploadedImages(newImageUrls);
                            toast({
                              title: "Cover Photo Uploaded",
                              description: `${uploadedFiles.length} image(s) uploaded successfully.`,
                            });
                          }}
                          buttonClassName="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choose Images
                        </ObjectUploader>
                      </div>
                    )}
                    
                    {uploadedImages.length >= 5 && (
                      <p className="text-sm text-green-600 mt-2">Maximum number of images reached (5/5)</p>
                    )}
                  </div>

                  {/* Debug KYC Status - moved to useEffect */}
                  
                  {!["verified","approved"].includes(((user as any)?.kycStatus || '').toLowerCase()) && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <strong>KYC Verification Required:</strong> To ensure transparency and prevent fraud, 
                        you'll need to complete identity verification before your campaign can go live.
                        <div className="text-xs mt-1">Current status: {(user as any)?.kycStatus || 'undefined'}</div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: KYC Verification */}
            {currentStep === 2 && !["verified","approved"].includes(((user as any)?.kycStatus || '').toLowerCase()) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Identity Verification</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="border-blue-200 bg-blue-50">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      To maintain platform integrity and prevent fraud, we require identity verification 
                      for all campaign creators. This information is securely stored and used only for verification purposes.
                    </AlertDescription>
                  </Alert>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valid Government ID
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Upload your valid ID</p>
                        <p className="text-xs text-gray-400">Driver's License, Passport, or National ID</p>
                        <input 
                          type="file" 
                          accept="image/*,.pdf" 
                          onChange={(e) => handleFileUpload('valid_id', e)}
                          className="hidden" 
                          id="valid-id-upload"
                          data-testid="input-valid-id"
                        />
                        <label 
                          htmlFor="valid-id-upload" 
                          className="mt-2 inline-block cursor-pointer text-primary hover:underline"
                        >
                          Choose File
                        </label>
                        {kycDocuments.valid_id && (
                          <div className="mt-2 flex items-center justify-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm">Uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proof of Address
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Upload proof of address</p>
                        <p className="text-xs text-gray-400">Utility bill, bank statement, or lease agreement</p>
                        <input 
                          type="file" 
                          accept="image/*,.pdf" 
                          onChange={(e) => handleFileUpload('proof_of_address', e)}
                          className="hidden" 
                          id="address-upload"
                          data-testid="input-proof-address"
                        />
                        <label 
                          htmlFor="address-upload" 
                          className="mt-2 inline-block cursor-pointer text-primary hover:underline"
                        >
                          Choose File
                        </label>
                        {kycDocuments.proof_of_address && (
                          <div className="mt-2 flex items-center justify-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm">Uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Processing Time:</strong> KYC verification typically takes 1-3 business days. 
                      You'll receive an email notification once your documents are reviewed.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Review & Submit */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Review & Submit</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Your campaign is ready for submission! Please review all details before submitting.
                    </AlertDescription>
                  </Alert>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Campaign Details</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Title:</strong> {form.watch("title")}</div>
                        <div><strong>Category:</strong> {form.watch("category")}</div>
                        <div><strong>Goal:</strong> ₱{parseInt(form.watch("goalAmount") || "0").toLocaleString()}</div>
                        <div><strong>Minimum Amount:</strong> ₱{parseInt(form.watch("minimumAmount") || "0").toLocaleString()}</div>
                        <div><strong>Duration:</strong> {form.watch("duration")} days</div>
                        <div><strong>Needs Volunteers:</strong> {form.watch("needsVolunteers") ? "Yes" : "No"}</div>
                        {form.watch("needsVolunteers") && form.watch("volunteerSlots") && (
                          <div><strong>Volunteer Slots:</strong> {form.watch("volunteerSlots")}</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Event Location</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Address:</strong> {form.watch("street")}, {form.watch("barangay")}</div>
                        <div><strong>City:</strong> {form.watch("city")}, {form.watch("province")}</div>
                        <div><strong>Zipcode:</strong> {form.watch("zipcode")}</div>
                        {form.watch("landmark") && (
                          <div><strong>Landmark:</strong> {form.watch("landmark")}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Campaign Timeline</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Start Date:</strong> {form.watch("startDate") ? new Date(form.watch("startDate")).toLocaleDateString() : "Not set"}</div>
                        <div><strong>End Date:</strong> {form.watch("endDate") ? new Date(form.watch("endDate")).toLocaleDateString() : "Not set"}</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Verification Status</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          {(user as any)?.kycStatus === "verified" ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                              <span className="text-sm">KYC Verified</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-yellow-600 mr-2" />
                              <span className="text-sm">KYC Pending Review</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          <span className="text-sm">Campaign Information Complete</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">What happens next?</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Your campaign will be reviewed by our team within 24-48 hours</li>
                      <li>• You'll receive an email notification once approved</li>
                      <li>• Once live, you can start sharing and collecting contributions</li>
                      <li>• Deposits and transactions are processed in PHP (blockchain temporarily disabled)</li>
                    </ul>
                  </div>

                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                data-testid="button-previous-step"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex space-x-2">
                {currentStep === 2 && (user as any)?.kycStatus !== "verified" && (
                  <Button
                    type="button"
                    onClick={handleKycSubmit}
                    disabled={submitKycMutation.isPending || Object.keys(kycDocuments).length < 2}
                    data-testid="button-submit-kyc"
                  >
                    {submitKycMutation.isPending ? "Submitting..." : "Submit KYC"}
                  </Button>
                )}

                {currentStep === 1 && (
                  <Button
                    type="button"
                    onClick={handleContinue}
                    data-testid="button-continue"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                
                {currentStep === 3 && (
                  <Button
                    type="button"
                    onClick={() => {
                      const formData = form.getValues();
                      const campaignData = {
                        ...formData,
                        images: uploadedImages.length > 0 ? JSON.stringify(uploadedImages) : null,
                        volunteerSlots: formData.volunteerSlots ? parseInt(formData.volunteerSlots) : 0,
                      };
                      createCampaignMutation.mutate(campaignData);
                    }}
                    disabled={createCampaignMutation.isPending}
                    data-testid="button-create-campaign"
                  >
                    {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
});

export default CreateCampaign;
