import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Calendar, 
  Star, 
  Briefcase, 
  GraduationCap, 
  Phone, 
  MapPin, 
  Building,
  Linkedin,
  MessageCircle,
  FileText,
  Users,
  TrendingUp,
  DollarSign,
  Shield,
  Hash
} from "lucide-react";
import { format } from "date-fns";
import UserVerifiedBadge from "@/components/UserVerifiedBadge";

interface CreatorProfileProps {
  creator: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImageUrl?: string;
    kycStatus?: string;
    joinDate?: string;
    createdAt?: string;
    socialScore?: number;
    creditScore?: number;
    averageRating?: number;
    totalRatings?: number;
    totalCampaigns?: number;
    activeCampaigns?: number;
    completedCampaigns?: number;
    totalRaised?: string | number;
    totalContributions?: number;
    contributionsValue?: string | number;
    averageSuccessRate?: number;
    averageSuccess?: number;
    phpBalance?: string | number;
    pusoBalance?: string | number;
    tipsBalance?: string | number;
    profession?: string;
    education?: string;
    address?: string;
    phoneNumber?: string;
    linkedinProfile?: string;
    organizationName?: string;
    organizationType?: string;
    workExperience?: string;
    skills?: string;
    reliabilityScore?: string | number;
    reliabilityRatingsCount?: number;
  };
  currentUser?: any; // Current user data to check admin status
  showAdminInfo?: boolean;
  showContactInfo?: boolean;
  onClose?: () => void;
}

