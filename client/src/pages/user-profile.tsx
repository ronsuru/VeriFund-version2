import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Mail, Phone, MapPin, Calendar, User, Shield, DollarSign, Flag, Clock,
  CheckCircle, AlertCircle, Edit, Wallet, Target, TrendingUp, Award, Users, Star,
  MessageCircle, Upload, X, LifeBuoy, Briefcase, Camera, History, Heart, Box,
  TrendingDown, Gift
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";

export default function UserProfile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Only allow admins and support to view user profiles
  const isAdminOrSupport = (user as any)?.isAdmin === true || (user as any)?.isSupport === true;

  const { data: userProfile, isLoading, error } = useQuery({
    queryKey: [`/api/admin/users/${userId}`],
    enabled: isAdminOrSupport && !!userId,
  });

  // Additional queries to match personal profile structure  
  const { data: userCampaigns = [] } = useQuery({
    queryKey: [`/api/admin/users/${userId}/campaigns`],
    enabled: false, // We'll use profile.campaigns instead
  }) as { data: any[] };

  const { data: userTransactions = [] } = useQuery({
    queryKey: [`/api/admin/users/${userId}/transactions`], 
    enabled: false, // We'll add this endpoint later if needed
  }) as { data: any[] };

  const { data: userContributions = [] } = useQuery({
    queryKey: [`/api/admin/users/${userId}/contributions`],
    enabled: false, // We'll add this endpoint later if needed  
  }) as { data: any[] };

  // Fetch user scores similar to personal profile
  const { data: creditScoreData } = useQuery({
    queryKey: [`/api/users/${userId}/credit-score`],
    enabled: isAdminOrSupport && !!userId,
  }) as { data: { averageScore: number } | undefined };

  const { data: averageRatingData } = useQuery({
    queryKey: [`/api/admin/creator/${userId}/profile`],
    enabled: isAdminOrSupport && !!userId,
  }) as { data: { averageRating: number; totalRatings: number; socialScore?: number } | undefined };

  const profile = userProfile as any;

  if (!isAdminOrSupport) {
    return (
<div className="min-h-screen bg-background flex items-center justify-center">        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have permission to view user profiles.</p>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
<div className="min-h-screen bg-background p-4">        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
<div className="min-h-screen bg-background flex items-center justify-center">        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
            <p className="text-gray-600 mb-4">The user profile you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation('/admin')} className="mr-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = `${profile?.firstName || 'Anonymous'} ${profile?.lastName || 'User'}`.trim();
  const initials = `${profile?.firstName?.[0] || 'U'}${profile?.lastName?.[0] || ''}`;
  
  const getKycStatusBadge = () => {
    const status = profile?.kycStatus;
    const hasKycDocuments = profile?.governmentIdUrl || profile?.proofOfAddressUrl;
    
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "pending":
        if (hasKycDocuments) {
          return (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
              <Clock className="w-3 h-3 mr-1" />
              Pending Review
            </Badge>
          );
        } else {
          return (
            <Badge className="bg-gray-100 text-gray-800 border-gray-200">
              <AlertCircle className="w-3 h-3 mr-1" />
              Basic
            </Badge>
          );
        }
      case "on_progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Basic
          </Badge>
        );
    }
  };

  const getStatusBadge = (isSuspended: boolean, isFlagged: boolean) => {
    if (isSuspended) return <Badge variant="destructive">Suspended</Badge>;
    if (isFlagged) return <Badge variant="outline" className="border-orange-500 text-orange-700">Flagged</Badge>;
    return <Badge variant="secondary">Active</Badge>;
  };

  // Calculate user statistics similar to personal profile
  const totalContributed = (userTransactions as any[]).reduce((sum: number, contrib: any) => sum + parseFloat(contrib.amount || "0"), 0);
  const totalRaised = (profile.campaigns || []).reduce((sum: number, campaign: any) => sum + parseFloat(campaign.currentAmount || "0"), 0);
  const successfulCampaigns = (profile.campaigns || []).filter((campaign: any) => campaign.status === "active" && parseFloat(campaign.currentAmount || "0") >= parseFloat(campaign.goalAmount || "1")).length;

  return (
<div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 mt-4">        {/* Header */}
        <div className="mb-8">
          <Button 
            onClick={() => setLocation('/admin')} 
            variant="ghost" 
            className="mb-4"
            data-testid="button-back-admin"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Panel
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">User Profile - {displayName}</h1>
          <p className="text-gray-600 mt-2">Administrative view of user information and activity</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information Card - Left Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="relative mx-auto mb-4">
                  <div className="w-24 h-24 bg-gray-300 rounded-full overflow-hidden flex items-center justify-center mx-auto">
                    {profile?.profileImageUrl ? (
                      <img 
                        src={profile.profileImageUrl} 
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-medium text-gray-600">
                        {initials}
                      </span>
                    )}
                  </div>
                </div>
                <CardTitle className="text-xl" data-testid="text-user-name">{displayName}</CardTitle>
                <div className="flex justify-center space-x-2 mb-2">
                  <Badge variant="outline" data-testid="text-user-id">
                    ID: {profile?.userDisplayId || userId}
                  </Badge>
                  {getStatusBadge(profile?.isSuspended, profile?.isFlagged)}
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  <p>Member since {profile?.createdAt ? format(new Date(profile.createdAt), 'MMMM yyyy') : 'Unknown'}</p>
                </div>
              </CardHeader>
            </Card>

            {/* User Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>User Scores</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Credit Score */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-900">Credit Score</h3>
                      <p className="text-xs text-blue-700">Financial trustworthiness</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600" data-testid="text-credit-score">
                      {creditScoreData?.averageScore || 0}
                    </div>
                    <div className="text-xs text-blue-600">Points</div>
                  </div>
                </div>

                {/* Social Score */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-900">Social Score</h3>
                      <p className="text-xs text-green-700">Community safety points</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600" data-testid="text-social-score">
                      {averageRatingData?.socialScore || profile?.socialScore || 0}
                    </div>
                    <div className="text-xs text-green-600">Points</div>
                  </div>
                </div>

                {/* Average Star Rating */}
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Award className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-yellow-900">Creator Rating</h3>
                      <p className="text-xs text-yellow-700">Community star rating</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 justify-end">
                      <div className="text-2xl font-bold text-yellow-600" data-testid="text-creator-rating">
                        {averageRatingData?.averageRating && averageRatingData.averageRating > 0 
                          ? averageRatingData.averageRating.toFixed(1) 
                          : '0'}
                      </div>
                      {averageRatingData?.averageRating && averageRatingData.averageRating > 0 ? (
                        <Award className="w-5 h-5 text-yellow-500 fill-current" />
                      ) : null}
                    </div>
                    <div className="text-xs text-yellow-600">
                      {averageRatingData?.totalRatings ? `${averageRatingData.totalRatings} ratings` : '0 ratings'}
                    </div>
                  </div>
                </div>

                {/* Reliability Score */}
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-purple-900">Reliability Score</h3>
                      <p className="text-xs text-purple-700">Volunteer safety rating</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 justify-end">
                      <div className="text-2xl font-bold text-purple-600" data-testid="text-reliability-score">
                        {profile?.reliabilityScore && parseFloat(profile.reliabilityScore.toString()) > 0 
                          ? parseFloat(profile.reliabilityScore.toString()).toFixed(1) 
                          : '0.0'}
                      </div>
                    </div>
                    <div className="text-xs text-purple-600">
                      {profile?.reliabilityRatingsCount ? `${profile.reliabilityRatingsCount} ratings` : '0 ratings'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KYC Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>KYC Verification Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${profile?.profileImageUrl ? "bg-green-100" : "bg-gray-100"}`}>
                        {profile?.profileImageUrl ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Camera className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Profile Picture</p>
                        <p className="text-xs text-gray-600">Upload a clear photo of yourself</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {profile?.profileImageUrl ? (
                        <Badge className="bg-green-100 text-green-800">Complete</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${profile?.profession ? "bg-green-100" : "bg-gray-100"}`}>
                        {profile?.profession ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <User className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Professional Information</p>
                        <p className="text-xs text-gray-600">Complete your professional details</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {profile?.profession ? (
                        <Badge className="bg-green-100 text-green-800">Complete</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${profile?.kycStatus === "verified" ? "bg-green-100" : "bg-gray-100"}`}>
                        {profile?.kycStatus === "verified" ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Shield className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Identity Verification</p>
                        <p className="text-xs text-gray-600">Submit valid ID and proof of address</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getKycStatusBadge()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5" />
                  <span>Wallet Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      ₱{parseFloat(profile?.phpBalance?.toString() || "0").toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">PHP Wallet</div>
                    <div className="text-xs text-gray-500">Available money for withdrawal</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ₱{parseFloat(profile?.tipsBalance?.toString() || "0").toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Tips Balance</div>
                    <div className="text-xs text-gray-500">Tips received from supporters</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
₱{parseFloat(profile?.contributionsBalance?.toString() || "0").toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Contributions Balance</div>
                    <div className="text-xs text-gray-500">Claimable contributions from campaigns</div>                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm" data-testid="text-user-email">{profile?.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-sm" data-testid="text-user-phone">{profile?.contactNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-sm" data-testid="text-user-address">{profile?.address || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Birthday</label>
                    <p className="text-sm" data-testid="text-user-birthday">
                      {profile?.birthday ? format(new Date(profile.birthday), 'MMMM dd, yyyy') : 'Not provided'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Education</label>
                    <p className="text-sm">{profile?.education || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Profession</label>
                    <p className="text-sm">{profile?.profession || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Work Experience</label>
                    <p className="text-sm">{profile?.workExperience || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Organization</label>
                    <p className="text-sm">{profile?.organizationName || 'Not provided'}</p>
                  </div>
                </div>
                {profile?.linkedinProfile && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">LinkedIn Profile</label>
                    <p className="text-sm">
                      <a href={profile.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {profile.linkedinProfile}
                      </a>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Campaigns */}
            {profile?.campaigns && profile.campaigns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    User Campaigns ({profile.campaigns.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profile.campaigns.slice(0, 5).map((campaign: any) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{campaign.title}</p>
                          <p className="text-xs text-gray-500">
                            Goal: ₱{campaign.goal?.toLocaleString()} | 
                            Raised: ₱{campaign.totalRaised?.toLocaleString() || 0} | 
                            Status: <span className={`font-medium ${
                              campaign.status === 'active' ? 'text-green-600' :
                              campaign.status === 'completed' ? 'text-blue-600' :
                              campaign.status === 'draft' ? 'text-yellow-600' : 'text-red-600'
                            }`}>{campaign.status}</span>
                          </p>
                          <p className="text-xs text-gray-400">
                            Created: {campaign.createdAt ? format(new Date(campaign.createdAt), 'MMM dd, yyyy') : 'Unknown'}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`/campaigns/${campaign.id}`, '_blank')}
                          data-testid={`button-view-campaign-${campaign.id}`}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                    {profile.campaigns.length > 5 && (
                      <p className="text-xs text-gray-500 text-center">
                        And {profile.campaigns.length - 5} more campaigns...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Activity Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-gray-600">
                      {profile?.campaigns?.length || 0}
                    </div>
                    <div className="text-xs text-gray-600">Campaigns Created</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-gray-600">
                      ₱{totalRaised.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Total Raised</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-gray-600">
                      {successfulCampaigns}
                    </div>
                    <div className="text-xs text-gray-600">Successful Campaigns</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-gray-600">
                      {profile?.volunteerApplicationsCount || 0}
                    </div>
                    <div className="text-xs text-gray-600">Volunteer Applications</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Last Login:</span>
                    <span>{profile?.lastLoginAt ? format(new Date(profile.lastLoginAt), 'MMM dd, yyyy') : 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Account Created:</span>
                    <span>{profile?.createdAt ? format(new Date(profile.createdAt), 'MMM dd, yyyy') : 'Unknown'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>


          </div>
        </div>
      </div>
    </div>
  );
}