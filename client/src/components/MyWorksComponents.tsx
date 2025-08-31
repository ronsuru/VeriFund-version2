import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  FileText, 
  TrendingUp, 
  Users, 
  Star, 
  BarChart3, 
  ClipboardCheck,
  User as UserIcon,
  Eye,
  MapPin,
  Calendar,
  Target,
  DollarSign,
  User as CreatorIcon
} from "lucide-react";

// My Works Analytics Component
export function MyWorksAnalytics() {
  const { data: analytics = {} } = useQuery({
    queryKey: ['/api/admin/my-works/analytics'],
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
      {[
        { label: 'KYC', count: (analytics as any)?.kyc || 0, color: 'bg-green-50 text-green-700' },
        { label: 'Documents', count: (analytics as any)?.documents || 0, color: 'bg-blue-50 text-blue-700' },
        { label: 'Campaigns', count: (analytics as any)?.campaigns || 0, color: 'bg-purple-50 text-purple-700' },
        { label: 'Volunteers', count: (analytics as any)?.volunteers || 0, color: 'bg-orange-50 text-orange-700' },
        { label: 'Creators', count: (analytics as any)?.creators || 0, color: 'bg-pink-50 text-pink-700' },
        { label: 'Users', count: (analytics as any)?.users || 0, color: 'bg-indigo-50 text-indigo-700' },
        { label: 'Total', count: (analytics as any)?.total || 0, color: 'bg-gray-50 text-gray-700' },
      ].map(({ label, count, color }) => (
        <div key={label} className={`rounded-lg p-4 ${color}`}>
          <div className="text-2xl font-bold">{count}</div>
          <div className="text-sm">{label}</div>
        </div>
      ))}
    </div>
  );
}

// My Works KYC Tab Component
export function MyWorksKycTab() {
  const { data: claimedKyc = [], isLoading } = useQuery({
    queryKey: ['/api/admin/my-works/kyc'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading KYC reports...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span>My Claimed KYC Reports</span>
        </CardTitle>
        <CardDescription>KYC verification reports you have claimed for review</CardDescription>
      </CardHeader>
      <CardContent>
        {!claimedKyc || (claimedKyc as any[]).length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No claimed KYC reports yet</p>
            <p className="text-sm text-muted-foreground mt-2">Claim KYC reports from the KYC tab to start reviewing them here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(claimedKyc as any[]).map((report: any) => (
              <div key={report.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={report.profileImageUrl} />
                      <AvatarFallback>{report.firstName?.[0]}{report.lastName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{report.firstName} {report.lastName}</p>
                      <p className="text-sm text-muted-foreground">{report.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge variant="outline">KYC-{report.id.slice(0, 6)}</Badge>
                    <Badge variant={report.kycStatus === 'on_progress' ? 'default' : 'secondary'} className="text-xs capitalize">
                      {report.kycStatus}
                    </Badge>
                  </div>
                </div>
                
                {/* Enhanced Information Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      User ID
                    </div>
                    <p className="text-sm font-mono">{report.id}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      Request Created
                    </div>
                    <p className="text-sm">{report.createdAt ? new Date(report.createdAt).toLocaleString() : 'Unknown'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <ClipboardCheck className="w-3 h-3" />
                      Claim Date
                    </div>
                    <p className="text-sm">{report.dateClaimed ? new Date(report.dateClaimed).toLocaleString() : (report.processedAt ? new Date(report.processedAt).toLocaleString() : 'Unknown')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// My Works Documents Tab Component
export function MyWorksDocumentsTab() {
  const { data: claimedDocuments = [], isLoading } = useQuery({
    queryKey: ['/api/admin/my-works/documents'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading document reports...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span>My Claimed Document Reports</span>
        </CardTitle>
        <CardDescription>Document-related reports you have claimed for review</CardDescription>
      </CardHeader>
      <CardContent>
        {!claimedDocuments || (claimedDocuments as any[]).length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No claimed document reports yet</p>
            <p className="text-sm text-muted-foreground mt-2">Claim document reports from the Reports tab to start reviewing them here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(claimedDocuments as any[]).map((report: any) => (
              <div key={report.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Document Report</p>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </div>
                  <Badge variant="outline">DOC-{report.id.slice(0, 6)}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Claimed on: {new Date(report.claimedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// My Works Campaigns Tab Component  
export function MyWorksCampaignsTab() {
  const { data: claimedCampaigns = [], isLoading } = useQuery({
    queryKey: ['/api/admin/my-works/campaigns'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading claimed campaign requests...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <span>My Claimed Campaign Requests</span>
        </CardTitle>
        <CardDescription>Campaign requests you have claimed for review and approval</CardDescription>
      </CardHeader>
      <CardContent>
        {!claimedCampaigns || (claimedCampaigns as any[]).length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No claimed campaign requests yet</p>
            <p className="text-sm text-muted-foreground mt-2">Claim campaign requests from the Campaigns tab to start reviewing them here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {(claimedCampaigns as any[]).map((campaign: any) => (
              <div key={campaign.id} className="border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow">
                {/* Header Section */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{campaign.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {campaign.campaignDisplayId || `CAM-${campaign.id.slice(0, 6)}`}
                      </Badge>
                      <Badge 
                        variant={campaign.status === 'pending' ? 'default' : 'secondary'}
                        className="text-xs capitalize"
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{campaign.description}</p>
                  </div>
                </div>

                {/* Creator Info */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={campaign.creator?.profileImageUrl} />
                    <AvatarFallback>
                      {campaign.creator?.firstName?.[0]}{campaign.creator?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        {campaign.creator?.firstName} {campaign.creator?.lastName}
                      </p>
                      <Badge 
                        variant={campaign.creator?.kycStatus === 'verified' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {campaign.creator?.kycStatus === 'verified' ? 'KYC Verified' : 'KYC Pending'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{campaign.creator?.email}</p>
                    {campaign.creator?.profession && (
                      <p className="text-xs text-gray-500">{campaign.creator?.profession}</p>
                    )}
                  </div>
                </div>

                {/* Campaign Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Target className="w-3 h-3" />
                      Goal Amount
                    </div>
                    <p className="font-semibold text-sm">₱{parseFloat(campaign.goalAmount).toLocaleString()}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <DollarSign className="w-3 h-3" />
                      Minimum Amount
                    </div>
                    <p className="font-semibold text-sm">₱{parseFloat(campaign.minimumAmount).toLocaleString()}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <TrendingUp className="w-3 h-3" />
                      Current Amount
                    </div>
                    <p className="font-semibold text-sm">₱{parseFloat(campaign.currentAmount || '0').toLocaleString()}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      Duration
                    </div>
                    <p className="font-semibold text-sm">{campaign.duration} days</p>
                  </div>
                </div>

                {/* Location & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      Location
                    </div>
                    <p className="text-sm">
                      {[campaign.city, campaign.province, campaign.region].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <FileText className="w-3 h-3" />
                      Category
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {campaign.category}
                    </Badge>
                  </div>
                </div>

                {/* Volunteer Info (if applicable) */}
                {campaign.needsVolunteers && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Needs Volunteers</span>
                    </div>
                    <p className="text-xs text-blue-600">
                      {campaign.volunteerSlots} slots available, {campaign.volunteerSlotsFilledCount || 0} filled
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-xs text-gray-500">
                    <p>Claimed on: {new Date(campaign.claimedAt).toLocaleDateString()}</p>
                    <p>Created: {new Date(campaign.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// My Works Volunteers Tab Component
export function MyWorksVolunteersTab() {
  const { data: claimedVolunteers = [], isLoading } = useQuery({
    queryKey: ['/api/admin/my-works/volunteers'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading volunteer reports...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-orange-600" />
          <span>My Claimed Volunteer Reports</span>
        </CardTitle>
        <CardDescription>Volunteer-related reports you have claimed for review</CardDescription>
      </CardHeader>
      <CardContent>
        {!claimedVolunteers || (claimedVolunteers as any[]).length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No claimed volunteer reports yet</p>
            <p className="text-sm text-muted-foreground mt-2">Claim volunteer reports from the Reports tab to start reviewing them here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(claimedVolunteers as any[]).map((report: any) => (
              <div key={report.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={report.volunteer?.profileImageUrl} />
                      <AvatarFallback>{report.volunteer?.firstName?.[0]}{report.volunteer?.lastName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{report.volunteer?.firstName} {report.volunteer?.lastName}</p>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline">VOL-{report.id.slice(0, 6)}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Claimed on: {new Date(report.claimedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// My Works Creators Tab Component
export function MyWorksCreatorsTab() {
  const { data: claimedCreators = [], isLoading } = useQuery({
    queryKey: ['/api/admin/my-works/creators'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading creator reports...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Star className="w-5 h-5 text-pink-600" />
          <span>My Claimed Creator Reports</span>
        </CardTitle>
        <CardDescription>Creator-related reports you have claimed for review</CardDescription>
      </CardHeader>
      <CardContent>
        {!claimedCreators || (claimedCreators as any[]).length === 0 ? (
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No claimed creator reports yet</p>
            <p className="text-sm text-muted-foreground mt-2">Claim creator reports from the Reports tab to start reviewing them here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(claimedCreators as any[]).map((report: any) => (
              <div key={report.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={report.creator?.profileImageUrl} />
                      <AvatarFallback>{report.creator?.firstName?.[0]}{report.creator?.lastName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{report.creator?.firstName} {report.creator?.lastName}</p>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline">CRE-{report.id.slice(0, 6)}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Claimed on: {new Date(report.claimedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// My Works Users Tab Component
export function MyWorksUsersTab() {
  const { data: claimedUsers = [], isLoading } = useQuery({
    queryKey: ['/api/admin/my-works/users'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading user reports...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserIcon className="w-5 h-5 text-indigo-600" />
          <span>My Claimed User Reports</span>
        </CardTitle>
        <CardDescription>User-related reports you have claimed for review</CardDescription>
      </CardHeader>
      <CardContent>
        {!claimedUsers || (claimedUsers as any[]).length === 0 ? (
          <div className="text-center py-8">
            <UserIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No claimed user reports yet</p>
            <p className="text-sm text-muted-foreground mt-2">Claim user reports from the Reports tab to start reviewing them here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(claimedUsers as any[]).map((report: any) => (
              <div key={report.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={report.user?.profileImageUrl} />
                      <AvatarFallback>{report.user?.firstName?.[0]}{report.user?.lastName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{report.user?.firstName} {report.user?.lastName}</p>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline">USR-{report.id.slice(0, 6)}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Claimed on: {new Date(report.claimedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// My Works All Tab Component
export function MyWorksAllTab() {
  const { data: allClaimedWorks = [], isLoading } = useQuery({
    queryKey: ['/api/admin/my-works/all'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading all claimed works...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <span>All My Claimed Works</span>
        </CardTitle>
        <CardDescription>All reports and requests you have claimed across all categories</CardDescription>
      </CardHeader>
      <CardContent>
        {!allClaimedWorks || (allClaimedWorks as any[]).length === 0 ? (
          <div className="text-center py-8">
            <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No claimed works yet</p>
            <p className="text-sm text-muted-foreground mt-2">Start claiming reports from various tabs to see your work organized here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(allClaimedWorks as any[]).map((work: any) => (
              <div key={work.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      work.type === 'kyc' ? 'bg-green-500' :
                      work.type === 'documents' ? 'bg-blue-500' :
                      work.type === 'campaigns' ? 'bg-purple-500' :
                      work.type === 'volunteers' ? 'bg-orange-500' :
                      work.type === 'creators' ? 'bg-pink-500' :
                      work.type === 'users' ? 'bg-indigo-500' : 'bg-gray-500'
                    }`} />
                    <div>
                      <p className="font-medium">{work.title || work.description}</p>
                      <p className="text-sm text-muted-foreground capitalize">{work.type} Report</p>
                    </div>
                  </div>
                  <Badge variant="outline">{work.displayId || work.id.slice(0, 6)}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Claimed on: {new Date(work.claimedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main My Works Component that wraps everything
export default function MyWorksComponents() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <ClipboardCheck className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">My Works</h1>
        </div>
        <p className="text-gray-600">Track your claimed tasks and workload management</p>
      </div>

      {/* Analytics */}
      <MyWorksAnalytics />

      {/* Claimed Work Tabs */}
      <Tabs defaultValue="kyc" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="kyc">KYC</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="all">All Works</TabsTrigger>
        </TabsList>

        <TabsContent value="kyc">
          <MyWorksKycTab />
        </TabsContent>

        <TabsContent value="documents">
          <MyWorksDocumentsTab />
        </TabsContent>

        <TabsContent value="campaigns">
          <MyWorksCampaignsTab />
        </TabsContent>

        <TabsContent value="users">
          <MyWorksUsersTab />
        </TabsContent>

        <TabsContent value="all">
          <MyWorksAllTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}