export default function CreatorProfile({ 
  creator, 
  currentUser,
  showAdminInfo = false, 
  showContactInfo = false,
  onClose 
}: CreatorProfileProps) {
  const displayName = `${creator.firstName || 'Anonymous'} ${creator.lastName || 'User'}`.trim();
  const initials = `${creator.firstName?.[0] || 'U'}${creator.lastName?.[0] || ''}`;
  const joinDateFormatted = creator.joinDate 
    ? format(new Date(creator.joinDate), 'MMMM yyyy')
    : creator.createdAt 
      ? format(new Date(creator.createdAt), 'MMMM yyyy')
      : null;

  // Check if current user is admin/support to show sensitive information
  const isAdminOrSupport = currentUser?.isAdmin === true;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start gap-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
          {creator.profileImageUrl ? (
            <img 
              src={creator.profileImageUrl} 
              alt="Profile" 
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            {displayName}
          </h2>
          <div className="flex items-center gap-4 mt-2">
            {isAdminOrSupport ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{creator.email || 'Email not provided'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-500">
                <Mail className="w-4 h-4" />
                <span className="text-sm italic">Contact info restricted to admin/support</span>
              </div>
            )}
            <Badge 
              variant={
                creator.kycStatus === 'verified' ? 'default' : 
                creator.kycStatus === 'pending' ? 'secondary' : 
                'destructive'
              }
              data-testid="creator-kyc-status"
            >
              <UserVerifiedBadge size="sm" className="mr-1" />
              KYC {creator.kycStatus || 'Not started'}
            </Badge>
          </div>
          {joinDateFormatted && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              Member since {joinDateFormatted}
            </div>
          )}
          
          {/* Creator Reference ID */}
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <Hash className="w-4 h-4" />
            <span className="flex items-center gap-2">
              <strong>Creator ID:</strong> {creator.id.slice(0, 8)}...{creator.id.slice(-4)}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(creator.id);
                  // You could add a toast notification here
                }}
                className="text-blue-600 hover:text-blue-800 text-xs underline ml-2"
                title="Click to copy full Creator ID"
              >
                Copy ID
              </button>
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1 italic">
            Use this ID when contacting support about this creator
          </div>
        </div>
      </div>

      {/* Trust & Community Scores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="creator-social-score">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Social Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{creator.socialScore || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Community engagement</div>
          </CardContent>
        </Card>
        
        <Card data-testid="creator-reliability-score">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Reliability Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-2xl font-bold text-green-600">
                {creator.reliabilityScore ? parseFloat(creator.reliabilityScore.toString()).toFixed(1) : "0.0"}
              </div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(parseFloat(creator.reliabilityScore?.toString() || '0'))
                        ? 'fill-green-400 text-green-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-500">{creator.reliabilityRatingsCount || 0} volunteer ratings</div>
          </CardContent>
        </Card>
        
        <Card data-testid="creator-credit-score">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Credit Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{creator.creditScore || 0}%</div>
            <div className="text-xs text-gray-500 mt-1">Document quality</div>
          </CardContent>
        </Card>
        
        <Card data-testid="creator-star-rating">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Star Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-2xl font-bold text-yellow-600">
                {creator.averageRating || 0}
              </div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(creator.averageRating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            {(creator.totalRatings || 0) > 0 && (
              <div className="text-xs text-gray-500">{creator.totalRatings} ratings</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card data-testid="creator-campaigns-stat">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{creator.totalCampaigns || 0}</div>
            {(creator.activeCampaigns !== undefined || creator.completedCampaigns !== undefined) && (
              <div className="text-xs text-gray-500 mt-1">
                {creator.activeCampaigns || 0} active • {creator.completedCampaigns || 0} completed
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card data-testid="creator-funds-raised">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Funds Raised</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₱{creator.totalRaised ? parseFloat(creator.totalRaised.toString()).toLocaleString() : '0'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {creator.averageSuccessRate || creator.averageSuccess || 0}% success rate
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="creator-contributions">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Contributions Made</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{creator.totalContributions || 0}</div>
            <div className="text-xs text-gray-500 mt-1">
              ₱{creator.contributionsValue ? parseFloat(creator.contributionsValue.toString()).toLocaleString() : '0'} total
            </div>
          </CardContent>
        </Card>
        
        {showAdminInfo && (
          <Card data-testid="creator-wallet-balances">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Wallet Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Balance:</span>
                  <span className="font-medium">₱{parseFloat(creator.phpBalance?.toString() || creator.pusoBalance?.toString() || '0').toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tips:</span>
                  <span className="font-medium">₱{parseFloat(creator.tipsBalance?.toString() || '0').toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Professional & Contact Information */}
      {(creator.profession || creator.education || creator.address || creator.phoneNumber || creator.linkedinProfile || showContactInfo) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Professional Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {creator.profession && (
                <div className="flex items-start gap-3">
                  <Briefcase className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">Profession</div>
                    <div className="font-medium">{creator.profession}</div>
                  </div>
                </div>
              )}
              
              {creator.education && (
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">Education</div>
                    <div className="font-medium">{creator.education}</div>
                  </div>
                </div>
              )}

              {creator.organizationName && (
                <div className="flex items-start gap-3">
                  <Building className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">Organization</div>
                    <div className="font-medium">
                      {creator.organizationName}
                      {creator.organizationType && (
                        <span className="text-gray-500 text-sm"> ({creator.organizationType})</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {creator.workExperience && (
                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">Work Experience</div>
                    <div className="text-sm bg-gray-50 p-2 rounded border mt-1">
                      {creator.workExperience}
                    </div>
                  </div>
                </div>
              )}

              {creator.skills && (
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">Skills</div>
                    <div className="text-sm bg-gray-50 p-2 rounded border mt-1">
                      {creator.skills}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          {(showContactInfo || creator.address || creator.phoneNumber || creator.linkedinProfile) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {creator.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-600">Address</div>
                      <div className="font-medium">{creator.address}</div>
                    </div>
                  </div>
                )}
                
                {creator.phoneNumber && isAdminOrSupport && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-600">Phone Number</div>
                      <div className="font-medium">{creator.phoneNumber}</div>
                    </div>
                  </div>
                )}
                
                {creator.phoneNumber && !isAdminOrSupport && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-600">Phone Number</div>
                      <div className="font-medium text-gray-500 italic">Restricted to admin/support</div>
                    </div>
                  </div>
                )}

                {creator.linkedinProfile && (
                  <div className="flex items-start gap-3">
                    <Linkedin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-600">LinkedIn Profile</div>
                      <a 
                        href={creator.linkedinProfile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        View LinkedIn Profile
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

    </div>
  );
}