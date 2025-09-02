import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/supabaseClient";import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  TrendingUp, 
  DollarSign,
  FileText,
  ExternalLink,
  Shield,
  UserPlus,
  Flag,
  MessageSquare,
  BookOpen,
  Settings,
  Target,
  Star,
  Award,
  BarChart3,
  Crown,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  UserX,
  Heart,
  BarChart,
  Check,
  X,
  Camera,
  ThumbsUp,
  AlertTriangle,
  AlertCircle,
  User as UserIcon,
  Menu,
  UserCheck,
  Video,
  Image as ImageIcon,
  RotateCcw,
  Download,
  Loader2,
  Edit,
  Trash2,
  Plus,
  Paperclip,
CreditCard,
  List,
  Bell,
  ArrowLeft,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import Navigation from "@/components/navigation";import type { User } from "@shared/schema";
import { parseDisplayId, entityTypeMap, isStandardizedId, generateSearchSuggestions } from '@shared/idUtils';
import verifundLogoV2 from "@assets/VeriFund v2-03_1756102873849.png";
import { ObjectUploader } from "@/components/ObjectUploader";
import { DocumentViewer } from "@/components/DocumentViewer";
import ThemeConfiguratorButtonMount, { openThemeConfigurator } from "@/components/ThemeConfiguratorButton";// Real-time Admin Milestones Component
function AdminMilestones() {
  const { data: milestonesData, isLoading } = useQuery({
    queryKey: ['/api/admin/milestones'],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  const getIcon = (iconName: string) => {
    const icons = {
      CheckCircle,
      ThumbsUp,
      Users,
      Crown,
      Award,
      Clock
    };
    const IconComponent = icons[iconName as keyof typeof icons] || CheckCircle;
    return IconComponent;
  };

  const getBorderColor = (achieved: boolean, progress: number, target: number) => {
    if (achieved) return 'border-green-200 bg-green-50';
    if (progress > 0) return 'border-yellow-200 bg-yellow-50';
    return 'border-gray-200 bg-gray-50';
  };

  const getIconColor = (achieved: boolean, progress: number) => {
    if (achieved) return 'text-green-500';
    if (progress > 0) return 'text-yellow-500';
    return 'text-gray-400';
  };

  const getBadge = (achieved: boolean, progress: number, target: number) => {
    if (achieved) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
          ✓ Done
        </Badge>
      );
    }
    if (progress > 0) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs">
          {progress}/{target}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-500 text-xs">
        0/{target}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm animate-pulse">
              <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-12 h-5 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const milestones = milestonesData?.milestones || [];
  
  // Sort milestones: pending/in-progress first, then achieved at the end
  const sortedMilestones = [...milestones].sort((a, b) => {
    // First sort by achieved status (false first, true last)
    if (a.achieved !== b.achieved) {
      return a.achieved ? 1 : -1;
    }
    // Within same achievement status, sort by progress (higher progress first)
    return b.progress - a.progress;
  });

  return (
    <div className="h-full flex flex-col max-h-full">
      {/* Milestone List - Scrollable */}
      <div className="flex-1 overflow-y-auto pr-1 pb-2" style={{ maxHeight: 'calc(100% - 120px)' }}>
        <div className="space-y-3">
          {sortedMilestones.map((milestone: any) => {
            const IconComponent = getIcon(milestone.icon);
            return (
              <div 
                key={milestone.id}
                className={`flex items-start gap-3 p-3 rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md ${getBorderColor(milestone.achieved, milestone.progress, milestone.target)} ${milestone.achieved ? 'opacity-75' : ''}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <IconComponent className={`h-4 w-4 ${getIconColor(milestone.achieved, milestone.progress)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-xs leading-tight mb-1">{milestone.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{milestone.description}</p>
                  {milestone.progress > 0 && !milestone.achieved && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-yellow-500 h-1 rounded-full transition-all duration-300" 
                          style={{ width: `${(milestone.progress / milestone.target) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {getBadge(milestone.achieved, milestone.progress, milestone.target)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Stats Footer - Fixed at bottom */}
      {milestonesData?.stats && (
        <div className="mt-auto pt-3 border-t border-purple-100">
          <div className="p-3 bg-white rounded-lg border border-purple-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-3 w-3 text-purple-600" />
              <h4 className="font-medium text-gray-800 text-xs">Progress Summary</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>KYC: <span className="font-medium text-purple-600">{milestonesData.stats.kycVerifiedCount}</span></div>
              <div>Campaigns: <span className="font-medium text-purple-600">{milestonesData.stats.campaignsApprovedCount}</span></div>
              <div>Users: <span className="font-medium text-purple-600">{milestonesData.stats.totalUsersCount}</span></div>
              <div>Since: <span className="font-medium text-purple-600">{new Date(milestonesData.stats.adminSince).toLocaleDateString()}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// VeriFund Main Page Component - Admin Dashboard
function VeriFundMainPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    middleInitial: '',
    lastName: '',
    contactNumber: '',
    email: '',
    birthday: '',
    address: '',
    education: '',
    funFacts: ''
  });
  const queryClient = useQueryClient();
  
  const { data: analytics } = useQuery({
    queryKey: ['/api/admin/analytics'],
    retry: false,
  });

  // Initialize form data with user data
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: (user as any)?.firstName || '',
        middleInitial: (user as any)?.middleInitial || '',
        lastName: (user as any)?.lastName || '',
        contactNumber: (user as any)?.contactNumber || (user as any)?.phoneNumber || '',
        email: (user as any)?.email || '',
        birthday: (user as any)?.birthday ? new Date((user as any).birthday).toISOString().split('T')[0] : '',
        address: (user as any)?.address || '',
        education: (user as any)?.education || '',
        funFacts: (user as any)?.funFacts || ''
      });
    }
  }, [user]);

  // Profile picture upload handlers
  const handleGetProfilePictureUpload = async () => {
    const response = await apiRequest('POST', '/api/user/profile-picture/upload');
    const data = await response.json();
    return { method: 'PUT' as const, url: data.url };
  };

  const handleProfilePictureComplete = async (files: { uploadURL: string; name: string }[]) => {
    if (files.length === 0) return;
    
    try {
      const uploadURL = files[0].uploadURL;
      const response = await apiRequest('PUT', '/api/user/profile-picture', { profileImageUrl: uploadURL });
      const updatedUser = await response.json();
      
      // Avoid triggering rapid refetch loops; update local cache instead
      queryClient.setQueryData(['/api/auth/user'], (prev: any) => ({ ...(prev || {}), ...updatedUser }));
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Mutation to update profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      console.log('Submitting profile data:', data);
      const payload = {
        ...data,
        birthday: data.birthday ? data.birthday : null, // Keep as string, backend will handle conversion
        isProfileComplete: true
      };
      console.log('API payload:', payload);
      const response = await apiRequest('PUT', '/api/user/profile', payload);
      console.log('API response:', response);
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('Profile update successful:', data);
      // Update cached user; don't refetch to avoid loops
      queryClient.setQueryData(['/api/auth/user'], (prev: any) => ({ ...(prev || {}), ...data }));
      setShowCompleteProfile(false);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    console.log('Save button clicked, current profile data:', profileData);
    
    // Basic validation
    if (!profileData.firstName || !profileData.lastName || !profileData.email) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in first name, last name, and email before saving.",
        variant: "destructive",
      });
      return;
    }
    
    updateProfileMutation.mutate(profileData);
  };


  return (
    <div className="container mx-auto px-4 py-6 mt-24 space-y-8">
      {/* Top Section: Profile Info (Left) + Milestones (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Profile Info as Vertical Rectangle */}
        <Card className="flex flex-col" style={{
          aspectRatio: '3/4',
          borderRadius: '12px'
        }}>
          <CardHeader className="flex-shrink-0">
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pb-3">
            <div className="space-y-4">
            {/* Profile Picture & Tag */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={(user as any)?.profileImageUrl} />
                  <AvatarFallback className="text-lg">
                    {(user as any)?.firstName?.[0]}{(user as any)?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880} // 5MB
                  onGetUploadParameters={handleGetProfilePictureUpload}
                  onComplete={handleProfilePictureComplete}
                  buttonClassName="absolute -bottom-1 -right-1 h-6 w-6 rounded-full p-0 text-xs"
                >
                  <Camera className="h-3 w-3" />
                </ObjectUploader>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{(user as any)?.firstName} {(user as any)?.lastName}</h3>
                <Badge variant={(user as any)?.isAdmin ? "default" : (user as any)?.isManager ? "default" : "secondary"} className="mt-1">
                  {(user as any)?.isAdmin ? "Admin" : (user as any)?.isManager ? "Manager" : "Support"}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">Click camera to edit profile picture</p>
              </div>
            </div>
            
            {/* Complete/Edit Profile Link */}
            <div className="pt-2">
              <button
                onClick={() => setShowCompleteProfile(!showCompleteProfile)}
                className="text-blue-600 hover:text-blue-800 underline text-sm font-medium transition-colors"
                data-testid="button-complete-profile"
              >
                {(user as any)?.isProfileComplete ? "Edit Profile" : "Complete Profile"}
              </button>
            </div>

            {/* Complete Profile Form */}
            {showCompleteProfile && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-semibold text-sm mb-4 text-gray-800">Complete Your Profile Information</h4>
                <div className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                      <Input 
                        placeholder="Enter first name" 
                        value={profileData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="text-sm"
                        data-testid="input-first-name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Middle Initial <span className="text-gray-400">(optional)</span></label>
                      <Input 
                        placeholder="M.I." 
                        value={profileData.middleInitial}
                        onChange={(e) => handleInputChange('middleInitial', e.target.value)}
                        className="text-sm"
                        maxLength={2}
                        data-testid="input-middle-initial"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                      <Input 
                        placeholder="Enter last name" 
                        value={profileData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="text-sm"
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>

                  {/* Contact & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Contact Number</label>
                      <Input 
                        placeholder="+63 XXX XXX XXXX" 
                        value={profileData.contactNumber}
                        onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                        className="text-sm"
                        data-testid="input-contact-number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
                      <Input 
                        placeholder="email@example.com" 
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="text-sm"
                        data-testid="input-email"
                      />
                    </div>
                  </div>

                  {/* Birthday */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Birthday</label>
                    <Input 
                      type="date" 
                      value={profileData.birthday}
                      onChange={(e) => handleInputChange('birthday', e.target.value)}
                      className="text-sm"
                      data-testid="input-birthday"
                    />
                  </div>

                  {/* Complete Address */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Complete Address</label>
                    <Input 
                      placeholder="Street, Barangay, City, Province, ZIP Code" 
                      value={profileData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="text-sm"
                      data-testid="input-address"
                    />
                  </div>

                  {/* Education Background */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Education Background</label>
                    <Input 
                      placeholder="Degree, School/University, Year" 
                      value={profileData.education}
                      onChange={(e) => handleInputChange('education', e.target.value)}
                      className="text-sm"
                      data-testid="input-education"
                    />
                  </div>

                  {/* Fun Facts */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fun Facts about Me</label>
                    <Input 
                      placeholder="Share something interesting about yourself..." 
                      value={profileData.funFacts}
                      onChange={(e) => handleInputChange('funFacts', e.target.value)}
                      className="text-sm"
                      data-testid="input-fun-facts"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      className="text-xs" 
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs"
                      onClick={() => setShowCompleteProfile(false)}
                      data-testid="button-cancel-profile"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Basic Profile Details */}
            {!showCompleteProfile && (
              <div className="space-y-3 pt-4 border-t">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div><span className="font-medium text-gray-600">Full Name:</span> {(user as any)?.firstName} {(user as any)?.middleInitial ? `${(user as any).middleInitial}.` : ''} {(user as any)?.lastName}</div>
                  <div><span className="font-medium text-gray-600">Email:</span> {(user as any)?.email || 'Not specified'}</div>
                  <div><span className="font-medium text-gray-600">Contact:</span> {(user as any)?.contactNumber || (user as any)?.phoneNumber || 'Not specified'}</div>
                  <div><span className="font-medium text-gray-600">Birthday:</span> {(user as any)?.birthday ? new Date((user as any).birthday).toLocaleDateString() : 'Not specified'}</div>
                  <div><span className="font-medium text-gray-600">Address:</span> {(user as any)?.address || 'Not specified'}</div>
                  <div><span className="font-medium text-gray-600">Education:</span> {(user as any)?.education || 'Not specified'}</div>
                  <div><span className="font-medium text-gray-600">Fun Facts:</span> {(user as any)?.funFacts || 'Not specified'}</div>
                  <div><span className="font-medium text-gray-600">Join Date:</span> {(user as any)?.createdAt ? new Date((user as any).createdAt).toLocaleDateString() : 'Not specified'}</div>
                </div>
              </div>
            )}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Milestones Achievement */}
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 aspect-square w-full flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
            <CardTitle className="flex items-center gap-2 text-purple-800 text-base">
              <Star className="h-4 w-4 text-purple-600" />
              Milestones Achievement
            </CardTitle>
            <p className="text-xs text-purple-600 mt-1">Next goals appear first • Achieved goals at bottom</p>
          </CardHeader>
          <CardContent className="flex-1 pb-3 overflow-hidden">
            <AdminMilestones />
          </CardContent>
        </Card>
      </div>

      {/* Platform Analytics Overview Section */}
      <div className="w-full">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 border-2 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Platform Analytics Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* User Management Analytics */}
              <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <h5 className="font-semibold text-sm text-blue-800">User Management</h5>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verified Users</span>
                    <span className="font-medium text-blue-700">{analytics?.verifiedUsers || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Suspended Accounts</span>
                    <span className="font-medium text-red-600">{analytics?.suspendedUsers || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending KYC</span>
                    <span className="font-medium text-yellow-600">{analytics?.pendingKYC || '0'}</span>
                  </div>
                </div>
              </div>

              {/* Reports Analytics */}
              <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <h5 className="font-semibold text-sm text-green-800">Reports</h5>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volunteer Reports</span>
                    <span className="font-medium text-green-700">{analytics?.volunteerReports || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Creator Reports</span>
                    <span className="font-medium text-green-700">{analytics?.creatorReports || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fraud Reports</span>
                    <span className="font-medium text-red-600">{analytics?.fraudReports || '0'}</span>
                  </div>
                </div>
              </div>

              {/* Financial Analytics */}
              <div className="bg-white p-4 rounded-lg border border-emerald-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <h5 className="font-semibold text-sm text-emerald-800">Financial</h5>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deposits</span>
                    <span className="font-medium text-emerald-700">{analytics?.deposits || '₱0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Withdrawals</span>
                    <span className="font-medium text-emerald-700">{analytics?.withdrawals || '₱0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Contributions</span>
                    <span className="font-medium text-emerald-700">{analytics?.totalContributions || '₱0'}</span>
                  </div>
                </div>
              </div>

              {/* Platform Activity */}
              <div className="bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <h5 className="font-semibold text-sm text-purple-800">Activity</h5>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Campaigns</span>
                    <span className="font-medium text-purple-700">{analytics?.activeCampaigns || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tips Collected</span>
                    <span className="font-medium text-purple-700">{analytics?.totalTips || '₱0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Claims Processed</span>
                    <span className="font-medium text-purple-700">{analytics?.claimsProcessed || '0'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Real Platform Health Metrics */}
            <div className="mt-4 pt-4 border-t border-blue-100">
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    (analytics?.verifiedUsers || 0) > 0 && (analytics?.activeCampaigns || 0) >= 0 
                      ? 'bg-green-500' 
                      : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-gray-600">System Health: </span>
                  <span className={`font-medium ${
                    (analytics?.verifiedUsers || 0) > 0 && (analytics?.activeCampaigns || 0) >= 0
                      ? 'text-green-600' 
                      : 'text-yellow-600'
                  }`}>
                    {(analytics?.verifiedUsers || 0) > 0 && (analytics?.activeCampaigns || 0) >= 0 
                      ? 'Healthy' 
                      : 'Starting Up'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    (analytics?.activeCampaigns || 0) <= 10 
                      ? 'bg-green-500' 
                      : (analytics?.activeCampaigns || 0) <= 50 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                  }`}></div>
                  <span className="text-gray-600">Response Time: </span>
                  <span className={`font-medium ${
                    (analytics?.activeCampaigns || 0) <= 10 
                      ? 'text-green-600' 
                      : (analytics?.activeCampaigns || 0) <= 50 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                  }`}>
                    {(analytics?.activeCampaigns || 0) <= 10 
                      ? 'Fast' 
                      : (analytics?.activeCampaigns || 0) <= 50 
                        ? 'Normal' 
                        : 'Slow'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    (analytics?.verifiedUsers || 0) <= 50 
                      ? 'bg-green-500' 
                      : (analytics?.verifiedUsers || 0) <= 200 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                  }`}></div>
                  <span className="text-gray-600">Load: </span>
                  <span className={`font-medium ${
                    (analytics?.verifiedUsers || 0) <= 50 
                      ? 'text-green-600' 
                      : (analytics?.verifiedUsers || 0) <= 200 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                  }`}>
                    {(analytics?.verifiedUsers || 0) <= 50 
                      ? 'Light' 
                      : (analytics?.verifiedUsers || 0) <= 200 
                        ? 'Moderate' 
                        : 'Heavy'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboards Section - Below all other sections */}
      <div className="w-full">
        <AdminLeaderboards />
      </div>
    </div>
  );
}
// Real Admin Leaderboards Component
function AdminLeaderboards() {
  const { data: leaderboards, isLoading } = useQuery({
    queryKey: ['/api/admin/leaderboards'],
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base animate-pulse">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
                <div className="w-32 h-4 bg-gray-200 rounded"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="flex justify-between items-center text-sm py-1 animate-pulse">
                    <div className="w-24 h-3 bg-gray-200 rounded"></div>
                    <div className="w-8 h-3 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-0">
      
      {/* KYC Evaluations Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            🏆 Most KYC Evaluations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboards?.kycEvaluations?.length > 0 ? (
              leaderboards.kycEvaluations.map((admin: any, index: number) => (
                <div 
                  key={admin.id} 
                  className={`flex justify-between items-center text-sm py-1 px-2 rounded ${
                    admin.isCurrentUser ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <span className={`${admin.isCurrentUser ? 'font-medium text-blue-700' : 'text-gray-600'}`}>
                    #{index + 1} {admin.name}
                    {admin.isCurrentUser && ' (You)'}
                  </span>
                  <span className="font-medium">{admin.count}</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No KYC evaluations yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reports Accommodated Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            📋 Most Reports Accommodated
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboards?.reportsAccommodated?.length > 0 ? (
              leaderboards.reportsAccommodated.map((admin: any, index: number) => (
                <div 
                  key={admin.id} 
                  className={`flex justify-between items-center text-sm py-1 px-2 rounded ${
                    admin.isCurrentUser ? 'bg-green-50 border border-green-200' : ''
                  }`}
                >
                  <span className={`${admin.isCurrentUser ? 'font-medium text-green-700' : 'text-gray-600'}`}>
                    #{index + 1} {admin.name}
                    {admin.isCurrentUser && ' (You)'}
                  </span>
                  <span className="font-medium">{admin.count}</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                Report system coming soon
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fastest Resolve Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            ⚡ Fastest to Resolve Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboards?.fastestResolve?.length > 0 ? (
              leaderboards.fastestResolve.map((admin: any, index: number) => (
                <div 
                  key={admin.id} 
                  className={`flex justify-between items-center text-sm py-1 px-2 rounded ${
                    admin.isCurrentUser ? 'bg-purple-50 border border-purple-200' : ''
                  }`}
                >
                  <span className={`${admin.isCurrentUser ? 'font-medium text-purple-700' : 'text-gray-600'}`}>
                    #{index + 1} {admin.name}
                    {admin.isCurrentUser && ' (You)'}
                  </span>
                  <span className="font-medium">{admin.avgTime}</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                Report timing coming soon
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Shared Campaign Details Renderer - Used by both Campaign Management and My Works sections
const renderCampaignDetails = (campaign: any) => (
  <div className="mt-3 pt-3 border-t space-y-4">
    {/* Comprehensive Creator and Campaign Information */}
    <div className="bg-gray-50 rounded-lg p-4 space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Creator Information */}
        <div>
          <h4 className="font-semibold mb-3 text-green-700">Creator Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12">
<AvatarImage src={normalizeImageUrl(campaign.creator?.profileImageUrl)} />                <AvatarFallback>{campaign.creator?.firstName?.[0]}{campaign.creator?.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{campaign.creator?.firstName} {campaign.creator?.middleInitial && campaign.creator?.middleInitial + '. '}{campaign.creator?.lastName}</p>
                <p className="text-gray-600">{campaign.creator?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <strong>User ID:</strong>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                <span className="font-mono">{campaign.creator?.userDisplayId || (campaign.creator?.id?.slice(0, 8) + '...' + campaign.creator?.id?.slice(-4))}</span>
                {!campaign.creator?.userDisplayId && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(campaign.creator?.id);
                    }}
                    className="text-green-700 hover:text-green-900 text-xs underline ml-2"
                    title="Click to copy full User ID"
                  >
                    Copy ID
                  </button>
                )}
              </div>
            </div>
            <p><strong>Contact Number:</strong> {campaign.creator?.contactNumber || campaign.creator?.phoneNumber || 'Not provided'}</p>
            <p><strong>Address:</strong> {campaign.creator?.address || 'Not provided'}</p>
            <p><strong>Birthday:</strong> {campaign.creator?.birthday ? new Date(campaign.creator.birthday).toLocaleDateString() : 'Not provided'}</p>
            <p><strong>Registration Date:</strong> {campaign.creator?.createdAt ? new Date(campaign.creator.createdAt).toLocaleDateString() : 'N/A'}</p>
            <p><strong>KYC Status:</strong> <Badge variant={campaign.creator?.kycStatus === 'verified' ? 'default' : campaign.creator?.kycStatus === 'pending' ? 'secondary' : 'destructive'}>{campaign.creator?.kycStatus || 'pending'}</Badge></p>
          </div>
        </div>

        {/* Professional & Additional Information */}
        <div>
          <h4 className="font-semibold mb-3 text-blue-700">Professional Details</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Education:</strong> {campaign.creator?.education || 'Not provided'}</p>
            <p><strong>Profession:</strong> {campaign.creator?.profession || 'Not provided'}</p>
            <p><strong>Work Experience:</strong> {campaign.creator?.workExperience || 'Not provided'}</p>
            <p><strong>Organization Name:</strong> {campaign.creator?.organizationName || 'Not provided'}</p>
            <p><strong>Organization Type:</strong> {campaign.creator?.organizationType || 'Not provided'}</p>
            <p><strong>LinkedIn Profile:</strong> {campaign.creator?.linkedinProfile ? (<a href={campaign.creator.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Profile</a>) : 'Not provided'}</p>
            <p><strong>Fun Facts:</strong> {campaign.creator?.funFacts || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Account Activity & Platform Information */}
      <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
        <div>
          <h4 className="font-semibold mb-3 text-purple-700">Platform Activity</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span>Creator Rating:</span>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="font-medium">{campaign.creator?.creatorRating || '0.0'}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Credit Score:</span>
              <Badge variant="outline">{campaign.creator?.creditScore || '0'}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Reliability Score:</span>
              <Badge variant="outline">{campaign.creator?.reliabilityScore || '0'}</Badge>
            </div>
            <p><strong>Account Balance:</strong> ₱{parseFloat(campaign.creator?.pusoBalance || '0').toLocaleString()}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-orange-700">Verification Details</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Profile Complete:</strong> <Badge variant={campaign.creator?.isProfileComplete ? 'default' : 'secondary'}>{campaign.creator?.isProfileComplete ? 'Yes' : 'No'}</Badge></p>
            <p><strong>Email Verified:</strong> <Badge variant={campaign.creator?.emailVerified ? 'default' : 'secondary'}>{campaign.creator?.emailVerified ? 'Yes' : 'No'}</Badge></p>
            <p><strong>Phone Verified:</strong> <Badge variant={campaign.creator?.phoneVerified ? 'default' : 'secondary'}>{campaign.creator?.phoneVerified ? 'Yes' : 'No'}</Badge></p>
            <p><strong>Submitted:</strong> {campaign.creator?.createdAt ? new Date(campaign.creator.createdAt).toLocaleDateString() : 'N/A'}</p>
            {campaign.processedByAdmin && (
              <p><strong>Processed By:</strong> {campaign.processedByAdmin}</p>
            )}
            {campaign.processedAt && (
              <p><strong>Processed Date:</strong> {new Date(campaign.processedAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Campaign Details Section */}
    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
      <h4 className="font-semibold mb-3 text-blue-700 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Campaign Details
      </h4>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <p><strong>Campaign ID:</strong> {campaign.campaignDisplayId || (campaign.id.slice(0, 8) + '...' + campaign.id.slice(-4))}</p>
          <p><strong>Title:</strong> {campaign.title}</p>
          <p><strong>Category:</strong> <Badge variant="outline">{campaign.category || 'General'}</Badge></p>
          <p><strong>Status:</strong> <Badge variant={campaign.status === 'active' ? 'default' : campaign.status === 'pending' ? 'secondary' : 'outline'}>{campaign.status}</Badge></p>
          <p><strong>Goal Amount:</strong> ₱{parseFloat(campaign.goalAmount || '0').toLocaleString()}</p>
          <p><strong>Current Amount:</strong> ₱{parseFloat(campaign.currentAmount || '0').toLocaleString()}</p>
          <p><strong>Duration:</strong> {campaign.duration} days</p>
          <p><strong>Created:</strong> {new Date(campaign.createdAt).toLocaleDateString()}</p>
          <p><strong>TES Verified:</strong> <Badge variant={campaign.tesVerified ? 'default' : 'secondary'}>{campaign.tesVerified ? 'Yes' : 'No'}</Badge></p>
        </div>
        <div className="space-y-2 text-sm">
          <p><strong>Location:</strong> {[campaign.street, campaign.barangay, campaign.city, campaign.province].filter(Boolean).join(', ') || 'Not provided'}</p>
          <p><strong>Start Date:</strong> {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'Not set'}</p>
          <p><strong>End Date:</strong> {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Not set'}</p>
          <p><strong>Progress:</strong> 
            <span className="ml-2 font-semibold text-green-600">
              {campaign.goalAmount ? Math.round((campaign.currentAmount / campaign.goalAmount) * 100) : 0}%
            </span>
          </p>
          <p><strong>Contributors:</strong> {campaign.contributorsCount || 0}</p>
          {campaign.needsVolunteers && (
            <>
              <p><strong>Volunteer Slots:</strong> {campaign.volunteerSlots}</p>
              <p><strong>Slots Filled:</strong> {campaign.volunteerSlotsFilledCount || 0}</p>
            </>
          )}
        </div>
      </div>
      
      {/* Campaign Description */}
      <div className="mt-4 pt-4 border-t">
        <h5 className="font-medium mb-2 text-gray-700">Description</h5>
        <div className="bg-white p-3 rounded-lg border max-h-32 overflow-y-auto">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{campaign.description || 'No description provided'}</p>
        </div>
      </div>
    </div>

    {/* Processing Information */}
    {(campaign.status === 'active' || campaign.status === 'rejected' || campaign.status === 'on_progress' || campaign.claimedBy) && (
      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <h4 className="font-semibold mb-3 text-indigo-700">Processing Information</h4>
        <div className="space-y-2 text-sm">
          {campaign.status === 'active' && campaign.approvedBy && (
            <>
              <p><strong>Processed by:</strong> {campaign.approvedByEmail || campaign.approvedBy}</p>
              <p><strong>Approved date & time:</strong> {campaign.approvedAt ? new Date(campaign.approvedAt).toLocaleString() : 'Not available'}</p>
              <p><strong>Approval reason:</strong> {campaign.approvalReason || 'No reason provided'}</p>
            </>
          )}
          {campaign.status === 'rejected' && campaign.rejectedBy && (
            <>
              <p><strong>Processed by:</strong> {campaign.rejectedByEmail || campaign.rejectedBy}</p>
              <p><strong>Rejected date & time:</strong> {campaign.rejectedAt ? new Date(campaign.rejectedAt).toLocaleString() : 'Not available'}</p>
              <p><strong>Rejection reason:</strong> {campaign.rejectionReason || 'No reason provided'}</p>
            </>
          )}
          {campaign.claimedBy && (
            <p><strong>Claimed By:</strong> {campaign.claimedByEmail || campaign.claimedByName || campaign.claimedBy}</p>
          )}
          {campaign.claimedAt && (
            <p><strong>Claimed At:</strong> {new Date(campaign.claimedAt).toLocaleString()}</p>
          )}
        </div>
      </div>
    )}

    {/* Campaign Images */}
    {campaign.images && (
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <h4 className="font-semibold mb-3 text-green-700">Campaign Images</h4>
        <div className="grid grid-cols-2 gap-3">
          {(() => {
            try {
              const imageArray = JSON.parse(campaign.images);
              return Array.isArray(imageArray) ? imageArray : [campaign.images];
            } catch {
              return [campaign.images];
            }
          })().map((imageUrl: string, index: number) => (
            <div key={index} className="relative group">
              <img 
src={normalizeImageUrl(imageUrl)} 
                alt={`Campaign image ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border hover:opacity-80 transition-opacity cursor-pointer"
                onClick={() => window.open(normalizeImageUrl(imageUrl), '_blank')}              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">Click to view full size</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);
function normalizeImageUrl(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  // If already absolute URL
  if (/^https?:\/\//i.test(raw)) return raw;
  // If server proxy form
  if (raw.startsWith('/objects/') || raw.startsWith('/api/upload')) {
    return raw;
  }
  // If it's a Supabase Storage object path like "public/..." or "profiles/..."
  const bucket = (import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET || import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'verifund-assets';
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (url) {
    const path = raw.replace(/^\/+/, '');
    return `${url}/storage/v1/object/public/${bucket}/${path}`;
  }
  return raw;
}// My Works Section Component - Section 2
function MyWorksSection() {
  const [activeTab, setActiveTab] = useState("pending-kyc");
  const [completedTab, setCompletedTab] = useState("completed-kyc");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [loadingReportDetails, setLoadingReportDetails] = useState(false);
  const [claimedSuspendedUsers, setClaimedSuspendedUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simple handleViewReport function for MY WORK section  
  const handleViewReport = async (report: any) => {
    console.log('Opening report modal for MY WORK:', report);
    setSelectedReport(report);
    setShowReportModal(true);
    setLoadingReportDetails(true);
    
    try {
      let enhancedReport = { ...report };
      
      // Fetch campaign details if campaign ID is available
      const campaignId = report.campaignId || report.targetId;
      if (campaignId) {
        try {
const campaignResponse = await apiRequest('GET', `/api/campaigns/${campaignId}`);          if (campaignResponse.ok) {
            const campaignData = await campaignResponse.json();
            enhancedReport.campaign = campaignData;
          }
        } catch (error) {
          console.log('Campaign fetch error:', error);
        }
      }
      
      // Fetch creator details if creator ID is available  
      const creatorId = report.creatorId || enhancedReport.campaign?.creatorId;
      if (creatorId) {
        try {
const creatorResponse = await apiRequest('GET', `/api/admin/users/${creatorId}`);          if (creatorResponse.ok) {
            const creatorData = await creatorResponse.json();
            enhancedReport.creator = creatorData;
          }
        } catch (error) {
          console.log('Creator fetch error:', error);
        }
      }
      
      // Fetch reporter details if reporter ID is available
      if (report.reporterId) {
        try {
const reporterResponse = await apiRequest('GET', `/api/admin/users/${report.reporterId}`);          if (reporterResponse.ok) {
            const reporterData = await reporterResponse.json();
            enhancedReport.reporter = reporterData;
          }
        } catch (error) {
          console.log('Reporter fetch error:', error);
        }
      }
      
      setSelectedReport(enhancedReport);
    } catch (error) {
      console.error('Error enhancing report details:', error);
    } finally {
      setLoadingReportDetails(false);
    }
  };

  // Helper function to render creator details
  const renderCreatorDetails = (creator: any) => (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h5 className="font-semibold mb-4 text-blue-800">Complete Creator Profile</h5>
      
      {/* Main Profile Section */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={creator?.profileImageUrl} />
            <AvatarFallback className="text-lg">{creator?.firstName?.[0]}{creator?.lastName?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h6 className="text-lg font-semibold">{creator?.firstName} {creator?.middleInitial && creator?.middleInitial + '. '}{creator?.lastName}</h6>
            <p className="text-gray-600">{creator?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm"><strong>User ID:</strong></span>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                <span className="font-mono" data-testid={`creator-display-id-${creator?.id}`}>{creator?.userDisplayId || creator?.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="space-y-3">
          <h6 className="font-semibold text-green-700 border-b border-green-200 pb-1">Personal Information</h6>
          <div className="space-y-2 text-sm">
            <p><strong>Contact Number:</strong> {creator?.contactNumber || creator?.phoneNumber || 'Not provided'}</p>
            <p><strong>Address:</strong> {creator?.address || 'Not provided'}</p>
            <p><strong>Birthday:</strong> {creator?.birthday ? new Date(creator?.birthday).toLocaleDateString() : 'Not provided'}</p>
            <p><strong>Location:</strong> {creator?.location || 'Not provided'}</p>
            <p><strong>Languages:</strong> {creator?.languages || 'Not provided'}</p>
            <p><strong>Registration Date:</strong> {new Date(creator?.createdAt || Date.now()).toLocaleDateString()}</p>
            <p><strong>KYC Status:</strong> <Badge variant={creator?.kycStatus === 'verified' ? 'default' : creator?.kycStatus === 'pending' ? 'secondary' : 'destructive'}>{creator?.kycStatus || 'pending'}</Badge></p>
            {creator?.bio && (
              <div>
                <strong>Bio:</strong>
                <p className="text-gray-600 mt-1">{creator?.bio}</p>
              </div>
            )}
            {creator?.interests && (
              <div>
                <strong>Interests:</strong>
                <p className="text-gray-600 mt-1">{creator?.interests}</p>
              </div>
            )}
            {creator?.funFacts && (
              <div>
                <strong>Fun Facts:</strong>
                <p className="text-gray-600 mt-1">{creator?.funFacts}</p>
              </div>
            )}
          </div>
        </div>

        {/* Professional Information */}
        <div className="space-y-3">
          <h6 className="font-semibold text-blue-700 border-b border-blue-200 pb-1">Professional Details</h6>
          <div className="space-y-2 text-sm">
            <p><strong>Education:</strong> {creator?.education || 'Not provided'}</p>
            <p><strong>Profession:</strong> {creator?.profession || 'Not provided'}</p>
            <p><strong>Organization:</strong> {creator?.organizationName || 'Not provided'}</p>
            <p><strong>Organization Type:</strong> {creator?.organizationType || 'Not provided'}</p>
            {creator?.linkedinProfile && (
              <p><strong>LinkedIn:</strong> 
                <a href={creator?.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                  View Profile
                </a>
              </p>
            )}
            {creator?.workExperience && (
              <div>
                <strong>Work Experience:</strong>
                <p className="text-gray-600 mt-1">{creator?.workExperience}</p>
              </div>
            )}
            {creator?.workExperienceDetails && (
              <div>
                <strong>Work Experience Details:</strong>
                <p className="text-gray-600 mt-1">{creator?.workExperienceDetails}</p>
              </div>
            )}
            {creator?.skills && (
              <div>
                <strong>Skills:</strong>
                <p className="text-gray-600 mt-1">{creator?.skills}</p>
              </div>
            )}
            {creator?.certifications && (
              <div>
                <strong>Certifications:</strong>
                <p className="text-gray-600 mt-1">{creator?.certifications}</p>
              </div>
            )}
          </div>
        </div>

        {/* Platform Scores & Statistics */}
        <div className="space-y-3">
          <h6 className="font-semibold text-purple-700 border-b border-purple-200 pb-1">Platform Scores & Stats</h6>
          <div className="space-y-3 text-sm">
            <div className="bg-white p-3 rounded-lg border">
              <p className="font-medium mb-2">Credibility & Trust Scores</p>
              <div className="space-y-1">
                <p><strong>Credibility Score:</strong> 
                  <span className="text-lg font-semibold ml-2 text-purple-600">
                    {creator?.credibilityScore || '100.00'}
                  </span>
                </p>
                <p><strong>Social Score:</strong> 
                  <span className="ml-2 text-blue-600 font-semibold">
                    {creator?.socialScore || '0'} pts
                  </span>
                </p>
                <p><strong>Reliability Score:</strong> 
                  <span className="flex items-center gap-1 ml-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-semibold">{creator?.reliabilityScore || '0.00'}</span>
                    <span className="text-gray-500">({creator?.reliabilityRatingsCount || 0} ratings)</span>
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border">
              <p className="font-medium mb-2">Campaign Statistics</p>
              <div className="space-y-1">
                <p><strong>Campaigns Created:</strong> {creator?.campaignsCreated || 0}</p>
                <p><strong>Total Raised:</strong> ₱{creator?.totalRaised || '0'}</p>
                <p><strong>Campaign Chances Left:</strong> {creator?.remainingCampaignChances || 2}</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border">
              <p className="font-medium mb-2">Account Status</p>
              <div className="space-y-1">
                <p><strong>Account Status:</strong> 
                  <Badge variant={creator?.accountStatus === 'active' ? 'default' : 'destructive'} className="ml-2">
                    {creator?.accountStatus || 'active'}
                  </Badge>
                </p>
                <p><strong>Profile Complete:</strong> 
                  <Badge variant={creator?.isProfileComplete ? 'default' : 'secondary'} className="ml-2">
                    {creator?.isProfileComplete ? 'Yes' : 'No'}
                  </Badge>
                </p>
                {creator?.isFlagged && (
                  <div>
                    <p><strong>⚠️ Flagged:</strong> {creator?.flagReason}</p>
                    <p className="text-xs text-gray-500">Flagged on: {new Date(creator?.flaggedAt).toLocaleDateString()}</p>
                  </div>
                )}
                {creator?.isSuspended && (
                  <div>
                    <p><strong>🚫 Suspended:</strong> {creator?.suspensionReason}</p>
                    <p className="text-xs text-gray-500">Suspended on: {new Date(creator?.suspendedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border">
              <p className="font-medium mb-2">Wallet Balances</p>
              <div className="space-y-1">
                <p><strong>PHP Balance:</strong> ₱{creator?.phpBalance || '0.00'}</p>
                <p><strong>Tips Balance:</strong> ₱{creator?.tipsBalance || '0.00'}</p>
                <p><strong>Contributions Balance:</strong> ₱{creator?.contributionsBalance || '0.00'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper function to render user profile with all details
  const renderUserProfile = (user: any) => (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div>
          <h4 className="font-semibold mb-3 text-green-700">Personal Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.profileImageUrl} />
                <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.firstName} {user.middleInitial && user.middleInitial + '. '}{user.lastName}</p>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <strong>User ID:</strong>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                <span className="font-mono" data-testid={`user-display-id-${user.id}`}>
                  {user.userDisplayId || (user.id.slice(0, 8) + '...' + user.id.slice(-4))}
                </span>
                {!user.userDisplayId && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user.id);
                    }}
                    className="text-green-700 hover:text-green-900 text-xs underline ml-2"
                    title="Click to copy full User ID"
                  >
                    Copy ID
                  </button>
                )}
              </div>
            </div>
            <p><strong>Contact Number:</strong> {user.contactNumber || user.phoneNumber || user.phone || 'Not provided'}</p>
            <p><strong>Address:</strong> {user.address || 'Not provided'}</p>
            <p><strong>Birthday:</strong> {user.birthday ? new Date(user.birthday).toLocaleDateString() : user.dateOfBirth || 'Not provided'}</p>
            <p><strong>Registration Date:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
            <p><strong>KYC Status:</strong> <Badge variant={user.kycStatus === 'verified' ? 'default' : user.kycStatus === 'pending' ? 'secondary' : 'destructive'}>{user.kycStatus || 'pending'}</Badge></p>
          </div>
        </div>

        {/* Professional & Additional Information */}
        <div>
          <h4 className="font-semibold mb-3 text-blue-700">Professional Details</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Education:</strong> {user.education || 'Not provided'}</p>
            <p><strong>Profession:</strong> {user.profession || 'Not provided'}</p>
            <p><strong>Work Experience:</strong> {user.workExperience || 'Not provided'}</p>
            <p><strong>Organization Name:</strong> {user.organizationName || 'Not provided'}</p>
            <p><strong>Organization Type:</strong> {user.organizationType || 'Not provided'}</p>
            <p><strong>LinkedIn Profile:</strong> {user.linkedinProfile ? (<a href={user.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Profile</a>) : 'Not provided'}</p>
            <p><strong>Fun Facts:</strong> {user.funFacts || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Account Activity & Platform Information */}
      <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
        <div>
          <h4 className="font-semibold mb-3 text-purple-700">Platform Activity</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span>Creator Rating:</span>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="font-medium">{user.creatorRating || '0.0'}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Credit Score:</span>
              <Badge variant="outline">{user.creditScore || '0'}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Reliability Score:</span>
              <Badge variant="outline">{user.reliabilityScore || '0'}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Social Score:</span>
              <Badge variant="outline">{user.socialScore || '0'}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Contributions:</span>
              <span className="font-medium">₱{user.totalContributions || '0'}</span>
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div>
          <h4 className="font-semibold mb-3 text-green-700">Wallet & Transactions</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span>PHP Balance:</span>
              <span className="font-medium">₱{user.phpBalance || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center">
<span>Tips Balance:</span>
              <span className="font-medium">{user.tipsBalance || '0.00'} PHP</span>            </div>
            <div className="flex justify-between items-center">
              <span>Tips Balance:</span>
              <span className="font-medium">₱{user.tipsBalance || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Campaigns Created:</span>
              <Badge variant="outline">{user.campaignsCreated || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Contributions Made:</span>
              <Badge variant="outline">{user.contributionsMade || 0}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Documents */}
      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
        <h4 className="font-semibold mb-3 text-orange-700">KYC Verification Documents</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-3 bg-white">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">Government ID</p>
              {user.governmentIdUrl || user.government_id_url ? (
                <Badge variant="default" className="bg-green-100 text-green-800">Uploaded</Badge>
              ) : (
                <Badge variant="destructive" className="bg-red-100 text-red-800">Missing</Badge>
              )}
            </div>
            {user.governmentIdUrl || user.government_id_url ? (
              <div className="relative">
                <DocumentViewer 
                  document={{
                    id: 'government-id',
                    fileName: 'Government ID',
                    fileUrl: user.governmentIdUrl || user.government_id_url,
                    documentType: 'Government ID',
                    description: 'Official government-issued identification document'
                  }}
                  trigger={
                    <div className="cursor-pointer group">
                      <img 
                        src={user.governmentIdUrl || user.government_id_url} 
                        alt="Government ID" 
                        className="w-full h-32 object-cover rounded hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                        <Eye className="text-white opacity-0 group-hover:opacity-100 w-6 h-6" />
                      </div>
                    </div>
                  }
                />
                <div className="mt-2 flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open(user.governmentIdUrl || user.government_id_url, '_blank')}
                    className="text-xs"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View Full
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = user.governmentIdUrl || user.government_id_url;
                      link.download = 'government-id.jpg';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded flex flex-col items-center justify-center text-gray-500 border-2 border-dashed">
                <FileText className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No document uploaded</p>
                <p className="text-xs text-gray-400 mt-1">Required for KYC verification</p>
              </div>
            )}
          </div>
          <div className="border rounded-lg p-3 bg-white">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">Proof of Address</p>
              {user.proofOfAddressUrl || user.proof_of_address_url ? (
                <Badge variant="default" className="bg-green-100 text-green-800">Uploaded</Badge>
              ) : (
                <Badge variant="destructive" className="bg-red-100 text-red-800">Missing</Badge>
              )}
            </div>
            {user.proofOfAddressUrl || user.proof_of_address_url ? (
              <div className="relative">
                <DocumentViewer 
                  document={{
                    id: 'proof-of-address',
                    fileName: 'Proof of Address',
                    fileUrl: user.proofOfAddressUrl || user.proof_of_address_url,
                    documentType: 'Proof of Address',
                    description: 'Official document showing current address (utility bill, bank statement, etc.)'
                  }}
                  trigger={
                    <div className="cursor-pointer group">
                      <img 
                        src={user.proofOfAddressUrl || user.proof_of_address_url} 
                        alt="Proof of Address" 
                        className="w-full h-32 object-cover rounded hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                        <Eye className="text-white opacity-0 group-hover:opacity-100 w-6 h-6" />
                      </div>
                    </div>
                  }
                />
                <div className="mt-2 flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open(user.proofOfAddressUrl || user.proof_of_address_url, '_blank')}
                    className="text-xs"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View Full
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = user.proofOfAddressUrl || user.proof_of_address_url;
                      link.download = 'proof-of-address.jpg';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded flex flex-col items-center justify-center text-gray-500 border-2 border-dashed">
                <FileText className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No document uploaded</p>
                <p className="text-xs text-gray-400 mt-1">Required for KYC verification</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Document Actions */}
        <div className="mt-4 flex gap-2">
          <Button 
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => {
              toast({
                title: "Request Clarification",
                description: "A message has been sent to the user requesting clarification on their KYC documents.",
              });
            }}
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            Request Clarification
          </Button>
        </div>
      </div>

      {/* Processing Information */}
      {(user.kycStatus === 'verified' || user.kycStatus === 'rejected' || user.kycStatus === 'on_progress' || user.claimedBy || user.processedByAdmin || user.processed_by_admin) && (
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <h4 className="font-semibold mb-3 text-indigo-700">Processing Information</h4>
          <div className="space-y-2 text-sm">
            {user.kycStatus === 'verified' && (user.verifiedBy || user.approvedBy) && (
              <>
                <p><strong>Processed by:</strong> {user.verifiedByEmail || user.approvedByEmail || user.verifiedBy || user.approvedBy}</p>
                <p><strong>Verified date & time:</strong> {user.verifiedAt || user.approvedAt ? new Date(user.verifiedAt || user.approvedAt).toLocaleString() : 'Not available'}</p>
                <p><strong>Verification reason:</strong> {user.verificationReason || user.approvalReason || 'KYC documents verified successfully'}</p>
              </>
            )}
            {user.kycStatus === 'rejected' && (user.rejectedBy || user.processedBy) && (
              <>
                <p><strong>Processed by:</strong> {user.rejectedByEmail || user.processedByEmail || user.rejectedBy || user.processedBy}</p>
                <p><strong>Rejected date & time:</strong> {user.rejectedAt || user.processedAt ? new Date(user.rejectedAt || user.processedAt).toLocaleString() : 'Not available'}</p>
                <p><strong>Rejection reason:</strong> {user.rejectionReason || user.processedReason || 'KYC documents did not meet verification requirements'}</p>
              </>
            )}
            {(user.claimedBy || user.processedByAdmin || user.processed_by_admin) && (
              <>
                <p><strong>Claimed By:</strong> {user.claimedByEmail || user.claimedByName || user.processedByAdminEmail || user.processedByAdmin || user.processed_by_admin || user.claimedBy}</p>
                {(user.claimedAt || user.processedAt) && (
                  <p><strong>Claimed At:</strong> {new Date(user.claimedAt || user.processedAt).toLocaleString()}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Activity Summary */}
      <div>
        <h4 className="font-semibold mb-3">Activity Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <p className="font-medium">{user.campaignsCreated || 0}</p>
            <p className="text-gray-600">Campaigns Created</p>
          </div>
          <div className="text-center">
            <p className="font-medium">{user.contributionsMade || 0}</p>
            <p className="text-gray-600">Contributions Made</p>
          </div>
          <div className="text-center">
            <p className="font-medium">{user.volunteersJoined || 0}</p>
            <p className="text-gray-600">Volunteer Activities</p>
          </div>
          <div className="text-center">
            <p className="font-medium">{user.reportsSubmitted || 0}</p>
            <p className="text-gray-600">Reports Submitted</p>
          </div>
        </div>
      </div>
    </div>
  );
  
  const { data: analytics } = useQuery({
    queryKey: ['/api/admin/my-works/analytics'],
    retry: false,
  });

  const { data: claimedKyc = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/kyc-claimed'],
    retry: false,
  });

  const { data: claimedReports = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/documents'],
    retry: false,
  });

  const { data: claimedCampaignReports = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/campaign-reports'],
    retry: false,
  });

  const { data: claimedCampaigns = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/campaigns'],
    retry: false,
  });

  const { data: claimedCreatorReports = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/creators'],
    retry: false,
  });

  const { data: claimedVolunteerReports = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/volunteers'],
    retry: false,
  });

  const { data: claimedTransactionReports = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/transactions'],
    retry: false,
  });

  const { data: allSuspendedUsers = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/users/suspended'],
    retry: false,
  });

  // Filter suspended users to show only those claimed by current admin
  const claimedSuspendedUsersData = allSuspendedUsers.filter((user: any) => 
    user.claimedBy && user.claimedBy !== null
  );

  // Completed Works Queries
  const { data: completedKyc = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/kyc-completed'],
    retry: false,
  });

  const { data: completedDocuments = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/documents-completed'],
    retry: false,
  });

  const { data: completedCampaigns = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/campaigns-completed'],
    retry: false,
  });

  const { data: completedVolunteers = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/volunteers-completed'],
    retry: false,
  });

  const { data: completedCreators = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/creators-completed'],
    retry: false,
  });

  const { data: completedSuspendedUsers = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/suspended-completed'],
    retry: false,
  });

  // Query for reported campaigns that have been approved/rejected
  const { data: reportedCampaigns = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/reports/campaigns/completed'],
    retry: false,
  });

  // Mutation for reactivating suspended users
  const reactivateSuspendedUserMutation = useMutation({
    mutationFn: async (userId: string) => {
const response = await apiRequest('POST', `/api/admin/users/${userId}/reactivate`);      return response.json();
    },
    onSuccess: (data, userId) => {
      toast({
        title: "Success",
        description: "User has been successfully reactivated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/suspended"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/my-works/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/my-works/suspended-completed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/verified"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to reactivate user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for reassigning suspended users
  const reassignSuspendedUserMutation = useMutation({
    mutationFn: async (userId: string) => {
const response = await apiRequest('POST', `/api/admin/users/${userId}/reassign`);      return response.json();
    },
    onSuccess: (data, userId) => {
      toast({
        title: "Success",
        description: "User has been successfully reassigned for review.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/suspended"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/my-works/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/my-works/suspended-completed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/verified"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to reassign user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Enhanced badge component with color coding
  const getStatusBadge = (status: string, type: 'kyc' | 'campaign' | 'report' = 'report') => {
    const statusLower = status?.toLowerCase().replace('_', '_') || '';
    
    // Color mapping based on status - Yellow for pending/in progress
    if (statusLower === 'pending' || statusLower === 'on_progress' || statusLower === 'claimed') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">{status}</Badge>;
    }
    // Green for success states
    if (statusLower === 'approved' || statusLower === 'verified' || statusLower === 'resolved' || statusLower === 'completed' || statusLower === 'active') {
      return <Badge className="bg-green-100 text-green-800 border-green-300">{status}</Badge>;
    }
    // Red for negative states
    if (statusLower === 'rejected' || statusLower === 'declined' || statusLower === 'failed' || statusLower === 'suspended' || statusLower === 'flagged') {
      return <Badge className="bg-red-100 text-red-800 border-red-300">{status}</Badge>;
    }
    // Blue for closed/ended states
    if (statusLower === 'closed' || statusLower === 'closed_with_refund' || statusLower === 'ended') {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">{status}</Badge>;
    }
    // Default gray
    return <Badge className="bg-gray-100 text-gray-700 border-gray-300">{status}</Badge>;
  };

  // Sort function to prioritize pending reports
  const sortByPriority = (items: any[]) => {
    return [...items].sort((a, b) => {
      const statusA = (a.status || a.kycStatus || '').toLowerCase();
      const statusB = (b.status || b.kycStatus || '').toLowerCase();
      
      // Priority order: pending/in_progress -> flagged -> others
      const getPriority = (status: string) => {
        if (status === 'pending' || status === 'on_progress') return 1;
        if (status === 'flagged' || status === 'claimed') return 2;
        if (status === 'rejected' || status === 'failed') return 3;
        return 4;
      };
      
      const priorityA = getPriority(statusA);
      const priorityB = getPriority(statusB);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Secondary sort by creation date (newest first)
      const dateA = new Date(a.createdAt || a.claimedAt || 0).getTime();
      const dateB = new Date(b.createdAt || b.claimedAt || 0).getTime();
      return dateB - dateA;
    });
  };

  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    type: 'approve' | 'reject' | null;
    itemId: string;
    itemType: 'kyc' | 'campaign' | 'report';
    reason: string;
    customReason: string;
  }>({
    open: false,
    type: null,
    itemId: '',
    itemType: 'kyc',
    reason: '',
    customReason: ''
  });
  const approvalReasons = {
    approve: {
      kyc: [
        "All documents verified and authentic",
        "Identity confirmed through verification process",
        "Meets all KYC requirements",
        "Additional verification completed successfully"
      ],
      campaign: [
        "Campaign meets all platform guidelines",
        "Legitimate fundraising purpose confirmed",
        "Creator verification completed",
        "All required documentation provided"
      ],
      report: [
        "Report reviewed and approved by admin",
        "Investigation completed - marking as resolved",
        "Administrative review completed successfully",
        "Report processed and closed"
      ]
    },
    reject: {
      kyc: [
        "Invalid or fraudulent documents submitted",
        "Identity verification failed",
        "Incomplete documentation provided",
        "Suspicious activity detected",
        "Does not meet platform requirements"
      ],
      campaign: [
        "Violates platform community guidelines",
        "Insufficient or misleading information",
        "Duplicate or spam campaign",
        "Inappropriate content or purpose",
        "Missing required documentation"
      ],
      report: [
        "Report reviewed and rejected by admin",
        "Insufficient evidence to proceed",
        "Report does not meet investigation criteria",
        "Administrative review - no action needed"
      ]
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Helper functions for file type detection
  const getFileTypeFromUrl = (url: string): string => {
    if (!url) return 'Unknown';
    const extension = url.split('.').pop()?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'Image';
    if (['pdf'].includes(extension)) return 'PDF';
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) return 'Video';
    if (['doc', 'docx'].includes(extension)) return 'Word Document';
    if (['xls', 'xlsx'].includes(extension)) return 'Excel Document';
    if (['ppt', 'pptx'].includes(extension)) return 'PowerPoint';
    
    return extension.toUpperCase() || 'Unknown';
  };

  const isImageFile = (url: string): boolean => {
    if (!url) return false;
    const extension = url.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);
  };

  const isPdfFile = (url: string): boolean => {
    if (!url) return false;
    const extension = url.split('.').pop()?.toLowerCase() || '';
    return extension === 'pdf';
  };

  const isVideoFile = (url: string): boolean => {
    if (!url) return false;
    const extension = url.split('.').pop()?.toLowerCase() || '';
    return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension);
  };

  // Separate component for report details to handle hooks properly
  const ReportDetails = ({ report }: { report: any }) => {
    // Fetch complete campaign details if related to campaign
    const { data: campaignDetails } = useQuery({
      queryKey: ['/api/campaigns', report.relatedId],
      enabled: !!report.relatedId && (report.relatedType === 'campaign' || report.campaignId),
    });

    // Fetch complete creator details if related to creator  
    const { data: creatorDetails } = useQuery({
      queryKey: ['/api/users', report.creatorId || report.relatedId],
      enabled: !!report.creatorId || (!!report.relatedId && report.relatedType === 'creator'),
    });

    // Fetch complete reporter profile
    const { data: reporterDetails } = useQuery({
      queryKey: ['/api/users', report.reporterId],
      enabled: !!report.reporterId,
    });

    // Fetch volunteer details if this is a volunteer report
    const { data: volunteerDetails } = useQuery({
      queryKey: ['/api/users', report.volunteerId || report.relatedId],
      enabled: !!report.volunteerId || (!!report.relatedId && report.relatedType === 'volunteer'),
    });

    return (
      <div className="mt-4 space-y-4">
        {/* Report Information - Standardized Format */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Report ID Section */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="text-sm font-medium text-gray-500">Report ID</label>
                  <p className="text-sm font-mono text-gray-900">{report.reportId || report.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge variant={report.status === 'pending' ? 'destructive' : report.status === 'resolved' ? 'default' : 'outline'}>
                      {report.status || 'pending'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Type and Date Section */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="text-sm font-medium text-gray-500">Report Type</label>
                  <p className="text-sm text-gray-900">{report.reportType || report.type || 'General Report'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date Created</label>
                  <p className="text-sm text-gray-900">{report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Report Reason Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Report Reason</label>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-sm text-gray-900">{report.reason || report.description || 'No reason provided'}</p>
              </div>
            </div>
            
            {/* Evidence Files Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Evidence Files</label>
              <div className="border rounded-lg">
                {report.evidenceUrls && report.evidenceUrls.length > 0 ? (
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-gray-600">
                      {report.evidenceUrls.length} file{report.evidenceUrls.length > 1 ? 's' : ''} uploaded by reporter
                    </p>
                    {report.evidenceUrls.map((url: string, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">Evidence File {index + 1}</p>
                            <p className="text-xs text-blue-600">Attachment provided by reporter</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-blue-300 text-blue-700 hover:bg-blue-100"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(url, '_blank');
                          }}
                          data-testid={`button-view-evidence-${index}`}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Paperclip className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No evidence files attached</p>
                  </div>
                )}
              </div>
            </div>
            
            {report.details && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Additional Details</label>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="text-sm text-gray-900">{report.details}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Links Relevant to the Report Card - Exact match to Reports Management modal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Links Relevant to the Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Campaign Card */}
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Campaign</p>
                    <p className="text-xs text-gray-500">Access campaign details</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // For campaign reports, relatedId contains the campaign ID when relatedType is 'campaign'
                    let campaignId = null;
                    
                    if (report.relatedType === 'campaign' && report.relatedId) {
                      campaignId = report.relatedId;
                    } else if (report.campaign?.id) {
                      // For enriched reports that have campaign object attached
                      campaignId = report.campaign.id;
                    } else if (report.campaignId) {
                      // Direct campaign ID field
                      campaignId = report.campaignId;
                    }
                    
                    if (campaignId) {
                      window.open(`/campaigns/${campaignId}`, '_blank');
                    } else {
                      alert('This report is not related to a campaign or campaign ID is not available.');
                    }
                  }}
                  data-testid="link-campaign"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>

              {/* Reporter Card */}
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Reporter</p>
                    <p className="text-xs text-gray-500">User who filed this report</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const reporterId = report.reporterId || 
                                     report.reporter?.id;
                    if (reporterId) {
                      window.open(`/admin/users/${reporterId}`, '_blank');
                    } else {
                      alert('No reporter ID found in this report.');
                    }
                  }}
                  data-testid="link-reporter"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>

              {/* Creator Card */}
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <UserIcon className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Creator</p>
                    <p className="text-xs text-gray-500">View campaign creator profile</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const creatorId = report.campaign?.creatorId || 
                                    report.creatorId ||
                                    report.targetId ||
                                    report.relatedId;
                    if (creatorId) {
                      window.open(`/admin/users/${creatorId}`, '_blank');
                    } else {
                      alert('No creator ID found in this report.');
                    }
                  }}
                  data-testid="link-creator"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>

              {/* Document Card - Only show for document-related reports */}
              {(report.documentId || report.relatedType === 'document') && (
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">Reported Document</p>
                      <p className="text-xs text-gray-500">View the document being reported</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Handle document viewing - this should navigate to the actual document
                      const documentId = report.documentId || report.relatedId;
                      if (documentId) {
                        window.open(`/documents/${documentId}`, '_blank');
                      } else {
                        alert('Document ID not found.');
                      }
                    }}
                    data-testid="link-document"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              )}


            </div>
          </CardContent>
        </Card>

        {/* Admin Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => openApprovalDialog('approve', report.id, 'report')}
                data-testid="button-approve-report"
                disabled={report.status === 'resolved' || report.status === 'approved'}
              >
                <Check className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button 
                size="sm"
                variant="destructive"
                onClick={() => openApprovalDialog('reject', report.id, 'report')}
                data-testid="button-reject-report"
                disabled={report.status === 'resolved' || report.status === 'rejected'}
              >
                <X className="w-4 h-4 mr-1" />
                Reject
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => handleEscalateReport(report.id)}
                data-testid="button-escalate-report"
                disabled={report.status === 'escalated'}
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                Escalate
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => handleReassignReport(report.id)}
                data-testid="button-reassign-report"
              >
                <UserX className="w-4 h-4 mr-1" />
                Reassign
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const openApprovalDialog = (type: 'approve' | 'reject', itemId: string, itemType: 'kyc' | 'campaign' | 'report') => {
    setApprovalDialog({
      open: true,
      type,
      itemId,
      itemType,
      reason: '',
      customReason: ''
    });
  };

  const closeApprovalDialog = () => {
    setApprovalDialog({
      open: false,
      type: null,
      itemId: '',
      itemType: 'kyc',
      reason: '',
      customReason: ''
    });
  };

  // Approval/Rejection mutations
  const approveItemMutation = useMutation({
    mutationFn: async ({ itemId, itemType, reason }: { itemId: string; itemType: string; reason: string }) => {
      console.log("🚀 Admin Page: Starting approval for:", { itemId, itemType, reason });
      let endpoint;
      if (itemType === 'kyc') {
        endpoint = `/api/admin/kyc/${itemId}/approve`;
      } else if (itemType === 'campaign') {
        endpoint = `/api/admin/campaigns/${itemId}/approve`;
      } else if (itemType === 'report') {
        endpoint = `/api/admin/reports/${itemId}/approve`;
      } else {
        throw new Error(`Unknown item type: ${itemType}`);
      }
      console.log("📍 Admin Page: Calling endpoint:", endpoint);
      try {
        const response = await apiRequest('POST', endpoint, { reason });
        console.log("✅ Admin Page: Approval successful:", response);
        return response;
      } catch (error) {
        console.error("❌ Admin Page: Approval failed:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Approved Successfully",
        description: "The request has been approved.",
      });
      // Invalidate all related queries based on item type
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/kyc-claimed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/campaign-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/campaigns-completed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/documents-completed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/volunteers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/volunteers-completed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/creators'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/creators-completed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/reports-claimed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns/rejected'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports/campaigns/completed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports/document'] });
      closeApprovalDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: "Failed to approve the request. Please try again.",
        variant: "destructive",
      });
    }
  });

  const rejectItemMutation = useMutation({
    mutationFn: async ({ itemId, itemType, reason }: { itemId: string; itemType: string; reason: string }) => {
      console.log("🚀 Admin Page: Starting rejection for:", { itemId, itemType, reason });
      let endpoint;
      if (itemType === 'kyc') {
        endpoint = `/api/admin/kyc/${itemId}/reject`;
      } else if (itemType === 'campaign') {
        endpoint = `/api/admin/campaigns/${itemId}/reject`;
      } else if (itemType === 'report') {
        endpoint = `/api/admin/reports/${itemId}/reject`;
      } else {
        throw new Error(`Unknown item type: ${itemType}`);
      }
      console.log("📍 Admin Page: Calling endpoint:", endpoint);
      try {
        const response = await apiRequest('POST', endpoint, { reason });
        console.log("✅ Admin Page: Rejection successful:", response);
        return response;
      } catch (error) {
        console.error("❌ Admin Page: Rejection failed:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Rejected Successfully",
        description: "The request has been rejected.",
      });
      // Invalidate all related queries based on item type
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/kyc-claimed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/campaign-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/campaigns-completed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/documents-completed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/volunteers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/volunteers-completed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/creators'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/creators-completed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/reports-claimed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns/rejected'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports/campaigns/completed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports/document'] });
      closeApprovalDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: "Failed to reject the request. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleApprovalSubmit = () => {
    console.log("🖱️ Admin Page: Approval submit button clicked");
    console.log("📋 Admin Page: Current approval dialog state:", approvalDialog);
    
    const finalReason = approvalDialog.reason === 'custom' ? approvalDialog.customReason : approvalDialog.reason;
    console.log("📝 Admin Page: Final reason:", finalReason);
    
    if (!finalReason.trim()) {
      console.log("⚠️ Admin Page: No reason provided, showing error toast");
      toast({
        title: "Reason Required",
        description: "Please select or enter a reason for your decision.",
        variant: "destructive",
      });
      return;
    }

    if (approvalDialog.type === 'approve') {
      approveItemMutation.mutate({
        itemId: approvalDialog.itemId,
        itemType: approvalDialog.itemType,
        reason: finalReason
      });
    } else {
      rejectItemMutation.mutate({
        itemId: approvalDialog.itemId,
        itemType: approvalDialog.itemType,
        reason: finalReason
      });
    }
  };

  // Functions for handling escalate and reassign actions
  const handleEscalateReport = async (reportId: string) => {
    try {
      await apiRequest('POST', `/api/admin/reports/${reportId}/escalate`, {
        reason: 'Report escalated for senior review'
      });
      toast({
        title: "Report Escalated",
        description: "The report has been escalated to senior administrators.",
      });
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/creators'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/volunteers'] });
    } catch (error) {
      toast({
        title: "Escalation Failed",
        description: "Failed to escalate the report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReassignReport = async (reportId: string) => {
    try {
      await apiRequest('POST', `/api/admin/reports/${reportId}/reassign`, {
        reason: 'Report reassigned to another administrator'
      });
      toast({
        title: "Report Reassigned",
        description: "The report has been reassigned to another administrator.",
      });
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/creators'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/volunteers'] });
    } catch (error) {
      toast({
        title: "Reassignment Failed",
        description: "Failed to reassign the report. Please try again.",
        variant: "destructive",
      });
    }
  };
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">My Workspace</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Track and manage all your claimed assignments including KYC verifications, reports reviews, 
          and various administrative tasks. Monitor your productivity and claimed workload.
        </p>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">KYC</p>
            <p className="text-xl font-bold">{analytics?.kyc || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 text-indigo-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Reviewed Campaigns</p>
            <p className="text-xl font-bold">{analytics?.reviewedCampaigns || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Document Reports</p>
            <p className="text-xl font-bold">{analytics?.documents || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Campaign Reports</p>
            <p className="text-xl font-bold">{analytics?.campaigns || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Volunteer Reports</p>
            <p className="text-xl font-bold">{analytics?.volunteers || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Creator Reports</p>
            <p className="text-xl font-bold">{analytics?.creators || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Transaction Reports</p>
            <p className="text-xl font-bold">{analytics?.transactions || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Section for Claimed Items */}
      <Card>
        <CardHeader>
          <CardTitle>Claimed Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1 p-1 bg-gray-100 rounded-lg">
                <TabsTrigger 
                  value="pending-kyc" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Pending KYC</span>
                  <span className="sm:hidden">KYC</span>
                  <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">{(claimedKyc || []).length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="pending-campaigns" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Pending Campaigns</span>
                  <span className="sm:hidden">Campaigns</span>
                  <span className="ml-1 bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full">{(claimedCampaigns || []).length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="document-reports" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Document Reports</span>
                  <span className="sm:hidden">Docs</span>
                  <span className="ml-1 bg-purple-100 text-purple-800 text-xs px-1.5 py-0.5 rounded-full">{(claimedReports || []).length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="campaign-reports" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Campaign Reports</span>
                  <span className="sm:hidden">C Reports</span>
                  <span className="ml-1 bg-orange-100 text-orange-800 text-xs px-1.5 py-0.5 rounded-full">{(claimedCampaignReports || []).length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="volunteer-reports" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Volunteer Reports</span>
                  <span className="sm:hidden">V Reports</span>
                  <span className="ml-1 bg-teal-100 text-teal-800 text-xs px-1.5 py-0.5 rounded-full">{(claimedVolunteerReports || []).length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="creator-reports" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Creator Reports</span>
                  <span className="sm:hidden">Cr Reports</span>
                  <span className="ml-1 bg-pink-100 text-pink-800 text-xs px-1.5 py-0.5 rounded-full">{(claimedCreatorReports || []).length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="suspended-users" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Suspended</span>
                  <span className="sm:hidden">Suspended</span>
                  <span className="ml-1 bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded-full">{(claimedSuspendedUsersData || []).length}</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="pending-kyc" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
{(claimedKyc || []).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No pending KYC requests claimed</p>
                ) : (
                  sortByPriority(claimedKyc || []).slice(0, 10).map((kyc: any) => (                    <div key={kyc.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={kyc.profileImageUrl} />
                            <AvatarFallback>{kyc.firstName?.[0]}{kyc.lastName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{kyc.firstName} {kyc.lastName}</h4>
                            <p className="text-sm text-gray-600">{kyc.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-600">User ID:</span>
                              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                <span className="font-mono" data-testid={`user-display-id-${kyc.id}`}>
                                  {kyc.userDisplayId}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(kyc.kycStatus || kyc.status, 'kyc')}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleExpanded(kyc.id)}
                          >
                            {expandedItems.includes(kyc.id) ? "Hide Details" : "View Details"}
                          </Button>
                          {kyc.kycStatus === 'on_progress' && (
                            <>
                              <Button 
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => openApprovalDialog('approve', kyc.id, 'kyc')}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm"
                                variant="destructive"
                                onClick={() => openApprovalDialog('reject', kyc.id, 'kyc')}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {expandedItems.includes(kyc.id) && renderUserProfile(kyc)}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="pending-campaigns" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
{(claimedCampaigns || []).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No pending campaigns claimed</p>
                ) : (
                  sortByPriority(claimedCampaigns || []).slice(0, 10).map((campaign: any) => (                    <div key={campaign.id} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">{campaign.title}</h4>
                            {campaign.campaignDisplayId && (
                              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                <span className="font-mono" data-testid={`campaign-display-id-${campaign.id}`}>
                                  {campaign.campaignDisplayId}
                                </span>
                              </div>
                            )}
                            {campaign.claimedBy && (
                              <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium border border-gray-300">
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                                  CLAIMED by {campaign.claimedBy}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{campaign.description?.substring(0, 100)}...</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span>Goal: ₱{campaign.goalAmount?.toLocaleString() || '0'}</span>
                            <span>Current: ₱{campaign.currentAmount?.toLocaleString() || '0'}</span>
                            <Badge variant="outline">{campaign.category || 'General'}</Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => toggleExpanded(`creator-${campaign.id}`)}
                            >
                              {expandedItems.includes(`creator-${campaign.id}`) ? "Hide Creator" : "View Creator Details"}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => toggleExpanded(`campaign-${campaign.id}`)}
                            >
                              {expandedItems.includes(`campaign-${campaign.id}`) ? "Hide Campaign" : "View Campaign Details"}
                            </Button>
                          </div>
                          {/* Admin Actions - Always visible for pending campaigns */}
                          {campaign.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => openApprovalDialog('approve', campaign.id, 'campaign')}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm"
                                variant="destructive"
                                onClick={() => openApprovalDialog('reject', campaign.id, 'campaign')}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {expandedItems.includes(`creator-${campaign.id}`) && renderCreatorDetails(campaign.creator)}
                      {expandedItems.includes(`campaign-${campaign.id}`) && (
                        <div className="mt-3 pt-3 border-t space-y-4">
                          {renderCampaignDetails(campaign)}
                          
                          {/* Approve/Reject Actions - Only show for pending campaigns */}
                          {campaign.status === 'pending' && (
                            <div className="flex gap-2 pt-4 mt-4 border-t">
                              <Button 
                                size="sm" 
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => openApprovalDialog('approve', campaign.id, 'campaign')}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm"
                                variant="destructive"
                                onClick={() => openApprovalDialog('reject', campaign.id, 'campaign')}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="document-reports" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
{(claimedReports || []).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No document reports claimed</p>
                ) : (
                  sortByPriority(claimedReports || []).slice(0, 10).map((report: any) => (                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Document Report #{report.id.slice(0, 8)}</h4>
                          <p className="text-sm text-gray-600">Type: {report.reportType || 'Document'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(report.status, 'report')}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewReport(report)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="campaign-reports" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
{(claimedCampaignReports || []).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No campaign reports claimed</p>
                ) : (
                  sortByPriority(claimedCampaignReports || []).slice(0, 10).map((report: any) => (                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Campaign Report #{report.id.slice(0, 8)}</h4>
                          <p className="text-sm text-gray-600">Type: {report.reportType || 'Campaign'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(report.status, 'report')}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewReport(report)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="creator-reports" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
{(claimedCreatorReports || []).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No creator reports claimed</p>
                ) : (
                  sortByPriority(claimedCreatorReports || []).slice(0, 10).map((report: any) => (                      <div key={report.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">Creator Report #{report.id.slice(0, 8)}</h4>
                            <p className="text-sm text-gray-600">Type: {report.reportType || 'Creator'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(report.status, 'report')}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewReport(report)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="volunteer-reports" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
{(claimedVolunteerReports || []).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No volunteer reports claimed</p>
                ) : (
                  sortByPriority(claimedVolunteerReports || []).slice(0, 10).map((report: any) => (                      <div key={report.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">Volunteer Report #{report.id.slice(0, 8)}</h4>
                            <p className="text-sm text-gray-600">Type: {report.reportType || 'Volunteer'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(report.status, 'report')}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewReport(report)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="suspended-users" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
{(claimedSuspendedUsersData || []).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No claimed suspended users</p>
                ) : (
                  (claimedSuspendedUsersData || []).slice(0, 10).map((user: any) => (                    <div key={user.id} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.profileImageUrl} />
                            <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{user.firstName} {user.lastName}</h4>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-600">User ID:</span>
                              <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                                <span className="font-mono">{user.userDisplayId}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              <strong>Reason:</strong> {user.suspensionReason || 'No reason provided'}
                            </p>
                            <p className="text-sm text-gray-400">
                              <strong>Suspended:</strong> {user.suspendedAt ? new Date(user.suspendedAt).toLocaleDateString() : 'N/A'}
                            </p>
                            <p className="text-sm text-gray-400">
                              <strong>Claimed:</strong> {user.claimedAt ? new Date(user.claimedAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                            <Users className="w-3 h-3 mr-1" />
                            Claimed
                          </Badge>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => reactivateSuspendedUserMutation.mutate(user.id)}
                            disabled={reactivateSuspendedUserMutation.isPending}
                            className="border-green-300 text-green-700 hover:bg-green-50"
                            data-testid={`button-reactivate-${user.id}`}
                          >
                            {reactivateSuspendedUserMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Reactivate
                              </>
                            )}
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => reassignSuspendedUserMutation.mutate(user.id)}
                            disabled={reassignSuspendedUserMutation.isPending}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            data-testid={`button-reassign-${user.id}`}
                          >
                            {reassignSuspendedUserMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Reassign
                              </>
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(`/admin/users/${user.id}`, '_blank')}
                            data-testid={`button-view-suspended-${user.id}`}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>

      {/* Approval/Rejection Dialog */}
      <Dialog open={approvalDialog.open} onOpenChange={(open) => !open && closeApprovalDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalDialog.type === 'approve' ? 'Approve' : 'Reject'} {approvalDialog.itemType === 'kyc' ? 'KYC Request' : 'Campaign Request'}
            </DialogTitle>
            <DialogDescription>
              Please select a reason for your decision. This will be recorded for audit purposes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Select
                value={approvalDialog.reason}
                onValueChange={(value) => 
                  setApprovalDialog(prev => ({ ...prev, reason: value, customReason: '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {approvalDialog.type && approvalDialog.itemType && 
                    approvalReasons[approvalDialog.type][approvalDialog.itemType].map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))
                  }
                  <SelectItem value="custom">Custom reason...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {approvalDialog.reason === 'custom' && (
              <div>
                <label className="text-sm font-medium">Custom Reason</label>
                <Textarea
                  placeholder="Enter your custom reason..."
                  value={approvalDialog.customReason}
                  onChange={(e) => 
                    setApprovalDialog(prev => ({ ...prev, customReason: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeApprovalDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleApprovalSubmit}
              disabled={approveItemMutation.isPending || rejectItemMutation.isPending}
              className={approvalDialog.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={approvalDialog.type === 'approve' ? 'default' : 'destructive'}
            >
              {(approveItemMutation.isPending || rejectItemMutation.isPending) ? 'Processing...' : 
               approvalDialog.type === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Completed Works Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Completed Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={completedTab} onValueChange={setCompletedTab}>
            <div className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1 p-1 bg-gray-100 rounded-lg">
                <TabsTrigger 
                  value="completed-kyc" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Completed KYC</span>
                  <span className="sm:hidden">KYC</span>
                  <span className="ml-1 bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full">{(completedKyc || []).length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="completed-campaigns" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Campaigns</span>
                  <span className="sm:hidden">Campaigns</span>
                  <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">{(claimedCampaigns || []).length + (completedCampaigns || []).length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="completed-documents" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Documents</span>
                  <span className="sm:hidden">Docs</span>
                  <span className="ml-1 bg-purple-100 text-purple-800 text-xs px-1.5 py-0.5 rounded-full">{(completedDocuments || []).length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="completed-campaign-reports" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Campaign Reports</span>
                  <span className="sm:hidden">C Reports</span>
                  <span className="ml-1 bg-orange-100 text-orange-800 text-xs px-1.5 py-0.5 rounded-full">{(reportedCampaigns || []).length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="completed-volunteers" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Volunteers</span>
                  <span className="sm:hidden">Volunteers</span>
                  <span className="ml-1 bg-teal-100 text-teal-800 text-xs px-1.5 py-0.5 rounded-full">{(completedVolunteers || []).length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="completed-creators" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Creators</span>
                  <span className="sm:hidden">Creators</span>
                  <span className="ml-1 bg-pink-100 text-pink-800 text-xs px-1.5 py-0.5 rounded-full">{(completedCreators || []).length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="completed-suspended" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Suspended</span>
                  <span className="sm:hidden">Suspended</span>
                  <span className="ml-1 bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded-full">{(completedSuspendedUsers || []).length}</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="completed-kyc" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
{(completedKyc || []).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No completed KYC requests</p>
                ) : (
                  (completedKyc || []).slice(0, 10).map((kyc: any) => (                    <div key={kyc.id} className="border rounded-lg p-3 md:p-4 bg-green-50 border-green-200">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                        <div className="flex items-center gap-2 md:gap-3">
                          <Avatar className="h-8 w-8 md:h-10 md:w-10">
                            <AvatarImage src={kyc.profileImageUrl} />
                            <AvatarFallback className="text-xs md:text-sm">{kyc.firstName?.[0]}{kyc.lastName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-sm md:text-base truncate">{kyc.firstName} {kyc.lastName}</h4>
                            <p className="text-xs md:text-sm text-gray-600 truncate">{kyc.email}</p>
                            <div className="flex items-center gap-1 md:gap-2 mt-1">
                              <span className="text-xs md:text-sm text-gray-600">User ID:</span>
                              <div className="bg-green-100 text-green-800 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-xs font-medium">
                                <span className="font-mono text-xs">{kyc.userDisplayId}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                          <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">Completed</span>
                            <span className="sm:hidden">Done</span>
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs px-2 md:px-3"
                            onClick={() => toggleExpanded(kyc.id)}
                          >
                            <span className="hidden sm:inline">{expandedItems.includes(kyc.id) ? "Hide Details" : "View Details"}</span>
                            <span className="sm:hidden">{expandedItems.includes(kyc.id) ? "Hide" : "View"}</span>
                          </Button>
                        </div>
                      </div>
                      {expandedItems.includes(kyc.id) && renderUserProfile(kyc)}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed-campaigns" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {completedCampaigns.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No completed campaign reviews</p>
                ) : (
                  completedCampaigns.slice(0, 10).map((campaign: any) => (
                    <div key={campaign.id} className="border rounded-lg p-3 md:p-4 bg-purple-50 border-purple-200">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-2">
                            <h4 className="font-medium text-sm md:text-base truncate">{campaign.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {campaign.campaignDisplayId || 'N/A'}
                            </Badge>
                            {campaign.claimedBy && (
                              <Badge variant="outline" className="text-xs bg-blue-50">
                                <span className="hidden sm:inline">● CLAIMED by {campaign.claimedBy}</span>
                                <span className="sm:hidden">● {campaign.claimedBy}</span>
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs md:text-sm text-gray-500 mb-1 line-clamp-2">
                            {campaign.description?.substring(0, 100) || 'No description available'}...
                          </p>
                          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                            <span>Goal: ₱{campaign.goalAmount?.toLocaleString() || '0'}</span>
                            <span>Current: ₱{campaign.currentAmount?.toLocaleString() || '0'}</span>
                            <Badge variant="outline" className="text-xs">{campaign.category || 'General'}</Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 md:gap-2 flex-shrink-0">
                          <div className="flex flex-col sm:flex-row gap-1 md:gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-xs px-2 md:px-3"
                              onClick={() => toggleExpanded(`creator-${campaign.id}`)}
                            >
                              <span className="hidden sm:inline">{expandedItems.includes(`creator-${campaign.id}`) ? "Hide Creator" : "View Creator Details"}</span>
                              <span className="sm:hidden">{expandedItems.includes(`creator-${campaign.id}`) ? "Hide Creator" : "Creator"}</span>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-xs px-2 md:px-3"
                              onClick={() => toggleExpanded(`campaign-${campaign.id}`)}
                            >
                              <span className="hidden sm:inline">{expandedItems.includes(`campaign-${campaign.id}`) ? "Hide Campaign" : "View Campaign Details"}</span>
                              <span className="sm:hidden">{expandedItems.includes(`campaign-${campaign.id}`) ? "Hide Campaign" : "Campaign"}</span>
                            </Button>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 md:gap-2">
                            <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {campaign.status || 'active'}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              <span className="hidden sm:inline">Completed: </span>
                              {campaign.completedAt ? new Date(campaign.completedAt).toLocaleDateString() : new Date(campaign.approvedAt || campaign.rejectedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {expandedItems.includes(`creator-${campaign.id}`) && renderCreatorDetails(campaign.creator)}
                      {expandedItems.includes(`campaign-${campaign.id}`) && (
                        <div className="mt-3 pt-3 border-t space-y-4">
                          {renderCampaignDetails(campaign)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed-documents" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {completedDocuments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No completed document reviews</p>
                ) : (
                  completedDocuments.slice(0, 10).map((doc: any) => (
                    <div key={doc.id} className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{doc.title || doc.reason || 'Document Report'}</h4>
                          <p className="text-sm text-gray-600">Report ID: {doc.reportId || doc.id}</p>
                          <p className="text-sm text-gray-500">Type: {doc.reportType || doc.type || 'Document Review'}</p>
                          <p className="text-sm text-gray-400">Completed: {doc.completedAt ? new Date(doc.completedAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {doc.status || 'Completed'}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewReport(doc)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed-campaign-reports" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
{(reportedCampaigns || []).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No completed campaign report reviews</p>
                ) : (
                  (reportedCampaigns || []).slice(0, 10).map((report: any) => (                    <div key={report.id} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{report.campaign?.title || 'Campaign Report'}</h4>
                          <p className="text-sm text-gray-600">Report ID: {report.reportId}</p>
                          <p className="text-sm text-gray-500">Campaign ID: {report.campaign?.campaignDisplayId}</p>
                          <p className="text-sm text-gray-500">Reporter: {report.reporter?.firstName} {report.reporter?.lastName}</p>
                          <p className="text-sm text-gray-400">Completed: {report.closedAt ? new Date(report.closedAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${
                            report.status === 'approved' ? 'bg-green-100 text-green-800 border-green-300' :
                            report.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                            'bg-orange-100 text-orange-800 border-orange-300'
                          }`}>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {report.status || 'Resolved'}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewReport(report)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed-volunteers" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {completedVolunteers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No completed volunteer reviews</p>
                ) : (
                  completedVolunteers.slice(0, 10).map((volunteer: any) => (
                    <div key={volunteer.id} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{volunteer.reason || volunteer.applicantName || 'Volunteer Report'}</h4>
                          <p className="text-sm text-gray-600">Report ID: {volunteer.reportId || volunteer.id}</p>
                          <p className="text-sm text-gray-500">Type: {volunteer.reportType || volunteer.type || 'Volunteer Review'}</p>
                          <p className="text-sm text-gray-400">Completed: {volunteer.completedAt ? new Date(volunteer.completedAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {volunteer.status || 'Completed'}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewReport(volunteer)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed-creators" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {completedCreators.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No completed creator reviews</p>
                ) : (
                  completedCreators.slice(0, 10).map((creator: any) => (
                    <div key={creator.id} className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{creator.reason || `${creator.firstName} ${creator.lastName}` || 'Creator Report'}</h4>
                          <p className="text-sm text-gray-600">Report ID: {creator.reportId || creator.id}</p>
                          <p className="text-sm text-gray-500">Type: {creator.reportType || creator.type || 'Creator Review'}</p>
                          <p className="text-sm text-gray-400">Completed: {creator.completedAt ? new Date(creator.completedAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {creator.status || 'Completed'}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewReport(creator)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed-suspended" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {completedSuspendedUsers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No completed suspended user cases</p>
                ) : (
                  completedSuspendedUsers.slice(0, 10).map((user: any) => (
                    <div key={user.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.profileImageUrl} />
                            <AvatarFallback className="bg-green-100">{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-green-900">{user.firstName} {user.lastName}</h4>
                            <p className="text-sm text-green-700">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-green-600">User ID:</span>
                              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                <span className="font-mono">{user.userDisplayId}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Reactivated
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(`/admin/users/${user.id}`, '_blank')}
                            data-testid={`button-view-completed-suspended-${user.id}`}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 mt-2 border-t border-green-200">
                        <div>
                          <p className="text-sm font-medium text-green-800">Original Suspension Date</p>
                          <p className="text-sm text-green-700" data-testid={`text-completed-suspension-date-${user.id}`}>
                            {user.suspendedAt ? new Date(user.suspendedAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-800">Suspension Reason</p>
                          <p className="text-sm text-green-700" data-testid={`text-completed-suspension-reason-${user.id}`}>
                            {user.suspensionReason || 'No reason provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>

      {/* Comprehensive Report Modal for MY WORK */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Details - {selectedReport?.reportId || selectedReport?.id}</DialogTitle>
            <DialogDescription>
              Complete information about this report including evidence, reporter details, and related entities.
            </DialogDescription>
          </DialogHeader>

          {loadingReportDetails && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading report details...</span>
            </div>
          )}

          {!loadingReportDetails && selectedReport && (
            <ReportDetails report={selectedReport} />
          )}

          {!loadingReportDetails && !selectedReport && (
            <div className="text-center py-8">
              <p className="text-gray-500">No report selected</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
// KYC Management Section - Section 3
function KYCSection() {
  const [activeKycTab, setActiveKycTab] = useState("basic");
  const [expandedUsers, setExpandedUsers] = useState<string[]>([]);
  const [kycSearchQuery, setKycSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: basicUsers = [] } = useQuery({
    queryKey: ['/api/admin/kyc/basic'],
    retry: false,
  });

  const { data: pendingKyc = [] } = useQuery({
    queryKey: ['/api/admin/kyc/pending'],
    retry: false,
  });

  const { data: verifiedKyc = [] } = useQuery({
    queryKey: ['/api/admin/kyc/verified'],
    retry: false,
  });

  const { data: rejectedKyc = [] } = useQuery({
    queryKey: ['/api/admin/kyc/rejected'],
    retry: false,
  });

  const { data: suspendedUsers = [] } = useQuery({
    queryKey: ['/api/admin/users/suspended'],
    retry: false,
  });

  const { data: adminStaff = [] } = useQuery({
    queryKey: ['/api/admin/admins'],
    retry: false,
  });

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Filter KYC users based on search query
  const getFilteredKycUsers = (users: any[], tabType: string) => {
    if (!kycSearchQuery.trim()) return users;
    
    const searchLower = kycSearchQuery.toLowerCase();
    return users.filter(user => {
      const searchFields = [
        user.id,
        user.userDisplayId,
        user.firstName,
        user.lastName,
        user.email,
        user.contactNumber,
        user.phoneNumber,
        user.phone,
        user.address,
        user.kycStatus,
        user.education,
        user.profession,
        user.organizationName,
        user.organizationType,
        user.processedByAdmin,
        user.rejectionReason,
        new Date(user.createdAt || Date.now()).toLocaleDateString(),
        new Date(user.createdAt || Date.now()).toLocaleString()
      ];
      
      return searchFields.some(field => 
        field && field.toString().toLowerCase().includes(searchLower)
      );
    });
  };

  // Render user profile details
  const renderUserProfile = (user: any) => (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div>
          <h4 className="font-semibold mb-3 text-green-700">Personal Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.profileImageUrl} />
                <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.firstName} {user.middleInitial && user.middleInitial + '. '}{user.lastName}</p>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <strong>User ID:</strong>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                <span className="font-mono" data-testid={`user-display-id-${user.id}`}>
                  {user.userDisplayId || (user.id.slice(0, 8) + '...' + user.id.slice(-4))}
                </span>
                {!user.userDisplayId && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user.id);
                    }}
                    className="text-green-700 hover:text-green-900 text-xs underline ml-2"
                    title="Click to copy full User ID"
                  >
                    Copy ID
                  </button>
                )}
              </div>
            </div>
            <p><strong>Contact Number:</strong> {user.contactNumber || user.phoneNumber || user.phone || 'Not provided'}</p>
            <p><strong>Address:</strong> {user.address || 'Not provided'}</p>
            <p><strong>Birthday:</strong> {user.birthday ? new Date(user.birthday).toLocaleDateString() : user.dateOfBirth || 'Not provided'}</p>
            <p><strong>Registration Date:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
            <p><strong>KYC Status:</strong> <Badge variant={user.kycStatus === 'verified' ? 'default' : user.kycStatus === 'pending' ? 'secondary' : 'destructive'}>{user.kycStatus || 'pending'}</Badge></p>
          </div>
        </div>

        {/* Professional & Additional Information */}
        <div>
          <h4 className="font-semibold mb-3 text-blue-700">Professional Details</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Education:</strong> {user.education || 'Not provided'}</p>
            <p><strong>Profession:</strong> {user.profession || 'Not provided'}</p>
            <p><strong>Work Experience:</strong> {user.workExperience || 'Not provided'}</p>
            <p><strong>Organization:</strong> {user.organizationName || 'Not provided'}</p>
            <p><strong>Organization Type:</strong> {user.organizationType || 'Not provided'}</p>
            <p><strong>LinkedIn:</strong> {user.linkedinProfile ? (
              <a href={user.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                View Profile
              </a>
            ) : 'Not provided'}</p>
            <p><strong>Fun Facts:</strong> {user.funFacts || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* KYC Documents Section */}
      {(user.governmentIdUrl || user.proofOfAddressUrl) && (
        <div>
          <h4 className="font-semibold mb-3 text-purple-700">KYC Documents</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.governmentIdUrl && (
              <div className="border rounded-lg p-3">
                <h5 className="font-medium mb-2">Government ID</h5>
                <DocumentViewer document={{
                  url: user.governmentIdUrl,
                  type: 'government_id',
                  fileName: 'Government ID',
                  fileSize: 0,
                  description: 'Government issued identification document'
                }} />
              </div>
            )}
            {user.proofOfAddressUrl && (
              <div className="border rounded-lg p-3">
                <h5 className="font-medium mb-2">Proof of Address</h5>
                <DocumentViewer document={{
                  url: user.proofOfAddressUrl,
                  type: 'proof_of_address',
                  fileName: 'Proof of Address',
                  fileSize: 0,
                  description: 'Proof of residential address document'
                }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Platform Activity & Account Information */}
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <h4 className="font-semibold mb-3 text-orange-700">Platform Activity</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Creator Rating:</strong> {user.creatorRating || user.reliabilityScore || 'N/A'}</p>
            <p><strong>Credit Score:</strong> {user.creditScore || user.credibilityScore || 'N/A'}</p>
            <p><strong>Reliability Score:</strong> {user.reliabilityScore || 'N/A'}</p>
            <p><strong>Social Score:</strong> {user.socialScore || 'N/A'}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-red-700">Account Settings</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Account Balance:</strong> ₱{user.phpBalance || user.pusoBalance || '0.00'}</p>
            <p><strong>Tips Balance:</strong> ₱{user.tipsBalance || '0.00'}</p>
            <p><strong>Contributions Balance:</strong> ₱{user.contributionsBalance || '0.00'}</p>
            <p><strong>Profile Complete:</strong> {user.isProfileComplete ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-gray-700">Verification Details</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Email Verified:</strong> {user.emailVerified || user.isEmailVerified ? 'Yes' : 'No'}</p>
            <p><strong>Phone Verified:</strong> {user.phoneVerified || user.isPhoneVerified ? 'Yes' : 'No'}</p>
            <p><strong>2FA Enabled:</strong> {user.twoFactorEnabled ? 'Yes' : 'No'}</p>
            {user.processedByAdmin && (
              <p><strong>Processed By:</strong> {user.processedByAdmin}</p>
            )}
            {user.processedAt && (
              <p><strong>Processed Date:</strong> {new Date(user.processedAt).toLocaleDateString()}</p>
            )}
            {user.rejectionReason && (
              <div className="mt-2">
                <strong>Rejection Reason:</strong>
                <p className="text-red-600 mt-1">{user.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // KYC Claim Mutation
  const [claimedUsers, setClaimedUsers] = useState<Set<string>>(new Set());
  const queryClientKyc = useQueryClient();
  const claimKycMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/kyc/${userId}/claim`, {});
    },
    onSuccess: (data, userId) => {
      toast({
        title: "KYC Request Claimed",
        description: "You have successfully claimed this KYC request for review.",
      });
      // Add user to claimed set for immediate UI update
      setClaimedUsers(prev => new Set(prev).add(userId));
      // Invalidate queries to refresh the data
      queryClientKyc.invalidateQueries({ queryKey: ["/api/admin/kyc/pending"] });
      queryClientKyc.invalidateQueries({ queryKey: ["/api/admin/my-works/kyc-claimed"] });
      queryClientKyc.invalidateQueries({ queryKey: ["/api/admin/my-works/analytics"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to claim KYC request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Suspended User Actions
  const [assignDialog, setAssignDialog] = useState<{
    open: boolean;
    userId: string;
    assigneeId?: string;
  }>({ open: false, userId: "" });

  const [claimedSuspendedUsers, setClaimedSuspendedUsers] = useState<Set<string>>(new Set());

  const claimSuspendedUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/claim-suspended`, {});
    },
    onSuccess: (data, userId) => {
      toast({
        title: "Suspended User Claimed",
        description: "You have successfully claimed this suspended user for review.",
      });
      // Add user to claimed set for immediate UI update
      setClaimedSuspendedUsers(prev => new Set(prev).add(userId));
      // Invalidate queries to refresh the data
      queryClientKyc.invalidateQueries({ queryKey: ["/api/admin/users/suspended"] });
      queryClientKyc.invalidateQueries({ queryKey: ["/api/admin/my-works/analytics"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to claim suspended user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const assignUserMutation = useMutation({
    mutationFn: async ({ userId, assigneeId }: { userId: string; assigneeId: string }) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/assign`, { assigneeId });
    },
    onSuccess: () => {
      toast({
        title: "User Assigned",
        description: "User has been successfully assigned for review.",
      });
      setAssignDialog({ open: false, userId: "" });
      queryClientKyc.invalidateQueries({ queryKey: ["/api/admin/users/suspended"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to assign user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const renderUserList = (users: any[], showKycStatus = true, showClaimButton = false) => (
    <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      {users.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No users found</p>
      ) : (
        users.slice(0, 10).map((user: any) => (
          <div key={user.id} className="border rounded-lg p-3 md:p-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <div className="flex items-center gap-2 md:gap-3">
                <Avatar className="h-8 w-8 md:h-10 md:w-10">
                  <AvatarImage src={user.profileImageUrl} />
                  <AvatarFallback className="text-xs md:text-sm">{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm md:text-base truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs md:text-sm text-gray-600 truncate">{user.email}</p>
                  {showKycStatus && (
                    <Badge variant={user.kycStatus === 'verified' ? 'default' : user.kycStatus === 'pending' ? 'secondary' : 'destructive'} className="text-xs mt-1">
                      {user.kycStatus || 'pending'}
                    </Badge>
                  )}
                  {user.kycStatus === 'on_progress' && user.processedByAdmin && (
                    <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                      <p><strong>Claimed by:</strong> {user.processedByAdmin}</p>
                      {user.dateClaimed && (
                        <p><strong>Claimed:</strong> {new Date(user.dateClaimed).toLocaleString()}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1 md:gap-2 flex-shrink-0">
                {showClaimButton && user.kycStatus === 'pending' && (
                  <Button
                    size="sm"
                    className="text-xs px-2 md:px-3"
                    onClick={() => claimKycMutation.mutate(user.id)}
                    disabled={claimKycMutation.isPending || claimedUsers.has(user.id)}
                  >
                    {claimKycMutation.isPending && claimKycMutation.variables === user.id ? (
                      <>
                        <Loader2 className="w-3 h-3 md:w-4 md:h-4 mr-1 animate-spin" />
                        <span className="hidden sm:inline">Claiming...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : claimedUsers.has(user.id) ? (
                      <>
                        <span className="hidden sm:inline">Claimed</span>
                        <span className="sm:hidden">✓</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Claim</span>
                        <span className="sm:hidden">C</span>
                      </>
                    )}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs px-2 md:px-3"
                  onClick={() => toggleUserExpanded(user.id)}
                >
                  <span className="hidden sm:inline">{expandedUsers.includes(user.id) ? 'Hide Details' : 'View Details'}</span>
                  <span className="sm:hidden">{expandedUsers.includes(user.id) ? 'Hide' : 'View'}</span>
                </Button>
              </div>
            </div>
            {expandedUsers.includes(user.id) && renderUserProfile(user)}
          </div>
        ))
      )}
    </div>
  );

  const renderSuspendedUsersList = (users: any[]) => (
    <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      {users.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No suspended users found</p>
      ) : (
        users.slice(0, 10).map((user: any) => (
          <div key={user.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.profileImageUrl} />
                    <AvatarFallback className="bg-red-100">{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-red-900">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-red-700">{user.email}</p>
                    <Badge variant="destructive" className="mt-1">
                      Suspended
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAssignDialog({ open: true, userId: user.id })}
                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    data-testid={`button-assign-${user.id}`}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Assign
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => claimSuspendedUserMutation.mutate(user.id)}
                    disabled={claimSuspendedUserMutation.isPending || (user.claimedBy && user.claimedBy !== null)}
                    className={user.claimedBy ? "border-gray-300 text-gray-500" : "border-green-300 text-green-700 hover:bg-green-50"}
                    data-testid={`button-claim-${user.id}`}
                  >
                    {claimSuspendedUserMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Claiming...
                      </>
                    ) : (user.claimedBy && user.claimedBy !== null) ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Claimed
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 mr-1" />
                        Claim
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/admin/users/${user.id}`, '_blank')}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    data-testid={`button-view-account-${user.id}`}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Account
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-red-200">
                <div>
                  <p className="text-sm font-medium text-red-800">Date of Suspension</p>
                  <p className="text-sm text-red-700" data-testid={`text-suspension-date-${user.id}`}>
                    {user.suspendedAt ? new Date(user.suspendedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800">Suspension Reason</p>
                  <p className="text-sm text-red-700" data-testid={`text-suspension-reason-${user.id}`}>
                    {user.suspensionReason || 'No reason provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">KYC Management</h2>
      
      {/* KYC Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-800" data-testid="stat-basic-users">
                  {basicUsers.length}
                </div>
                <div className="text-sm text-blue-600">Basic Users</div>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-800" data-testid="stat-pending-kyc">
                  {pendingKyc.length}
                </div>
                <div className="text-sm text-yellow-600">Pending KYC</div>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-800" data-testid="stat-verified-users">
                  {verifiedKyc.length}
                </div>
                <div className="text-sm text-green-600">Verified Users</div>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-800" data-testid="stat-rejected-users">
                  {rejectedKyc.length}
                </div>
                <div className="text-sm text-red-600">Rejected Users</div>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800" data-testid="stat-suspended-users">
                  {suspendedUsers.length}
                </div>
                <div className="text-sm text-gray-600">Suspended Users</div>
              </div>
              <UserX className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* KYC Search Bar */}
          <div className="mb-6">
<div className="flex items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name, email, ID, KYC status, profession, organization..."
                  value={kycSearchQuery}
                  onChange={(e) => setKycSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-kyc-search"
                />
              </div>
              <Button
                onClick={async () => {
                  const userId = '884b590e-2db1-4894-8615-9eed63eaabed'; // sshkitacc02@gmail.com
                  try {
                    const response = await fetch(`/api/admin/users/${userId}/reset-contributions`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      }
                    });
                    const result = await response.json();
                    if (response.ok) {
                      toast({
                        title: "Success",
                        description: `Contributions balance reset to ₱0.00 for ${result.userEmail}`,
                      });
                    } else {
                      toast({
                        title: "Error",
                        description: result.message || "Failed to reset contributions",
                        variant: "destructive"
                      });
                    }
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to reset contributions",
                      variant: "destructive"
                    });
                  }
                }}
                variant="outline"
                size="sm"
                className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 ml-4"
              >
                Reset Contributions
              </Button>            </div>
            {kycSearchQuery && (
              <p className="text-sm text-gray-500 mt-2">
                Searching for: "<span className="font-medium">{kycSearchQuery}</span>"
              </p>
            )}
          </div>

          <Tabs value={activeKycTab} onValueChange={setActiveKycTab}>
            <div className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 p-1 bg-gray-100 rounded-lg">
                <TabsTrigger 
                  value="basic" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Basic</span>
                  <span className="sm:hidden">Basic</span>
                  <span className="ml-1 bg-gray-100 text-gray-800 text-xs px-1.5 py-0.5 rounded-full">{getFilteredKycUsers(basicUsers, 'basic').length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="pending" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Pending</span>
                  <span className="sm:hidden">Pending</span>
                  <span className="ml-1 bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded-full">{getFilteredKycUsers(pendingKyc, 'pending').length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="verified" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Verified</span>
                  <span className="sm:hidden">Verified</span>
                  <span className="ml-1 bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full">{getFilteredKycUsers(verifiedKyc, 'verified').length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="rejected" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Rejected</span>
                  <span className="sm:hidden">Rejected</span>
                  <span className="ml-1 bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded-full">{getFilteredKycUsers(rejectedKyc, 'rejected').length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="suspended" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Suspended</span>
                  <span className="sm:hidden">Suspended</span>
                  <span className="ml-1 bg-orange-100 text-orange-800 text-xs px-1.5 py-0.5 rounded-full">{getFilteredKycUsers(suspendedUsers, 'suspended').length}</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="basic" className="mt-4">
              {(() => {
                const filteredUsers = getFilteredKycUsers(basicUsers, 'basic');
                return filteredUsers.length === 0 && kycSearchQuery ? (
                  <p className="text-center text-gray-500 py-8">
                    No basic users found matching "{kycSearchQuery}"
                  </p>
                ) : (
                  renderUserList(filteredUsers)
                );
              })()}
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              {(() => {
                const filteredUsers = getFilteredKycUsers(pendingKyc, 'pending');
                return filteredUsers.length === 0 && kycSearchQuery ? (
                  <p className="text-center text-gray-500 py-8">
                    No pending KYC users found matching "{kycSearchQuery}"
                  </p>
                ) : (
                  renderUserList(filteredUsers, true, true)
                );
              })()}
            </TabsContent>

            <TabsContent value="verified" className="mt-4">
              {(() => {
                const filteredUsers = getFilteredKycUsers(verifiedKyc, 'verified');
                return filteredUsers.length === 0 && kycSearchQuery ? (
                  <p className="text-center text-gray-500 py-8">
                    No verified users found matching "{kycSearchQuery}"
                  </p>
                ) : (
                  renderUserList(filteredUsers)
                );
              })()}
            </TabsContent>

            <TabsContent value="rejected" className="mt-4">
              {(() => {
                const filteredUsers = getFilteredKycUsers(rejectedKyc, 'rejected');
                return filteredUsers.length === 0 && kycSearchQuery ? (
                  <p className="text-center text-gray-500 py-8">
                    No rejected users found matching "{kycSearchQuery}"
                  </p>
                ) : (
                  renderUserList(filteredUsers)
                );
              })()}
            </TabsContent>

            <TabsContent value="suspended" className="mt-4">
              {(() => {
                const filteredUsers = getFilteredKycUsers(suspendedUsers, 'suspended');
                return filteredUsers.length === 0 && kycSearchQuery ? (
                  <p className="text-center text-gray-500 py-8">
                    No suspended users found matching "{kycSearchQuery}"
                  </p>
                ) : (
                  renderSuspendedUsersList(filteredUsers)
                );
              })()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={(open) => setAssignDialog({ open, userId: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Suspended User</DialogTitle>
            <DialogDescription>
              Select an admin to assign this suspended user for review and resolution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="assignee">Select Admin</Label>
              <Select onValueChange={(value) => setAssignDialog(prev => ({ ...prev, assigneeId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an admin..." />
                </SelectTrigger>
                <SelectContent>
                  {adminStaff?.map((admin: any) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.firstName} {admin.lastName} ({admin.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog({ open: false, userId: "" })}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (assignDialog.assigneeId) {
                  assignUserMutation.mutate({ 
                    userId: assignDialog.userId, 
                    assigneeId: assignDialog.assigneeId 
                  });
                }
              }}
              disabled={!assignDialog.assigneeId || assignUserMutation.isPending}
            >
              {assignUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
// Campaign Management Section - Section 4
function CampaignsSection() {
  const [activeCampaignTab, setActiveCampaignTab] = useState("requests");
  const [expandedCampaigns, setExpandedCampaigns] = useState<string[]>([]);
  const [claimedCampaigns, setClaimedCampaigns] = useState<string[]>([]);
  const [campaignSearchQuery, setCampaignSearchQuery] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Assign dialog state
  const [assignDialog, setAssignDialog] = useState<{
    open: boolean;
    campaignId: string;
    selectedAdmin: string;
  }>({
    open: false,
    campaignId: '',
    selectedAdmin: ''
  });

  const { data: pendingCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/pending'],
    retry: false,
  });

  const { data: activeCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/active'],
    retry: false,
  });

  const { data: inProgressCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/in-progress'],
    retry: false,
  });

  const { data: completedCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/completed'],
    retry: false,
  });

  const { data: closedCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/closed'],
    retry: false,
  });

  const { data: rejectedCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/rejected'],
    retry: false,
  });

  // Get list of admins for assignment
  const { data: adminsList = [] } = useQuery({
    queryKey: ['/api/admin/admins'],
    retry: false,
  });

  const toggleCampaignExpanded = (campaignId: string) => {
    setExpandedCampaigns(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const queryClientCampaigns = useQueryClient();
  const claimCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      console.log("🚀 Claiming campaign:", campaignId);
      return await apiRequest('POST', `/api/admin/campaigns/${campaignId}/claim`, {});
    },
    onSuccess: () => {
      console.log("✅ Campaign claimed successfully");
      toast({
        title: "Campaign Claimed",
        description: "You have successfully claimed this campaign for review.",
      });
      // Force refresh campaign lists (refetch instead of just invalidate)
      queryClientCampaigns.refetchQueries({ queryKey: ['/api/admin/campaigns/pending'] });
      queryClientCampaigns.refetchQueries({ queryKey: ['/api/admin/my-works/campaigns'] });
      queryClientCampaigns.refetchQueries({ queryKey: ['/api/admin/my-works/analytics'] });
      // Also invalidate for other components
      queryClientCampaigns.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
    },
    onError: (error: any) => {
      console.error("❌ Failed to claim campaign:", error);
      toast({
        title: "Error",
        description: "Failed to claim campaign. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleClaimCampaign = (campaignId: string) => {
    setClaimedCampaigns(prev => [...prev, campaignId]);
    claimCampaignMutation.mutate(campaignId);
  };

  // Assign campaign mutation
  const assignCampaignMutation = useMutation({
    mutationFn: async ({ campaignId, adminId }: { campaignId: string; adminId: string }) => {
      console.log("🚀 Assigning campaign:", { campaignId, adminId });
      return await apiRequest('POST', `/api/admin/campaigns/${campaignId}/assign`, { adminId });
    },
    onSuccess: () => {
      console.log("✅ Campaign assigned successfully");
      toast({
        title: "Campaign Assigned",
        description: "Campaign has been successfully assigned to the selected admin.",
      });
      // Refresh campaign lists
      queryClientCampaigns.refetchQueries({ queryKey: ['/api/admin/campaigns/pending'] });
      queryClientCampaigns.refetchQueries({ queryKey: ['/api/admin/my-works/campaigns'] });
      queryClientCampaigns.refetchQueries({ queryKey: ['/api/admin/my-works/analytics'] });
      queryClientCampaigns.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
      setAssignDialog({ open: false, campaignId: '', selectedAdmin: '' });
    },
    onError: (error: any) => {
      console.error("❌ Failed to assign campaign:", error);
      toast({
        title: "Error",
        description: "Failed to assign campaign. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAssignCampaign = (campaignId: string) => {
    setAssignDialog({ open: true, campaignId, selectedAdmin: '' });
  };

  const confirmAssignCampaign = () => {
    if (assignDialog.selectedAdmin && assignDialog.campaignId) {
      assignCampaignMutation.mutate({
        campaignId: assignDialog.campaignId,
        adminId: assignDialog.selectedAdmin
      });
    }
  };

  // Filter campaigns based on search query
  const getFilteredCampaigns = (campaigns: any[], tabType: string) => {
    if (!campaignSearchQuery.trim()) return campaigns;
    
    const searchLower = campaignSearchQuery.toLowerCase();
    return campaigns.filter(campaign => {
      const searchFields = [
        campaign.id,
        campaign.title,
        campaign.description,
        campaign.category,
        campaign.targetAmount,
        campaign.currentAmount,
        campaign.creator?.email,
        campaign.creator?.firstName,
        campaign.creator?.lastName,
        campaign.createdAt,
        campaign.status,
        campaign.claimedBy,
        campaign.claimAdmin?.email,
        campaign.assignedAdmin?.email,
        new Date(campaign.createdAt || Date.now()).toLocaleDateString(),
        new Date(campaign.createdAt || Date.now()).toLocaleString()
      ];
      
      return searchFields.some(field => 
        field && field.toString().toLowerCase().includes(searchLower)
      );
    });
  };

  const renderCreatorDetails = (creator: any) => (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h5 className="font-semibold mb-4 text-blue-800">Complete Creator Profile</h5>
      
      {/* Main Profile Section */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={creator?.profileImageUrl} />
            <AvatarFallback className="text-lg">{creator?.firstName?.[0]}{creator?.lastName?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h6 className="text-lg font-semibold">{creator?.firstName} {creator?.middleInitial && creator?.middleInitial + '. '}{creator?.lastName}</h6>
            <p className="text-gray-600">{creator?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm"><strong>User ID:</strong></span>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                <span className="font-mono" data-testid={`creator-display-id-${creator?.id}`}>{creator?.userDisplayId || creator?.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="space-y-3">
          <h6 className="font-semibold text-green-700 border-b border-green-200 pb-1">Personal Information</h6>
          <div className="space-y-2 text-sm">
            <p><strong>Contact Number:</strong> {creator?.contactNumber || creator?.phoneNumber || 'Not provided'}</p>
            <p><strong>Address:</strong> {creator?.address || 'Not provided'}</p>
            <p><strong>Birthday:</strong> {creator?.birthday ? new Date(creator?.birthday).toLocaleDateString() : 'Not provided'}</p>
            <p><strong>Location:</strong> {creator?.location || 'Not provided'}</p>
            <p><strong>Languages:</strong> {creator?.languages || 'Not provided'}</p>
            <p><strong>Registration Date:</strong> {new Date(creator?.createdAt || Date.now()).toLocaleDateString()}</p>
            <p><strong>KYC Status:</strong> <Badge variant={creator?.kycStatus === 'verified' ? 'default' : creator?.kycStatus === 'pending' ? 'secondary' : 'destructive'}>{creator?.kycStatus || 'pending'}</Badge></p>
            {creator?.bio && (
              <div>
                <strong>Bio:</strong>
                <p className="text-gray-600 mt-1">{creator?.bio}</p>
              </div>
            )}
            {creator?.interests && (
              <div>
                <strong>Interests:</strong>
                <p className="text-gray-600 mt-1">{creator?.interests}</p>
              </div>
            )}
            {creator?.funFacts && (
              <div>
                <strong>Fun Facts:</strong>
                <p className="text-gray-600 mt-1">{creator?.funFacts}</p>
              </div>
            )}
          </div>
        </div>

        {/* Professional Information */}
        <div className="space-y-3">
          <h6 className="font-semibold text-blue-700 border-b border-blue-200 pb-1">Professional Details</h6>
          <div className="space-y-2 text-sm">
            <p><strong>Education:</strong> {creator?.education || 'Not provided'}</p>
            <p><strong>Profession:</strong> {creator?.profession || 'Not provided'}</p>
            <p><strong>Organization:</strong> {creator?.organizationName || 'Not provided'}</p>
            <p><strong>Organization Type:</strong> {creator?.organizationType || 'Not provided'}</p>
            {creator?.linkedinProfile && (
              <p><strong>LinkedIn:</strong> 
                <a href={creator?.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                  View Profile
                </a>
              </p>
            )}
            {creator?.workExperience && (
              <div>
                <strong>Work Experience:</strong>
                <p className="text-gray-600 mt-1">{creator?.workExperience}</p>
              </div>
            )}
            {creator?.workExperienceDetails && (
              <div>
                <strong>Work Experience Details:</strong>
                <p className="text-gray-600 mt-1">{creator?.workExperienceDetails}</p>
              </div>
            )}
            {creator?.skills && (
              <div>
                <strong>Skills:</strong>
                <p className="text-gray-600 mt-1">{creator?.skills}</p>
              </div>
            )}
            {creator?.certifications && (
              <div>
                <strong>Certifications:</strong>
                <p className="text-gray-600 mt-1">{creator?.certifications}</p>
              </div>
            )}
          </div>
        </div>

        {/* Platform Scores & Statistics */}
        <div className="space-y-3">
          <h6 className="font-semibold text-purple-700 border-b border-purple-200 pb-1">Platform Scores & Stats</h6>
          <div className="space-y-3 text-sm">
            <div className="bg-white p-3 rounded-lg border">
              <p className="font-medium mb-2">Credibility & Trust Scores</p>
              <div className="space-y-1">
                <p><strong>Credibility Score:</strong> 
                  <span className="text-lg font-semibold ml-2 text-purple-600">
                    {creator?.credibilityScore || '100.00'}
                  </span>
                </p>
                <p><strong>Social Score:</strong> 
                  <span className="ml-2 text-blue-600 font-semibold">
                    {creator?.socialScore || '0'} pts
                  </span>
                </p>
                <p><strong>Reliability Score:</strong> 
                  <span className="flex items-center gap-1 ml-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-semibold">{creator?.reliabilityScore || '0.00'}</span>
                    <span className="text-gray-500">({creator?.reliabilityRatingsCount || 0} ratings)</span>
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border">
              <p className="font-medium mb-2">Campaign Statistics</p>
              <div className="space-y-1">
                <p><strong>Campaigns Created:</strong> {creator?.campaignsCreated || 0}</p>
                <p><strong>Total Raised:</strong> ₱{creator?.totalRaised || '0'}</p>
                <p><strong>Campaign Chances Left:</strong> {creator?.remainingCampaignChances || 2}</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border">
              <p className="font-medium mb-2">Account Status</p>
              <div className="space-y-1">
                <p><strong>Account Status:</strong> 
                  <Badge variant={creator?.accountStatus === 'active' ? 'default' : 'destructive'} className="ml-2">
                    {creator?.accountStatus || 'active'}
                  </Badge>
                </p>
                <p><strong>Profile Complete:</strong> 
                  <Badge variant={creator?.isProfileComplete ? 'default' : 'secondary'} className="ml-2">
                    {creator?.isProfileComplete ? 'Yes' : 'No'}
                  </Badge>
                </p>
                {creator?.isFlagged && (
                  <div>
                    <p><strong>⚠️ Flagged:</strong> {creator?.flagReason}</p>
                    <p className="text-xs text-gray-500">Flagged on: {new Date(creator?.flaggedAt).toLocaleDateString()}</p>
                  </div>
                )}
                {creator?.isSuspended && (
                  <div>
                    <p><strong>🚫 Suspended:</strong> {creator?.suspensionReason}</p>
                    <p className="text-xs text-gray-500">Suspended on: {new Date(creator?.suspendedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border">
              <p className="font-medium mb-2">Wallet Balances</p>
              <div className="space-y-1">
                <p><strong>PHP Balance:</strong> ₱{creator?.phpBalance || '0.00'}</p>
                <p><strong>Tips Balance:</strong> ₱{creator?.tipsBalance || '0.00'}</p>
                <p><strong>Contributions Balance:</strong> ₱{creator?.contributionsBalance || '0.00'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  const renderCampaignList = (campaigns: any[], showClaimButton = false) => (
    <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      {campaigns.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No campaigns found</p>
      ) : (
        campaigns.slice(0, 10).map((campaign: any) => (
          <div key={campaign.id} className="border rounded-lg p-3 md:p-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1 md:gap-3 mb-2">
                  <h4 className="font-medium text-sm md:text-base truncate">{campaign.title}</h4>
                  {campaign.campaignDisplayId && (
                    <div className="bg-blue-100 text-blue-800 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-xs font-medium">
                      <span className="font-mono text-xs" data-testid={`campaign-display-id-${campaign.id}`}>
                        {campaign.campaignDisplayId}
                      </span>
                    </div>
                  )}
                  {campaign.claimedBy && (
                    <div className="bg-gray-100 text-gray-700 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-medium border border-gray-300">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-500 rounded-full"></span>
                        <span className="hidden sm:inline">CLAIMED by {campaign.claimedBy}</span>
                        <span className="sm:hidden">{campaign.claimedBy}</span>
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-2">{campaign.description?.substring(0, 100)}...</p>
                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm">
                  <span>Goal: ₱{campaign.goalAmount?.toLocaleString() || '0'}</span>
                  <span>Current: ₱{campaign.currentAmount?.toLocaleString() || '0'}</span>
                  <Badge variant="outline" className="text-xs">{campaign.category || 'General'}</Badge>
                </div>
              </div>
              <div className="flex flex-col gap-1 md:gap-2 flex-shrink-0">
                {showClaimButton && !campaign.claimedBy && !claimedCampaigns.includes(campaign.id) && (
                  <div className="flex flex-col sm:flex-row gap-1 md:gap-2">
                    <Button 
                      size="sm" 
                      variant="default"
                      className="text-xs px-2 md:px-3"
                      onClick={() => handleClaimCampaign(campaign.id)}
                      disabled={claimCampaignMutation.isPending}
                      data-testid={`button-claim-campaign-${campaign.id}`}
                    >
                      {claimCampaignMutation.isPending ? (
                        <>
                          <span className="hidden sm:inline">Claiming...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden sm:inline">CLAIM</span>
                          <span className="sm:hidden">C</span>
                        </>
                      )}
                    </Button>
                    {((user as any)?.isAdmin || (user as any)?.isManager) && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-xs px-2 md:px-3"
                        onClick={() => handleAssignCampaign(campaign.id)}
                        disabled={assignCampaignMutation.isPending}
                        data-testid={`button-assign-campaign-${campaign.id}`}
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        {assignCampaignMutation.isPending ? (
                          <>
                            <span className="hidden sm:inline">Assigning...</span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden sm:inline">Assign</span>
                            <span className="sm:hidden">A</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
                {showClaimButton && (campaign.claimedBy || claimedCampaigns.includes(campaign.id)) && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    disabled
                    className="opacity-50 cursor-not-allowed bg-gray-100 text-gray-500"
                    data-testid={`button-claimed-campaign-${campaign.id}`}
                  >
                    ✓ CLAIMED
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => toggleCampaignExpanded(`creator-${campaign.id}`)}
                  >
                    {expandedCampaigns.includes(`creator-${campaign.id}`) ? "Hide Creator" : "View Creator Details"}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => toggleCampaignExpanded(`campaign-${campaign.id}`)}
                  >
                    {expandedCampaigns.includes(`campaign-${campaign.id}`) ? "Hide Campaign" : "View Campaign Details"}
                  </Button>
                </div>
              </div>
            </div>
            {expandedCampaigns.includes(`creator-${campaign.id}`) && renderCreatorDetails(campaign.creator)}
            {expandedCampaigns.includes(`campaign-${campaign.id}`) && renderCampaignDetails(campaign)}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Campaign Management</h2>
      
      {/* Campaign Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-800" data-testid="stat-pending-campaigns">
                  {pendingCampaigns.length}
                </div>
                <div className="text-sm text-yellow-600">Pending</div>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-800" data-testid="stat-active-campaigns">
                  {activeCampaigns.length}
                </div>
                <div className="text-sm text-green-600">Active</div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-800" data-testid="stat-inprogress-campaigns">
                  {inProgressCampaigns.length}
                </div>
                <div className="text-sm text-blue-600">In Progress</div>
              </div>
              <BarChart className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-800" data-testid="stat-completed-campaigns">
                  {completedCampaigns.length}
                </div>
                <div className="text-sm text-purple-600">Completed</div>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-800" data-testid="stat-rejected-campaigns">
                  {rejectedCampaigns.length}
                </div>
                <div className="text-sm text-red-600">Rejected</div>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800" data-testid="stat-cancelled-campaigns">
                  {closedCampaigns.length}
                </div>
                <div className="text-sm text-gray-600">Closed</div>
              </div>
              <XCircle className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Campaign Administration</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Campaign Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search campaigns by title, description, creator, ID, category, or amount..."
                value={campaignSearchQuery}
                onChange={(e) => setCampaignSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-campaign-search"
              />
            </div>
            {campaignSearchQuery && (
              <p className="text-sm text-gray-500 mt-2">
                Searching for: "<span className="font-medium">{campaignSearchQuery}</span>"
              </p>
            )}
          </div>

          <Tabs value={activeCampaignTab} onValueChange={setActiveCampaignTab}>
            <div className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1 p-1 bg-gray-100 rounded-lg">
                <TabsTrigger 
                  value="requests" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Pending</span>
                  <span className="sm:hidden">Pending</span>
                  <span className="ml-1 bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded-full">{getFilteredCampaigns(pendingCampaigns, 'pending').length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="active" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Active</span>
                  <span className="sm:hidden">Active</span>
                  <span className="ml-1 bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full">{getFilteredCampaigns(activeCampaigns, 'active').length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="in-progress" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">In Progress</span>
                  <span className="sm:hidden">Progress</span>
                  <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">{getFilteredCampaigns(inProgressCampaigns, 'in-progress').length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="completed" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Completed</span>
                  <span className="sm:hidden">Done</span>
                  <span className="ml-1 bg-purple-100 text-purple-800 text-xs px-1.5 py-0.5 rounded-full">{getFilteredCampaigns(completedCampaigns, 'completed').length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="rejected" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Rejected</span>
                  <span className="sm:hidden">Rejected</span>
                  <span className="ml-1 bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded-full">{getFilteredCampaigns(rejectedCampaigns, 'rejected').length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="closed" 
                  className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  <span className="hidden sm:inline">Closed</span>
                  <span className="sm:hidden">Closed</span>
                  <span className="ml-1 bg-gray-100 text-gray-800 text-xs px-1.5 py-0.5 rounded-full">{getFilteredCampaigns(closedCampaigns, 'closed').length}</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="requests" className="mt-4">
              {(() => {
                const filteredCampaigns = getFilteredCampaigns(pendingCampaigns, 'pending');
                return filteredCampaigns.length === 0 && campaignSearchQuery ? (
                  <p className="text-center text-gray-500 py-8">
                    No pending campaigns found matching "{campaignSearchQuery}"
                  </p>
                ) : (
                  renderCampaignList(filteredCampaigns, true)
                );
              })()}
            </TabsContent>

            <TabsContent value="active" className="mt-4">
              {(() => {
                const filteredCampaigns = getFilteredCampaigns(activeCampaigns, 'active');
                return filteredCampaigns.length === 0 && campaignSearchQuery ? (
                  <p className="text-center text-gray-500 py-8">
                    No active campaigns found matching "{campaignSearchQuery}"
                  </p>
                ) : (
                  renderCampaignList(filteredCampaigns)
                );
              })()}
            </TabsContent>

            <TabsContent value="in-progress" className="mt-4">
              {(() => {
                const filteredCampaigns = getFilteredCampaigns(inProgressCampaigns, 'in-progress');
                return filteredCampaigns.length === 0 && campaignSearchQuery ? (
                  <p className="text-center text-gray-500 py-8">
                    No in-progress campaigns found matching "{campaignSearchQuery}"
                  </p>
                ) : (
                  renderCampaignList(filteredCampaigns)
                );
              })()}
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              {(() => {
                const filteredCampaigns = getFilteredCampaigns(completedCampaigns, 'completed');
                return filteredCampaigns.length === 0 && campaignSearchQuery ? (
                  <p className="text-center text-gray-500 py-8">
                    No completed campaigns found matching "{campaignSearchQuery}"
                  </p>
                ) : (
                  renderCampaignList(filteredCampaigns)
                );
              })()}
            </TabsContent>

            <TabsContent value="rejected" className="mt-4">
              {(() => {
                const filteredCampaigns = getFilteredCampaigns(rejectedCampaigns, 'rejected');
                return filteredCampaigns.length === 0 && campaignSearchQuery ? (
                  <p className="text-center text-gray-500 py-8">
                    No rejected campaigns found matching "{campaignSearchQuery}"
                  </p>
                ) : (
                  renderCampaignList(filteredCampaigns)
                );
              })()}
            </TabsContent>

            <TabsContent value="closed" className="mt-4">
              {(() => {
                const filteredCampaigns = getFilteredCampaigns(closedCampaigns, 'closed');
                return filteredCampaigns.length === 0 && campaignSearchQuery ? (
                  <p className="text-center text-gray-500 py-8">
                    No closed campaigns found matching "{campaignSearchQuery}"
                  </p>
                ) : (
                  renderCampaignList(filteredCampaigns)
                );
              })()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Assign Campaign Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={(open) => setAssignDialog({ ...assignDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Campaign to Admin</DialogTitle>
            <DialogDescription>
              Select an admin to assign this campaign to for review and processing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Admin</label>
              <Select
                value={assignDialog.selectedAdmin}
                onValueChange={(value) => setAssignDialog({ ...assignDialog, selectedAdmin: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an admin..." />
                </SelectTrigger>
                <SelectContent>
                  {adminsList.map((admin: any) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.name || admin.email || `Admin ${admin.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignDialog({ open: false, campaignId: '', selectedAdmin: '' })}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAssignCampaign}
              disabled={!assignDialog.selectedAdmin || assignCampaignMutation.isPending}
            >
              {assignCampaignMutation.isPending ? "Assigning..." : "Assign Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
// Volunteer Management Section - Section 5
function VolunteersSection() {
  const [activeVolunteerTab, setActiveVolunteerTab] = useState("opportunities");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [volunteerSearchQuery, setVolunteerSearchQuery] = useState("");

  const { data: opportunities = [] } = useQuery({
    queryKey: ['/api/admin/volunteer-opportunities'],
    retry: false,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['/api/admin/volunteer-applications'],
    retry: false,
  });



  const toggleItemExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Filter volunteer data based on search query
  const getFilteredVolunteerData = (data: any[], tabType: string) => {
    if (!volunteerSearchQuery.trim()) return data;
    
    const searchLower = volunteerSearchQuery.toLowerCase();
    return data.filter(item => {
      if (tabType === 'opportunities') {
        const searchFields = [
          item.id,
          item.title,
          item.description,
          item.location,
          item.duration,
          item.status,
          item.requirements,
          item.campaignTitle,
          item.creator?.firstName,
          item.creator?.lastName,
          item.creator?.email,
          item.slotsNeeded?.toString(),
          item.slotsFilled?.toString(),
          new Date(item.startDate || Date.now()).toLocaleDateString(),
          new Date(item.endDate || Date.now()).toLocaleDateString(),
          new Date(item.createdAt || Date.now()).toLocaleDateString()
        ];
        return searchFields.some(field => 
          field && field.toString().toLowerCase().includes(searchLower)
        );
      } else {
        // Applications
        const searchFields = [
          item.id,
          item.volunteerName,
          item.volunteerEmail,
          item.status,
          item.opportunityTitle,
          item.campaignTitle,
          item.coverLetter,
          item.experience,
          item.motivation,
          item.availability,
          new Date(item.appliedAt || Date.now()).toLocaleDateString(),
          new Date(item.appliedAt || Date.now()).toLocaleString()
        ];
        return searchFields.some(field => 
          field && field.toString().toLowerCase().includes(searchLower)
        );
      }
    });
  };

  const renderVolunteerOpportunityDetails = (opportunity: any) => (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h5 className="font-semibold mb-3">Volunteer Opportunity Details</h5>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <p><strong>Title:</strong> {opportunity.title}</p>
          <p><strong>Campaign:</strong> {opportunity.campaignTitle || 'N/A'}</p>
          <p><strong>Description:</strong> {opportunity.description?.substring(0, 150)}...</p>
          <p><strong>Location:</strong> {opportunity.location || 'Remote'}</p>
          <p><strong>Duration:</strong> {opportunity.duration || 'Flexible'}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p><strong>Slots Needed:</strong> {opportunity.slotsNeeded || 0}</p>
          <p><strong>Slots Filled:</strong> {opportunity.slotsFilled || 0}</p>
          <p><strong>Status:</strong> <Badge variant="outline">{opportunity.status}</Badge></p>
          <p><strong>Start Date:</strong> {opportunity.startDate ? new Date(opportunity.startDate).toLocaleDateString() : 'TBD'}</p>
          <p><strong>End Date:</strong> {opportunity.endDate ? new Date(opportunity.endDate).toLocaleDateString() : 'TBD'}</p>
        </div>
      </div>
      <div className="mt-3">
        <p><strong>Requirements:</strong></p>
        <p className="text-sm text-gray-600 mt-1">{opportunity.requirements || 'No specific requirements listed'}</p>
      </div>
      <div className="mt-3">
        <p><strong>Creator Information:</strong></p>
        <div className="flex items-center gap-3 mt-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={opportunity.creator?.profileImageUrl} />
            <AvatarFallback>{opportunity.creator?.firstName?.[0]}{opportunity.creator?.lastName?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{opportunity.creator?.firstName} {opportunity.creator?.lastName}</p>
            <p className="text-xs text-gray-600">{opportunity.creator?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOpportunitiesList = (opportunities: any[]) => (
    <div className="space-y-3">
      {opportunities.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No volunteer opportunities found</p>
      ) : (
        opportunities.map((opportunity: any) => (
          <div key={opportunity.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium mb-1">{opportunity.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{opportunity.description?.substring(0, 100)}...</p>
                <div className="flex items-center gap-4 text-sm">
                  <span>Slots: {opportunity.slotsFilled || 0}/{opportunity.slotsNeeded || 0}</span>
                  <span>Location: {opportunity.location || 'Remote'}</span>
                  <Badge variant="outline">{opportunity.status}</Badge>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open(`/user-profile/${opportunity.creator?.id}`, '_blank')}
                  data-testid={`button-view-creator-profile-${opportunity.creator?.id}`}
                >
                  <UserIcon className="h-4 w-4 mr-1" />
                  View Creator Profile
                </Button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderApplicationsList = (applications: any[]) => (
    <div className="space-y-3">
      {applications.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No volunteer applications found</p>
      ) : (
        applications.map((application: any) => (
          <div key={application.id} className="border rounded-lg p-4" data-testid={`volunteer-application-${application.id}`}>
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="grid grid-cols-4 gap-4 items-center">
                  {/* Volunteer's Name */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={application.volunteer?.profileImageUrl} />
                      <AvatarFallback>{application.volunteer?.firstName?.[0]}{application.volunteer?.lastName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium" data-testid={`volunteer-name-${application.volunteer?.id}`}>
                        {application.volunteer?.name || `${application.volunteer?.firstName} ${application.volunteer?.lastName}`.trim()}
                      </h4>
                      <Badge variant={
                        application.status === 'approved' ? 'default' : 
                        application.status === 'rejected' ? 'destructive' : 'outline'
                      } className="text-xs">
                        {application.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Volunteer's Email */}
                  <div>
                    <p className="text-sm text-gray-600" data-testid={`volunteer-email-${application.volunteer?.id}`}>
                      {application.volunteer?.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      Applied: {new Date(application.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Volunteer Rating */}
                  <div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium" data-testid={`volunteer-rating-${application.volunteer?.id}`}>
                        {application.volunteer?.reliabilityScore || 0}/5
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Reliability Score</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(`/user-profile/${application.volunteer?.id}`, '_blank')}
                      data-testid={`button-view-profile-${application.volunteer?.id}`}
                    >
                      <UserIcon className="h-4 w-4 mr-1" />
                      View Profile
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(`/campaign/${application.campaign?.id}`, '_blank')}
                      data-testid={`button-view-campaign-${application.campaign?.id}`}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Campaign
                    </Button>
                  </div>
                </div>

                {/* Campaign Applied For */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Applied for campaign:</span> {application.campaign?.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    Category: {application.campaign?.category} • Status: {application.campaign?.status}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );



  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Volunteer Management</h2>
      
      {/* Volunteer Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-800" data-testid="stat-total-opportunities">
                  {opportunities.length}
                </div>
                <div className="text-sm text-blue-600">Total Volunteer Opportunities</div>
              </div>
              <Heart className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-800" data-testid="stat-total-applications">
                  {applications.length}
                </div>
                <div className="text-sm text-green-600">Total Volunteer Applications</div>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Volunteer Administration</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Volunteer Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search opportunities by title, description, location, creator... or applications by volunteer name, email, status..."
                value={volunteerSearchQuery}
                onChange={(e) => setVolunteerSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-volunteer-search"
              />
            </div>
            {volunteerSearchQuery && (
              <p className="text-sm text-gray-500 mt-2">
                Searching for: "<span className="font-medium">{volunteerSearchQuery}</span>"
              </p>
            )}
          </div>

          <Tabs value={activeVolunteerTab} onValueChange={setActiveVolunteerTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="opportunities">Opportunities ({getFilteredVolunteerData(opportunities, 'opportunities').length})</TabsTrigger>
              <TabsTrigger value="applications">Applications ({getFilteredVolunteerData(applications, 'applications').length})</TabsTrigger>
            </TabsList>

            <TabsContent value="opportunities" className="mt-4">
              {(() => {
                const filteredOpportunities = getFilteredVolunteerData(opportunities, 'opportunities');
                return filteredOpportunities.length === 0 && volunteerSearchQuery ? (
                  <p className="text-center text-gray-500 py-8">
                    No volunteer opportunities found matching "{volunteerSearchQuery}"
                  </p>
                ) : (
                  renderOpportunitiesList(filteredOpportunities)
                );
              })()}
            </TabsContent>

            <TabsContent value="applications" className="mt-4">
              {(() => {
                const filteredApplications = getFilteredVolunteerData(applications, 'applications');
                return filteredApplications.length === 0 && volunteerSearchQuery ? (
                  <p className="text-center text-gray-500 py-8">
                    No volunteer applications found matching "{volunteerSearchQuery}"
                  </p>
                ) : (
                  renderApplicationsList(filteredApplications)
                );
              })()}
            </TabsContent>


          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
// Financial Management Section - Section 6
function FinancialSection() {
  const [activeFinancialTab, setActiveFinancialTab] = useState("deposits");
  const [expandedTransactions, setExpandedTransactions] = useState<string[]>([]);
  const [financialSearchQuery, setFinancialSearchQuery] = useState("");

  const { data: deposits = [] } = useQuery({
    queryKey: ['/api/admin/financial/deposits'],
    retry: false,
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ['/api/admin/financial/withdrawals'],
    retry: false,
  });

  const { data: contributions = [] } = useQuery({
    queryKey: ['/api/admin/financial/contributions'],
    retry: false,
  });

  const { data: tips = [] } = useQuery({
    queryKey: ['/api/admin/financial/tips'],
    retry: false,
  });

  const { data: claimedContributions = [] } = useQuery({
    queryKey: ['/api/admin/financial/claimed-contributions'],
    retry: false,
  });

  const { data: claimedTips = [] } = useQuery({
    queryKey: ['/api/admin/financial/claimed-tips'],
    retry: false,
  });

  const { data: pendingTransactions = [] } = useQuery({
    queryKey: ['/api/admin/financial/pending-transactions'],
    retry: false,
  });

  const { data: completedTransactions = [] } = useQuery({
    queryKey: ['/api/admin/financial/completed-transactions'],
    retry: false,
  });

  const { data: failedTransactions = [] } = useQuery({
    queryKey: ['/api/admin/financial/failed-transactions'],
    retry: false,
  });

  const toggleTransactionExpanded = (transactionId: string) => {
    setExpandedTransactions(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  // Filter financial data based on search query
  const getFilteredFinancialData = (data: any[], tabType: string) => {
    if (!financialSearchQuery.trim()) return data;
    
    const searchLower = financialSearchQuery.toLowerCase();
    return data.filter(item => {
      const searchFields = [
        item.id,
        item.type,
        item.status,
        item.amount?.toString(),
        item.method,
        item.description,
        item.reference,
        item.paymentReference,
        item.campaignTitle,
        item.userDisplayId,
        item.userId,
        item.userEmail,
        item.userName,
        item.userFirstName,
        item.userLastName,
        item.createdAt && new Date(item.createdAt).toLocaleDateString(),
        item.createdAt && new Date(item.createdAt).toLocaleString(),
        item.processedAt && new Date(item.processedAt).toLocaleDateString(),
        item.processedAt && new Date(item.processedAt).toLocaleString(),
        // For transaction objects
        item.transaction?.id,
        item.transaction?.type,
        item.transaction?.status,
        item.transaction?.amount?.toString(),
        item.transaction?.method,
        item.transaction?.description,
        item.transaction?.reference,
        item.transaction?.paymentReference
      ];
      
      return searchFields.some(field => 
        field && field.toString().toLowerCase().includes(searchLower)
      );
    });
  };

  const renderTransactionDetails = (transaction: any) => (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h5 className="font-semibold mb-3">Transaction Details</h5>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <p className="break-all"><strong>Full Transaction ID:</strong> {transaction.transactionId || transaction.id}</p>
          <p><strong>Transaction Type:</strong> {transaction.transactionType || transaction.type || 'N/A'}</p>
          <p className="whitespace-nowrap"><strong>Amount:</strong> ₱{transaction.amount || '0.00'}</p>
          <p><strong>Fee:</strong> ₱{transaction.fee || '0.00'}</p>
          <p className="whitespace-nowrap"><strong>Net Amount:</strong> ₱{(parseFloat(transaction.amount || '0') - parseFloat(transaction.fee || '0')).toFixed(2)}</p>
          <p><strong>Currency:</strong> {transaction.currency || 'PHP'}</p>        </div>
        <div className="space-y-2 text-sm">
          <p><strong>Status:</strong> <Badge variant={
            transaction.status === 'completed' || transaction.status === 'success' ? 'default' :
            transaction.status === 'failed' || transaction.status === 'rejected' ? 'destructive' :
            transaction.status === 'pending' ? 'outline' : 'secondary'
          }>{transaction.status || 'unknown'}</Badge></p>
          <p><strong>Created:</strong> {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : 'N/A'}</p>
          <p><strong>Updated:</strong> {transaction.updatedAt ? new Date(transaction.updatedAt).toLocaleString() : 'N/A'}</p>
          <p><strong>Block Number:</strong> {transaction.blockNumber || 'N/A'}</p>
          <p><strong>Gas Used:</strong> {transaction.gasUsed || 'N/A'}</p>
          <p><strong>Gas Price:</strong> {transaction.gasPrice || 'N/A'}</p>
        </div>
      </div>
      <div className="mt-3">
        <p><strong>User Information:</strong></p>
        <div className="flex items-center gap-3 mt-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={transaction.user?.profileImageUrl} />
            <AvatarFallback>{transaction.user?.firstName?.[0]}{transaction.user?.lastName?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{transaction.user?.firstName} {transaction.user?.lastName}</p>
            <p className="text-xs text-gray-600">{transaction.user?.email}</p>
            <p className="text-xs text-gray-500">User ID: {transaction.user?.userDisplayId || transaction.userId || 'N/A'}</p>
          </div>
        </div>
      </div>
      {transaction.description && (
        <div className="mt-3">
          <p><strong>Description:</strong></p>
          <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
        </div>
      )}
      {transaction.campaignId && (
        <div className="mt-3">
          <p><strong>Related Campaign:</strong></p>
          <p className="text-sm text-gray-600 mt-1">Campaign ID: {transaction.campaignId}</p>
          <p className="text-sm text-gray-600">Campaign: {transaction.campaign?.title || 'N/A'}</p>
        </div>
      )}
    </div>
  );

  const renderTransactionList = (transactions: any[], title: string) => (
    <div className="space-y-3">
      <h4 className="font-medium text-lg mb-4">{title}</h4>
      {transactions.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No transactions found</p>
      ) : (
        <div className="space-y-2">
          {transactions.map((transaction: any) => (
            <div key={transaction.id} className="border rounded-lg p-4 bg-white">
<div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4 items-center">
                <div>
                  <p className="font-medium text-xs sm:text-sm">{transaction.transactionType || transaction.type || 'N/A'}</p>
                  <p className="text-xs text-gray-500">Type</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm">                    {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : 
                     transaction.transactionDate ? new Date(transaction.transactionDate).toLocaleString() : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">Date & Time</p>
                </div>
                <div>
<div className="flex items-center gap-2 max-w-[140px] sm:max-w-none">
                    {transaction.transactionDisplayId && (
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium truncate">
                        <span className="font-mono truncate" data-testid={`transaction-display-id-${transaction.id}`}>                          {transaction.transactionDisplayId}
                        </span>
                      </div>
                    )}
                    {!transaction.transactionDisplayId && (
<p className="text-xs sm:text-sm font-mono truncate">
                        {(transaction.transactionId || transaction.id || 'N/A').substring(0, 12)}...                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Transaction ID</p>
                </div>
                <div>
<p className="text-sm font-semibold whitespace-nowrap">                    ₱{transaction.amount || '0.00'}
                  </p>
                  <p className="text-xs text-gray-500">Amount</p>
                </div>
                <div>
                  <Badge variant={
                    transaction.status === 'completed' || transaction.status === 'success' ? 'default' :
                    transaction.status === 'failed' || transaction.status === 'rejected' ? 'destructive' :
                    transaction.status === 'pending' ? 'outline' : 'secondary'
                  }>
                    {transaction.status || 'unknown'}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">Status</p>
                </div>
<div className="flex gap-2 col-span-2 sm:col-span-1">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full sm:w-auto"                    onClick={() => toggleTransactionExpanded(transaction.id)}
                  >
                    {expandedTransactions.includes(transaction.id) ? "Hide Details" : "VIEW TRANSACTION DETAILS"}
                  </Button>
                </div>
              </div>
              {expandedTransactions.includes(transaction.id) && renderTransactionDetails(transaction)}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Calculate analytics totals
  const totalDeposits = deposits.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);
  const totalWithdrawals = withdrawals.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);
  const totalContributions = contributions.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);
  const totalTips = tips.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);
  const totalPending = pendingTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);
  const totalCompleted = completedTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);
  const totalFailed = failedTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Financial Management</h2>
      
      {/* Analytics Cards */}
      <div className="space-y-4">
        {/* First Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-center">Total Deposits</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">₱{totalDeposits.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{deposits.length} transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-center">Total Withdrawals</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">₱{totalWithdrawals.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{withdrawals.length} transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-center">Total Contributions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">₱{totalContributions.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{contributions.length} transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-center">Total Tips</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">₱{totalTips.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{tips.length} transactions</p>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-center">Total Pending</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">₱{totalPending.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{pendingTransactions.length} transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-center">Total Successful</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">₱{totalCompleted.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{completedTransactions.length} transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-center">Total Failed</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">₱{totalFailed.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{failedTransactions.length} transactions</p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Blockchain Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Financial Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions by ID, amount, status, method, description, user details, reference..."
                value={financialSearchQuery}
                onChange={(e) => setFinancialSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-financial-search"
              />
            </div>
            {financialSearchQuery && (
              <p className="text-sm text-gray-500 mt-2">
                Searching for: "<span className="font-medium">{financialSearchQuery}</span>"
              </p>
            )}
          </div>

          <Tabs value={activeFinancialTab} onValueChange={setActiveFinancialTab}>
            <TabsList className="grid w-full grid-cols-7 text-xs">
              <TabsTrigger value="deposits">Deposits ({getFilteredFinancialData(deposits, 'deposits').length})</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals ({getFilteredFinancialData(withdrawals, 'withdrawals').length})</TabsTrigger>
              <TabsTrigger value="contributions">Contributions ({getFilteredFinancialData(contributions, 'contributions').length})</TabsTrigger>
              <TabsTrigger value="tips">Tips ({getFilteredFinancialData(tips, 'tips').length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({getFilteredFinancialData(pendingTransactions, 'pending').length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({getFilteredFinancialData(completedTransactions, 'completed').length})</TabsTrigger>
              <TabsTrigger value="failed">Failed ({getFilteredFinancialData(failedTransactions, 'failed').length})</TabsTrigger>
            </TabsList>

            <TabsContent value="deposits" className="mt-4">
              {(() => {
                const filteredData = getFilteredFinancialData(deposits, 'deposits');
                return filteredData.length === 0 && financialSearchQuery ? (
                  <p className="text-center text-gray-500 py-8">
                    No deposit transactions found matching "{financialSearchQuery}"
                  </p>
                ) : (
                  renderTransactionList(filteredData, 'Deposit Transactions')
                );
              })()}
            </TabsContent>

            <TabsContent value="withdrawals" className="mt-4">
              {(() => {
                const filteredData = getFilteredFinancialData(withdrawals, 'withdrawals');
                return filteredData.length === 0 && financialSearchQuery ? (
                  <p className="text-center text-gray-500 py-8">
                    No withdrawal transactions found matching "{financialSearchQuery}"
                  </p>
                ) : (
                  renderTransactionList(filteredData, 'Withdrawal Transactions')
                );
              })()}
            </TabsContent>

            <TabsContent value="contributions" className="mt-4">
              {(() => {
                const filteredData = getFilteredFinancialData(contributions, 'contributions');
                return filteredData.length === 0 && financialSearchQuery ? (
                  <p className="text-center text-gray-500 py-8">
                    No contribution transactions found matching "{financialSearchQuery}"
                  </p>
                ) : (
                  renderTransactionList(filteredData, 'Contribution Transactions')
                );
              })()}
            </TabsContent>

            <TabsContent value="tips" className="mt-4">
              {(() => {
                const filteredData = getFilteredFinancialData(tips, 'tips');
                return filteredData.length === 0 && financialSearchQuery ? (
                  <p className="text-center text-gray-500 py-8">
                    No tip transactions found matching "{financialSearchQuery}"
                  </p>
                ) : (
                  renderTransactionList(filteredData, 'Tip Transactions')
                );
              })()}
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              {(() => {
                const filteredData = getFilteredFinancialData(pendingTransactions, 'pending');
                return filteredData.length === 0 && financialSearchQuery ? (
                  <p className="text-center text-gray-500 py-8">
                    No pending transactions found matching "{financialSearchQuery}"
                  </p>
                ) : (
                  renderTransactionList(filteredData, 'All Pending Transactions')
                );
              })()}
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              {(() => {
                const filteredData = getFilteredFinancialData(completedTransactions, 'completed');
                return filteredData.length === 0 && financialSearchQuery ? (
                  <p className="text-center text-gray-500 py-8">
                    No completed transactions found matching "{financialSearchQuery}"
                  </p>
                ) : (
                  renderTransactionList(filteredData, 'All Completed Transactions')
                );
              })()}
            </TabsContent>

            <TabsContent value="failed" className="mt-4">
              {(() => {
                const filteredData = getFilteredFinancialData(failedTransactions, 'failed');
                return filteredData.length === 0 && financialSearchQuery ? (
                  <p className="text-center text-gray-500 py-8">
                    No failed transactions found matching "{financialSearchQuery}"
                  </p>
                ) : (
                  renderTransactionList(filteredData, 'All Failed Transactions')
                );
              })()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
// Notifications Management Section - Section 6.5
function NotificationsSection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all platform notifications (admin view)
  const { data: allNotifications = [], isLoading: loadingNotifications } = useQuery({
    queryKey: ['/api/admin/notifications'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest('PATCH', `/api/notifications/${notificationId}/read`);
      if (!response.ok) throw new Error('Failed to mark notification as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
      toast({
        title: "Notification marked as read",
        description: "The notification has been marked as read",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      });
    }
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', '/api/notifications/mark-all-read');
      if (!response.ok) throw new Error('Failed to mark all notifications as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
      toast({
        title: "All notifications marked as read",
        description: "All notifications have been marked as read",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive"
      });
    }
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'fraud_report_submitted':
      case 'campaign_reported':
      case 'creator_reported':
        return <Flag className="h-5 w-5 text-red-500" />;
      case 'kyc_submitted':
      case 'kyc_approved':
      case 'kyc_rejected':
        return <Shield className="h-5 w-5 text-blue-500" />;
      case 'campaign_created':
      case 'campaign_updated':
        return <Target className="h-5 w-5 text-green-500" />;
      case 'volunteer_applied':
      case 'volunteer_approved':
      case 'volunteer_rejected':
        return <Users className="h-5 w-5 text-purple-500" />;
      case 'contribution_made':
      case 'tip_sent':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'fraud_report_submitted':
      case 'campaign_reported':
      case 'creator_reported':
        return 'border-red-200 bg-red-50';
      case 'kyc_submitted':
      case 'kyc_approved':
      case 'kyc_rejected':
        return 'border-blue-200 bg-blue-50';
      case 'campaign_created':
      case 'campaign_updated':
        return 'border-green-200 bg-green-50';
      case 'volunteer_applied':
      case 'volunteer_approved':
      case 'volunteer_rejected':
        return 'border-purple-200 bg-purple-50';
      case 'contribution_made':
      case 'tip_sent':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (loadingNotifications) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading Notifications...</span>
      </div>
    );
  }

  const unreadCount = allNotifications.filter((n: any) => !n.readAt).length;

  return (
    <div className="space-y-6 px-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm text-gray-500">Admin Panel</span>
            <span className="text-gray-400">/</span>
            <span className="text-sm text-gray-700 font-medium">Notifications</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Notifications</h1>
          <p className="text-gray-600 mt-2">Monitor all platform activities and user actions</p>
          <div className="mt-2 flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-blue-600 font-medium">Admin View - All Platform Notifications</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setActiveTab('profile');
              const params = new URLSearchParams(window.location.search);
              params.set('tab', 'profile');
              window.history.replaceState({}, '', `/admin?${params.toString()}`);
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Panel
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Notifications ({allNotifications.length})</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-sm">
                {unreadCount} unread
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {allNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No notifications yet</p>
              <p className="text-sm">Notifications will appear here when users take actions</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allNotifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${getNotificationColor(notification.type)} ${
                    !notification.readAt ? 'ring-2 ring-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          {!notification.readAt && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Type: {notification.type}</span>
                          <span>User: {notification.userId}</span>
                          <span>{new Date(notification.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!notification.readAt && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          disabled={markAsReadMutation.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}// Reports Management Section - Section 7
function ReportsSection() {
  const [activeReportsTab, setActiveReportsTab] = useState("document");
  const [activeProcessedTab, setActiveProcessedTab] = useState("document");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [claimingReport, setClaimingReport] = useState<string | null>(null);
  const [claimedReports, setClaimedReports] = useState<Set<string>>(new Set());
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<any>(null);
  const [loadingReportDetails, setLoadingReportDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"pending" | "processed">("pending");
const [isCleaningUp, setIsCleaningUp] = useState(false);  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Function to handle viewing report details with enhanced data fetching
  const handleViewReport = async (report: any) => {
    console.log('Opening report modal for:', report);
    setSelectedReport(report);
    setShowReportModal(true);
    setLoadingReportDetails(true);
    
    try {
      let enhancedReport = { ...report };
      console.log('Starting to enhance report:', enhancedReport);
      
      // Fetch campaign details if campaign ID is available
let campaignId = null;
      
      console.log('🔍 Report data for campaign ID extraction:', {
        relatedId: report.relatedId,
        relatedType: report.relatedType,
        reportType: report.reportType
      });
      
      // For campaign reports, use relatedId
      if (report.relatedId && report.relatedType === 'campaign') {
        campaignId = report.relatedId;
        console.log('📋 Campaign report - using relatedId as campaignId:', campaignId);
      }
      // For document reports, use relatedId (which now contains campaignId)
      else if (report.relatedType === null || report.relatedType === 'document') {
        // The backend now stores campaignId in relatedId field
        campaignId = report.relatedId || null;
        console.log('📋 Document report - using relatedId as campaignId:', campaignId);
      }
      
      if (campaignId) {
        console.log('Fetching campaign details for:', campaignId);
        try {
          const campaignResponse = await apiRequest('GET', `/api/campaigns/${campaignId}`);          if (campaignResponse.ok) {
            const campaignData = await campaignResponse.json();
            console.log('Campaign data received:', campaignData);
            enhancedReport.campaign = campaignData;
          } else {
            console.log('Campaign fetch failed:', campaignResponse.status);
          }
        } catch (error) {
          console.log('Campaign fetch error:', error);
        }
      }
      
      // Fetch creator details if creator ID is available  
const creatorId = enhancedReport.campaign?.creatorId;
      if (creatorId) {
        console.log('Fetching creator details for:', creatorId);
        try {
          const creatorResponse = await apiRequest('GET', `/api/admin/users/${creatorId}`);          if (creatorResponse.ok) {
            const creatorData = await creatorResponse.json();
            console.log('Creator data received:', creatorData);
            enhancedReport.creator = creatorData;
          } else {
            console.log('Creator fetch failed:', creatorResponse.status);
          }
        } catch (error) {
          console.log('Creator fetch error:', error);
        }
      }
      
// Fetch document details if document ID is available (for document reports)
      if (report.documentId && (report.relatedType === null || report.relatedType === 'document')) {
        console.log('Fetching document details for:', report.documentId);
        try {
          // Fetch actual document details from the database
          const documentResponse = await apiRequest('GET', `/api/admin/documents/${report.documentId}`);
          if (documentResponse.ok) {
            const documentData = await documentResponse.json();
            console.log('Document data received:', documentData);
            enhancedReport.document = documentData;
          } else {
            console.log('Document fetch failed:', documentResponse.status);
            // Fallback to just storing the ID
            enhancedReport.document = { id: report.documentId };
          }
        } catch (error) {
          console.log('Document fetch error:', error);
          // Fallback to just storing the ID
          enhancedReport.document = { id: report.documentId };
        }
      }      // Fetch reporter details if reporter ID is available
      if (report.reporterId) {
        console.log('Fetching reporter details for:', report.reporterId);
        try {
const reporterResponse = await apiRequest('GET', `/api/admin/users/${report.reporterId}`);          if (reporterResponse.ok) {
            const reporterData = await reporterResponse.json();
            console.log('Reporter data received:', reporterData);
            enhancedReport.reporter = reporterData;
          } else {
            console.log('Reporter fetch failed:', reporterResponse.status);
          }
        } catch (error) {
          console.log('Reporter fetch error:', error);
        }
      }
      
      console.log('Final enhanced report:', enhancedReport);
      setSelectedReport(enhancedReport);
    } catch (error) {
      console.error('Error enhancing report details:', error);
    } finally {
      setLoadingReportDetails(false);
    }
  };

  // Data queries with proper error handling and type safety
  const { data: documentReports = [], isLoading: loadingDocuments } = useQuery({
    queryKey: ['/api/admin/reports/document'],
    retry: false,
  });

  const { data: campaignReports = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ['/api/admin/reports/campaigns'],
    retry: false,
  });

  const { data: volunteerReports = [], isLoading: loadingVolunteers } = useQuery({
    queryKey: ['/api/admin/reports/volunteers'],
    retry: false,
  });

  const { data: creatorReports = [], isLoading: loadingCreators } = useQuery({
    queryKey: ['/api/admin/reports/creators'],
    retry: false,
  });

  const { data: transactionReports = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['/api/admin/reports/transactions'],
    retry: false,
  });

  // Processed reports queries
  const { data: processedDocumentReports = [], isLoading: loadingProcessedDocuments } = useQuery({
    queryKey: ['/api/admin/reports/processed/document'],
    retry: false,
  });

  const { data: processedCampaignReports = [], isLoading: loadingProcessedCampaigns } = useQuery({
    queryKey: ['/api/admin/reports/processed/campaigns'],
    retry: false,
  });

  const { data: processedVolunteerReports = [], isLoading: loadingProcessedVolunteers } = useQuery({
    queryKey: ['/api/admin/reports/processed/volunteers'],
    retry: false,
  });

  const { data: processedCreatorReports = [], isLoading: loadingProcessedCreators } = useQuery({
    queryKey: ['/api/admin/reports/processed/creators'],
    retry: false,
  });

  const { data: processedTransactionReports = [], isLoading: loadingProcessedTransactions } = useQuery({
    queryKey: ['/api/admin/reports/processed/transactions'],
    retry: false,
  });

  const isLoading = loadingDocuments || loadingCampaigns || loadingVolunteers || loadingCreators || loadingTransactions;
  const isLoadingProcessed = loadingProcessedDocuments || loadingProcessedCampaigns || loadingProcessedVolunteers || loadingProcessedCreators || loadingProcessedTransactions;

  // Search functionality
  const filterReports = (reports: any[], query: string) => {
    if (!query.trim()) return reports;
    
    const lowercaseQuery = query.toLowerCase();
    return reports.filter((report: any) => {
      // Search in report ID
      if (report.id?.toLowerCase().includes(lowercaseQuery) || 
          report.reportId?.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Search in description
      if (report.description?.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Search in report type
      if (report.reportType?.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Search in status
      if (report.status?.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Search in reporter information
      if (report.reporter?.email?.toLowerCase().includes(lowercaseQuery) ||
          report.reporter?.firstName?.toLowerCase().includes(lowercaseQuery) ||
          report.reporter?.lastName?.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Search in campaign title (for campaign reports)
      if (report.campaignTitle?.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Search in creator name (for creator reports)
      if (report.creatorName?.toLowerCase().includes(lowercaseQuery) ||
          report.firstName?.toLowerCase().includes(lowercaseQuery) ||
          report.lastName?.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Search in volunteer name (for volunteer reports)
      if (report.volunteerName?.toLowerCase().includes(lowercaseQuery) ||
          report.applicantName?.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Search in admin notes
      if (report.adminNotes?.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Search in dates (formatted)
      if (report.createdAt) {
        const dateStr = new Date(report.createdAt).toLocaleDateString().toLowerCase();
        if (dateStr.includes(lowercaseQuery)) return true;
      }
      
      if (report.resolvedAt) {
        const dateStr = new Date(report.resolvedAt).toLocaleDateString().toLowerCase();
        if (dateStr.includes(lowercaseQuery)) return true;
      }
      
      return false;
    });
  };

  // Get filtered reports based on current search
  const getFilteredReports = (reportType: string, mode: 'pending' | 'processed') => {
    let reports: any[] = [];
    
    if (mode === 'pending') {
      switch (reportType) {
        case 'document': reports = documentReports; break;
        case 'campaigns': reports = campaignReports; break;
        case 'volunteers': reports = volunteerReports; break;
        case 'creators': reports = creatorReports; break;
        case 'transactions': reports = transactionReports; break;
        default: reports = [];
      }
    } else {
      switch (reportType) {
        case 'document': reports = processedDocumentReports; break;
        case 'campaigns': reports = processedCampaignReports; break;
        case 'volunteers': reports = processedVolunteerReports; break;
        case 'creators': reports = processedCreatorReports; break;
        case 'transactions': reports = processedTransactionReports; break;
        default: reports = [];
      }
    }
    
    return filterReports(reports, searchQuery);
  };

  // Function to handle report status updates
  const handleUpdateReportStatus = async (reportId: string, status: string, reason?: string) => {
    try {
await apiRequest('PATCH', `/api/admin/reports/${reportId}/status`, { status, reason });      toast({
        title: "Report Updated",
        description: `Report status changed to ${status}`,
      });
      
      // Invalidate all report queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
      setShowReportModal(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive"
      });
    }
  };

  // Function to handle report claiming
  const handleClaimReport = async (reportId: string, reportType: string) => {
    setClaimingReport(reportId);
    try {
const response = await apiRequest('PATCH', `/api/admin/reports/${reportId}/claim`, { reportType });      if (response.ok) {
        // Add this report to the claimed reports set
        setClaimedReports(prev => new Set(prev).add(reportId));
        
        // Update the selected report to show it's claimed
        setSelectedReport(prev => ({
          ...prev,
          claimed: true,
          claimedBy: (user as any)?.name || (user as any)?.email,
          claimedAt: new Date().toISOString()
        }));
        
        toast({
          title: "Report Claimed",
          description: "You have successfully claimed this report",
        });
        
        // Invalidate all report queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
        
        // Invalidate MY WORK queries to show claimed reports in the appropriate tabs
        queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/creators'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/volunteers'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/documents'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/campaigns'] });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to claim report",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim report",
        variant: "destructive"
      });
    } finally {
      setClaimingReport(null);
    }
  };

// Function to handle cleanup of all fraud reports
  const handleCleanupReports = async () => {
    if (!confirm('Are you sure you want to delete ALL fraud reports and their evidence? This action cannot be undone.')) {
      return;
    }

    console.log('🧹 Starting cleanup process...');
    setIsCleaningUp(true);
    try {
      console.log('📡 Making API request to /api/admin/cleanup-reports');
      const response = await apiRequest('POST', '/api/admin/cleanup-reports');
      console.log('📡 API response received:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Cleanup result:', result);
        toast({
          title: "Cleanup Successful",
          description: `Deleted ${result.deletedCount} total reports (${result.deletedFraudCount} fraud + ${result.deletedVolunteerCount} volunteer) and their evidence files`,
        });
        
        // Invalidate all report queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
      } else {
        const error = await response.json();
        console.error('❌ Cleanup failed:', error);
        toast({
          title: "Cleanup Failed",
          description: error.message || "Failed to cleanup reports",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Cleanup error:', error);
      toast({
        title: "Error",
        description: "Failed to cleanup reports",
        variant: "destructive"
      });
    } finally {
      setIsCleaningUp(false);
    }
  };  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading Reports...</span>
      </div>
    );
  }

  // Calculate analytics
  const totalDocumentReports = documentReports.length + processedDocumentReports.length;
  const totalCampaignReports = campaignReports.length + processedCampaignReports.length;
  const totalVolunteerReports = volunteerReports.length + processedVolunteerReports.length;
  const totalCreatorReports = creatorReports.length + processedCreatorReports.length;
  const totalTransactionReports = transactionReports.length + processedTransactionReports.length;
  
  const totalClaimedReports = [
    ...processedDocumentReports,
    ...processedCampaignReports,
    ...processedVolunteerReports,
    ...processedCreatorReports,
    ...processedTransactionReports
  ].filter(report => report.status === 'claimed' || report.claimedBy).length;
  
  const totalApprovedReports = [
    ...processedDocumentReports,
    ...processedCampaignReports,
    ...processedVolunteerReports,
    ...processedCreatorReports,
    ...processedTransactionReports
  ].filter(report => report.status === 'approved').length;
  
  const totalRejectedReports = [
    ...processedDocumentReports,
    ...processedCampaignReports,
    ...processedVolunteerReports,
    ...processedCreatorReports,
    ...processedTransactionReports
  ].filter(report => report.status === 'rejected').length;
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Reports Management</h2>
      
      {/* Reports Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-800" data-testid="stat-document-reports">
                  {totalDocumentReports}
                </div>
                <div className="text-sm text-blue-600">Document Reports</div>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-800" data-testid="stat-campaign-reports">
                  {totalCampaignReports}
                </div>
                <div className="text-sm text-green-600">Campaign Reports</div>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-800" data-testid="stat-volunteer-reports">
                  {totalVolunteerReports}
                </div>
                <div className="text-sm text-purple-600">Volunteer Reports</div>
              </div>
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-800" data-testid="stat-creator-reports">
                  {totalCreatorReports}
                </div>
                <div className="text-sm text-orange-600">Creator Reports</div>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row of Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-800" data-testid="stat-transaction-reports">
                  {totalTransactionReports}
                </div>
                <div className="text-sm text-yellow-600">Transaction Reports</div>
              </div>
              <CreditCard className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-indigo-800" data-testid="stat-claimed-reports">
                  {totalClaimedReports}
                </div>
                <div className="text-sm text-indigo-600">Claimed Reports</div>
              </div>
              <UserCheck className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-emerald-800" data-testid="stat-approved-reports">
                  {totalApprovedReports}
                </div>
                <div className="text-sm text-emerald-600">Approved Reports</div>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-800" data-testid="stat-rejected-reports">
                  {totalRejectedReports}
                </div>
                <div className="text-sm text-red-600">Rejected Reports</div>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Reports</CardTitle>
          <p className="text-sm text-gray-600">Search across all report information including IDs, descriptions, dates, and related entities</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search reports by ID, description, type, status, names, dates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="input-search-reports"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={searchMode === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchMode('pending')}
                data-testid="button-search-pending"
              >
                Pending Reports
              </Button>
              <Button
                variant={searchMode === 'processed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchMode('processed')}
                data-testid="button-search-processed"
              >
                Processed Reports
              </Button>
            </div>
          </div>
          {searchQuery && (
            <div className="mt-3 text-sm text-gray-600">
              Searching in <span className="font-medium">{searchMode}</span> reports for: 
              <span className="font-medium text-blue-600"> "{searchQuery}"</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
<div className="flex justify-between items-start">
            <div>
              <CardTitle>Reports Administration</CardTitle>
              <p className="text-sm text-gray-600">Manage and review all platform reports</p>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                console.log('🔘 Cleanup button clicked!');
                handleCleanupReports();
              }}
              disabled={isCleaningUp}
              className="flex items-center gap-2"
            >
              {isCleaningUp ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isCleaningUp ? 'Cleaning...' : 'Cleanup Reports'}
            </Button>
          </div>        </CardHeader>
        <CardContent>
          <Tabs value={activeReportsTab} onValueChange={setActiveReportsTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="document">Document ({Array.isArray(documentReports) ? documentReports.length : 0})</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns ({Array.isArray(campaignReports) ? campaignReports.length : 0})</TabsTrigger>
              <TabsTrigger value="volunteers">Volunteers ({Array.isArray(volunteerReports) ? volunteerReports.length : 0})</TabsTrigger>
              <TabsTrigger value="creators">Creators ({Array.isArray(creatorReports) ? creatorReports.length : 0})</TabsTrigger>
              <TabsTrigger value="transactions">Transactions ({Array.isArray(transactionReports) ? transactionReports.length : 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="document" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {(() => {
                  const filteredReports = getFilteredReports('document', 'pending');
                  return filteredReports.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {searchQuery ? `No document reports found matching "${searchQuery}"` : "No document reports found"}
                    </p>
                  ) : (
                    filteredReports.slice(0, 10).map((report: any) => (
                      <div key={report.id} className="border rounded-lg p-4 bg-white">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-start lg:items-center">
                        <div>
                          <p className="font-medium text-sm">{report.reportId || report.id}</p>
                          <p className="text-xs text-gray-500">Report ID</p>
                        </div>
                        <div>
                          <p className="text-sm">{report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}</p>
                          <p className="text-xs text-gray-500">Date & Time</p>
                        </div>
                        <div className="min-w-0">
                          {report.claimedBy && report.claimAdmin ? (
                            <div className="space-y-0.5">
                              <Badge variant="outline" className="text-xs max-w-full truncate block">
                                {report.claimAdmin.email}
                              </Badge>
                              <p className="text-xs text-gray-500 truncate">
                                {new Date(report.claimedAt).toLocaleDateString()} {new Date(report.claimedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          ) : (
                            <Badge variant={report.status === 'pending' ? 'destructive' : report.status === 'resolved' ? 'default' : 'outline'}>
                              {report.status || 'pending'}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate">{report.reporterId || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Reporter ID</p>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => handleViewReport(report)} className="min-w-0">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleClaimReport(report.id, 'document')}
                            disabled={claimingReport === report.id || claimedReports.has(report.id) || report.claimedBy}
                            data-testid="button-claim-document-report"
                            className="min-w-0"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            {claimingReport === report.id ? 'Claiming...' : 
                             (claimedReports.has(report.id) || report.claimedBy) ? 'Claimed' : 'Claim'}
                          </Button>
                          {((user as any)?.isAdmin || (user as any)?.isManager) && (
                            <Button 
                              size="sm"
                              variant="default"
                              onClick={() => {
                                console.log('Assign document report:', report.id);
                                toast({
                                  title: "Assign Feature",
                                  description: "Assign functionality will be implemented soon.",
                                });
                              }}
                              data-testid="button-assign-document-report"
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    ))
                  );
                })()}
              </div>
            </TabsContent>

            <TabsContent value="campaigns" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {(() => {
                  const filteredReports = getFilteredReports('campaigns', 'pending');
                  return filteredReports.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {searchQuery ? `No campaign reports found matching "${searchQuery}"` : "No campaign reports found"}
                    </p>
                  ) : (
                    filteredReports.slice(0, 10).map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4 bg-white">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-start lg:items-center">
                        <div>
                          <p className="font-medium text-sm">{report.reportId || report.id}</p>
                          <p className="text-xs text-gray-500">Report ID</p>
                        </div>
                        <div>
                          <p className="text-sm">{report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}</p>
                          <p className="text-xs text-gray-500">Date & Time</p>
                        </div>
                        <div className="min-w-0">
                          {report.claimedBy && report.claimAdmin ? (
                            <div className="space-y-0.5">
                              <Badge variant="outline" className="text-xs max-w-full truncate block">
                                {report.claimAdmin.email}
                              </Badge>
                              <p className="text-xs text-gray-500 truncate">
                                {new Date(report.claimedAt).toLocaleDateString()} {new Date(report.claimedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          ) : (
                            <Badge variant={report.status === 'pending' ? 'destructive' : report.status === 'resolved' ? 'default' : 'outline'}>
                              {report.status || 'pending'}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate">{report.reporterId || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Reporter ID</p>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => handleViewReport(report)} className="min-w-0">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleClaimReport(report.id, 'campaign')}
                            disabled={claimingReport === report.id || claimedReports.has(report.id) || report.claimedBy}
                            data-testid="button-claim-campaign-report"
                            className="min-w-0"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            {claimingReport === report.id ? 'Claiming...' : 
                             (claimedReports.has(report.id) || report.claimedBy) ? 'Claimed' : 'Claim'}
                          </Button>
                          {((user as any)?.isAdmin || (user as any)?.isManager) && (
                            <Button 
                              size="sm"
                              variant="default"
                              onClick={() => {
                                console.log('Assign campaign report:', report.id);
                                toast({
                                  title: "Assign Feature",
                                  description: "Assign functionality will be implemented soon.",
                                });
                              }}
                              data-testid="button-assign-campaign-report"
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    ))
                  );
                })()}
              </div>
            </TabsContent>

            <TabsContent value="volunteers" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {(() => {
                  const filteredReports = getFilteredReports('volunteers', 'pending');
                  return filteredReports.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {searchQuery ? `No volunteer reports found matching "${searchQuery}"` : "No volunteer reports found"}
                    </p>
                  ) : (
                    filteredReports.slice(0, 10).map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4 bg-white">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-start lg:items-center">
                        <div>
                          <p className="font-medium text-sm">{report.reportId || report.id}</p>
                          <p className="text-xs text-gray-500">Report ID</p>
                        </div>
                        <div>
                          <p className="text-sm">{report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}</p>
                          <p className="text-xs text-gray-500">Date & Time</p>
                        </div>
                        <div className="min-w-0">
                          {report.claimedBy && report.claimAdmin ? (
                            <div className="space-y-0.5">
                              <Badge variant="outline" className="text-xs max-w-full truncate block">
                                {report.claimAdmin.email}
                              </Badge>
                              <p className="text-xs text-gray-500 truncate">
                                {new Date(report.claimedAt).toLocaleDateString()} {new Date(report.claimedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          ) : (
                            <Badge variant={report.status === 'pending' ? 'destructive' : report.status === 'resolved' ? 'default' : 'outline'}>
                              {report.status || 'pending'}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate">{report.reporterId || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Reporter ID</p>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => handleViewReport(report)} className="min-w-0">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleClaimReport(report.id, 'volunteer')}
                            disabled={claimingReport === report.id || claimedReports.has(report.id) || report.claimedBy}
                            data-testid="button-claim-volunteer-report"
                            className="min-w-0"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            {claimingReport === report.id ? 'Claiming...' : 
                             (claimedReports.has(report.id) || report.claimedBy) ? 'Claimed' : 'Claim'}
                          </Button>
                          {((user as any)?.isAdmin || (user as any)?.isManager) && (
                            <Button 
                              size="sm"
                              variant="default"
                              onClick={() => {
                                console.log('Assign volunteer report:', report.id);
                                toast({
                                  title: "Assign Feature",
                                  description: "Assign functionality will be implemented soon.",
                                });
                              }}
                              data-testid="button-assign-volunteer-report"
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    ))
                  );
                })()}
              </div>
            </TabsContent>

            <TabsContent value="creators" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {(() => {
                  const filteredReports = getFilteredReports('creators', 'pending');
                  return filteredReports.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {searchQuery ? `No creator reports found matching "${searchQuery}"` : "No creator reports found"}
                    </p>
                  ) : (
                    filteredReports.slice(0, 10).map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4 bg-white">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-start lg:items-center">
                        <div>
                          <p className="font-medium text-sm">{report.reportId || report.id}</p>
                          <p className="text-xs text-gray-500">Report ID</p>
                        </div>
                        <div>
                          <p className="text-sm">{report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}</p>
                          <p className="text-xs text-gray-500">Date & Time</p>
                        </div>
                        <div className="min-w-0">
                          {report.claimedBy && report.claimAdmin ? (
                            <div className="space-y-0.5">
                              <Badge variant="outline" className="text-xs max-w-full truncate block">
                                {report.claimAdmin.email}
                              </Badge>
                              <p className="text-xs text-gray-500 truncate">
                                {new Date(report.claimedAt).toLocaleDateString()} {new Date(report.claimedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          ) : (
                            <Badge variant={report.status === 'pending' ? 'destructive' : report.status === 'resolved' ? 'default' : 'outline'}>
                              {report.status || 'pending'}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate">{report.reporterId || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Reporter ID</p>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => handleViewReport(report)} className="min-w-0">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleClaimReport(report.id, 'creator')}
                            disabled={claimingReport === report.id || claimedReports.has(report.id) || report.claimedBy}
                            data-testid="button-claim-creator-report"
                            className="min-w-0"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            {claimingReport === report.id ? 'Claiming...' : 
                             (claimedReports.has(report.id) || report.claimedBy) ? 'Claimed' : 'Claim'}
                          </Button>
                          {((user as any)?.isAdmin || (user as any)?.isManager) && (
                            <Button 
                              size="sm"
                              variant="default"
                              onClick={() => {
                                console.log('Assign creator report:', report.id);
                                toast({
                                  title: "Assign Feature",
                                  description: "Assign functionality will be implemented soon.",
                                });
                              }}
                              data-testid="button-assign-creator-report"
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    ))
                  );
                })()}
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {(() => {
                  const filteredReports = getFilteredReports('transactions', 'pending');
                  return filteredReports.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {searchQuery ? `No transaction reports found matching "${searchQuery}"` : "No transaction reports found"}
                    </p>
                  ) : (
                    filteredReports.slice(0, 10).map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4 bg-white">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-start lg:items-center">
                        <div>
                          <p className="font-medium text-sm">{report.reportId || report.id}</p>
                          <p className="text-xs text-gray-500">Report ID</p>
                        </div>
                        <div>
                          <p className="text-sm">{report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}</p>
                          <p className="text-xs text-gray-500">Date & Time</p>
                        </div>
                        <div className="min-w-0">
                          {report.claimedBy && report.claimAdmin ? (
                            <div className="space-y-0.5">
                              <Badge variant="outline" className="text-xs max-w-full truncate block">
                                {report.claimAdmin.email}
                              </Badge>
                              <p className="text-xs text-gray-500 truncate">
                                {new Date(report.claimedAt).toLocaleDateString()} {new Date(report.claimedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          ) : (
                            <Badge variant={report.status === 'pending' ? 'destructive' : report.status === 'resolved' ? 'default' : 'outline'}>
                              {report.status || 'pending'}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate">{report.reporterId || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Reporter ID</p>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => handleViewReport(report)} className="min-w-0">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleClaimReport(report.id, 'transaction')}
                            disabled={claimingReport === report.id || claimedReports.has(report.id) || report.claimedBy}
                            data-testid="button-claim-transaction-report"
                            className="min-w-0"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            {claimingReport === report.id ? 'Claiming...' : 
                             (claimedReports.has(report.id) || report.claimedBy) ? 'Claimed' : 'Claim'}
                          </Button>
                          {((user as any)?.isAdmin || (user as any)?.isManager) && (
                            <Button 
                              size="sm"
                              variant="default"
                              onClick={() => {
                                console.log('Assign transaction report:', report.id);
                                toast({
                                  title: "Assign Feature",
                                  description: "Assign functionality will be implemented soon.",
                                });
                              }}
                              data-testid="button-assign-transaction-report"
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    ))
                  );
                })()}
              </div>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
      {/* Processed Reports Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Processed Reports</CardTitle>
          <p className="text-sm text-gray-600">View resolved and processed reports by category</p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeProcessedTab} onValueChange={setActiveProcessedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="document">Documents ({Array.isArray(processedDocumentReports) ? processedDocumentReports.length : 0})</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns ({Array.isArray(processedCampaignReports) ? processedCampaignReports.length : 0})</TabsTrigger>
              <TabsTrigger value="volunteers">Volunteers ({Array.isArray(processedVolunteerReports) ? processedVolunteerReports.length : 0})</TabsTrigger>
              <TabsTrigger value="creators">Creators ({Array.isArray(processedCreatorReports) ? processedCreatorReports.length : 0})</TabsTrigger>
              <TabsTrigger value="transactions">Transactions ({Array.isArray(processedTransactionReports) ? processedTransactionReports.length : 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="document" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {(() => {
                  const filteredReports = getFilteredReports('documents', 'processed');
                  return filteredReports.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {searchQuery ? `No processed document reports found matching "${searchQuery}"` : "No processed document reports found"}
                    </p>
                  ) : (
                    filteredReports.slice(0, 10).map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-start lg:items-center">
                        <div>
                          <p className="font-medium text-sm">{report.reportId || report.id}</p>
                          <p className="text-xs text-gray-500">Report ID</p>
                        </div>
                        <div>
                          <p className="text-sm">{report.resolvedAt ? new Date(report.resolvedAt).toLocaleString() : (report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A')}</p>
                          <p className="text-xs text-gray-500">Resolved Date</p>
                        </div>
                        <div className="min-w-0">
                          <Badge variant="default" className="bg-green-600">
                            {report.status || 'resolved'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate">{report.resolvedBy || report.claimAdmin?.email || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Resolved By</p>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => handleViewReport(report)} className="min-w-0">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                    ))
                  );
                })()}
              </div>
            </TabsContent>

            <TabsContent value="campaigns" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {(() => {
                  const filteredReports = getFilteredReports('campaigns', 'processed');
                  return filteredReports.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {searchQuery ? `No processed campaign reports found matching "${searchQuery}"` : "No processed campaign reports found"}
                    </p>
                  ) : (
                    filteredReports.slice(0, 10).map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-start lg:items-center">
                        <div>
                          <p className="font-medium text-sm">{report.reportId || report.id}</p>
                          <p className="text-xs text-gray-500">Report ID</p>
                        </div>
                        <div>
                          <p className="text-sm">{report.resolvedAt ? new Date(report.resolvedAt).toLocaleString() : (report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A')}</p>
                          <p className="text-xs text-gray-500">Resolved Date</p>
                        </div>
                        <div className="min-w-0">
                          <Badge variant="default" className="bg-blue-600">
                            {report.status || 'resolved'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate">{report.resolvedBy || report.claimAdmin?.email || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Resolved By</p>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => handleViewReport(report)} className="min-w-0">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                    ))
                  );
                })()}
              </div>
            </TabsContent>

            <TabsContent value="volunteers" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {(() => {
                  const filteredReports = getFilteredReports('volunteers', 'processed');
                  return filteredReports.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {searchQuery ? `No processed volunteer reports found matching "${searchQuery}"` : "No processed volunteer reports found"}
                    </p>
                  ) : (
                    filteredReports.slice(0, 10).map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4 bg-purple-50 border-purple-200">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-start lg:items-center">
                        <div>
                          <p className="font-medium text-sm">{report.reportId || report.id}</p>
                          <p className="text-xs text-gray-500">Report ID</p>
                        </div>
                        <div>
                          <p className="text-sm">{report.resolvedAt ? new Date(report.resolvedAt).toLocaleString() : (report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A')}</p>
                          <p className="text-xs text-gray-500">Resolved Date</p>
                        </div>
                        <div className="min-w-0">
                          <Badge variant="default" className="bg-purple-600">
                            {report.status || 'resolved'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate">{report.resolvedBy || report.claimAdmin?.email || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Resolved By</p>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => handleViewReport(report)} className="min-w-0">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                    ))
                  );
                })()}
              </div>
            </TabsContent>

            <TabsContent value="creators" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {(() => {
                  const filteredReports = getFilteredReports('creators', 'processed');
                  return filteredReports.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {searchQuery ? `No processed creator reports found matching "${searchQuery}"` : "No processed creator reports found"}
                    </p>
                  ) : (
                    filteredReports.slice(0, 10).map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-start lg:items-center">
                        <div>
                          <p className="font-medium text-sm">{report.reportId || report.id}</p>
                          <p className="text-xs text-gray-500">Report ID</p>
                        </div>
                        <div>
                          <p className="text-sm">{report.resolvedAt ? new Date(report.resolvedAt).toLocaleString() : (report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A')}</p>
                          <p className="text-xs text-gray-500">Resolved Date</p>
                        </div>
                        <div className="min-w-0">
                          <Badge variant="default" className="bg-orange-600">
                            {report.status || 'resolved'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate">{report.resolvedBy || report.claimAdmin?.email || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Resolved By</p>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => handleViewReport(report)} className="min-w-0">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                    ))
                  );
                })()}
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="mt-4">
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {(() => {
                  const filteredReports = getFilteredReports('transactions', 'processed');
                  return filteredReports.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {searchQuery ? `No processed transaction reports found matching "${searchQuery}"` : "No processed transaction reports found"}
                    </p>
                  ) : (
                    filteredReports.slice(0, 10).map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4 bg-emerald-50 border-emerald-200">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-start lg:items-center">
                        <div>
                          <p className="font-medium text-sm">{report.reportId || report.id}</p>
                          <p className="text-xs text-gray-500">Report ID</p>
                        </div>
                        <div>
                          <p className="text-sm">{report.resolvedAt ? new Date(report.resolvedAt).toLocaleString() : (report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A')}</p>
                          <p className="text-xs text-gray-500">Resolved Date</p>
                        </div>
                        <div className="min-w-0">
                          <Badge variant="default" className="bg-emerald-600">
                            {report.status || 'resolved'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate">{report.resolvedBy || report.claimAdmin?.email || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Resolved By</p>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => handleViewReport(report)} className="min-w-0">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                    ))
                  );
                })()}
              </div>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>

      {/* Comprehensive Report Details Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Details - {selectedReport?.reportId || selectedReport?.id}</DialogTitle>
            <DialogDescription>
              Complete information about this report including evidence, reporter details, and related entities.
            </DialogDescription>
          </DialogHeader>

          {loadingReportDetails && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <span className="ml-2">Loading detailed information...</span>
            </div>
          )}

          {selectedReport && !loadingReportDetails && (
            <div className="space-y-6">
              {/* Report Information - Standardized Format */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Report Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Report ID Section */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Report ID</label>
                        <p className="text-sm font-mono text-gray-900">{selectedReport.reportId || selectedReport.id}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <div className="mt-1">
                          <Badge variant={selectedReport.status === 'pending' ? 'destructive' : selectedReport.status === 'resolved' ? 'default' : 'outline'}>
                            {selectedReport.status || 'pending'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Report Type and Date Section */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Report Type</label>
                        <p className="text-sm text-gray-900">{selectedReport.reportType || selectedReport.type || 'General Report'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date Created</label>
                        <p className="text-sm text-gray-900">{selectedReport.createdAt ? new Date(selectedReport.createdAt).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Report Reason Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">Report Reason</label>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <p className="text-sm text-gray-900">{selectedReport.reason || selectedReport.description || 'No reason provided'}</p>
                    </div>
                  </div>
                  
                  {/* Evidence Files Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">Evidence Files</label>
                    <div className="border rounded-lg">
                      {selectedReport.evidenceUrls && selectedReport.evidenceUrls.length > 0 ? (
                        <div className="p-4 space-y-3">
                          <p className="text-xs text-gray-600">
                            {selectedReport.evidenceUrls.length} file{selectedReport.evidenceUrls.length > 1 ? 's' : ''} uploaded by reporter
                          </p>
                          {selectedReport.evidenceUrls.map((url: string, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <div>
                                  <p className="text-sm font-medium text-blue-900">Evidence File {index + 1}</p>
                                  <p className="text-xs text-blue-600">Attachment provided by reporter</p>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.open(url, '_blank');
                                }}
                                data-testid={`button-view-evidence-${index}`}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <Paperclip className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">No evidence files attached</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedReport.details && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Additional Details</label>
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <p className="text-sm text-gray-900">{selectedReport.details}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Links relevant to the report */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Links Relevant to the Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    


                    {/* Campaign Card */}
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <Target className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">Campaign</p>
                          <p className="text-xs text-gray-500">Access campaign details</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const campaignId = selectedReport.campaign?.id || 
                                           selectedReport.campaignId || 
                                           selectedReport.targetId ||
                                           selectedReport.relatedId;
                          if (campaignId) {
                            window.open(`/campaigns/${campaignId}`, '_blank');
                          } else {
                            alert('No campaign ID found in this report.');
                          }
                        }}
                        data-testid="link-campaign"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>




                    {/* Reporter Card */}
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="text-sm font-medium">Reporter</p>
                          <p className="text-xs text-gray-500">User who filed this report</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Reporter button clicked!');
                          console.log('Selected Report:', selectedReport);
                          
                          const reporterId = selectedReport.reporterId || 
                                           selectedReport.reporter?.id;
                          
                          console.log('Reporter ID found:', reporterId);
                          
                          if (reporterId) {
                            const profileUrl = `/admin/users/${reporterId}`;
                            console.log('Opening reporter profile:', profileUrl);
                            window.open(profileUrl, '_blank');
                          } else {
                            console.error('No reporter ID found in report data');
                            alert('No reporter ID found in this report. Check console for details.');
                          }
                        }}
                        data-testid="link-reporter"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>



                    {/* Creator Card - Only show in Document, Campaign, and Creator tabs */}
                    {(activeReportsTab === 'document' || activeReportsTab === 'campaigns' || activeReportsTab === 'creators') && (
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <UserIcon className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium">Creator</p>
                            <p className="text-xs text-gray-500">View campaign creator profile</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
// Get creator ID from various possible sources
                            const creatorId = selectedReport.creator?.id || 
                                             selectedReport.creatorId || 
                                             selectedReport.campaign?.creatorId ||
                                             selectedReport.targetId;                            if (creatorId) {
                              const profileUrl = `/admin/users/${creatorId}`;
                              console.log('Opening creator profile:', profileUrl);
                              window.open(profileUrl, '_blank');
                            } else {
                              console.error('No creator ID found in report data');
                              alert('No creator ID found in this report. Check console for details.');
                            }
                          }}
                          data-testid="link-creator"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    )}

{/* Document Card - Only show in Document tab */}
                    {activeReportsTab === 'document' && (
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium">Document</p>
                            <p className="text-xs text-gray-500">View reported document</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Get document URL from various possible sources
                            // For document reports, prioritize the actual reported document over evidence files
                            const documentUrl = (selectedReport.document && selectedReport.document.fileUrl) ||
                                              (selectedReport.document && selectedReport.document.viewUrl) ||
                                              (selectedReport.document && selectedReport.document.url) ||
                                              selectedReport.documentUrl || 
                                              selectedReport.fileUrl ||
                                              selectedReport.targetUrl ||
                                              selectedReport.evidenceUrls?.[0];
                            
                            if (documentUrl) {
                              console.log('Opening reported document:', documentUrl);
                              window.open(documentUrl, '_blank');
                            } else {
                              console.error('No document URL found in report data');
                              console.log('Document data available:', selectedReport.document);
                              console.log('Document fileUrl:', selectedReport.document?.fileUrl);
                              console.log('Document viewUrl:', selectedReport.document?.viewUrl);
                              console.log('Full report data:', selectedReport);
                              alert('No document URL found in this report. Check console for details.');
                            }
                          }}
                          data-testid="link-document"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    )}                    {/* Volunteer Card - Only show in Volunteer tab */}
                    {activeReportsTab === 'volunteers' && (
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <Users className="h-5 w-5 text-emerald-500" />
                          <div>
                            <p className="text-sm font-medium">Volunteer</p>
                            <p className="text-xs text-gray-500">View volunteer profile</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Volunteer button clicked!');
                            console.log('Full selectedReport:', JSON.stringify(selectedReport, null, 2));
                            
                            // For volunteer reports, relatedId should be the volunteer's user ID
                            const volunteerId = selectedReport.relatedId || 
                                              selectedReport.reportedVolunteerId || 
                                              selectedReport.reportedVolunteer?.id ||
                                              selectedReport.volunteerId || 
                                              selectedReport.volunteer?.id ||
                                              selectedReport.reportedUserId ||
                                              selectedReport.userId;
                            
                            console.log('Extracted volunteer ID:', volunteerId);
                            
                            if (volunteerId) {
                              const adminUrl = `/admin/users/${volunteerId}`;
                              console.log('Opening URL:', adminUrl);
                              window.open(adminUrl, '_blank');
                            } else {
                              console.error('No volunteer ID found in report data');
                              alert('No volunteer ID found in this report. Please check the console for details.');
                            }
                          }}
                          data-testid="link-volunteer"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    )}

                  </div>
                </CardContent>
              </Card>







              {/* Reporter Evidence Card */}
              {(selectedReport.evidence || selectedReport.attachments || selectedReport.screenshots || selectedReport.documents) && (
                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center text-base text-blue-700">
                      <Shield className="h-4 w-4 mr-2" />
                      Reporter Evidence
                    </CardTitle>
                    <p className="text-sm text-gray-600">Evidence files uploaded by the reporter to support their fraud claim</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Evidence files */}
                      {selectedReport.evidence && selectedReport.evidence.map((item: any, index: number) => (
                        <div key={`evidence-${index}`} className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium">{item.filename || item.fileName || `Evidence ${index + 1}`}</p>
                              <p className="text-xs text-gray-500">{item.type || item.mimeType || 'File'} • {item.size || item.fileSize || 'Unknown size'}</p>
                            </div>
                          </div>
                          <DocumentViewer 
                            document={{
                              id: `evidence-${index}`,
                              fileName: item.filename || item.fileName || `Evidence-${index + 1}`,
                              fileUrl: item.url || item.fileUrl,
                              mimeType: item.type || item.mimeType,
                              fileSize: typeof item.size === 'string' ? parseInt(item.size) : item.size || item.fileSize,
                              description: `Evidence file ${index + 1}`
                            }}
                          />
                        </div>
                      ))}
                      
                      {/* Screenshot files */}
                      {selectedReport.screenshots && selectedReport.screenshots.map((screenshot: any, index: number) => (
                        <div key={`screenshot-${index}`} className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50">
                          <div className="flex items-center space-x-3">
                            <ImageIcon className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="text-sm font-medium">Screenshot {index + 1}</p>
                              <p className="text-xs text-gray-500">Image Evidence</p>
                            </div>
                          </div>
                          <DocumentViewer 
                            document={{
                              id: `screenshot-${index}`,
                              fileName: `Screenshot-${index + 1}`,
                              fileUrl: typeof screenshot === 'string' ? screenshot : screenshot.url,
                              mimeType: 'image/png',
                              description: `Screenshot evidence ${index + 1}`
                            }}
                          />
                        </div>
                      ))}
                      
                      {/* Document attachments from progress reports */}
                      {selectedReport.documents && selectedReport.documents.map((doc: any, index: number) => (
                        <div key={`document-${doc.id || index}`} className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-purple-500" />
                            <div>
                              <p className="text-sm font-medium">{doc.fileName || `Document ${index + 1}`}</p>
                              <p className="text-xs text-gray-500">{doc.mimeType || 'File'} • {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : 'Unknown size'}</p>
                              {doc.description && (
                                <p className="text-xs text-gray-600 mt-1">{doc.description}</p>
                              )}
                            </div>
                          </div>
                          <DocumentViewer 
                            document={{
                              id: doc.id || `document-${index}`,
                              fileName: doc.fileName,
                              fileUrl: doc.fileUrl,
                              mimeType: doc.mimeType,
                              fileSize: doc.fileSize,
                              documentType: doc.documentType,
                              description: doc.description
                            }}
                          />
                        </div>
                      ))}
                      
                      {/* Progress report attachments */}
                      {selectedReport.attachments && selectedReport.attachments.map((attachment: any, index: number) => (
                        <div key={`attachment-${index}`} className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">{attachment.fileName || attachment.filename || `Attachment ${index + 1}`}</p>
                              <p className="text-xs text-gray-500">{attachment.mimeType || attachment.type || 'File'} • {attachment.fileSize || attachment.size || 'Unknown size'}</p>
                            </div>
                          </div>
                          <DocumentViewer 
                            document={{
                              id: `attachment-${index}`,
                              fileName: attachment.fileName || attachment.filename || `Attachment-${index + 1}`,
                              fileUrl: attachment.fileUrl || attachment.url,
                              mimeType: attachment.mimeType || attachment.type,
                              fileSize: attachment.fileSize || (typeof attachment.size === 'string' ? parseInt(attachment.size) : attachment.size),
                              description: `Attachment ${index + 1}`
                            }}
                          />
                        </div>
                      ))}
                      
                      {/* Show message if no evidence found */}
                      {(!selectedReport.evidence || selectedReport.evidence.length === 0) && 
                       (!selectedReport.screenshots || selectedReport.screenshots.length === 0) &&
                       (!selectedReport.documents || selectedReport.documents.length === 0) &&
                       (!selectedReport.attachments || selectedReport.attachments.length === 0) && (
                        <p className="text-sm text-gray-500 text-center py-4">No evidence files uploaded by reporter</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Claim Status Indicator */}
              {(claimedReports.has(selectedReport.id) || selectedReport.claimed) && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Report Claimed</p>
                        <p className="text-sm text-green-600">
                          {selectedReport.claimedBy && (
                            <>Claimed by {selectedReport.claimedBy}</>
                          )}
                          {selectedReport.claimedAt && (
                            <> on {new Date(selectedReport.claimedAt).toLocaleString()}</>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Admin Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Admin Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-3">
                    {/* Claim Button - Available to both Admin and Support */}
                    <Button 
                      onClick={() => {
                        const reportType = activeReportsTab === 'document' ? 'document' : 
                                         activeReportsTab === 'campaigns' ? 'campaign' : 
                                         activeReportsTab === 'creators' ? 'creator' : 
                                         activeReportsTab === 'volunteers' ? 'volunteer' : 
                                         'transaction';
                        handleClaimReport(selectedReport.id, reportType);
                      }}
                      variant="outline"
                      disabled={claimingReport === selectedReport.id || claimedReports.has(selectedReport.id) || selectedReport.claimedBy}
                      data-testid="button-claim-report"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      {claimingReport === selectedReport.id ? 'Claiming...' : 
                       (claimedReports.has(selectedReport.id) || selectedReport.claimedBy) ? 'Claimed' : 'Claim'}
                    </Button>

                    {/* Assign Button - Available to Admin and Manager */}
                    {((user as any)?.isAdmin || (user as any)?.isManager) && (
                      <Button 
                        onClick={() => {
                          // TODO: Implement assign functionality
                          console.log('Assign report:', selectedReport.id);
                          toast({
                            title: "Assign Feature",
                            description: "Assign functionality will be implemented soon.",
                          });
                        }}
                        variant="default"
                        data-testid="button-assign-report"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal for standalone document viewing */}
      {currentDocument && (
        <DocumentViewer 
          document={currentDocument}
          trigger={null}
          externalShow={showDocumentViewer}
          onExternalClose={() => {
            setShowDocumentViewer(false);
            setCurrentDocument(null);
          }}
        />
      )}
    </div>
  );
}

// Invite Management Section
function InviteSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("administrator");
  const [isLoading, setIsLoading] = useState(false);
  const [activeInviteTab, setActiveInviteTab] = useState("pending");

// Fetch invitations based on active tab (uses default queryFn which attaches Authorization)
  const { data: invitations, refetch: refetchInvitations } = useQuery({
    queryKey: [`/api/admin/support/invitations?status=${activeInviteTab}`],
    retry: false,  });

  // Send invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const response = await apiRequest('POST', '/api/admin/support/invite', { email, role });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Invitation Sent!",
        description: data.message || "Support invitation has been sent successfully.",
      });
      setInviteEmail("");
      setInviteRole("administrator");
      // Invalidate all invitation queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support/invitations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Invitation",
        description: error.message || "There was an error sending the invitation.",
        variant: "destructive",
      });
    }
  });

  const handleSendInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }
    sendInvitationMutation.mutate({ email: inviteEmail.trim(), role: inviteRole });
  };

  // Client-side check relaxed; server enforces admin access

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Access Management</h1>
        <p className="mt-2 text-gray-600">Send invitations to new support staff members</p>
      </div>

      {/* Send Invitation Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2 text-blue-600" />
            Send New Invitation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendInvitation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={sendInvitationMutation.isPending}
                  required
                  data-testid="input-invite-email"
                />
              </div>
              <div>
                <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <Select value={inviteRole} onValueChange={setInviteRole} disabled={sendInvitationMutation.isPending}>
                  <SelectTrigger data-testid="select-invite-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrator">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={sendInvitationMutation.isPending || !inviteEmail.trim()}
                data-testid="button-send-invitation"
              >
                {sendInvitationMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Invitations Management Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-green-600" />
            Invitations Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <Tabs value={activeInviteTab} onValueChange={setActiveInviteTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" data-testid="tab-pending-invites">
                Pending Invites
              </TabsTrigger>
              <TabsTrigger value="accepted" data-testid="tab-accepted-invites">
                Accepted Invites
              </TabsTrigger>
              <TabsTrigger value="declined" data-testid="tab-declined-invites">
                Declined Invites
              </TabsTrigger>
            </TabsList>

            {/* Pending Invites Tab */}
            <TabsContent value="pending">
              <InvitationsList 
                invitations={invitations} 
                status="pending" 
                emptyMessage="No pending invitations"
                emptyIcon={<Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />}
              />
            </TabsContent>

            {/* Accepted Invites Tab */}
            <TabsContent value="accepted">
              <InvitationsList 
                invitations={invitations} 
                status="accepted" 
                emptyMessage="No accepted invitations"
                emptyIcon={<CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />}
              />
            </TabsContent>

            {/* Declined Invites Tab */}
            <TabsContent value="declined">
              <InvitationsList 
                invitations={invitations} 
                status="declined" 
                emptyMessage="No declined invitations"
                emptyIcon={<XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Role Manager */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-purple-600" />
            Role Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RoleManager />
        </CardContent>
      </Card>
    </div>
  );
}

// Invitations List Component
interface InvitationsListProps {
  invitations: any[];
  status: string;
  emptyMessage: string;
  emptyIcon: React.ReactNode;
}

function InvitationsList({ invitations, status, emptyMessage, emptyIcon }: InvitationsListProps) {
  if (!invitations) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        <span className="ml-2 text-gray-600">Loading invitations...</span>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8">
        {emptyIcon}
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {invitations.map((invitation: any) => (
        <div key={invitation.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                status === 'pending' ? 'bg-blue-100' :
                status === 'accepted' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {status === 'pending' && <Mail className="h-5 w-5 text-blue-600" />}
                {status === 'accepted' && <CheckCircle className="h-5 w-5 text-green-600" />}
                {status === 'declined' && <XCircle className="h-5 w-5 text-red-600" />}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900" data-testid={`text-invitation-email-${invitation.id}`}>
                {invitation.email}
              </p>
              <div className="text-sm text-gray-500">
                <span>Invited {new Date(invitation.createdAt).toLocaleDateString()}</span>
                {status === 'pending' && (
                  <span> • Expires {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                )}
                {status === 'accepted' && invitation.acceptedAt && (
                  <span> • Accepted {new Date(invitation.acceptedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={
                status === 'pending' ? 'default' : 
                status === 'accepted' ? 'secondary' : 'destructive'
              }
              data-testid={`badge-invitation-status-${invitation.id}`}
            >
              {invitation.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

// Role Manager Component
function RoleManager() {
  const { toast } = useToast();
  const [filter, setFilter] = useState('');
const [showAuditModal, setShowAuditModal] = useState(false);  const { data: users, refetch } = useQuery({ queryKey: ['/api/admin/access/users'] });
  const { data: audit } = useQuery({ queryKey: ['/api/admin/access/audit'] });
  const updateRoles = useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: { isAdmin?: boolean; isSupport?: boolean } }) => {
      return apiRequest('PUT', `/api/admin/access/users/${userId}/roles`, roles);
    },
    onSuccess: () => {
      toast({ title: 'Roles updated' });
      refetch();
    },
    onError: (e: any) => toast({ title: 'Update failed', description: e?.message || 'Error', variant: 'destructive' }),
  });

  if (!users) {
    return (
      <div className="flex items-center py-4 text-sm text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
        Loading users…
      </div>
    );
  }

  const filtered = (users as any[]).filter((u: any) => (u.email || '').toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <input
          className="border rounded px-3 py-2 text-sm w-72"
          placeholder="Search by email…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="space-x-2">
          <Button size="sm" variant="outline" onClick={() => refetch()}>Refresh</Button>
<Button size="sm" variant="secondary" onClick={() => setShowAuditModal(true)}>Logs</Button>        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Admin</th>
              <th className="py-2 pr-4">Support</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u: any) => (
              <tr key={u.id} className="border-t">
                <td className="py-2 pr-4">{u.email}</td>
                <td className="py-2 pr-4">
                  <input
                    type="checkbox"
                    checked={!!u.isAdmin}
                    onChange={(e) => updateRoles.mutate({ userId: u.id, roles: { isAdmin: e.target.checked } })}
                  />
                </td>
                <td className="py-2 pr-4">
                  <input
                    type="checkbox"
                    checked={!!u.isSupport}
                    onChange={(e) => updateRoles.mutate({ userId: u.id, roles: { isSupport: e.target.checked } })}
                  />
                </td>
                <td className="py-2 pr-4">
                  <Button size="sm" variant="outline" onClick={() => refetch()}>Refresh</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

{/* Audit Log Modal */}
      <Dialog open={showAuditModal} onOpenChange={setShowAuditModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <List className="h-5 w-5 mr-2 text-gray-600" />
              Recent Role Changes
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {!audit ? (
              <div className="text-sm text-gray-500">Loading audit log...</div>
            ) : (audit as any[]).length === 0 ? (
              <div className="text-sm text-gray-500">No role changes recorded in this session.</div>
            ) : (
              <ul className="space-y-3">
                {(audit as any[]).map((log: any, index: number) => (
                  <li key={index} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {log.message}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>    </div>
  );
}
// Support Tickets Management Section
function TicketsSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTicketsTab, setActiveTicketsTab] = useState("pending");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [claimingTicket, setClaimingTicket] = useState<string | null>(null);
  const [claimedTickets, setClaimedTickets] = useState<Set<string>>(new Set());

  // Fetch support tickets
  const { data: tickets, refetch: refetchTickets } = useQuery({
    queryKey: ['/api/admin/support/tickets'],
  });

  // Claim ticket mutation
  const claimTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const response = await apiRequest(`/api/admin/support/tickets/${ticketId}/claim`, {
        method: 'POST'
      });
      return response;
    },
    onSuccess: (data, ticketId) => {
      toast({
        title: "Ticket Claimed",
        description: "Support ticket has been successfully claimed.",
      });
      setClaimedTickets(prev => new Set(prev).add(ticketId));
      refetchTickets();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Claim Ticket",
        description: error.message || "There was an error claiming the ticket.",
        variant: "destructive",
      });
    }
  });

  const handleClaimTicket = (ticketId: string) => {
    setClaimingTicket(ticketId);
    claimTicketMutation.mutate(ticketId);
    setTimeout(() => setClaimingTicket(null), 1000);
  };

  // Filter tickets by status
  const getFilteredTickets = () => {
    if (!tickets) return [];
    
    switch (activeTicketsTab) {
      case 'pending':
        return tickets.filter((ticket: any) => ticket.status === 'open' && !ticket.claimedBy);
      case 'in_progress':
        return tickets.filter((ticket: any) => ticket.status === 'in_progress' || (ticket.status === 'open' && ticket.claimedBy));
      case 'resolved':
        return tickets.filter((ticket: any) => ticket.status === 'resolved' || ticket.status === 'closed');
      default:
        return tickets;
    }
  };

  const filteredTickets = getFilteredTickets();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return <Settings className="h-4 w-4" />;
      case 'billing': return <DollarSign className="h-4 w-4" />;
      case 'account': return <UserIcon className="h-4 w-4" />;
      case 'bug_report': return <AlertTriangle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Client-side check relaxed; server will enforce admin/support access

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
        <p className="mt-2 text-gray-600">Manage user support requests and technical issues</p>
      </div>

      {/* Tickets Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Tickets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tickets?.filter((t: any) => t.status === 'open' && !t.claimedBy).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tickets?.filter((t: any) => t.status === 'in_progress' || (t.status === 'open' && t.claimedBy)).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tickets?.filter((t: any) => t.status === 'resolved' || t.status === 'closed').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Tickets Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTicketsTab} onValueChange={setActiveTicketsTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" data-testid="tab-pending-tickets">
                Pending ({tickets?.filter((t: any) => t.status === 'open' && !t.claimedBy).length || 0})
              </TabsTrigger>
              <TabsTrigger value="in_progress" data-testid="tab-inprogress-tickets">
                In Progress ({tickets?.filter((t: any) => t.status === 'in_progress' || (t.status === 'open' && t.claimedBy)).length || 0})
              </TabsTrigger>
              <TabsTrigger value="resolved" data-testid="tab-resolved-tickets">
                Resolved ({tickets?.filter((t: any) => t.status === 'resolved' || t.status === 'closed').length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTicketsTab} className="mt-6">
              {!tickets ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                  <span className="ml-2 text-gray-600">Loading tickets...</span>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No {activeTicketsTab.replace('_', ' ')} tickets</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTickets.map((ticket: any) => (
                    <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="flex items-center space-x-2">
                              {getCategoryIcon(ticket.category)}
                              <span className="font-medium text-gray-900">{ticket.ticketNumber}</span>
                            </div>
                            <Badge className={`text-xs border ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority?.toUpperCase()}
                            </Badge>
                            <Badge variant={ticket.status === 'open' ? 'destructive' : 
                                           ticket.status === 'in_progress' ? 'default' : 'secondary'}>
                              {ticket.status?.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          
                          <h3 className="text-lg font-medium text-gray-900 mb-1">{ticket.subject}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ticket.message}</p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                            <span>Category: {ticket.category?.replace('_', ' ')}</span>
                            {ticket.claimedBy && (
                              <span>Claimed by: {ticket.claimedByEmail}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowTicketDetail(true);
                            }}
                            data-testid={`button-view-ticket-${ticket.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          
                          {activeTicketsTab === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleClaimTicket(ticket.id)}
                              disabled={claimingTicket === ticket.id || claimedTickets.has(ticket.id)}
                              data-testid={`button-claim-ticket-${ticket.id}`}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              {claimingTicket === ticket.id ? 'Claiming...' : 
                               claimedTickets.has(ticket.id) ? 'Claimed' : 'Claim'}
                            </Button>
                          )}
                          
                          {((user as any)?.isAdmin || (user as any)?.isManager) && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                toast({
                                  title: "Assign Feature",
                                  description: "Ticket assignment functionality will be implemented soon.",
                                });
                              }}
                              data-testid={`button-assign-ticket-${ticket.id}`}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Ticket Detail Modal */}
      <Dialog open={showTicketDetail} onOpenChange={setShowTicketDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Ticket Details - {selectedTicket?.ticketNumber}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-6">
              {/* Ticket Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Subject</Label>
                  <p className="text-base font-medium">{selectedTicket.subject}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority?.toUpperCase()}
                  </Badge>
                  <Badge variant={selectedTicket.status === 'open' ? 'destructive' : 
                                 selectedTicket.status === 'in_progress' ? 'default' : 'secondary'}>
                    {selectedTicket.status?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Ticket Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Category</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    {getCategoryIcon(selectedTicket.category)}
                    <span className="capitalize">{selectedTicket.category?.replace('_', ' ')}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Created</Label>
                  <p>{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">User ID</Label>
                  <p className="font-mono text-sm">{selectedTicket.userId}</p>
                </div>
                {selectedTicket.claimedBy && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Claimed By</Label>
                    <p>{selectedTicket.claimedByEmail}</p>
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Message</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                  <p className="whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>
              </div>

              {/* Related Information */}
              {(selectedTicket.relatedCampaignId || selectedTicket.relatedTransactionId || selectedTicket.relatedUserId) && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Related Information</Label>
                  <div className="mt-2 space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    {selectedTicket.relatedCampaignId && (
                      <p><strong>Campaign ID:</strong> {selectedTicket.relatedCampaignId}</p>
                    )}
                    {selectedTicket.relatedTransactionId && (
                      <p><strong>Transaction ID:</strong> {selectedTicket.relatedTransactionId}</p>
                    )}
                    {selectedTicket.relatedUserId && (
                      <p><strong>Related User ID:</strong> {selectedTicket.relatedUserId}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedTicket.attachments && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Attachments</Label>
                  <div className="mt-2 space-y-2">
                    {JSON.parse(selectedTicket.attachments).map((attachment: any, index: number) => (
                      <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{attachment.name}</span>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              <div className="flex space-x-3 pt-4 border-t">
                {!selectedTicket.claimedBy && (
                  <Button
                    onClick={() => {
                      handleClaimTicket(selectedTicket.id);
                      setShowTicketDetail(false);
                    }}
                    disabled={claimingTicket === selectedTicket.id}
                    data-testid="button-claim-ticket-modal"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    {claimingTicket === selectedTicket.id ? 'Claiming...' : 'Claim Ticket'}
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Response Feature",
                      description: "Ticket response functionality will be implemented soon.",
                    });
                  }}
                  data-testid="button-respond-ticket"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Respond
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Status Update",
                      description: "Status update functionality will be implemented soon.",
                    });
                  }}
                  data-testid="button-update-status"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccessSection() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Access Control</h1>
        <p className="mt-2 text-gray-600">Manage user permissions and access levels</p>
      </div>
      <Card>
        <CardContent className="p-8 text-center">
          <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Access control management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
function SecuritySection() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
        <p className="mt-2 text-gray-600">Configure platform security and monitoring</p>
      </div>
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Security settings coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Admin Component
function AdminPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  // Fetch server-side user (includes role flags like isAdmin/isSupport)
  const { data: serverUser, isLoading: isLoadingServer } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    throwOnError: false,
  });
  const hasAdminAccess = (serverUser as any)?.isAdmin === true || (serverUser as any)?.isSupport === true;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("main");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isWorkspaceExpanded, setIsWorkspaceExpanded] = useState(false);

  // Shared report modal states
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [loadingReportDetails, setLoadingReportDetails] = useState(false);

  // Shared function to handle viewing report details with enhanced data fetching
  const handleViewReport = async (report: any) => {
    console.log('Opening report modal for:', report);
    setSelectedReport(report);
    setShowReportModal(true);
    setLoadingReportDetails(true);
    
    try {
      let enhancedReport = { ...report };
      console.log('Starting to enhance report:', enhancedReport);
      
      // Fetch campaign details if campaign ID is available
      const campaignId = report.campaignId || report.targetId;
      if (campaignId) {
        console.log('Fetching campaign details for:', campaignId);
        try {
const campaignResponse = await apiRequest('GET', `/api/campaigns/${campaignId}`);          if (campaignResponse.ok) {
            const campaignData = await campaignResponse.json();
            console.log('Campaign data received:', campaignData);
            enhancedReport.campaign = campaignData;
          } else {
            console.log('Campaign fetch failed:', campaignResponse.status);
          }
        } catch (error) {
          console.log('Campaign fetch error:', error);
        }
      }
      
      // Fetch creator details if creator ID is available  
      const creatorId = report.creatorId || enhancedReport.campaign?.creatorId;
      if (creatorId) {
        console.log('Fetching creator details for:', creatorId);
        try {
const creatorResponse = await apiRequest('GET', `/api/admin/users/${creatorId}`);          if (creatorResponse.ok) {
            const creatorData = await creatorResponse.json();
            console.log('Creator data received:', creatorData);
            enhancedReport.creator = creatorData;
          } else {
            console.log('Creator fetch failed:', creatorResponse.status);
          }
        } catch (error) {
          console.log('Creator fetch error:', error);
        }
      }
      
      // Fetch reporter details if reporter ID is available
      if (report.reporterId) {
        console.log('Fetching reporter details for:', report.reporterId);
        try {
const reporterResponse = await apiRequest('GET', `/api/admin/users/${report.reporterId}`);          if (reporterResponse.ok) {
            const reporterData = await reporterResponse.json();
            console.log('Reporter data received:', reporterData);
            enhancedReport.reporter = reporterData;
          } else {
            console.log('Reporter fetch failed:', reporterResponse.status);
          }
        } catch (error) {
          console.log('Reporter fetch error:', error);
        }
      }
      
      console.log('Final enhanced report:', enhancedReport);
      setSelectedReport(enhancedReport);
    } catch (error) {
      console.error('Error enhancing report details:', error);
    } finally {
      setLoadingReportDetails(false);
    }
  };

  // Handle unauthorized access
  useEffect(() => {
    if (!isLoadingServer && !serverUser) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }

    if (!isLoadingServer && serverUser && !hasAdminAccess) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
      return;
    }
  }, [isLoadingServer, serverUser, hasAdminAccess, toast]);

  // Guarded renders to avoid blank screen
  if (isLoadingServer) {
    return (
<div className="min-h-screen bg-background flex items-center justify-center">        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!serverUser) {
    return (
<div className="min-h-screen bg-background flex items-center justify-center">        <div className="text-gray-700">Please sign in to continue…</div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
<div className="min-h-screen bg-background flex items-center justify-center">        <div className="bg-white border rounded-lg p-6 shadow">
          <div className="text-xl font-semibold mb-2">Access Denied</div>
          <div className="text-gray-600">You don't have permission to access the admin panel.</div>
        </div>
      </div>
    );
  }

// Keep activeTab in sync with URL (?tab=...) even when only the query string changes
  // We listen to history updates to catch pushState/replaceState navigations
  const [routerLocation] = useLocation();
  useEffect(() => {
    const applyTabFromUrl = () => {
      const params = new URLSearchParams(window.location.search || '');
      const tabFromUrl = params.get('tab') || 'main';
      setActiveTab((prev) => (prev !== tabFromUrl ? tabFromUrl : prev));
    };

    // Initial sync on mount and whenever Admin route itself changes
    applyTabFromUrl();

    const onLocationChange = () => applyTabFromUrl();

    // Patch history methods to emit a custom event so we can react to query-only changes
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    window.history.pushState = function (...args: any[]) {
      // @ts-expect-error: spread args for native method
      const result = originalPushState.apply(this, args);
      window.dispatchEvent(new Event('verifund:locationchange'));
      return result;
    } as typeof window.history.pushState;
    window.history.replaceState = function (...args: any[]) {
      // @ts-expect-error: spread args for native method
      const result = originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event('verifund:locationchange'));
      return result;
    } as typeof window.history.replaceState;

    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('verifund:locationchange', onLocationChange);

    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('verifund:locationchange', onLocationChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [routerLocation]);  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Do not gate by client-side flags; serverUser already validated admin access
  // Keep rendering even if Supabase user object lacks isAdmin/isSupport fields

  const navigationItems = [
{ id: "main", label: "VeriFund", icon: Crown, href: "/admin?tab=main" },
    { id: "my-works", label: "Workspace", icon: FileText, href: "/admin?tab=my-works" },
    { id: "kyc", label: "KYC", icon: Shield, href: "/admin?tab=kyc" },
    { id: "campaigns", label: "Campaigns", icon: Target, href: "/admin?tab=campaigns" },
    { id: "reports", label: "Reports", icon: Flag, href: "/admin?tab=reports" },
    { id: "notifications", label: "Notifications", icon: Bell, href: "/admin?tab=notifications" },
    { id: "tickets", label: "Tickets", icon: MessageSquare, href: "/admin?tab=tickets" },  ];

  const workspaceItems = [
    { id: "my-works", label: "Overview", icon: BarChart3 },
    { id: "volunteers", label: "Volunteers", icon: Users },
    { id: "financial", label: "Financial", icon: DollarSign },
    { id: "stories", label: "Stories", icon: BookOpen },
    { id: "access", label: "Access", icon: Shield },
    { id: "invite", label: "Invites", icon: Mail },
  ];

  const sidenavItems = [
    { id: "kyc", label: "KYC", icon: Shield },
    { id: "campaigns", label: "Campaigns", icon: Target },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "tickets", label: "Tickets", icon: MessageSquare },
  ];

  const renderContent = () => {
    if (import.meta.env.DEV) {
      console.log('Admin renderContent for tab', activeTab);
    }
    switch (activeTab) {
      case "main": return (<VeriFundMainPage />);
      case "my-works": return (<MyWorksSection />);
      case "kyc": return (<KYCSection />);
      case "campaigns": return (<CampaignsSection />);
      case "volunteers": return (<VolunteersSection />);
      case "financial": return (<FinancialSection />);
      case "reports": 
        try {
          return <ReportsSection />;
        } catch (error) {
          console.error("Error in ReportsSection:", error);
          return (
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4">Reports</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">There was an error loading the Reports section. Please try refreshing the page.</p>
                <p className="text-sm text-red-600 mt-2">Error: {error?.toString()}</p>
              </div>
            </div>
          );
        }
case "notifications": return <NotificationsSection />;      case "tickets": return <TicketsSection />;
      case "invite": return <InviteSection />;
      case "security": return <SecuritySection />;
      default: return <VeriFundMainPage />;
    }
  };

  // Defensive render wrapper to avoid blank screens
  let safeContent: React.ReactNode;
  try {
    safeContent = renderContent();
  } catch (err) {
    console.error('Admin section render error:', err);
    safeContent = (
      <div className="p-6">
        <div className="text-xl font-semibold mb-2">There was an error loading this section.</div>
        <div className="text-sm text-red-600">{String(err)}</div>
      </div>
    );
  }

  return (
<div className="min-h-screen bg-background">
      {/* Theme Configurator mount (admin only) */}
      {((user as any)?.isAdmin || (user as any)?.isSupport) && (
        <ThemeConfiguratorButtonMount />
      )}
      {/* Debug banner removed */}
      {/* Top Navigation - sticky, hide user "My Profile" shortcut on admin */}
      <Navigation variant="sticky" hideAdminProfileLink />



      {/* Navigation Drawer Toggle Button */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-4 py-3 rounded-xl transition-all duration-200 hover:shadow-sm border border-gray-200 hover:border-gray-300"
            data-testid="drawer-toggle"
          >
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Menu className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">Admin Menu</span>
          </button>
          
          {/* Notification Icon */}
          <button
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 hover:shadow-sm"
            data-testid="notification-button"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Content - Full Width */}
      <div className="flex-1 overflow-auto">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-4 px-4 md:py-6 md:px-6">
            {safeContent}
          </div>
        </main>
      </div>

      {/* Modern Navigation Drawer */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-50"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black bg-opacity-30 transition-opacity duration-300" />
          
          {/* Drawer Container */}
          <div className="absolute left-0 top-0 h-full w-80 max-w-sm">
            {/* Drawer */}
            <div className="h-full bg-white shadow-2xl rounded-r-2xl flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
                </div>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {/* My Workspace - Collapsible */}
                <div className="space-y-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsWorkspaceExpanded(!isWorkspaceExpanded);
                    }}
                    className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:shadow-sm"
                    data-testid="drawer-workspace-toggle"
                  >
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg mr-3 bg-gray-100 text-gray-500">
                        <UserCheck className="h-4 w-4" />
                      </div>
                      <span className="font-medium">My Workspace</span>
                    </div>
                    {isWorkspaceExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  
                  {/* Workspace Sub-items */}
                  {isWorkspaceExpanded && (
                    <div className="ml-6 space-y-1">
                      {workspaceItems.map((item) => {
            const IconComponent = item.icon;
                        const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                  setActiveTab(item.id);
                              setIsMobileSidebarOpen(false);
                  const params = new URLSearchParams(window.location.search);
                  params.set('tab', item.id);
                  window.history.replaceState({}, '', `/admin?${params.toString()}`);
                }}
                className={`${
                              isActive
                                ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-r-2 border-indigo-500'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            } group flex items-center px-4 py-2 text-sm font-medium rounded-lg w-full text-left transition-all duration-200 hover:shadow-sm`}
                            data-testid={`drawer-nav-${item.id}`}
                          >
                            <div className={`p-1.5 rounded-md mr-3 transition-colors ${
                              isActive 
                                ? 'bg-indigo-100 text-indigo-600' 
                                : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-600'
                            }`}>
                              <IconComponent className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
                    </div>
                  )}
                </div>

                {/* Other Navigation Items */}
                {sidenavItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab(item.id);
                        setIsMobileSidebarOpen(false);
                        const params = new URLSearchParams(window.location.search);
                        params.set('tab', item.id);
                        window.history.replaceState({}, '', `/admin?${params.toString()}`);
                      }}
                      className={`${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-r-2 border-indigo-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-4 py-3 text-sm font-medium rounded-xl w-full text-left transition-all duration-200 hover:shadow-sm`}
                      data-testid={`drawer-nav-${item.id}`}
                    >
                      <div className={`p-2 rounded-lg mr-3 transition-colors ${
                        isActive 
                          ? 'bg-indigo-100 text-indigo-600' 
                          : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-600'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
              
              {/* Footer */}
              <div className="p-4 border-t border-gray-100">
                <div className="text-xs text-gray-500 text-center">
                  VeriFund Admin Panel
            </div>
          </div>
        </div>
            </div>
        </div>
      )}

    </div>
  );
}

export default AdminPage;