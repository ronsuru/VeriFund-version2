import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Trophy, 
  FileText, 
  Zap,
  Shield,
  UserCheck,
  ClipboardCheck,
  Star,
  Timer,
  Award,
  TrendingUp
} from "lucide-react";

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
  isAdmin: boolean;
  isSupport: boolean;
  dateJoined: string;
  dateInvited?: string;
  location?: string;
  phoneNumber?: string;
  birthday?: string;
  bio?: string;
}

interface StaffMilestones {
  firstKycVerified?: string;
  firstCreatorReport?: string;
  firstCampaignApproval?: string;
  firstSupportTicket?: string;
  firstDocumentReview?: string;
}

interface StaffAnalytics {
  verifiedUsers: number;
  volunteerReports: number;
  creatorReports: number;
  userReports: number;
  suspendedAccounts: number;
  fraudReports: number;
  deposits: number;
  withdrawals: number;
  contributions: number;
  claimedContributions: number;
  claimedTips: number;
}

interface LeaderboardEntry {
  userId: string;
  name: string;
  email: string;
  count: number;
  avgTime?: number;
}

interface StaffProfileProps {
  staffId?: string;
}

export function AdminStaffProfile({ staffId }: StaffProfileProps) {
  // Fetch staff member data
  const { data: staffMember } = useQuery<StaffMember>({
    queryKey: [`/api/admin/staff/${staffId || 'current'}`],
    enabled: true,
  });

  // Fetch milestones
  const { data: milestones = {} } = useQuery<StaffMilestones>({
    queryKey: [`/api/admin/staff/${staffId || 'current'}/milestones`],
    enabled: true,
  });

  // Fetch analytics
  const { data: analytics = {} } = useQuery<StaffAnalytics>({
    queryKey: [`/api/admin/staff/${staffId || 'current'}/analytics`],
    enabled: true,
  });

  // Fetch leaderboards
  const { data: kycLeaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/admin/leaderboard/kyc-evaluations'],
    enabled: true,
  });

  const { data: reportsLeaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/admin/leaderboard/reports-accommodated'],
    enabled: true,
  });

  const { data: fastestLeaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/admin/leaderboard/fastest-resolve'],
    enabled: true,
  });

  if (!staffMember) {
    return (
      <div className="min-h-screen p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading staff profile...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleTag = (member: StaffMember) => {
    if (member.isAdmin) return { text: 'Admin', color: 'bg-red-100 text-red-800' };
    if (member.isSupport) return { text: 'Support', color: 'bg-blue-100 text-blue-800' };
    return { text: 'Staff', color: 'bg-gray-100 text-gray-800' };
  };

  const roleTag = getRoleTag(staffMember);

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Top Section - Profile Info and Milestones/Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture and Basic Info */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={staffMember.profileImageUrl} />
                <AvatarFallback className="text-xl">
                  {getInitials(staffMember.firstName, staffMember.lastName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold">
                  {staffMember.firstName} {staffMember.lastName}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge className={roleTag.color} data-testid="staff-role-badge">
                    <Shield className="w-3 h-3 mr-1" />
                    {roleTag.text}
                  </Badge>
                  {(staffMember as any).userDisplayId && (
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      <span className="font-mono" data-testid={`staff-display-id-${staffMember.id}`}>
                        {(staffMember as any).userDisplayId}
                      </span>
                    </div>
                  )}
                </div>
                {/* Complete Profile link for unverified users */}
                {(staffMember as any).kycStatus !== "verified" && (
                  <div className="mt-2">
                    <button 
                      onClick={() => window.location.href = "/profile-verification"}
                      className="text-sm text-orange-600 hover:text-orange-800 underline"
                      data-testid="link-complete-profile"
                    >
                      Complete Profile
                    </button>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Start Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(staffMember.dateJoined)}
                  </p>
                </div>
              </div>

              {staffMember.birthday && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Birthday</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(staffMember.birthday)}
                    </p>
                  </div>
                </div>
              )}

              {staffMember.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">
                      {staffMember.location}
                    </p>
                  </div>
                </div>
              )}

              {staffMember.phoneNumber && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Contact Number</p>
                    <p className="text-sm text-muted-foreground">
                      {staffMember.phoneNumber}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email Address</p>
                  <p className="text-sm text-muted-foreground">
                    {staffMember.email}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Milestones and Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Milestones & Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Milestones Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Milestones
              </h3>
              <div className="space-y-3">
                {milestones.firstKycVerified && (
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">First KYC Verified</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(milestones.firstKycVerified)}
                      </p>
                    </div>
                  </div>
                )}
                
                {milestones.firstCreatorReport && (
                  <div className="flex items-center gap-3">
                    <ClipboardCheck className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">First Creator Report Created</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(milestones.firstCreatorReport)}
                      </p>
                    </div>
                  </div>
                )}

                {milestones.firstSupportTicket && (
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">First Support Ticket Resolved</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(milestones.firstSupportTicket)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Analytics Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Analytics
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verified Users</span>
                    <span className="font-medium">{analytics.verifiedUsers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volunteer Reports</span>
                    <span className="font-medium">{analytics.volunteerReports || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creator Reports</span>
                    <span className="font-medium">{analytics.creatorReports || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User Reports</span>
                    <span className="font-medium">{analytics.userReports || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Suspended Accounts</span>
                    <span className="font-medium">{analytics.suspendedAccounts || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fraud Reports</span>
                    <span className="font-medium">{analytics.fraudReports || 0}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deposits</span>
                    <span className="font-medium">{analytics.deposits || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Withdrawals</span>
                    <span className="font-medium">{analytics.withdrawals || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contributions & Tips</span>
                    <span className="font-medium">{analytics.contributions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Claimed Contributions</span>
                    <span className="font-medium">{analytics.claimedContributions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Claimed Tips</span>
                    <span className="font-medium">{analytics.claimedTips || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section - Leaderboard Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most KYC Evaluations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 text-yellow-600" />
              Most KYC Evaluations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {kycLeaderboard.slice(0, 10).map((entry, index) => (
                <div 
                  key={entry.userId} 
                  className={`flex items-center justify-between p-2 rounded ${
                    entry.userId === staffMember.id ? 'bg-yellow-50 border border-yellow-200' : ''
                  }`}
                  data-testid={`kyc-leaderboard-${index + 1}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">{entry.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{entry.count}</Badge>
                </div>
              ))}
              
              {kycLeaderboard.length === 0 && (
                <div className="text-center py-4">
                  <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Most Reports Accommodated */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-blue-600" />
              Most Reports Accommodated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportsLeaderboard.slice(0, 10).map((entry, index) => (
                <div 
                  key={entry.userId} 
                  className={`flex items-center justify-between p-2 rounded ${
                    entry.userId === staffMember.id ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                  data-testid={`reports-leaderboard-${index + 1}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-blue-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">{entry.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{entry.count}</Badge>
                </div>
              ))}
              
              {reportsLeaderboard.length === 0 && (
                <div className="text-center py-4">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fastest to Resolve Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-green-600" />
              Fastest to Resolve Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fastestLeaderboard.slice(0, 10).map((entry, index) => (
                <div 
                  key={entry.userId} 
                  className={`flex items-center justify-between p-2 rounded ${
                    entry.userId === staffMember.id ? 'bg-green-50 border border-green-200' : ''
                  }`}
                  data-testid={`fastest-leaderboard-${index + 1}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-green-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">{entry.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">
                      {entry.avgTime ? `${Math.round(entry.avgTime)}h` : 'N/A'}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {fastestLeaderboard.length === 0 && (
                <div className="text-center py-4">
                  <Timer className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}