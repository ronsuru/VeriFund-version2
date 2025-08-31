import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ObjectUploader } from '@/components/ObjectUploader';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { supabase } from '@/supabaseClient';
import { 
  FileText, 
  Image, 
  Video, 
  Receipt, 
  FileCheck, 
  File, 
  Calendar,
  Star,
  Trash2,
  Plus,
  Upload,
  Loader2,
X,
  Eye,
  Flag} from 'lucide-react';

interface ProgressReport {
  id: string;
  campaignId: string;
  createdById: string;
  title: string;
  description: string | null;
  reportDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
  documents: ProgressReportDocument[];
  creditScore: {
    scorePercentage: number;
    completedDocumentTypes: string[];
    totalRequiredTypes: number;
  } | null;
}

interface CreatorRating {
  id: string;
  raterId: string;
  creatorId: string;
  campaignId: string;
  progressReportId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProgressReportDocument {
  id: string;
  progressReportId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  description: string | null;
  createdAt: string;
}

interface ProgressReportProps {
  campaignId: string;
  isCreator: boolean;
  campaignStatus?: string; // Add campaign status to check if uploads allowed
}

const ratingFormSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

type RatingFormData = z.infer<typeof ratingFormSchema>;

const reportFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().optional(),
  reportDate: z.string().min(1, 'Report date is required'),
});

const fraudReportSchema = z.object({
  reportType: z.string().min(1, 'Please select a report type'),
  description: z.string().min(10, 'Please provide at least 10 characters describing the issue'),
  evidence: z.any().optional(), // For file uploads
});

const documentTypes = [
  { value: 'image', label: 'Images', icon: Image, color: 'bg-blue-100 text-blue-800' },
  { value: 'video_link', label: 'Video Links', icon: Video, color: 'bg-purple-100 text-purple-800' },
  { value: 'official_receipt', label: 'Official Receipts', icon: Receipt, color: 'bg-green-100 text-green-800' },
  { value: 'acknowledgement_receipt', label: 'Acknowledgement Receipts', icon: FileCheck, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'expense_summary', label: 'Expense Summary', icon: FileText, color: 'bg-red-100 text-red-800' },
  { value: 'invoice', label: 'Invoices', icon: File, color: 'bg-orange-100 text-orange-800' },
  { value: 'contract', label: 'Contracts', icon: FileText, color: 'bg-indigo-100 text-indigo-800' },
  { value: 'other', label: 'Other Documents', icon: File, color: 'bg-gray-100 text-gray-800' },
];

