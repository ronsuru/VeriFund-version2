import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { ObjectUploader } from "@/components/ObjectUploader";
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
  User,
  Shield,
  Clock,
  ArrowLeft,
  ArrowRight,
  Camera,
  Briefcase,
  GraduationCap,
  Phone,
  MapPin,
  Building,
  Linkedin
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";

const profileVerificationSchema = z.object({
  education: z.string().min(10, "Please provide detailed educational background"),
  profession: z.string().min(3, "Profession is required"),
  workExperience: z.string().min(20, "Please provide detailed work experience"),
  linkedinProfile: z.string().url("Please provide a valid LinkedIn URL").optional().or(z.literal("")),
  organizationName: z.string().min(2, "Organization name is required"),
  organizationType: z.enum(["government", "ngo", "private", "startup", "freelance", "student", "other"]),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(20, "Complete address is required"),
});

const steps = [
  { id: 1, title: "Profile Picture", description: "Upload your profile photo" },
  { id: 2, title: "Professional Details", description: "Work and education information" },
  { id: 3, title: "Identity Documents", description: "KYC verification documents" },
  { id: 4, title: "Review & Submit", description: "Final review and submission" }
];

export default function ProfileVerification() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { data: serverUser, status: authStatus } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string>("");
  const [kycDocuments, setKycDocuments] = useState<{ [key: string]: string }>({});
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof profileVerificationSchema>>({
    resolver: zodResolver(profileVerificationSchema),
    defaultValues: {
      education: "",
      profession: "",
      workExperience: "",
      linkedinProfile: "",
      organizationName: "",
      organizationType: "private",
      phoneNumber: "",
      address: "",
    },
  });

  // Open login modal only after server auth says unauthenticated
  useEffect(() => {
if (authStatus === 'success' && !serverUser) {
      import('@/lib/loginModal').then(m => m.openLoginModal());    }
  }, [authStatus, serverUser]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileVerificationSchema>) => {
      return await apiRequest("PUT", "/api/user/profile", {
        ...data,
        profileImageUrl,
        isProfileComplete: true,
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your professional details have been saved.",
      });
      setCurrentStep(3);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
import('@/lib/loginModal').then(m => m.openLoginModal());        return;
      }
      toast({
        title: "Profile Update Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const submitKycMutation = useMutation({
    mutationFn: async (documents: { [key: string]: string }) => {
      return await apiRequest("POST", "/api/user/kyc", { documents });
    },
    onSuccess: () => {
      toast({
        title: "Verification Submitted",
        description: "Your documents have been submitted for review. You'll be notified within 24-48 hours.",
      });
      queryClient.setQueryData(["/api/auth/user"], (prev: any) => ({ ...(prev || {}), ...user }));
      setCurrentStep(4);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
import('@/lib/loginModal').then(m => m.openLoginModal());        return;
      }
      toast({
        title: "KYC Submission Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof profileVerificationSchema>) => {
    if (currentStep === 2) {
      updateProfileMutation.mutate(data);
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

  const handleFileUpload = async (type: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      // Get upload URL from server
      console.log(`Uploading ${type} document:`, file.name);
      const response = await apiRequest("POST", "/api/objects/upload");
      const data = await response.json();
      const uploadURL = data.uploadURL || data.url;
const objectPath: string | undefined = data.objectPath;      if (!uploadURL) {
        throw new Error("No upload URL received from server");
      }
      
      // Upload file directly to object storage
const { supabase } = await import('@/supabaseClient');
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        credentials: 'include',      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }
      
// Build a preview URL from objectPath for immediate feedback
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
      const bucket = ((import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET as string | undefined) || 'verifund-assets';
      const previewUrl = supabaseUrl && objectPath
        ? `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`
        : uploadURL;

      // Store the upload URL for backend normalization
      setKycDocuments(prev => ({ ...prev, [type]: uploadURL }));
      
      // Optionally you could set a local preview map here if needed
      toast({
        title: "Document Uploaded",
        description: `${type.replace('_', ' ')} uploaded successfully.`,
      });
    } catch (error) {
      console.error(`Error uploading ${type} document:`, error);
      toast({
        title: "Upload Failed",
        description: `Failed to upload ${type.replace('_', ' ')}. Please try again.`,
        variant: "destructive",
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-profile-verification-title">
            Complete Your Profile Verification
          </h1>
          <p className="text-lg text-muted-foreground">
            Help contributors trust you by completing your professional profile and identity verification
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

        {/* Step 1: Profile Picture */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="w-5 h-5" />
                <span>Profile Picture</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Important:</strong> Please upload a clear, recent photo of yourself. Do not use cartoon avatars, 
                  AI-generated images, or photos that don't clearly show your face. This helps build trust with contributors.
                </AlertDescription>
              </Alert>

              <div className="text-center">
                {/* Show set profile picture */}
                {profileImageUrl && (
                  <div className="mb-6">
                    <img 
                      src={profileImageUrl} 
                      alt="Profile picture"
                      className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-green-200 shadow-lg"
                    />
                    <p className="text-center text-sm text-green-600 mt-2">
                      ✓ Profile picture set successfully
                    </p>
                    <div className="flex justify-center mt-4">
                      <Button
                        onClick={() => {
                          setProfileImageUrl("");
                          setUploadedImagePreview("");
                          toast({
                            title: "Profile Picture Removed",
                            description: "You can upload a new image.",
                          });
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Change Picture
                      </Button>
                    </div>
                  </div>
                )}

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Upload Your Profile Picture</h3>
                  <p className="text-gray-600 mb-4">
                    Choose a professional photo that clearly shows your face
                  </p>
                  
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5242880} // 5MB
                    onGetUploadParameters={async () => {
                      console.log("Getting upload parameters...");
                      const response = await apiRequest("POST", "/api/objects/upload");
                      const data = await response.json();
                      console.log("Got upload response:", data);
                      const uploadURL = data.uploadURL || data.url;
                      console.log("Using upload URL:", uploadURL);
                      
                      if (!uploadURL) {
                        throw new Error("No upload URL received from server");
                      }
                      
                      return {
                        method: "PUT" as const,
                        url: uploadURL,
                      };
                    }}
                    onComplete={async (uploadResult) => {
                      console.log("=== UPLOAD COMPLETE CALLBACK TRIGGERED ===");
                      console.log("Upload result:", uploadResult);
                      
                      if (!uploadResult || uploadResult.length === 0) {
                        console.error("No files in upload result");
                        toast({
                          title: "Upload Failed",
                          description: "No files were uploaded successfully.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      const uploadedFile = uploadResult[0];
                      const uploadURL = uploadedFile.uploadURL;
                      console.log("Processing uploaded file with URL:", uploadURL);
                      
                      if (!uploadURL) {
                        console.error("Upload URL is missing from result:", uploadedFile);
                        toast({
                          title: "Upload Failed",
                          description: "Upload URL is missing. Please try again.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      try {
                        // Immediately call the API to get the permanent URL
                        console.log("Setting profile picture with URL:", uploadURL);
                        const requestData = { profileImageUrl: uploadURL };
                        console.log("Request data:", requestData);
const response = await apiRequest("PUT", "/api/user/profile-picture", requestData);
                        const data = await response.json();
                        console.log("Profile picture response:", data);

                        // Prefer server-provided public URL; otherwise build from objectPath; lastly proxy via /objects
                        const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
                        const bucket = ((import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET as string | undefined) || 'verifund-assets';
                        const objectPath: string | undefined = data.objectPath;
                        let finalUrl: string = data.profileImageUrl || '';
                        if ((!finalUrl || !/^https?:\/\//.test(finalUrl)) && objectPath) {
                          if (supabaseUrl) {
                            finalUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
                          } else {
                            finalUrl = `/objects/${objectPath}`;
                          }
                        }
                        if (finalUrl && !finalUrl.startsWith('http') && !finalUrl.startsWith('/')) {
                          finalUrl = `/${finalUrl}`;
                        }

                        if (finalUrl) {
                          setUploadedImagePreview(finalUrl);
                          setProfileImageUrl(finalUrl);                          toast({
                            title: "Profile Picture Set!",
                            description: "Your profile picture has been uploaded and set successfully.",
                          });
                        } else {
throw new Error("No preview URL available from server");                        }
                      } catch (error) {
                        console.error("Error setting profile picture:", error);
                        toast({
                          title: "Upload Error",
                          description: `Failed to set profile picture: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
                          variant: "destructive",
                        });
                      }
                    }}
                    buttonClassName="w-full max-w-sm mx-auto"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Profile Picture
                  </ObjectUploader>
                </div>

                <div className="text-sm text-gray-500 mt-4">
                  <p><strong>Guidelines:</strong></p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Use a recent, clear photo of yourself</li>
                    <li>Face should be clearly visible and well-lit</li>
                    <li>No sunglasses, hats, or face coverings</li>
                    <li>Professional or semi-formal appearance preferred</li>
                    <li>No cartoon avatars or AI-generated images</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Professional Details */}
        {currentStep === 2 && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Briefcase className="w-5 h-5" />
                    <span>Professional Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="border-green-200 bg-green-50">
                    <Shield className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Providing detailed professional information helps contributors understand your background 
                      and builds trust in your campaigns. All information is securely stored.
                    </AlertDescription>
                  </Alert>

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="profession"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Briefcase className="w-4 h-4" />
                            <span>Current Profession</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Software Engineer, Teacher, Doctor"
                              {...field}
                              data-testid="input-profession"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="organizationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Building className="w-4 h-4" />
                            <span>Organization/Company</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., ABC Corporation, XYZ NGO"
                              {...field}
                              data-testid="input-organization"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="organizationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-organization-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="government">Government</SelectItem>
                              <SelectItem value="ngo">NGO/Non-profit</SelectItem>
                              <SelectItem value="private">Private Company</SelectItem>
                              <SelectItem value="startup">Startup</SelectItem>
                              <SelectItem value="freelance">Freelancer</SelectItem>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Phone className="w-4 h-4" />
                            <span>Phone Number</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+63 9XX XXX XXXX"
                              {...field}
                              data-testid="input-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="education"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <GraduationCap className="w-4 h-4" />
                          <span>Educational Background</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={3}
                            placeholder="e.g., Bachelor of Science in Computer Science from University of the Philippines (2015-2019)"
                            {...field}
                            data-testid="textarea-education"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="workExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Experience</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={4}
                            placeholder="Describe your work experience, including current role, previous positions, and relevant achievements"
                            {...field}
                            data-testid="textarea-work-experience"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="linkedinProfile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Linkedin className="w-4 h-4" />
                            <span>LinkedIn Profile (Optional)</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://linkedin.com/in/yourprofile"
                              {...field}
                              data-testid="input-linkedin"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>Complete Address</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              rows={2}
                              placeholder="Street address, barangay, city, province"
                              {...field}
                              data-testid="textarea-address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        )}

        {/* Step 3: Identity Documents */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Identity Verification Documents</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Please upload clear, readable photos of your documents. Ensure all text is visible 
                  and the documents are current and valid.
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
                  <strong>Processing Time:</strong> Identity verification typically takes 1-3 business days. 
                  You'll receive an email notification once your documents are reviewed.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Verification Complete</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Congratulations!</strong> Your profile verification has been submitted successfully. 
                  Our team will review your information and documents within 24-48 hours.
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="font-medium mb-3">What happens next?</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Our verification team will review your documents within 1-3 business days
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    You'll receive an email notification once verification is complete
                  </li>
                  <li className="flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Once verified, you can create campaigns and start fundraising
                  </li>
                  <li className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Your verified badge will be displayed on your campaigns
                  </li>
                </ul>
              </div>

              <div className="text-center">
                <Button 
                  onClick={() => setLocation("/")}
                  className="bg-primary hover:bg-primary/90"
                  data-testid="button-return-home"
                >
                  Return to Dashboard
                </Button>
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

          {currentStep === 1 && (
            <Button
              onClick={() => {
                console.log("Continue button clicked. Current profileImageUrl:", profileImageUrl); // Debug log
                if (!profileImageUrl || profileImageUrl.trim() === "") {
                  toast({
                    title: "Profile Picture Required", 
                    description: "Please upload a profile picture before proceeding.",
                    variant: "destructive",
                  });
                  return;
                }
                console.log("Proceeding to step 2"); // Debug log
                setCurrentStep(2);
              }}
              data-testid="button-next-step"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {currentStep === 2 && (
            <Button
              type="submit"
              onClick={form.handleSubmit(onSubmit)}
              disabled={updateProfileMutation.isPending}
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? (
                "Saving..."
              ) : (
                <>
                  Save & Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}

          {currentStep === 3 && (
            <Button
              onClick={handleKycSubmit}
              disabled={submitKycMutation.isPending}
              data-testid="button-submit-kyc"
            >
              {submitKycMutation.isPending ? (
                "Submitting..."
              ) : (
                <>
                  Submit for Verification
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}