export default function ProgressReport({ campaignId, isCreator, campaignStatus }: ProgressReportProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [showVideoLinkForm, setShowVideoLinkForm] = useState(false);
  const [isFraudReportModalOpen, setIsFraudReportModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [videoLinkUrls, setVideoLinkUrls] = useState<string[]>(['']);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [showRatingForm, setShowRatingForm] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [stagedFiles, setStagedFiles] = useState<{ uploadURL: string; name: string; size: number; type: string }[]>([]);
  const [isSubmittingFiles, setIsSubmittingFiles] = useState(false);
const [uploadedEvidenceFiles, setUploadedEvidenceFiles] = useState<{ url: string; name: string; size: number; type: string; file?: File }[]>([]);
  const [expandedDocumentTypes, setExpandedDocumentTypes] = useState<Set<string>>(new Set());  const form = useForm<z.infer<typeof reportFormSchema>>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      title: '',
      description: '',
      reportDate: new Date().toISOString().split('T')[0],
    },
  });

  // Fetch campaign data for panels
  const { data: campaign } = useQuery<any>({
    queryKey: ['/api/campaigns', campaignId],
  });

  // Fetch progress reports
  const { data: reports = [], isLoading, refetch } = useQuery<ProgressReport[]>({
    queryKey: ['/api/campaigns', campaignId, 'progress-reports'],
    staleTime: 0, // Force fresh data on every load
    gcTime: 0, // Don't cache the data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

// Debug logging for progress reports and documents
  useEffect(() => {
    console.log('🔍 ProgressReport Debug Info:', {
      campaignId,
      reportsCount: reports.length,
      reports: reports.map(report => ({
        id: report.id,
        title: report.title,
        documentsCount: report.documents?.length || 0,
        documents: report.documents?.map(doc => ({
          id: doc.id,
          fileName: doc.fileName,
          documentType: doc.documentType,
          fileUrl: doc.fileUrl
        })) || []
      }))
    });
  }, [reports, campaignId]);  // Force refetch on component mount to ensure fresh data
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Check if user has already rated this progress report
  const { data: userExistingRating } = useQuery({
    queryKey: ['/api/progress-reports', reports[0]?.id, 'ratings', 'user'],
queryFn: async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      const res = await apiRequest('GET', `/api/progress-reports/${reports[0]?.id}/ratings/user`);
      return res.json();
    },    enabled: isAuthenticated && !isCreator && !(user as any)?.isAdmin && !!reports[0]?.id,
  });

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: async (data: z.infer<typeof reportFormSchema>) => {
      return apiRequest('POST', `/api/campaigns/${campaignId}/progress-reports`, data);
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'progress-reports'] });
      toast({
        title: 'Progress report created',
        description: 'Your progress report has been created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: { 
      reportId: string; 
      documentType: string; 
      fileName: string; 
      fileUrl: string; 
      fileSize?: number; 
      mimeType?: string;
      description?: string; 
    }) => {
      // Validate required fields before making request
      if (!data.reportId || !data.documentType || !data.fileName || !data.fileUrl) {
        throw new Error('Missing required fields: reportId, documentType, fileName, and fileUrl are required');
      }

      console.log('🚀 Making API request with data:', {
        reportId: data.reportId,
        documentType: data.documentType,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
      });

      return apiRequest('POST', `/api/progress-reports/${data.reportId}/documents`, {
        documentType: data.documentType,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        description: data.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'progress-reports'] });
      // Don't show individual success toasts here - we'll show them in handleUploadComplete
    },
    onError: (error: Error) => {
      console.error('❌ Upload mutation error:', error);
      // Don't show individual error toasts here - we'll handle them in handleUploadComplete
    },
  });

  const handleUploadDocument = async (reportId: string, documentType: string) => {
    // Force fresh data before upload
    await refetch();
    console.log('🔍 Using report ID for upload:', reportId);
    console.log('📊 Current reports data:', reports);
    
    setSelectedReportId(reportId);
    setSelectedDocumentType(documentType);
    
    if (documentType === 'video_link') {
      setShowVideoLinkForm(true);
    } else {
      setIsUploadModalOpen(true);
    }
  };

  const fraudReportForm = useForm<z.infer<typeof fraudReportSchema>>({
    resolver: zodResolver(fraudReportSchema),
    defaultValues: {
      reportType: '',
      description: '',
    },
  });

  // Rating form
  const ratingForm = useForm<RatingFormData>({
    resolver: zodResolver(ratingFormSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  const submitFraudReportMutation = useMutation({
    mutationFn: async (data: z.infer<typeof fraudReportSchema>) => {
      console.log('🛡️ Submitting document fraud report with data:', data);
      console.log('📎 Evidence files:', uploadedEvidenceFiles);
      
      // Create FormData for multipart upload to match backend expectations
      const formData = new FormData();
      formData.append('reportType', data.reportType);
      formData.append('description', data.description);
      formData.append('documentId', selectedDocumentId || '');
      
// Add the missing IDs needed for the "Links Relevant to the Report" card
      formData.append('campaignId', campaignId);
      formData.append('reporterId', (user as any)?.id || '');
      
      // Get creator ID from campaign data if available
      if (campaign && 'creatorId' in campaign && campaign.creatorId) {
        formData.append('creatorId', campaign.creatorId);
        console.log('👤 Added creator ID:', campaign.creatorId);
      }
      
      // Add evidence files
      if (uploadedEvidenceFiles && uploadedEvidenceFiles.length > 0) {
        for (let i = 0; i < uploadedEvidenceFiles.length; i++) {
          const file = uploadedEvidenceFiles[i];
          if (file.file) {
            formData.append('evidence', file.file);
            console.log('📎 Added evidence file:', file.name);
          }
        }      }
      
      console.log('📝 FormData contents:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const response = await fetch('/api/fraud-reports', {
        method: 'POST',
        credentials: 'include',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},        body: formData, // Use FormData instead of JSON
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit fraud report');
      }

      return response.json();
    },
    onSuccess: () => {
      setIsFraudReportModalOpen(false);
      fraudReportForm.reset();
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep the community safe. We'll review your report.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting report",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReportDocument = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setIsFraudReportModalOpen(true);
    fraudReportForm.reset();
    setUploadedEvidenceFiles([]);
  };

  const onSubmitFraudReport = (data: z.infer<typeof fraudReportSchema>) => {
    submitFraudReportMutation.mutate({
      ...data,
      attachments: uploadedEvidenceFiles.map(file => file.url),
    });
  };

  // Evidence file upload handlers
  const handleEvidenceFileUploadComplete = (files: { uploadURL: string; name: string; size: number; type: string }[]) => {
    if (files.length === 0) return;
console.log('🔍 ObjectUploader completed with files:', files);
    
    const newFiles = files.map(file => ({
      url: file.uploadURL, // This should be the accessUrl like /public-objects/...      name: file.name,
      size: file.size,
      type: file.type
    }));
console.log('🔍 Processed evidence files:', newFiles);    setUploadedEvidenceFiles(prev => [...prev, ...newFiles]);
  };

  const removeEvidenceFile = (fileUrl: string) => {
    setUploadedEvidenceFiles(prev => prev.filter(file => file.url !== fileUrl));
  };

  // Simple file upload handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;

// Validate minimum files for images (allow single upload)
    if (selectedDocumentType === 'image' && selectedFiles.length < 1) {
      toast({
        title: 'No Photos Selected',
        description: 'Please upload at least 1 photo.',        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const formData = new FormData();
      
      // Debug: Log what we're about to send
      console.log('🔍 Frontend Debug - Files to upload:', {
        selectedFiles: selectedFiles.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        })),
        selectedDocumentType,
        selectedReportId
      });      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('documentType', selectedDocumentType);

// Debug: Log FormData contents
      console.log('🔍 Frontend Debug - FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (value && typeof value === 'object' && 'name' in value && 'size' in value && 'type' in value) {
          console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      console.log('🔍 Frontend Debug - About to send fetch request');
      
      const response = await fetch(`/api/progress-reports/${selectedReportId}/documents/upload`, {
        method: 'POST',
        // Remove credentials for file uploads as they can interfere with multipart/form-data
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        body: formData,
      });
      
      console.log('🔍 Frontend Debug - Fetch response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      toast({
        title: 'Files uploaded successfully',
        description: `${selectedFiles.length} file(s) uploaded`,
      });

      // Reset state
      setSelectedFiles([]);
      setIsUploadModalOpen(false);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'progress-reports'] });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type === 'application/pdf') return FileText;
    return File;
  };

  // Creator rating mutations
  const submitRatingMutation = useMutation({
    mutationFn: async (data: { progressReportId: string; rating: number; comment?: string }) => {
      return apiRequest(
        'POST',
        `/api/progress-reports/${data.progressReportId}/ratings`,
        {
          rating: data.rating,
          comment: data.comment,
        }
      );
    },
    onSuccess: () => {
      toast({
        title: "Rating submitted",
        description: "Thank you for rating this creator's progress report!",
      });
      setShowRatingForm(null);
      setSelectedRating(0);
      setRatingComment('');
      queryClient.invalidateQueries({ queryKey: ['/api/progress-reports', 'ratings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress-reports', showRatingForm, 'ratings', 'user'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmitRating = (data: RatingFormData) => {
    if (!showRatingForm) return;
    submitRatingMutation.mutate({ ...data, progressReportId: showRatingForm });
  };

  const handleGetUploadParameters = async () => {
    const { apiRequest } = await import('@/lib/queryClient');
    const response = await apiRequest('POST', '/api/objects/upload');
    const data = await response.json();
    console.log('🔍 Server upload response:', data);
    return {
      method: 'PUT' as const,
      url: data.url, // Server returns 'url', not 'uploadURL'
    };
  };

  // Helper function to normalize upload URL to object path
  const normalizeUploadUrl = (uploadUrl: string): string => {
    console.log('🔄 Normalizing URL:', uploadUrl);
    
    // Validate input
    if (!uploadUrl || typeof uploadUrl !== 'string') {
      console.error('❌ Invalid upload URL:', uploadUrl);
      return '';
    }

    try {
      const url = new URL(uploadUrl);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      console.log('📍 Path segments:', pathSegments);
      
      if (pathSegments.length >= 3) {
        // Keep the full bucket and object path structure for proper GCS access
        // From: /bucket-name/.private/uploads/uuid
        // To: /objects/bucket-name/.private/uploads/uuid
        const bucketName = pathSegments[0];
        const objectPath = pathSegments.slice(1).join('/'); // .private/uploads/uuid
        const normalizedPath = `/objects/${bucketName}/${objectPath}`;
        console.log('✅ Normalized path:', normalizedPath);
        
        // Validate the normalized path
        if (normalizedPath && normalizedPath.startsWith('/objects/')) {
          return normalizedPath;
        } else {
          console.error('❌ Invalid normalized path:', normalizedPath);
          return '';
        }
      }
      console.log('⚠️ Not enough path segments, cannot normalize');
      return '';
    } catch (error) {
      console.error('❌ Error normalizing upload URL:', error);
      return '';
    }
  };

  const handleUploadComplete = async (result: any) => {
    console.log('🎯 handleUploadComplete called with:', result);
    
    // Handle both Uppy result format and simple file array format
    const files = Array.isArray(result) ? result : result?.successful || [];
    console.log('📁 Processed files:', files);
    
    if (files.length > 0) {
      // For image uploads, validate minimum number
      if (selectedDocumentType === 'image' && files.length < 10) {
        toast({
          title: 'Minimum Photos Required',
          description: 'Please upload at least 10 photos for a photo album.',
          variant: 'destructive',
        });
        return;
      }

      // Validate that we have all required data
      if (!selectedReportId || !selectedDocumentType) {
        toast({
          title: 'Upload Error',
          description: 'Missing report or document type information.',
          variant: 'destructive',
        });
        return;
      }

      // Stage files and show submit button
      setStagedFiles(files);
      
      toast({
        title: 'Files Uploaded Successfully',
        description: `${files.length} file(s) uploaded. Click Submit to save them to your progress report.`,
      });
    }
  };

  const handleSubmitStagedFiles = async (filesToSubmit?: { uploadURL: string; name: string; size: number; type: string }[]) => {
    const files = filesToSubmit || stagedFiles;
    console.log('📋 handleSubmitStagedFiles called with:', { 
      filesToSubmit: filesToSubmit?.length, 
      stagedFiles: stagedFiles.length, 
      finalFiles: files.length 
    });
    
    if (files.length === 0) {
      console.log('❌ No files to submit, returning early');
      return;
    }

    setIsSubmittingFiles(true);

    try {
      // Process uploads sequentially to avoid race conditions
      for (let index = 0; index < files.length; index++) {
        const uploadedFile = files[index];
        const normalizedUrl = normalizeUploadUrl(uploadedFile.uploadURL);
        
        // Validate that we have all required fields
        if (!normalizedUrl || !uploadedFile.name) {
          console.error('❌ Missing required upload data:', {
            normalizedUrl,
            fileName: uploadedFile.name,
            reportId: selectedReportId,
            documentType: selectedDocumentType
          });
          continue; // Skip this file and continue with next
        }

        const fileName = selectedDocumentType === 'image' 
          ? `Photo ${index + 1}: ${uploadedFile.name}`
          : files.length > 1 ? `Document ${index + 1}: ${uploadedFile.name}` : uploadedFile.name;

        console.log('📤 Uploading file with data:', {
          reportId: selectedReportId,
          documentType: selectedDocumentType,
          fileName,
          fileUrl: normalizedUrl,
          fileSize: uploadedFile.size,
          mimeType: uploadedFile.type,
          originalUrl: uploadedFile.uploadURL,
        });

        // Wait for each upload to complete before proceeding to the next
        await new Promise<void>((resolve, reject) => {
          uploadDocumentMutation.mutate({
            reportId: selectedReportId!,
            documentType: selectedDocumentType,
            fileName,
            fileUrl: normalizedUrl,
            fileSize: uploadedFile.size,
            mimeType: uploadedFile.type,
          }, {
            onSuccess: () => {
              console.log(`✅ Successfully uploaded: ${fileName}`);
              resolve();
            },
            onError: (error) => {
              console.error(`❌ Failed to upload: ${fileName}`, error);
              reject(error);
            }
          });
        });
      }

      // Show success toast after all uploads complete
      toast({
        title: selectedDocumentType === 'image' ? 'Photo Album Uploaded' : 
              files.length > 1 ? 'Documents Uploaded' : 'Document Uploaded',
        description: selectedDocumentType === 'image' ? 
          `Successfully uploaded ${files.length} photos to your progress report.` :
          `Successfully uploaded ${files.length} ${files.length > 1 ? 'documents' : 'document'} to your progress report.`,
      });

      // Clear staged files and close modal after successful submission
      setStagedFiles([]);
      setIsUploadModalOpen(false);

      // Force refresh the progress reports to show new documents and updated credit scores
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'progress-reports'] });
      
      // Also refresh any credit score related queries  
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });

    } catch (error) {
      console.error('❌ Upload process failed:', error);
      toast({
        title: 'Upload Error',
        description: 'Some files failed to upload. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingFiles(false);
    }
  };

  const addVideoUrl = () => {
    const url = currentVideoUrl.trim();
    if (url && videoLinkUrls.length < 10) {
      if (isValidVideoUrl(url)) {
        setVideoLinkUrls([...videoLinkUrls, url]);
        setCurrentVideoUrl('');
        toast({
          title: 'Video Added',
          description: 'Video URL has been added to your album.',
        });
      } else {
        toast({
          title: 'Invalid Video URL',
          description: 'Please enter a valid video URL from supported platforms (YouTube, Facebook, TikTok, Instagram, Vimeo, etc.)',
          variant: 'destructive',
        });
      }
    }
  };

  const removeVideoUrl = (index: number) => {
    setVideoLinkUrls(videoLinkUrls.filter((_, i) => i !== index));
  };

  const handleVideoAlbumSubmit = async () => {
    const validUrls = videoLinkUrls.filter(url => url.trim() !== '');
    
    if (validUrls.length === 0) {
      toast({
        title: 'No Videos Added',
        description: 'Please add at least 1 video to create a video album.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedReportId) {
      validUrls.forEach((url, index) => {
        console.log('📤 Uploading video with data:', {
          reportId: selectedReportId,
          documentType: 'video_link',
          fileName: `Video ${index + 1}: ${url}`,
          fileUrl: url,
        });
        uploadDocumentMutation.mutate({
          reportId: selectedReportId,
          documentType: 'video_link',
          fileName: `Video ${index + 1}: ${url}`,
          fileUrl: url,
        });
      });
      
      // Force refresh the progress reports to show new video links and updated credit scores
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'progress-reports'] });
      
      toast({
        title: 'Video Album Uploaded',
        description: `Successfully added ${validUrls.length} videos to your progress report.`,
      });
      
      setShowVideoLinkForm(false);
      setVideoLinkUrls(['']);
      setCurrentVideoUrl('');
    }
  };

  const isValidVideoUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // YouTube patterns
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        return true;
      }
      
      // Facebook patterns
      if (hostname.includes('facebook.com') || hostname.includes('fb.watch')) {
        return true;
      }
      
      // TikTok patterns
      if (hostname.includes('tiktok.com') || hostname.includes('vm.tiktok.com')) {
        return true;
      }
      
      // Instagram patterns
      if (hostname.includes('instagram.com')) {
        return true;
      }
      
      // Vimeo patterns
      if (hostname.includes('vimeo.com')) {
        return true;
      }
      
      // Twitter/X patterns
      if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
        return true;
      }
      
      // LinkedIn patterns
      if (hostname.includes('linkedin.com')) {
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  };

  const getVideoEmbedInfo = (url: string): { embedUrl: string; platform: string; thumbnailUrl?: string } | null => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // YouTube
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        if (match) {
          return {
            embedUrl: `https://www.youtube.com/embed/${match[1]}`,
            platform: 'YouTube',
            thumbnailUrl: `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`
          };
        }
      }
      
      // Facebook
      if (hostname.includes('facebook.com') || hostname.includes('fb.watch')) {
        return {
          embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`,
          platform: 'Facebook'
        };
      }
      
      // TikTok
      if (hostname.includes('tiktok.com')) {
        return {
          embedUrl: `https://www.tiktok.com/embed/v2/${url.split('/')[5]}`,
          platform: 'TikTok'
        };
      }
      
      // Instagram
      if (hostname.includes('instagram.com')) {
        return {
          embedUrl: `${url}embed/`,
          platform: 'Instagram'
        };
      }
      
      // Vimeo
      if (hostname.includes('vimeo.com')) {
        const videoId = url.split('/').pop();
        return {
          embedUrl: `https://player.vimeo.com/video/${videoId}`,
          platform: 'Vimeo'
        };
      }
      
      // For other platforms, return generic info
      return {
        embedUrl: url,
        platform: 'Video'
      };
    } catch {
      return null;
    }
  };

  const getDocumentTypeInfo = (type: string) => {
    return documentTypes.find(dt => dt.value === type) || documentTypes[documentTypes.length - 1];
  };


  const onSubmit = (data: z.infer<typeof reportFormSchema>) => {
    createReportMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2 mt-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6" data-testid="progress-report-section">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Campaign creators can upload documentation to build trust and transparency
          </p>
        </div>
        <div className="flex gap-2">
        {isCreator && isAuthenticated && (
          <>
            {campaignStatus === 'on_progress' && (
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Progress Report</DialogTitle>
                  </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Week 1 Progress Update" 
                            {...field} 
                            data-testid="input-report-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of this report..." 
                            className="min-h-[80px]"
                            {...field} 
                            data-testid="textarea-report-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reportDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            data-testid="input-report-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createReportMutation.isPending}>
                      {createReportMutation.isPending ? 'Creating...' : 'Create Report'}
                    </Button>
                  </div>
                </form>
              </Form>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
        </div>
      </div>

      {reports && reports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No Progress Reports Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-500 mb-6">
              {isCreator 
                ? "Create your first progress report to build trust with contributors" 
                : "The campaign creator hasn't shared any progress reports yet"
              }
            </p>
            {isCreator && isAuthenticated && (
              <div className="flex justify-center">
                {campaignStatus === 'on_progress' ? (
                  <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2" data-testid="button-upload-progress-reports">
                        <Upload className="h-4 w-4" />
                        UPLOAD PROGRESS REPORTS
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Button 
                      disabled 
                      className="flex items-center gap-2 opacity-50 cursor-not-allowed" 
                      data-testid="button-upload-progress-reports-disabled"
                    >
                      <Upload className="h-4 w-4" />
                      UPLOAD PROGRESS REPORTS
                    </Button>
                    <p className="text-xs text-gray-500">
                      {campaignStatus === 'active' 
                        ? "Progress reports available once minimum operational amount is reached" 
                        : "Campaign must be active and funded to create progress reports"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {reports.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                {/* Combined Progress Report Details and Credit Score Panel */}
                <div className="grid grid-cols-1 gap-3 mb-4">
                  {/* Progress Report Details Panel */}
                  <div className="border-l-4 border-blue-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-r-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                      {reports[0].title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Report Date: {format(new Date(reports[0].reportDate), 'MMMM d, yyyy')}
                    </p>
                    {reports[0].description && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
                        {reports[0].description}
                      </p>
                    )}
                  </div>

                  {/* Credit Score Panel - Always show, with fallback data */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 bg-yellow-400 rounded-sm flex items-center justify-center">
                        <span className="text-xs text-yellow-800">⭐</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Credit Score</span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {reports[0].creditScore?.scorePercentage || 0}%
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${reports[0].creditScore?.scorePercentage || 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400">
                        Submit comprehensive documentation to improve your credit score and attract more contributors
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
                <CardContent>
                <div className="space-y-4">
                  {/* Document Status for Non-Creators */}
                  {!isCreator && (
                    <Card className="border-gray-200 dark:border-gray-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileCheck className="h-4 w-4" />
                          Documentation Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {documentTypes.map((docType) => {
                            const hasDocuments = reports[0].documents.some(doc => doc.documentType === docType.value);
                            const docCount = reports[0].documents.filter(doc => doc.documentType === docType.value).length;
                            const IconComponent = docType.icon;

                            return (
                              <div
                                key={docType.value}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md border ${
                                  hasDocuments 
                                    ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20' 
                                    : 'border-gray-200 bg-gray-50 text-gray-500 dark:bg-gray-800'
                                }`}
                              >
                                <IconComponent className={`h-4 w-4 ${hasDocuments ? 'text-green-600' : 'text-gray-400'}`} />
                                <span className="text-sm">{docType.label}</span>
                                {hasDocuments ? (
                                  <Badge variant="secondary" className="text-xs ml-1">
                                    {docCount} ✓
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-gray-400 ml-1">Not uploaded</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Documents List */}
                  {reports[0].documents.length > 0 && (
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Uploaded Documents</h4>
                        <div className="text-sm text-gray-500">
                          {reports[0].documents.length} file{reports[0].documents.length !== 1 ? 's' : ''} total
                        </div>
                      </div>
                      <div className="space-y-2">
                        {(() => {
// Debug logging for document grouping
                          console.log('🔍 Document Display Debug:', {
                            hasReports: !!reports[0],
                            reportId: reports[0]?.id,
                            documents: reports[0]?.documents || [],
                            documentsLength: reports[0]?.documents?.length || 0
                          });                          // Group documents by type
                          const groupedDocs = reports[0].documents.reduce((acc, doc) => {
                            if (!acc[doc.documentType]) {
                              acc[doc.documentType] = [];
                            }
                            acc[doc.documentType].push(doc);
                            return acc;
                          }, {} as Record<string, any[]>);

                          return Object.entries(groupedDocs).map(([docType, documents]) => {
                            const docTypeInfo = getDocumentTypeInfo(docType);
                            const IconComponent = docTypeInfo.icon;
                            
                            // For videos, show carousel with 2 videos visible at a time
                            if (docType === 'video_link') {
                              return (
                                <div key={docType} className="space-y-3">
                                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center gap-3 mb-3">
                                      <IconComponent className="h-4 w-4 text-gray-500" />
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                          Video Documentation ({documents.length} videos)
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Progress videos uploaded by the creator
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {/* Video Carousel with max 2 videos visible */}
                                    <div className="relative">
                                      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                                        {documents.map((document) => {
                                          const embedInfo = getVideoEmbedInfo(document.fileUrl);
                                          if (!embedInfo) return null;
                                          
                                          return (
                                            <div key={document.id} className="flex-shrink-0 w-80 space-y-2">
                                              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                                                <iframe
                                                  src={embedInfo.embedUrl}
                                                  title={document.fileName || `Video ${document.id}`}
                                                  className="w-full h-full"
                                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                  allowFullScreen
                                                />
                                              </div>
                                              <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                  {document.fileName || `Video ${document.id}`}
                                                </p>
                                                {!isCreator && isAuthenticated && (
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleReportDocument(document.id)}
                                                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                                    data-testid={`button-report-fraud-${document.id}`}
                                                  >
                                                    🚩 Report
                                                  </Button>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            
                            // For other document types, show in list format
                            return (
                              <div key={docType} className="space-y-2">
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <div className="flex items-center gap-3 mb-3">
                                    <IconComponent className="h-4 w-4 text-gray-500" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {docTypeInfo.label} ({documents.length} {documents.length === 1 ? 'file' : 'files'})
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Documentation and supporting evidence
                                      </p>
                                    </div>
                                  </div>
{/* Compact file grid layout with show more functionality */}
                                  {(() => {
                                    const maxVisibleFiles = 6;
                                    const isExpanded = expandedDocumentTypes.has(docType);
                                    const hasMoreFiles = documents.length > maxVisibleFiles;
                                    const visibleFiles = (hasMoreFiles && !isExpanded) ? documents.slice(0, maxVisibleFiles) : documents;
                                    
                                    return (
                                      <>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                          {visibleFiles.map((document) => (
                                      <div key={document.id} className="group relative bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg p-3 border shadow-sm transition-colors">
                                        {/* File info - more compact */}
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={document.fileName}>
                                              {document.fileName}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">                                              {document.fileSize && `${(document.fileSize / (1024 * 1024)).toFixed(1)} MB`}
                                            </p>
                                          </div>
                                        </div>
{/* Action buttons - compact horizontal layout */}
                                        <div className="flex items-center gap-2">                                          <Button
                                            size="sm"
                                            variant="outline"
                                            asChild
                                            data-testid={`button-view-file-${document.id}`}
className="flex-1 h-7 text-xs px-2 py-1"                                          >
                                            <a
                                              href={document.fileUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1"
                                            >
<Eye className="h-3 w-3" />
                                              View                                            </a>
                                          </Button>
                                          {isAuthenticated && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleReportDocument(document.id)}
className="h-7 w-7 p-0 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                              title="Report this file"
                                              data-testid={`button-report-fraud-${document.id}`}
                                            >
                                              <Flag className="h-3 w-3" />                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
</div>
                                    
                                        {/* Show More/Less button */}
                                        {hasMoreFiles && (
                                          <div className="col-span-full flex justify-center mt-3">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                setExpandedDocumentTypes(prev => {
                                                  const newSet = new Set(prev);
                                                  if (newSet.has(docType)) {
                                                    newSet.delete(docType);
                                                  } else {
                                                    newSet.add(docType);
                                                  }
                                                  return newSet;
                                                });
                                              }}
                                              className="text-sm px-4 py-2"
                                            >
                                              {isExpanded ? 'Show Less' : `Show ${documents.length - maxVisibleFiles} More Files`}
                                            </Button>
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>
                </CardContent>

                {/* Creator Rating Section for non-creators and non-admins */}
                {!isCreator && isAuthenticated && !(user as any)?.isAdmin && (
                  <Card className="mt-3 bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-yellow-800">
                          {userExistingRating ? 'Your Rating' : 'Rate this Progress Report'}
                        </h4>
                        <div className="flex items-center space-x-1 text-yellow-600">
                          <Star className="w-4 h-4" />
                          <span className="text-sm">Community Rating</span>
                        </div>
                      </div>
                      
                      {userExistingRating ? (
                        <div className="space-y-2">
                          <p className="text-sm text-yellow-700">
                            You have already rated this progress report.
                          </p>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star}
                                  className={`w-4 h-4 ${userExistingRating.rating >= star ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-yellow-700 font-medium">
                              {userExistingRating.rating}/5
                            </span>
                          </div>
                          {userExistingRating.comment && (
                            <div className="bg-white p-2 rounded border border-yellow-200">
                              <p className="text-sm text-gray-700">"{userExistingRating.comment}"</p>
                            </div>
                          )}
                          <p className="text-xs text-yellow-600 italic">
                            Thank you for your feedback! Ratings help improve campaign transparency.
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-yellow-700 mb-3">
                            Help the community by rating this creator's progress report quality and transparency.
                          </p>
                          
                            {showRatingForm === reports[0].id ? (
                            <div className="space-y-3">
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Button
                                    key={star}
                                    variant="ghost"
                                    size="sm"
                                    className={`p-1 h-auto ${selectedRating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                                    onClick={() => setSelectedRating(star)}
                                    data-testid={`star-${star}-report-${reports[0].id}`}
                                  >
                                    <Star className={`w-6 h-6 ${selectedRating >= star ? 'fill-current' : ''}`} />
                                  </Button>
                                ))}
                                <span className="ml-2 text-sm text-yellow-700">{selectedRating}/5</span>
                              </div>
                              
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-yellow-800">
                                  Comment (Optional)
                                </label>
                                <textarea
                                  value={ratingComment}
                                  onChange={(e) => setRatingComment(e.target.value)}
                                  placeholder="Share your thoughts about this progress report..."
                                  className="w-full p-2 border border-yellow-300 rounded text-sm resize-none"
                                  rows={3}
                                  data-testid={`textarea-comment-report-${reports[0].id}`}
                                />
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => onSubmitRating({ rating: selectedRating, comment: ratingComment })}
                                  disabled={selectedRating === 0 || submitRatingMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  data-testid={`button-submit-rating-${reports[0].id}`}
                                >
                                  {submitRatingMutation.isPending ? 'Submitting...' : 'Submit Rating'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setShowRatingForm(null);
                                    setSelectedRating(0);
                                    setRatingComment('');
                                  }}
                                  data-testid={`button-cancel-rating-${reports[0].id}`}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => setShowRatingForm(reports[0].id)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white"
                              data-testid={`button-rate-report-${reports[0].id}`}
                            >
                              <Star className="w-4 h-4 mr-1" />
                              Rate Creator
                            </Button>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Card>
            )}
          
        {/* Upload Documentation Panel for Creators - Moved outside the reports map to prevent duplication */}
        {isCreator && isAuthenticated && (campaignStatus === 'on_progress' || campaignStatus === 'active' || campaignStatus === 'cancelled') && (
          <Card className="mt-6 border-dashed border-2 border-gray-300 dark:border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Documentation for Latest Report
              </CardTitle>
              <CardDescription className="text-sm">
                Click any document type below to upload files and build transparency for your most recent progress report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {documentTypes.map((docType) => {
                  // Check if there are any reports and get the latest one
                  const latestReport = reports && reports.length > 0 ? reports[0] : null;
                  if (!latestReport) return null;
                  
                  const hasDocuments = latestReport.documents.some(doc => doc.documentType === docType.value);
                  const docCount = latestReport.documents.filter(doc => doc.documentType === docType.value).length;
                  const IconComponent = docType.icon;

                  return (
                    <Button
                      key={docType.value}
                      variant={hasDocuments ? "secondary" : "outline"}
                      size="sm"
                      className={`flex items-center gap-2 transition-all ${
                        hasDocuments 
                          ? 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/20' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => {
                        console.log('🎯 Button clicked - Report ID:', latestReport.id);
                        handleUploadDocument(latestReport.id, docType.value);
                      }}
                      data-testid={`button-upload-${docType.value}`}
                    >
                      <IconComponent className={`h-4 w-4 ${hasDocuments ? 'text-green-600' : 'text-gray-500'}`} />
                      <span className="text-sm">{docType.label}</span>
                      {hasDocuments && (
                        <Badge variant="secondary" className="text-xs ml-1">
                          {docCount}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Upload {selectedDocumentType && getDocumentTypeInfo(selectedDocumentType).label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedDocumentType === 'image' 
                ? 'Upload a photo album (minimum 10 photos, maximum 50 photos) to showcase your progress and build trust with contributors.'
                : 'Upload documents (minimum 1 file, maximum 50 files) to increase your credit score and build trust with contributors.'}
            </p>
            <div className="space-y-4">
              <input
                type="file"
                id="file-upload"
                multiple
                accept={selectedDocumentType === 'image' ? 'image/*' : '*'}
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {selectedDocumentType === 'image' 
                  ? 'Select Photos (10-50 photos)' 
                  : 'Select Files (1-50 files)'}
              </Button>
              
              {/* Show selected files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected Files ({selectedFiles.length}):</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <span className="truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSelectedFile(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    onClick={handleFileUpload}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload {selectedFiles.length} file(s)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
            
            {/* Submit Button - appears after files are uploaded */}
            {stagedFiles.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {stagedFiles.length} file(s) ready for submission
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-300">
                      Click Submit to add them to your progress report
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStagedFiles([])}
                      disabled={isSubmittingFiles}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleSubmitStagedFiles()}
                      disabled={isSubmittingFiles}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      {isSubmittingFiles ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Submit
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Album Form Dialog */}
      <Dialog open={showVideoLinkForm} onOpenChange={setShowVideoLinkForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Video Album</DialogTitle>
            <DialogDescription>
              Add video links from YouTube, Facebook, TikTok, Instagram, Vimeo, and other platforms to create a video album (minimum 1 video, maximum 10 videos).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Current Videos List */}
            {videoLinkUrls.filter(url => url.trim() !== '').length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Added Videos ({videoLinkUrls.filter(url => url.trim() !== '').length}/10):</label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {videoLinkUrls.map((url, index) => 
                    url.trim() !== '' && (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="flex-1 truncate text-sm">
                          {(() => {
                            const embedInfo = getVideoEmbedInfo(url);
                            if (embedInfo) {
                              return (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-9 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                                    {embedInfo.thumbnailUrl ? (
                                      <img 
                                        src={embedInfo.thumbnailUrl}
                                        alt="Video thumbnail"
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Video className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="truncate">Video {index + 1}</span>
                                    <span className="text-xs text-gray-500">{embedInfo.platform}</span>
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <span className="text-red-500">Invalid Video URL</span>
                              );
                            }
                          })()}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeVideoUrl(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
            
            {/* Add New Video */}
            {videoLinkUrls.length < 10 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Add Video URL
                </label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://youtube.com/watch?v=... or https://tiktok.com/... or https://facebook.com/..."
                    value={currentVideoUrl}
                    onChange={(e) => setCurrentVideoUrl(e.target.value)}
                    data-testid="input-video-url"
                    onKeyPress={(e) => e.key === 'Enter' && addVideoUrl()}
                  />
                  <Button
                    onClick={addVideoUrl}
                    disabled={!currentVideoUrl.trim() || videoLinkUrls.length >= 10}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowVideoLinkForm(false);
                  setVideoLinkUrls(['']);
                  setCurrentVideoUrl('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleVideoAlbumSubmit}
                disabled={videoLinkUrls.filter(url => url.trim() !== '').length === 0}
                data-testid="button-submit-video-album"
              >
                Add Video Album ({videoLinkUrls.filter(url => url.trim() !== '').length} videos)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fraud Report Modal */}
      <Dialog open={isFraudReportModalOpen} onOpenChange={setIsFraudReportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Report Document</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-2">
              Please help us maintain community safety by reporting suspicious or fraudulent documentation.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...fraudReportForm}>
            <form onSubmit={fraudReportForm.handleSubmit(onSubmitFraudReport)} className="space-y-4">
              <FormField
                control={fraudReportForm.control}
                name="reportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Report Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-report-type">
                          <SelectValue placeholder="Select reason for report" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fake_documents">Fake or Forged Documents</SelectItem>
                        <SelectItem value="misleading_info">Misleading Information</SelectItem>
                        <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                        <SelectItem value="spam">Spam or Irrelevant Content</SelectItem>
                        <SelectItem value="copyright_violation">Copyright Violation</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
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
                        placeholder="Please provide details about why you're reporting this document..."
                        className="min-h-[100px] resize-none"
                        data-testid="textarea-report-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Evidence File Upload Section */}
              <FormField
                control={fraudReportForm.control}
                name="evidence"
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
                        
<div className="space-y-3">
                          <input
                            type="file"
                            multiple
                            accept="image/*,application/pdf,.doc,.docx"
                            onChange={(event) => {
                              const files = Array.from(event.target.files || []);
                              setUploadedEvidenceFiles(prev => [
                                ...prev,
                                ...files.map(file => ({
                                  url: URL.createObjectURL(file), // Temporary preview URL
                                  name: file.name,
                                  size: file.size,
                                  type: file.type,
                                  file: file // Keep the actual file for upload
                                }))
                              ]);
                            }}
                            className="hidden"
                            id="evidence-upload"
                            data-testid="input-evidence-upload"
                          />
                          <Button
                            type="button"
                            onClick={() => document.getElementById('evidence-upload')?.click()}
                            className="w-full bg-lime-400 hover:bg-lime-500 text-gray-900 font-medium py-3 rounded-lg"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Upload className="w-4 h-4" />
                              <span>Upload Evidence Files</span>
                            </div>
                          </Button>
                        </div>                        {/* Display uploaded files with previews */}
                        {uploadedEvidenceFiles.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-700">Uploaded Evidence ({uploadedEvidenceFiles.length}):</p>
                            <div className="grid grid-cols-1 gap-3">
                              {uploadedEvidenceFiles.map((file, index) => {
                                const FileIcon = getFileIcon(file.type);
                                const isImage = file.type.startsWith('image/');
                                
                                return (
                                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                    {/* File Preview/Icon */}
                                    <div className="flex-shrink-0 w-12 h-12 bg-white border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                                      {isImage ? (
                                        <img 
                                          src={file.url} 
                                          alt={file.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            // Fallback to icon if image fails to load
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.nextElementSibling?.setAttribute('style', 'display: block');
                                          }}
                                        />
                                      ) : (
                                        <FileIcon className="w-6 h-6 text-gray-500" />
                                      )}
                                      {isImage && (
                                        <FileIcon className="w-6 h-6 text-gray-500" style={{ display: 'none' }} />
                                      )}
                                    </div>
                                    
                                    {/* File Info */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                                        {file.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {formatFileSize(file.size)} • {file.type.split('/')[0]}
                                      </p>
                                    </div>
                                    
                                    {/* Remove Button */}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeEvidenceFile(file.url)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                                      title="Remove file"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
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
                  onClick={() => setIsFraudReportModalOpen(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitFraudReportMutation.isPending} className="bg-red-500 hover:bg-red-600 px-6">
                  {submitFraudReportMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
