import {
  users,
  campaigns,
  contributions,
  tips,
  transactions,
  volunteerOpportunities,
  volunteerApplications,
  campaignUpdates,
  paymentRecords,
  exchangeRates,
  blockchainConfig,
  supportInvitations,
  supportRequests,
  supportTickets,
  supportEmailTickets,
  notifications,
  campaignReactions,
  campaignComments,
  commentReplies,
  commentVotes,
  replyVotes,
  progressReports,
  progressReportDocuments,
  userCreditScores,
  creatorRatings,
  fraudReports,
  volunteerReports,
  monthlyCampaignLimits,
  volunteerReliabilityRatings,
  stories,
  storyReactions,
  storyComments,
  storyShares,
  type User,
  type UpsertUser,
  type Campaign,
  type InsertCampaign,
  type Contribution,
  type InsertContribution,
  type Tip,
  type InsertTip,
  type Transaction,
  type InsertTransaction,
  type VolunteerOpportunity,
  type InsertVolunteerOpportunity,
  type VolunteerApplication,
  type InsertVolunteerApplication,
  type CampaignUpdate,
  type InsertCampaignUpdate,
  type PaymentRecord,
  type InsertPaymentRecord,
  type ExchangeRate,
  type InsertExchangeRate,
  type SupportInvitation,
  type InsertSupportInvitation,
  type SupportRequest,
  type InsertSupportRequest,
  type Notification,
  type InsertNotification,
  type CampaignReaction,
  type InsertCampaignReaction,
  type CampaignComment,
  type InsertCampaignComment,
  type CommentReply,
  type InsertCommentReply,
  type ProgressReport,
  type InsertProgressReport,
  type ProgressReportDocument,
  type InsertProgressReportDocument,
  type UserCreditScore,
  type InsertUserCreditScore,
  type CreatorRating,
  type InsertCreatorRating,
  type FraudReport,
  type InsertFraudReport,
  type VolunteerReport,
  type InsertVolunteerReport,
  type SupportTicket,
  type InsertSupportTicket,
  type SupportEmailTicket,
  type InsertSupportEmailTicket,
  type VolunteerReliabilityRating,
  type Story,
  type InsertStory,
  type StoryReaction,
  type InsertStoryReaction,
  type StoryComment,
  type InsertStoryComment,
  type StoryShare,
  type InsertStoryShare,
  type InsertVolunteerReliabilityRating,
} from "@shared/schema";
import { idGenerator } from "@shared/idUtils";
import { db } from "./db";
import { eq, desc, sql, and, or, not, gt, lt, inArray, isNull, isNotNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import * as crypto from "crypto";
import { ObjectStorageService } from "./storage/supabaseStorage";

// ID Generation utilities
function generateDisplayId(prefix: string, suffix: string): string {
  return `${prefix}-${suffix.padStart(6, '0')}`;
}

function generateRandomSuffix(): string {
  return Math.floor(Math.random() * 999999).toString().padStart(6, '0');
}

async function generateUniqueUserDisplayId(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const suffix = generateRandomSuffix();
    const displayId = generateDisplayId('USR', suffix);
    
    const existing = await db.select().from(users).where(eq(users.userDisplayId, displayId)).limit(1);
    if (existing.length === 0) {
      return displayId;
    }
    attempts++;
  }
  // Fallback to timestamp-based ID if random fails
  return generateDisplayId('USR', Date.now().toString().slice(-6));
}

function isDraft(status: string | null | undefined): boolean {
  return (status || '').toLowerCase() === 'draft';
}async function generateUniqueTransactionDisplayId(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const suffix = generateRandomSuffix();
    const displayId = generateDisplayId('TXN', suffix);
    
    const existing = await db.select().from(transactions).where(eq(transactions.transactionDisplayId, displayId)).limit(1);
    if (existing.length === 0) {
      return displayId;
    }
    attempts++;
  }
  // Fallback to timestamp-based ID if random fails
  return generateDisplayId('TXN', Date.now().toString().slice(-6));
}

async function generateUniqueDocumentDisplayId(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const suffix = generateRandomSuffix();
    const displayId = generateDisplayId('DOC', suffix);
    
    const existing = await db.select().from(progressReportDocuments).where(eq(progressReportDocuments.documentDisplayId, displayId)).limit(1);
    if (existing.length === 0) {
      return displayId;
    }
    attempts++;
  }
  // Fallback to timestamp-based ID if random fails
  return generateDisplayId('DOC', Date.now().toString().slice(-6));
}

async function generateUniqueCampaignDisplayId(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const suffix = generateRandomSuffix();
    const displayId = generateDisplayId('CAM', suffix);
    
    const existing = await db.select().from(campaigns).where(eq(campaigns.campaignDisplayId, displayId)).limit(1);
    if (existing.length === 0) {
      return displayId;
    }
    attempts++;
  }
  // Fallback to timestamp-based ID if random fails
  return generateDisplayId('CAM', Date.now().toString().slice(-6));
}
async function generateUniqueDraftDisplayId(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const suffix = generateRandomSuffix();
    const displayId = generateDisplayId('DRF', suffix);
    const existing = await db.select().from(campaigns).where(eq(campaigns.campaignDisplayId, displayId)).limit(1);
    if (existing.length === 0) {
      return displayId;
    }
    attempts++;
  }
  return generateDisplayId('DRF', Date.now().toString().slice(-6));
}export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserKYC(id: string, status: string, documents?: string): Promise<void>;
  updateUserBalance(id: string, balance: string): Promise<void>;
  updateUserProfile(id: string, profileData: {
    firstName?: string;
    middleInitial?: string;
    lastName?: string;
    contactNumber?: string;
    email?: string;
    birthday?: Date;
    address?: string;
    education?: string;
    funFacts?: string;
    profession?: string;
    workExperience?: string;
    linkedinProfile?: string;
    organizationName?: string;
    organizationType?: string;
    phoneNumber?: string;
    profileImageUrl?: string;
    isProfileComplete?: boolean;
  }): Promise<User>;
  updateUserWallet(userId: string, walletAddress: string, encryptedPrivateKey: string): Promise<void>;
  updateUser(id: string, userData: Partial<User>): Promise<User>;
  getClaimedKycRequests(staffId: string): Promise<User[]>;
  getClaimedReports(staffId: string): Promise<FraudReport[]>;
  
  
  // Campaign operations
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  getCampaigns(filters?: { status?: string; category?: string; limit?: number }): Promise<Campaign[]>;
  updateCampaignStatus(id: string, status: string): Promise<Campaign>;
  updateCampaignAmount(id: string, amount: string): Promise<void>;
  updateCampaignClaimedAmount(campaignId: string, claimedAmount: string): Promise<void>;
  updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign>;
  getCampaignsByCreator(creatorId: string): Promise<Campaign[]>;
  getExpiredCampaigns(): Promise<Campaign[]>;
  flagUser(userId: string, reason: string): Promise<void>;
getUserDraftCount(userId: string): Promise<number>;  // Contribution operations
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  getContributionsByCampaign(campaignId: string): Promise<Contribution[]>;
  getContributionsByUser(userId: string): Promise<Contribution[]>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByCampaign(campaignId: string): Promise<Transaction[]>;
  getRecentTransactions(limit?: number): Promise<Transaction[]>;
  
  // Volunteer operations
  createVolunteerOpportunity(opportunity: InsertVolunteerOpportunity): Promise<VolunteerOpportunity>;
  getVolunteerOpportunities(filters?: { status?: string; limit?: number }): Promise<VolunteerOpportunity[]>;
  applyForVolunteer(application: InsertVolunteerApplication): Promise<VolunteerApplication>;
  getVolunteerApplicationsByUser(userId: string): Promise<VolunteerApplication[]>;
  
  // Campaign volunteer operations
  getCampaignVolunteerApplication(campaignId: string, applicantId: string): Promise<VolunteerApplication | undefined>;
  createCampaignVolunteerApplication(application: { campaignId: string; applicantId: string; intent: string; message?: string; status?: string }): Promise<VolunteerApplication>;
  getCampaignVolunteerApplications(campaignId: string): Promise<VolunteerApplication[]>;
  getVolunteerApplication(applicationId: string): Promise<VolunteerApplication | undefined>;
  updateCampaignVolunteerApplicationStatus(applicationId: string, status: string, rejectionReason?: string): Promise<VolunteerApplication | undefined>;
  incrementVolunteerSlotsFilledCount(campaignId: string): Promise<void>;
  
  // Campaign updates
  createCampaignUpdate(update: InsertCampaignUpdate): Promise<CampaignUpdate>;
  getCampaignUpdates(campaignId: string): Promise<CampaignUpdate[]>;
  
  // Admin operations
  getPendingCampaigns(): Promise<Campaign[]>;
  getPendingKYC(): Promise<User[]>;
  getVerifiedUsers(): Promise<User[]>;
  getRejectedKYC(): Promise<User[]>;
  getSuspendedUsers(): Promise<User[]>;
  getFlaggedCampaigns(): Promise<Campaign[]>;
  
  // Transaction search for admin
  searchTransactions(params: {
    email?: string;
    transactionId?: string;
    amount?: string;
    type?: string;
  }): Promise<any[]>;
  
  // Balance operations - Multiple wallet types
  addPhpBalance(userId: string, amount: number): Promise<void>;
  subtractPhpBalance(userId: string, amount: number): Promise<void>;
  addTipsBalance(userId: string, amount: number): Promise<void>;
  addContributionsBalance(userId: string, amount: number): Promise<void>;
  claimTips(userId: string): Promise<number>;
  claimContributions(userId: string, amount?: number): Promise<number>;
  
  // Admin balance corrections
  correctPhpBalance(userId: string, newBalance: number, reason: string): Promise<void>;
  correctTipsBalance(userId: string, newBalance: number, reason: string): Promise<void>;
  correctContributionsBalance(userId: string, newBalance: number, reason: string): Promise<void>;
  updateTransactionStatus(transactionId: string, status: string, reason: string): Promise<void>;
  getTransactionById(transactionId: string): Promise<any>;
  
  // Admin Financial Management methods
  getContributionsAndTips(): Promise<any[]>;
  getClaimedTips(): Promise<any[]>;
  getClaimedContributions(): Promise<any[]>;
  getAllTransactionHistories(): Promise<any[]>;
  getDepositTransactions(): Promise<any[]>;
  getWithdrawalTransactions(): Promise<any[]>;
  getContributionTransactions(): Promise<any[]>;
  getTipTransactions(): Promise<any[]>;
  getClaimTransactions(): Promise<any[]>;
  getRefundTransactions(): Promise<any[]>;
  getConversionTransactions(): Promise<any[]>;
  getCampaignClosureTransactions(): Promise<any[]>;
  getCompletedTransactions(): Promise<any[]>;
  getPendingTransactions(): Promise<any[]>;
  getFailedTransactions(): Promise<any[]>;

  // Admin Claim System methods
  claimFraudReport(reportId: string, adminId: string): Promise<boolean>;
  claimSupportRequest(requestId: string, adminId: string): Promise<boolean>;
  getFraudReport(reportId: string): Promise<any>;
  getSupportRequest(requestId: string): Promise<any>;
  getAdminClaimedReports(adminId: string): Promise<{
    fraudReports: any[];
    supportRequests: any[];
  }>;

  // Admin Completed Works methods
  getAdminCompletedKyc(adminId: string): Promise<any[]>;
  getAdminCompletedDocuments(adminId: string): Promise<any[]>;
  getAdminCompletedCampaigns(adminId: string): Promise<any[]>;
  getAdminCompletedVolunteers(adminId: string): Promise<any[]>;
  getAdminCompletedCreators(adminId: string): Promise<any[]>;
  
  // Get all completed campaign reports (approved/rejected)
  getCompletedCampaignReports(): Promise<any[]>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  getAllNotifications(): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string, userId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteExpiredNotifications(): Promise<void>;

  // Public stats methods for landing page
  getAllUsers(): Promise<User[]>;
  getAllVolunteerApplications(): Promise<VolunteerApplication[]>;
  getAllContributions(): Promise<Contribution[]>;

  // Admin transaction processing
  processTransaction(transactionId: string): Promise<void>;
  rejectTransaction(transactionId: string): Promise<void>;

  // Tip operations
  createTip(tip: InsertTip): Promise<Tip>;
  getTipsByCreator(creatorId: string): Promise<Tip[]>;
  getTipsByCampaign(campaignId: string): Promise<Tip[]>;
  
  // Support staff operations
  createSupportInvitation(email: string, invitedBy: string): Promise<SupportInvitation>;
  getSupportInvitation(token: string): Promise<SupportInvitation | undefined>;
  acceptSupportInvitation(token: string): Promise<void>;
  getPendingSupportInvitations(): Promise<SupportInvitation[]>;
  getAcceptedSupportInvitations(): Promise<SupportInvitation[]>;
  getDeclinedSupportInvitations(): Promise<SupportInvitation[]>;
  getAllSupportInvitations(): Promise<SupportInvitation[]>;
  resendSupportInvitation(invitationId: string): Promise<SupportInvitation>;
  revokeSupportInvitation(invitationId: string): Promise<void>;
  getAllSupportStaff(): Promise<User[]>;
  updateSupportStaffProfile(userId: string, profileData: any): Promise<void>;
  getSupportPerformanceMetrics(userId?: string): Promise<any>;
  
  // Analytics
  getAnalytics(): Promise<{
    totalWithdrawn: number;
    totalTipsCollected: number;
    totalContributionsCollected: number;
    totalDeposited: number;
    activeUsers: number;
    contributors: number;
    creators: number;
    volunteers: number;
    completedCampaigns: number;
    pendingCampaigns: number;
    activeCampaigns: number;
    inProgressCampaigns: number;
    fraudReportsCount: number;
    verifiedUsers: number;
  }>;

  // Campaign engagement operations
  toggleCampaignReaction(campaignId: string, userId: string, reactionType: string): Promise<CampaignReaction | null>;
  getCampaignReactions(campaignId: string): Promise<{ [key: string]: { count: number; users: string[] } }>;
  getCampaignReactionByUser(campaignId: string, userId: string): Promise<CampaignReaction | undefined>;
  
  // Campaign comment operations
  createCampaignComment(comment: InsertCampaignComment): Promise<CampaignComment>;
  getCampaignComments(campaignId: string): Promise<(CampaignComment & { user: User; replies: (CommentReply & { user: User })[] })[]>;
  updateCampaignComment(commentId: string, content: string, userId: string): Promise<CampaignComment | undefined>;
  deleteCampaignComment(commentId: string, userId: string): Promise<void>;
  
  // Comment reply operations
  createCommentReply(reply: InsertCommentReply): Promise<CommentReply>;
  getCommentReplies(commentId: string): Promise<(CommentReply & { user: User })[]>;
  updateCommentReply(replyId: string, content: string, userId: string): Promise<CommentReply | undefined>;
  deleteCommentReply(replyId: string, userId: string): Promise<void>;
  
  // Document search operations
  getDocumentById(documentId: string): Promise<any>;
  getDocumentByShortId(shortId: string): Promise<any>;
  generateDocumentShortId(fileUrl: string): string;

  // Volunteer reliability rating operations
  createVolunteerReliabilityRating(rating: InsertVolunteerReliabilityRating): Promise<VolunteerReliabilityRating>;
  getVolunteerReliabilityRating(volunteerId: string, campaignId: string): Promise<VolunteerReliabilityRating | undefined>;
  getVolunteerReliabilityRatings(volunteerId: string): Promise<(VolunteerReliabilityRating & { campaign: Campaign; rater: User })[]>;
  updateVolunteerReliabilityScore(volunteerId: string): Promise<void>;
  getVolunteersToRate(campaignId: string, creatorId: string): Promise<(User & { application: VolunteerApplication })[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Generate user display ID if not provided
    if (!userData.userDisplayId) {
      userData.userDisplayId = await generateUniqueUserDisplayId();
    }
    
    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error) {
      // If there's a unique constraint violation on email, try to find existing user
      if (error.code === '23505' && error.constraint === 'users_email_unique') {
        const existingUser = await this.getUserByEmail(userData.email);
        if (existingUser) {
          // Update the existing user instead
          const [updatedUser] = await db
            .update(users)
            .set({
              ...userData,
              updatedAt: new Date(),
            })
            .where(eq(users.email, userData.email))
            .returning();
          return updatedUser;
        }
      }
      throw error;
    }
  }

  async updateUserKYC(id: string, status: string, documentsOrReason?: string): Promise<void> {
    const updateData: any = { 
      kycStatus: status, 
      updatedAt: new Date() 
    };
    
    // If status is rejected, store the reason in rejectionReason field
    if (status === 'rejected' && documentsOrReason) {
      updateData.rejectionReason = documentsOrReason;
    } else if (documentsOrReason) {
      // For other statuses, treat as documents
      updateData.kycDocuments = documentsOrReason;
    }
    
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id));
  }

  // Delete a campaign by ID (caller must verify draft + ownership)
  async deleteCampaignById(campaignId: string): Promise<void> {
    // First get the campaign to extract image URLs before deletion
    const campaign = await db.select({ images: campaigns.images }).from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    
    if (campaign.length > 0 && campaign[0].images) {
      try {
        // Parse images array and delete from storage
        const imageUrls = JSON.parse(campaign[0].images);
        if (Array.isArray(imageUrls)) {
          for (const imageUrl of imageUrls) {
            if (imageUrl && typeof imageUrl === 'string') {
              // Extract object path from URL and delete from storage
              await this.deleteCampaignImage(imageUrl);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to parse campaign images for cleanup:', error);
      }
    }
    
    // Delete the campaign record
    await db.delete(campaigns).where(eq(campaigns.id, campaignId));
  }

  // Helper method to delete campaign image from storage
  private async deleteCampaignImage(imageUrl: string): Promise<void> {
    try {
      // Extract object path from various URL formats
      let objectPath = imageUrl;
      
      // Handle different URL formats
      if (imageUrl.startsWith('http')) {
        // Extract path from full URL
        const url = new URL(imageUrl);
        objectPath = url.pathname.replace('/storage/v1/object/public/', '').replace('/verifund-assets/', '');
      } else if (imageUrl.startsWith('/api/upload')) {
        // Extract from API upload path
        const url = new URL(imageUrl, 'http://localhost');
        objectPath = url.searchParams.get('objectPath') || imageUrl;
      } else if (imageUrl.startsWith('/objects/')) {
        // Direct object path
        objectPath = imageUrl.replace('/objects/', '');
      } else if (imageUrl.startsWith('verifund-assets/')) {
        // Bucket-prefixed path
        objectPath = imageUrl.replace('verifund-assets/', '');
      }
      
      // Clean up the path
      objectPath = objectPath.replace(/^\/+/, '');
      
      if (objectPath) {
        // Delete from Supabase storage
        const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'verifund-assets';
        const { supabase } = await import('./storage/supabaseStorage');
        const { error } = await supabase.storage.from(bucket).remove([objectPath]);
        
        if (error) {
          console.warn('Failed to delete image from storage:', error.message);
        } else {
          console.log('Successfully deleted image from storage:', objectPath);
        }
      }
    } catch (error) {
      console.warn('Error deleting campaign image:', error);
    }
  }

  // Get user's current draft count
  async getUserDraftCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(campaigns)
      .where(and(eq(campaigns.creatorId, userId), eq(campaigns.status, 'draft')));
    
    return result[0]?.count || 0;
  }

  // Batch delete drafts owned by a specific user
  async deleteDraftCampaignsForUser(userId: string, campaignIds: string[]): Promise<number> {
    if (!Array.isArray(campaignIds) || campaignIds.length === 0) return 0;
    
    // Get campaigns with images before deletion
    const rows = await db
      .select({ id: campaigns.id, creatorId: campaigns.creatorId, status: campaigns.status, images: campaigns.images })
      .from(campaigns)
      .where(inArray(campaigns.id, campaignIds as any));
    
    const deletableRows = rows.filter(r => r.creatorId === userId && isDraft(r.status as any));
    if (deletableRows.length === 0) return 0;
    
    // Clean up images from storage before deleting database records
    for (const row of deletableRows) {
      if (row.images) {
        try {
          const imageUrls = JSON.parse(row.images);
          if (Array.isArray(imageUrls)) {
            for (const imageUrl of imageUrls) {
              if (imageUrl && typeof imageUrl === 'string') {
                await this.deleteCampaignImage(imageUrl);
              }
            }
          }
        } catch (error) {
          console.warn('Failed to parse campaign images for cleanup:', error);
        }
      }
    }
    
    const deletableIds = deletableRows.map(r => r.id);
    await db.delete(campaigns).where(inArray(campaigns.id, deletableIds as any));
    return deletableIds.length;
  }

  async updateUserBalance(id: string, balance: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        phpBalance: balance,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id));
  }

  async updateUserTipBalance(id: string, balance: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        tipsBalance: balance,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id));
  }

  async updateUserWallet(userId: string, walletAddress: string, encryptedPrivateKey: string): Promise<void> {
    await db
      .update(users)
      .set({
        celoWalletAddress: walletAddress,
        walletPrivateKey: encryptedPrivateKey,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserProfile(id: string, profileData: {
    firstName?: string;
    middleInitial?: string;
    lastName?: string;
    displayName?: string;
    contactNumber?: string;
    email?: string;
    birthday?: Date | string;
    address?: string;
    education?: string;
    funFacts?: string;
    profession?: string;
    workExperience?: string;
    linkedinProfile?: string;
    organizationName?: string;
    organizationType?: string;
    phoneNumber?: string;
    profileImageUrl?: string;
    isProfileComplete?: boolean;
  }): Promise<User> {
    // Convert birthday string to Date if needed
    const processedData = { ...profileData };
    if (processedData.birthday && typeof processedData.birthday === 'string') {
      processedData.birthday = new Date(processedData.birthday);
    }
    
    const [user] = await db
      .update(users)
      .set({
        ...processedData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Campaign operations
  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    // Generate campaign display ID if not provided
    if (!campaign.campaignDisplayId) {
      if ((campaign as any).status === 'draft') {
        campaign.campaignDisplayId = await generateUniqueDraftDisplayId();
      } else {
        campaign.campaignDisplayId = await generateUniqueCampaignDisplayId();
      }    }
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + campaign.duration);
    
    const [newCampaign] = await db
      .insert(campaigns)
      .values({
        ...campaign,
        endDate,
        volunteerSlotsFilledCount: 0, // Initialize volunteer filled count
      })
      .returning();
    
    // Increment monthly campaign count only for non-draft campaigns
    if (newCampaign.creatorId && newCampaign.status !== 'draft') {      await this.incrementMonthlyCampaignCount(newCampaign.creatorId);
    }
    
    return newCampaign;
  }

  async updateCampaignClaimedAmount(campaignId: string, claimedAmount: string): Promise<void> {
    await db
      .update(campaigns)
      .set({ claimedAmount })
      .where(eq(campaigns.id, campaignId));
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async getCampaignWithCreator(id: string): Promise<any | undefined> {
    const [campaign] = await db
      .select({
        // Campaign fields
        id: campaigns.id,
        creatorId: campaigns.creatorId,
        title: campaigns.title,
        description: campaigns.description,
        category: campaigns.category,
        goalAmount: campaigns.goalAmount,
        minimumAmount: campaigns.minimumAmount,
        currentAmount: campaigns.currentAmount,
        claimedAmount: campaigns.claimedAmount,
        images: campaigns.images,
        status: campaigns.status,
        tesVerified: campaigns.tesVerified,
        duration: campaigns.duration,
        street: campaigns.street,
        barangay: campaigns.barangay,
        city: campaigns.city,
        province: campaigns.province,
        region: campaigns.region,
        zipcode: campaigns.zipcode,
        landmark: campaigns.landmark,
        startDate: campaigns.startDate,
        endDate: campaigns.endDate,
        needsVolunteers: campaigns.needsVolunteers,
        volunteerSlots: campaigns.volunteerSlots,
        volunteerSlotsFilledCount: campaigns.volunteerSlotsFilledCount,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        // Creator fields
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
        creatorEmail: users.email,
        creatorKycStatus: users.kycStatus,
      })
      .from(campaigns)
      .leftJoin(users, eq(campaigns.creatorId, users.id))
      .where(eq(campaigns.id, id));
    return campaign;
  }

  async getCampaigns(filters?: { status?: string; category?: string; limit?: number }): Promise<Campaign[]> {
    // Create user table aliases for joins
    const claimedByUser = alias(users, 'claimedByUser');
    const approvedByUser = alias(users, 'approvedByUser');
    const rejectedByUser = alias(users, 'rejectedByUser');
    
    // Select only columns that actually exist in the database
    let query = db.select({
      id: campaigns.id,
      creatorId: campaigns.creatorId,
      title: campaigns.title,
      description: campaigns.description,
      category: campaigns.category,
      goalAmount: campaigns.goalAmount,
      minimumAmount: campaigns.minimumAmount,
      currentAmount: campaigns.currentAmount,
      claimedAmount: campaigns.claimedAmount,
      images: campaigns.images,
      status: campaigns.status,
      tesVerified: campaigns.tesVerified,
      duration: campaigns.duration,
      street: campaigns.street,
      barangay: campaigns.barangay,
      city: campaigns.city,
      province: campaigns.province,
      region: campaigns.region,
      zipcode: campaigns.zipcode,
      landmark: campaigns.landmark,
      startDate: campaigns.startDate,
      endDate: campaigns.endDate,
      needsVolunteers: campaigns.needsVolunteers,
      volunteerSlots: campaigns.volunteerSlots,
      volunteerSlotsFilledCount: campaigns.volunteerSlotsFilledCount,
      createdAt: campaigns.createdAt,
      updatedAt: campaigns.updatedAt,
      campaignDisplayId: campaigns.campaignDisplayId,
      // Processing fields
      claimedBy: campaigns.claimedBy,
      claimedAt: campaigns.claimedAt,
      approvedBy: campaigns.approvedBy,
      approvedAt: campaigns.approvedAt,
      rejectedBy: campaigns.rejectedBy,
      rejectedAt: campaigns.rejectedAt,
      rejectionReason: campaigns.rejectionReason,
      // Admin email fields
      claimedByEmail: claimedByUser.email,
      approvedByEmail: approvedByUser.email,
      rejectedByEmail: rejectedByUser.email,
    })
    .from(campaigns)
    .leftJoin(claimedByUser, eq(campaigns.claimedBy, claimedByUser.id))
    .leftJoin(approvedByUser, eq(campaigns.approvedBy, approvedByUser.id))
    .leftJoin(rejectedByUser, eq(campaigns.rejectedBy, rejectedByUser.id));
    
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(campaigns.status, filters.status));
    }
    if (filters?.category) {
      conditions.push(eq(campaigns.category, filters.category));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    query = query.orderBy(desc(campaigns.createdAt));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    return await query;
  }

  async getCampaignsWithCreators(filters?: { status?: string; category?: string; limit?: number }): Promise<any[]> {
    try {
      console.log("🔍 Fetching campaigns with creators...");
      
      // Build where conditions
      const whereConditions = [];
      if (filters?.status) {
        whereConditions.push(eq(campaigns.status, filters.status));
      }
      if (filters?.category) {
        whereConditions.push(eq(campaigns.category, filters.category));
      }
      
      const campaignsData = await db
        .select({
          // Campaign fields
          id: campaigns.id,
          creatorId: campaigns.creatorId,
          title: campaigns.title,
          description: campaigns.description,
          category: campaigns.category,
          goalAmount: campaigns.goalAmount,
          minimumAmount: campaigns.minimumAmount,
          currentAmount: campaigns.currentAmount,
          claimedAmount: campaigns.claimedAmount,
          images: campaigns.images,
          status: campaigns.status,
          tesVerified: campaigns.tesVerified,
          duration: campaigns.duration,
          street: campaigns.street,
          barangay: campaigns.barangay,
          city: campaigns.city,
          province: campaigns.province,
          region: campaigns.region,
          zipcode: campaigns.zipcode,
          landmark: campaigns.landmark,
          startDate: campaigns.startDate,
          endDate: campaigns.endDate,
          needsVolunteers: campaigns.needsVolunteers,
          volunteerSlots: campaigns.volunteerSlots,
          volunteerSlotsFilledCount: campaigns.volunteerSlotsFilledCount,
          createdAt: campaigns.createdAt,
          updatedAt: campaigns.updatedAt,
          // Creator fields
          creatorFirstName: users.firstName,
          creatorLastName: users.lastName,
          creatorEmail: users.email,
          creatorKycStatus: users.kycStatus,
        })
        .from(campaigns)
        .leftJoin(users, eq(campaigns.creatorId, users.id))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(campaigns.createdAt))
        .limit(filters?.limit || 1000);
      
      console.log(`✅ Found ${campaignsData.length} campaigns with creator data`);
      return campaignsData;
    } catch (error) {
      console.error("❌ Error in getCampaignsWithCreators:", error);
      
      // Instead of falling back to regular campaigns, let's try a simpler approach
      try {
        console.log("🔄 Attempting fallback approach...");
        const basicCampaigns = await this.getCampaigns(filters);
        
        // Manually add creator information
        const campaignsWithCreators = await Promise.all(
          basicCampaigns.map(async (campaign) => {
            try {
              const creator = await this.getUser(campaign.creatorId);
              return {
                ...campaign,
                creatorFirstName: creator?.firstName || null,
                creatorLastName: creator?.lastName || null,
                creatorEmail: creator?.email || null,
                creatorKycStatus: creator?.kycStatus || null,
              };
            } catch (userError) {
              console.error(`Error fetching creator for campaign ${campaign.id}:`, userError);
              return {
                ...campaign,
                creatorFirstName: null,
                creatorLastName: null,
                creatorEmail: null,
                creatorKycStatus: null,
              };
            }
          })
        );
        
        console.log(`✅ Fallback successful: ${campaignsWithCreators.length} campaigns with creator data`);
        return campaignsWithCreators;
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError);
        return await this.getCampaigns(filters);
      }
    }
  }

  async updateCampaignStatus(id: string, status: string): Promise<Campaign> {
    const [updatedCampaign] = await db
      .update(campaigns)
      .set({ 
        status,
        updatedAt: new Date() 
      })
      .where(eq(campaigns.id, id))
      .returning();
    
    if (!updatedCampaign) {
      throw new Error("Campaign not found");
    }
    
    return updatedCampaign;
  }

  async updateCampaignAmount(id: string, amount: string): Promise<void> {
    await db
      .update(campaigns)
      .set({ 
        currentAmount: amount,
        updatedAt: new Date() 
      })
      .where(eq(campaigns.id, id));
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    const [updatedCampaign] = await db
      .update(campaigns)
      .set({ 
        ...updates,
        updatedAt: new Date() 
      })
      .where(eq(campaigns.id, id))
      .returning();
    
    if (!updatedCampaign) {
      throw new Error("Campaign not found");
    }
    
    return updatedCampaign;
  }

  async getCampaignsByCreator(creatorId: string, filters?: { status?: string; category?: string }): Promise<any[]> {
    const conditions = [eq(campaigns.creatorId, creatorId)];
    
    if (filters?.status && filters.status !== 'all') {
      conditions.push(eq(campaigns.status, filters.status));
    }

    if (filters?.category && filters.category !== 'all') {
      conditions.push(eq(campaigns.category, filters.category));
    }

    const campaignsData = await db
      .select({
        // Campaign fields
        id: campaigns.id,
        creatorId: campaigns.creatorId,
        title: campaigns.title,
        description: campaigns.description,
        category: campaigns.category,
        goalAmount: campaigns.goalAmount,
        minimumAmount: campaigns.minimumAmount,
        currentAmount: campaigns.currentAmount,
        claimedAmount: campaigns.claimedAmount,
        images: campaigns.images,
        status: campaigns.status,
        tesVerified: campaigns.tesVerified,
        duration: campaigns.duration,
        street: campaigns.street,
        barangay: campaigns.barangay,
        city: campaigns.city,
        province: campaigns.province,
        region: campaigns.region,
        zipcode: campaigns.zipcode,
        landmark: campaigns.landmark,
        startDate: campaigns.startDate,
        endDate: campaigns.endDate,
        needsVolunteers: campaigns.needsVolunteers,
        volunteerSlots: campaigns.volunteerSlots,
        volunteerSlotsFilledCount: campaigns.volunteerSlotsFilledCount,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        // Creator fields
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
        creatorEmail: users.email,
        creatorKycStatus: users.kycStatus,
      })
      .from(campaigns)
      .leftJoin(users, eq(campaigns.creatorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(campaigns.createdAt));

    return campaignsData;
  }

  // Contribution operations
  async createContribution(contribution: InsertContribution): Promise<Contribution> {
    const transactionHash = `0x${Math.random().toString(16).substr(2, 40)}`;
    
    const [newContribution] = await db
      .insert(contributions)
      .values({
        ...contribution,
        transactionHash,
      })
      .returning();

    // Check if contribution pushes campaign to minimum operational amount
    const campaign = await this.getCampaign(contribution.campaignId);
    if (campaign) {
      const newTotal = parseFloat(campaign.currentAmount) + parseFloat(contribution.amount);
      const minimumAmount = parseFloat(campaign.minimumAmount);
      
      // If we've reached minimum amount and campaign is still active, change to on_progress
      if (newTotal >= minimumAmount && campaign.status === 'active') {
        await this.updateCampaignStatus(contribution.campaignId, 'on_progress');
        
        // Create notification for campaign creator
        await this.createNotification({
          userId: campaign.creatorId,
          title: "Campaign Ready for Progress! 🚀",
          message: `Your campaign "${campaign.title}" has reached the minimum operational amount. You can now start uploading progress reports!`,
          type: "campaign_status_update",
          relatedId: contribution.campaignId,
        });
      }
    }
    
    return newContribution;
  }

  async getContributionsByCampaign(campaignId: string): Promise<Contribution[]> {
    return await db
      .select()
      .from(contributions)
      .where(eq(contributions.campaignId, campaignId))
      .orderBy(desc(contributions.createdAt));
  }

  async getContributionsByUser(userId: string): Promise<Contribution[]> {
    return await db
      .select()
      .from(contributions)
      .where(eq(contributions.contributorId, userId))
      .orderBy(desc(contributions.createdAt));
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    // Generate transaction display ID if not provided
    if (!transaction.transactionDisplayId) {
      transaction.transactionDisplayId = await generateUniqueTransactionDisplayId();
    }
    
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getTransactionsByCampaign(campaignId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.campaignId, campaignId))
      .orderBy(desc(transactions.createdAt));
  }

  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async getTransactionByPaymongoId(paymongoId: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.paymentProviderTxId, paymongoId));
    return transaction;
  }

  // Multiple wallet operations
  async addPhpBalance(userId: string, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const currentBalance = parseFloat(user.phpBalance || '0');
    const newBalance = (currentBalance + amount).toFixed(2);
    
    await db
      .update(users)
      .set({
        phpBalance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async subtractPhpBalance(userId: string, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const currentBalance = parseFloat(user.phpBalance || '0');
    const newBalance = (currentBalance - amount).toFixed(2);
    
    if (parseFloat(newBalance) < 0) {
      throw new Error('Insufficient PHP balance');
    }
    
    await db
      .update(users)
      .set({
        phpBalance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async addTipsBalance(userId: string, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const currentBalance = parseFloat(user.tipsBalance || '0');
    const newBalance = (currentBalance + amount).toFixed(2);
    
    await db
      .update(users)
      .set({
        tipsBalance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async addContributionsBalance(userId: string, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const currentBalance = parseFloat(user.contributionsBalance || '0');
    const newBalance = (currentBalance + amount).toFixed(2);
    
    await db
      .update(users)
      .set({
        contributionsBalance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async claimTips(userId: string, amount?: number): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const currentTipsBalance = parseFloat(user.tipsBalance || '0');
    if (currentTipsBalance <= 0) {
      throw new Error('No tips available to claim');
    }
    
    // If no amount specified, claim all tips
    const tipsAmount = amount || currentTipsBalance;
    
    // Validate requested amount
    if (tipsAmount > currentTipsBalance) {
      throw new Error('Insufficient tips balance');
    }
    
    // Apply 1% claiming fee to the claimed amount
    const claimingFee = Math.max(tipsAmount * 0.01, 1); // 1% with ₱1 minimum
    const netAmount = tipsAmount - claimingFee;
    
    // Calculate remaining tips balance
    const remainingTips = (currentTipsBalance - tipsAmount).toFixed(2);
    
    // Transfer net tips to PHP balance (after fee) and update tips balance
    await this.addPhpBalance(userId, netAmount);
    await db
      .update(users)
      .set({
        tipsBalance: remainingTips,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
      
    return netAmount; // Return net amount received
  }

  async claimContributions(userId: string, amount?: number): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const availableContributions = parseFloat(user.contributionsBalance || '0');
    if (availableContributions <= 0) {
      throw new Error('No contributions available to claim');
    }
    
    // Use requested amount or claim all if not specified
    const contributionsAmount = amount ? Math.min(amount, availableContributions) : availableContributions;
    
    // Validate requested amount
    if (contributionsAmount > availableContributions) {
      throw new Error('Insufficient contributions balance');
    }
    
    // Apply 1% claiming fee to the claimed amount
    const claimingFee = Math.max(contributionsAmount * 0.01, 1); // 1% with ₱1 minimum
    const netAmount = contributionsAmount - claimingFee;
    
    // Calculate remaining contributions balance
    const remainingContributions = (availableContributions - contributionsAmount).toFixed(2);
    
    // Transfer net contributions to PHP balance (after fee) and update contributions balance
    await this.addPhpBalance(userId, netAmount);
    await db
      .update(users)
      .set({
        contributionsBalance: remainingContributions,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
      
    return netAmount; // Return net amount received
  }

  // Get all contributions for a campaign (both claimed and unclaimed)
  async getAllContributionsForCampaign(campaignId: string): Promise<Contribution[]> {
    return await db
      .select()
      .from(contributions)
      .where(eq(contributions.campaignId, campaignId))
      .orderBy(desc(contributions.createdAt));
  }

  // Subtract from user's contributions balance
  async subtractUserContributionsBalance(userId: string, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const currentBalance = parseFloat(user.contributionsBalance || '0');
    if (currentBalance < amount) {
      throw new Error('Insufficient contributions balance');
    }
    
    const newBalance = (currentBalance - amount).toFixed(2);
    
    await db
      .update(users)
      .set({
        contributionsBalance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Mark contribution as refunded
  async markContributionAsRefunded(contributionId: string): Promise<void> {
    // Note: Contributions table doesn't have a status field
    // This function currently doesn't update anything but is kept for API compatibility
    // In the future, you may want to add a status field to the contributions schema
    console.log(`Contribution ${contributionId} marked as refunded (no-op due to schema limitations)`);
  }

  // Support staff invitation system
  async createSupportInvitation(email: string, invitedBy: string): Promise<SupportInvitation> {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours from now
    
    const [invitation] = await db
      .insert(supportInvitations)
      .values({
        email,
        invitedBy,
        token,
        expiresAt,
      })
      .returning();
      
    return invitation;
  }

  async getSupportInvitation(token: string): Promise<SupportInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(supportInvitations)
      .where(eq(supportInvitations.token, token))
      .limit(1);
      
    return invitation;
  }

  async getSupportInvitationByToken(token: string): Promise<SupportInvitation | undefined> {
    return await this.getSupportInvitation(token);
  }

  async updateSupportInvitationStatus(invitationId: string, status: 'pending' | 'accepted' | 'expired'): Promise<void> {
    await db
      .update(supportInvitations)
      .set({ status })
      .where(eq(supportInvitations.id, invitationId));
  }

  async updateUserRole(userId: string, role: 'support' | 'admin'): Promise<void> {
    if (role === 'support') {
      await db
        .update(users)
        .set({ isSupport: true })
        .where(eq(users.id, userId));
    } else if (role === 'admin') {
      await db
        .update(users)
        .set({ isAdmin: true })
        .where(eq(users.id, userId));
    }
  }

  async updateUserRoles(userId: string, roles: { isAdmin?: boolean; isSupport?: boolean }): Promise<void> {
    const updateFields: any = {};
    if (typeof roles.isAdmin === 'boolean') {
      updateFields.isAdmin = roles.isAdmin;
    }
    if (typeof roles.isSupport === 'boolean') {
      updateFields.isSupport = roles.isSupport;
    }
    if (Object.keys(updateFields).length === 0) return;

    await db
      .update(users)
      .set(updateFields)
      .where(eq(users.id, userId));
  }

  async acceptSupportInvitation(token: string): Promise<void> {
    const invitation = await this.getSupportInvitation(token);
    if (!invitation) {
      throw new Error('Invalid invitation token');
    }
    
    if (invitation.status !== 'pending') {
      throw new Error('Invitation has already been processed');
    }
    
    if (new Date() > invitation.expiresAt) {
      throw new Error('Invitation has expired');
    }
    
    // Update user to support role
    await db
      .update(users)
      .set({ isSupport: true })
      .where(eq(users.email, invitation.email));
      
    // Mark invitation as accepted
    await db
      .update(supportInvitations)
      .set({ status: 'accepted' })
      .where(eq(supportInvitations.token, token));
  }

  async getPendingSupportInvitations(): Promise<SupportInvitation[]> {
    return await db
      .select()
      .from(supportInvitations)
      .where(eq(supportInvitations.status, 'pending'))
      .orderBy(desc(supportInvitations.createdAt));
  }

  async getAcceptedSupportInvitations(): Promise<SupportInvitation[]> {
    return await db
      .select()
      .from(supportInvitations)
      .where(eq(supportInvitations.status, 'accepted'))
      .orderBy(desc(supportInvitations.createdAt));
  }

  async getDeclinedSupportInvitations(): Promise<SupportInvitation[]> {
    return await db
      .select()
      .from(supportInvitations)
      .where(eq(supportInvitations.status, 'declined'))
      .orderBy(desc(supportInvitations.createdAt));
  }

  async getAllSupportInvitations(): Promise<SupportInvitation[]> {
    return await db
      .select()
      .from(supportInvitations)
      .orderBy(desc(supportInvitations.createdAt));
  }

  async resendSupportInvitation(invitationId: string): Promise<SupportInvitation> {
    // Generate new token and extend expiry
    const newToken = crypto.randomUUID();
    const newExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours from now
    
    const [updatedInvitation] = await db
      .update(supportInvitations)
      .set({ 
        token: newToken, 
        expiresAt: newExpiresAt,
        status: 'pending' // Reset to pending if was expired
      })
      .where(eq(supportInvitations.id, invitationId))
      .returning();
      
    return updatedInvitation;
  }

  async revokeSupportInvitation(invitationId: string): Promise<void> {
    await db
      .update(supportInvitations)
      .set({ 
        status: 'revoked',
        revokedAt: new Date()
      })
      .where(eq(supportInvitations.id, invitationId));
  }

  async getAllSupportStaff(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(or(eq(users.isSupport, true), eq(users.isAdmin, true)))
      .orderBy(desc(users.createdAt));
  }

  async getAdminUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isAdmin, true))
      .orderBy(desc(users.createdAt));
  }

  async getSupportUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isSupport, true))
      .orderBy(desc(users.createdAt));
  }

  async updateSupportStaffProfile(userId: string, profileData: any): Promise<void> {
    await db
      .update(users)
      .set({ 
        ...profileData,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async getSupportPerformanceMetrics(userId?: string): Promise<any> {
    const supportStaff = userId 
      ? [await this.getUser(userId)]
      : await this.getAllSupportStaff();

    const metrics = [];

    for (const staff of supportStaff) {
      if (!staff || (!staff.isSupport && !staff.isAdmin)) continue;

      // Get support tickets metrics
      const ticketsQuery = db
        .select({
          total: sql<number>`count(*)`,
          avgResponseTime: sql<number>`avg(extract(epoch from (updated_at - created_at))/3600)`, // in hours
          resolved: sql<number>`count(case when status = 'resolved' then 1 end)`,
          onProgress: sql<number>`count(case when status = 'on_progress' then 1 end)`,
          closed: sql<number>`count(case when status = 'closed' then 1 end)`,
        })
        .from(supportTickets)
        .where(eq(supportTickets.claimedBy, staff.id));

      const [ticketMetrics] = await ticketsQuery;

      // Get documents reviewed (KYC)
      const kycQuery = db
        .select({
          reviewed: sql<number>`count(*)`,
          approved: sql<number>`count(case when kyc_status = 'verified' then 1 end)`,
          flagged: sql<number>`count(case when kyc_status = 'rejected' then 1 end)`,
        })
        .from(users)
        .where(eq(users.processedByAdmin, staff.email || ''));

      const [kycMetrics] = await kycQuery;

      // Get campaigns handled (campaigns table doesn't have processedByAdmin field)
      // This would need to be tracked differently, for now return zeros
      const campaignQuery = db
        .select({
          handled: sql<number>`0 as handled`,
          approved: sql<number>`0 as approved`,
          rejected: sql<number>`0 as rejected`,
        })
        .from(campaigns)
        .limit(1);

      const [campaignMetrics] = await campaignQuery;

      metrics.push({
        userId: staff.id,
        name: `${staff.firstName} ${staff.lastName}`,
        email: staff.email,
        role: staff.isAdmin ? 'Admin' : 'Support',
        dateJoined: staff.dateJoined || staff.createdAt,
        supportTickets: {
          count: Number(ticketMetrics?.total || 0),
          avgResponseTime: Number(ticketMetrics?.avgResponseTime || 0),
          resolutionRate: ticketMetrics?.total > 0 
            ? ((Number(ticketMetrics?.resolved || 0) + Number(ticketMetrics?.closed || 0)) / Number(ticketMetrics?.total)) * 100
            : 0
        },
        documents: {
          reviewed: Number(kycMetrics?.reviewed || 0),
          approved: Number(kycMetrics?.approved || 0),
          flagged: Number(kycMetrics?.flagged || 0)
        },
        campaigns: {
          handled: Number(campaignMetrics?.handled || 0),
          approved: Number(campaignMetrics?.approved || 0),
          rejected: Number(campaignMetrics?.rejected || 0)
        }
      });
    }

    return userId ? metrics[0] : metrics;
  }

  // Analytics dashboard
  async getAnalytics(): Promise<{
    totalWithdrawn: number;
    totalTipsCollected: number;
    totalContributionsCollected: number;
    totalDeposited: number;
    activeUsers: number;
    contributors: number;
    creators: number;
    volunteers: number;
    completedCampaigns: number;
    pendingCampaigns: number;
    activeCampaigns: number;
    inProgressCampaigns: number;
    fraudReportsCount: number;
    verifiedUsers: number;
  }> {
    try {
      // Simple queries to get real data
      const allUsers = await db.select().from(users);
      const allCampaigns = await db.select().from(campaigns);
      const allContributions = await db.select().from(contributions);
      const allTips = await db.select().from(tips);
      const allTransactions = await db.select().from(transactions);
      const allFraudReports = await db.select().from(fraudReports);
      const allVolunteerApps = await db.select().from(volunteerApplications);

      // Calculate counts
      const totalUsers = allUsers.length;
      const activeCampaigns = allCampaigns.filter(c => c.status === 'active').length;
      const completedCampaigns = allCampaigns.filter(c => c.status === 'completed').length;
      const pendingCampaigns = allCampaigns.filter(c => c.status === 'pending').length;
      
      // Get unique contributors and creators
      const uniqueContributors = [...new Set(allContributions.map(c => c.contributorId))].length;
      const uniqueCreators = [...new Set(allCampaigns.map(c => c.creatorId))].length;
      const uniqueVolunteers = [...new Set(allVolunteerApps.map(v => v.volunteerId))].length;
      
      // Get verified users
      const verifiedUsers = allUsers.filter(u => u.kycStatus === 'verified').length;
      
      // Calculate financial totals
      const totalContributions = allContributions.reduce((sum, c) => sum + parseFloat(c.amount || '0'), 0);
      const totalTips = allTips.reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
      const totalDeposits = allTransactions
        .filter(t => t.type === 'deposit' && t.status === 'completed')
        .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
      const totalWithdrawals = allTransactions
        .filter(t => t.type === 'withdrawal' && t.status === 'completed')
        .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

      return {
        totalWithdrawn: totalWithdrawals,
        totalTipsCollected: totalTips,
        totalContributionsCollected: totalContributions,
        totalDeposited: totalDeposits,
        activeUsers: totalUsers,
        contributors: uniqueContributors,
        creators: uniqueCreators,
        volunteers: uniqueVolunteers,
        completedCampaigns: completedCampaigns,
        pendingCampaigns: pendingCampaigns,
        activeCampaigns: activeCampaigns,
        inProgressCampaigns: activeCampaigns, // Same as active
        fraudReportsCount: allFraudReports.length,
        verifiedUsers: verifiedUsers,
      };
    } catch (error) {
      console.error('Analytics query error:', error);
      // Return zeros if there's any error
      return {
        totalWithdrawn: 0,
        totalTipsCollected: 0,
        totalContributionsCollected: 0,
        totalDeposited: 0,
        activeUsers: 0,
        contributors: 0,
        creators: 0,
        volunteers: 0,
        completedCampaigns: 0,
        pendingCampaigns: 0,
        activeCampaigns: 0,
        inProgressCampaigns: 0,
        fraudReportsCount: 0,
        verifiedUsers: 0,
      };
    }
  }

  async getPendingTransactions(type: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.type, type),
        eq(transactions.status, 'pending')
      ))
      .orderBy(desc(transactions.createdAt));
  }

  async getUserTransactions(userId: string, limit: number = 10): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  // Volunteer operations
  async createVolunteerOpportunity(opportunity: InsertVolunteerOpportunity): Promise<VolunteerOpportunity> {
    const [newOpportunity] = await db
      .insert(volunteerOpportunities)
      .values(opportunity)
      .returning();
    return newOpportunity;
  }

  async getVolunteerOpportunities(filters?: { status?: string; limit?: number }): Promise<VolunteerOpportunity[]> {
    // Get campaigns that have volunteer slots and need volunteers
    let campaignQuery = db.select().from(campaigns)
      .where(and(
        gt(campaigns.volunteerSlots, 0), // Has volunteer slots
        eq(campaigns.status, 'on_progress') // Campaign is active
      ));
    
    if (filters?.limit) {
      campaignQuery = campaignQuery.limit(filters.limit);
    }
    
    const campaignsWithVolunteerSlots = await campaignQuery.orderBy(desc(campaigns.createdAt));
    
    // Convert campaigns to volunteer opportunities format
    const volunteerOpportunities: VolunteerOpportunity[] = campaignsWithVolunteerSlots.map(campaign => ({
      id: `volunteer-${campaign.id}`, // Prefix to distinguish from regular volunteer opportunities
      campaignId: campaign.id,
      title: `Volunteer for: ${campaign.title}`,
      description: campaign.description,
      location: campaign.location || 'Location TBD',
      startDate: campaign.createdAt, // Use campaign creation as start
      endDate: campaign.endDate,
      slotsNeeded: campaign.volunteerSlots,
      slotsFilled: campaign.volunteerSlotsFilledCount,
      status: campaign.status,
      createdAt: campaign.createdAt,
      // Add category and duration from campaign
      category: campaign.category,
      duration: campaign.duration,
    }));
    
    return volunteerOpportunities;
  }

  async getCompletedVolunteerOpportunities(): Promise<VolunteerOpportunity[]> {
    try {
      // Get campaigns that had volunteer slots and are now completed/closed
      const completedCampaigns = await db.select().from(campaigns)
        .where(and(
          gt(campaigns.volunteerSlots, 0), // Had volunteer slots
          or(
            eq(campaigns.status, 'completed'),
            eq(campaigns.status, 'closed')
          )
        ))
        .orderBy(desc(campaigns.updatedAt));
      
      // Convert campaigns to completed volunteer opportunities format
      const completedOpportunities: VolunteerOpportunity[] = completedCampaigns.map(campaign => ({
        id: `volunteer-${campaign.id}`,
        campaignId: campaign.id,
        title: `Volunteer for: ${campaign.title}`,
        description: campaign.description,
        location: campaign.location || 'Location TBD',
        startDate: campaign.createdAt,
        endDate: campaign.endDate,
        slotsNeeded: campaign.volunteerSlots,
        slotsFilled: campaign.volunteerSlotsFilledCount,
        status: campaign.status,
        createdAt: campaign.createdAt,
        category: campaign.category,
        duration: campaign.duration,
        campaign: {
          id: campaign.id,
          title: campaign.title,
          category: campaign.category,
          status: campaign.status,
          goalAmount: campaign.goalAmount,
          currentAmount: campaign.currentAmount,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
          location: campaign.location,
        },
      }));
      
      return completedOpportunities;
    } catch (error) {
      console.error('❌ Error getting completed volunteer opportunities:', error);
      return [];
    }
  }

  async applyForVolunteer(application: InsertVolunteerApplication): Promise<VolunteerApplication> {
    // For campaign-based volunteer applications, set opportunityId to null
    // since these don't exist in the volunteer_opportunities table
    const applicationData = {
      ...application,
      opportunityId: application.opportunityId?.startsWith('volunteer-') ? null : application.opportunityId
    };
    
    const [newApplication] = await db
      .insert(volunteerApplications)
      .values(applicationData)
      .returning();
    return newApplication;
  }

  async getVolunteerApplicationsByUser(userId: string): Promise<VolunteerApplication[]> {
    return await db
      .select()
      .from(volunteerApplications)
      .where(eq(volunteerApplications.volunteerId, userId))
      .orderBy(desc(volunteerApplications.createdAt));
  }

  async getVolunteerApplication(applicationId: string): Promise<VolunteerApplication | undefined> {
    const [application] = await db
      .select()
      .from(volunteerApplications)
      .where(eq(volunteerApplications.id, applicationId));
    return application;
  }

  // Campaign volunteer operations
  async getCampaignVolunteerApplication(campaignId: string, applicantId: string): Promise<VolunteerApplication | undefined> {
    const [application] = await db
      .select()
      .from(volunteerApplications)
      .where(
        and(
          eq(volunteerApplications.campaignId, campaignId),
          eq(volunteerApplications.volunteerId, applicantId)
        )
      );
    return application;
  }

  async createCampaignVolunteerApplication(application: { 
    campaignId: string; 
    applicantId: string; 
    intent: string; 
    telegramDisplayName: string;
    telegramUsername: string;
    status?: string 
  }): Promise<VolunteerApplication> {
    const [newApplication] = await db
      .insert(volunteerApplications)
      .values({
        campaignId: application.campaignId,
        volunteerId: application.applicantId,
        intent: application.intent,
        telegramDisplayName: application.telegramDisplayName,
        telegramUsername: application.telegramUsername,
        status: application.status || "pending",
        // Note: opportunityId is optional for campaign applications
      })
      .returning();
    return newApplication;
  }

  async getCampaignVolunteerApplications(campaignId: string): Promise<VolunteerApplication[]> {
    return await db
      .select({
        id: volunteerApplications.id,
        campaignId: volunteerApplications.campaignId,
        opportunityId: volunteerApplications.opportunityId,
        volunteerId: volunteerApplications.volunteerId,
        status: volunteerApplications.status,
        message: volunteerApplications.message,
        intent: volunteerApplications.intent,
        telegramDisplayName: volunteerApplications.telegramDisplayName,
        telegramUsername: volunteerApplications.telegramUsername,
        rejectionReason: volunteerApplications.rejectionReason,
        createdAt: volunteerApplications.createdAt,
        // Include applicant basic details
        applicantName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`.as('applicantName'),
        applicantEmail: users.email,
        applicantKycStatus: users.kycStatus,
        applicantProfileImageUrl: users.profileImageUrl,
        // Complete volunteer profile information
        volunteerProfile: {
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
          phoneNumber: users.phoneNumber,
          address: users.address,
          education: users.education,
          profession: users.profession,
          workExperience: users.workExperience,
          linkedinProfile: users.linkedinProfile,
          organizationName: users.organizationName,
          organizationType: users.organizationType,
          kycStatus: users.kycStatus,
          isProfileComplete: users.isProfileComplete,
          createdAt: users.createdAt,
        }
      })
      .from(volunteerApplications)
      .innerJoin(users, eq(volunteerApplications.volunteerId, users.id))
      .where(eq(volunteerApplications.campaignId, campaignId))
      .orderBy(desc(volunteerApplications.createdAt));
  }

  async updateCampaignVolunteerApplicationStatus(
    applicationId: string, 
    status: string, 
    rejectionReason?: string
  ): Promise<VolunteerApplication | undefined> {
    const [updatedApplication] = await db
      .update(volunteerApplications)
      .set({ 
        status,
        rejectionReason: rejectionReason || null 
      })
      .where(eq(volunteerApplications.id, applicationId))
      .returning();
    return updatedApplication;
  }

  async incrementVolunteerSlotsFilledCount(campaignId: string): Promise<void> {
    await db
      .update(campaigns)
      .set({
        volunteerSlotsFilledCount: sql`${campaigns.volunteerSlotsFilledCount} + 1`
      })
      .where(eq(campaigns.id, campaignId));
  }

  // Campaign updates
  async createCampaignUpdate(update: InsertCampaignUpdate): Promise<CampaignUpdate> {
    const [newUpdate] = await db
      .insert(campaignUpdates)
      .values(update)
      .returning();
    return newUpdate;
  }

  async getCampaignUpdates(campaignId: string): Promise<CampaignUpdate[]> {
    return await db
      .select()
      .from(campaignUpdates)
      .where(eq(campaignUpdates.campaignId, campaignId))
      .orderBy(desc(campaignUpdates.createdAt));
  }

  // Admin operations
  async getPendingCampaigns(): Promise<any[]> {
    return await db
      .select({
        // Campaign fields
        id: campaigns.id,
        creatorId: campaigns.creatorId,
        title: campaigns.title,
        description: campaigns.description,
        category: campaigns.category,
        goalAmount: campaigns.goalAmount,
        minimumAmount: campaigns.minimumAmount,
        currentAmount: campaigns.currentAmount,
        claimedAmount: campaigns.claimedAmount,
        images: campaigns.images,
        status: campaigns.status,
        tesVerified: campaigns.tesVerified,
        duration: campaigns.duration,
        street: campaigns.street,
        barangay: campaigns.barangay,
        city: campaigns.city,
        province: campaigns.province,
        region: campaigns.region,
        zipcode: campaigns.zipcode,
        landmark: campaigns.landmark,
        startDate: campaigns.startDate,
        endDate: campaigns.endDate,
        needsVolunteers: campaigns.needsVolunteers,
        volunteerSlots: campaigns.volunteerSlots,
        volunteerSlotsFilledCount: campaigns.volunteerSlotsFilledCount,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        // Creator fields
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
        creatorEmail: users.email,
        creatorKycStatus: users.kycStatus,
      })
      .from(campaigns)
      .leftJoin(users, eq(campaigns.creatorId, users.id))
      .where(eq(campaigns.status, "pending"))
      .orderBy(desc(campaigns.createdAt));
  }

  async getPendingKYC(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.kycStatus, "pending"))
      .orderBy(desc(users.createdAt));
  }

  async getVerifiedUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.kycStatus, "verified"))
      .orderBy(desc(users.updatedAt));
  }

  async getRejectedKYC(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.kycStatus, "rejected"))
      .orderBy(desc(users.updatedAt));
  }

  async getClaimedKycRequests(staffId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.claimedBy, staffId),
          eq(users.kycStatus, "on_progress")
        )
      )
      .orderBy(desc(users.dateClaimed));
  }

  async getClaimedReports(staffId: string): Promise<FraudReport[]> {
    try {
      return await db
        .select()
        .from(fraudReports)
        .where(
          and(
            eq(fraudReports.claimedBy, staffId),
            eq(fraudReports.status, "on_progress")
          )
        )
        .orderBy(desc(fraudReports.createdAt));
    } catch (error) {
      console.error('Error fetching claimed reports:', error);
      return [];
    }
  }

  async getSuspendedUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isSuspended, true))
      .orderBy(desc(users.suspendedAt));
  }

  async getFlaggedCampaigns(): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.status, "flagged"))
      .orderBy(desc(campaigns.createdAt));
  }

  async getFlaggedCreators(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isFlagged, true))
      .orderBy(desc(users.flaggedAt));
  }

  async getCampaignsByCreatorId(creatorId: string): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.creatorId, creatorId))
      .orderBy(desc(campaigns.createdAt));
  }

  // Blockchain-related operations

  async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<void> {
    await db
      .update(transactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transactions.id, transactionId));
  }

  async getTransaction(transactionId: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId));
    return transaction;
  }

  // Payment record operations
  async createPaymentRecord(paymentData: InsertPaymentRecord): Promise<PaymentRecord> {
    const [payment] = await db
      .insert(paymentRecords)
      .values(paymentData)
      .returning();
    return payment;
  }

  async updatePaymentRecord(paymentId: string, updates: Partial<PaymentRecord>): Promise<void> {
    await db
      .update(paymentRecords)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(paymentRecords.id, paymentId));
  }

  async getPaymentRecordByPaymongoId(paymongoId: string): Promise<PaymentRecord | undefined> {
    const [payment] = await db
      .select()
      .from(paymentRecords)
      .where(eq(paymentRecords.paymongoPaymentId, paymongoId));
    return payment;
  }

  // Exchange rate operations
  async createExchangeRate(rateData: InsertExchangeRate): Promise<ExchangeRate> {
    const [rate] = await db
      .insert(exchangeRates)
      .values(rateData)
      .returning();
    return rate;
  }

  async getActiveExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate | undefined> {
    const [rate] = await db
      .select()
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.fromCurrency, fromCurrency),
          eq(exchangeRates.toCurrency, toCurrency),
          eq(exchangeRates.isActive, true)
        )
      )
      .orderBy(desc(exchangeRates.createdAt))
      .limit(1);
    return rate;
  }

  // Featured campaigns - high credibility creators
  async getFeaturedCampaigns(limit: number = 10): Promise<Campaign[]> {
    try {
      // For simplicity, return active campaigns with highest current amounts for now
      // This represents "successful" campaigns that are gaining traction
      const featuredCampaigns = await db
        .select({
          ...campaigns,
          creatorFirstName: users.firstName,
          creatorLastName: users.lastName,
          creatorEmail: users.email,
        })
        .from(campaigns)
        .leftJoin(users, eq(campaigns.creatorId, users.id))
        .where(or(eq(campaigns.status, 'active'), eq(campaigns.status, 'on_progress')))
        .orderBy(
          sql`
            CASE WHEN ${users.kycStatus} = 'verified' THEN 1 ELSE 0 END DESC,
            CAST(${campaigns.currentAmount} AS DECIMAL) DESC,
            ${campaigns.createdAt} DESC
          `
        )
        .limit(limit);

      return featuredCampaigns as any;
    } catch (error) {
      console.error("Error in getFeaturedCampaigns:", error);
      // Fallback to recent active campaigns with creator info
      return await db
        .select({
          ...campaigns,
          creatorFirstName: users.firstName,
          creatorLastName: users.lastName,
          creatorEmail: users.email,
        })
        .from(campaigns)
        .leftJoin(users, eq(campaigns.creatorId, users.id))
        .where(or(eq(campaigns.status, 'active'), eq(campaigns.status, 'on_progress')))
        .orderBy(desc(campaigns.createdAt))
        .limit(limit) as any;
    }
  }

  // Recommended campaigns based on user interests
  async getRecommendedCampaigns(userId: string, limit: number = 10): Promise<Campaign[]> {
    try {
      // Get user's contribution history to determine interests
      const userContributions = await this.getContributionsByUser(userId);
      
      if (userContributions.length === 0) {
        // If no contribution history, return recent active campaigns
        return await db
          .select({
            ...campaigns,
            creatorFirstName: users.firstName,
            creatorLastName: users.lastName,
            creatorEmail: users.email,
          })
          .from(campaigns)
          .leftJoin(users, eq(campaigns.creatorId, users.id))
          .where(eq(campaigns.status, 'on_progress'))
          .orderBy(desc(campaigns.createdAt))
          .limit(limit) as any;
      }

      // Get campaigns the user has contributed to
      const contributedCampaignIds = userContributions.map(c => c.campaignId);
      
      if (contributedCampaignIds.length === 0) {
        return await db
          .select({
            ...campaigns,
            creatorFirstName: users.firstName,
            creatorLastName: users.lastName,
            creatorEmail: users.email,
          })
          .from(campaigns)
          .leftJoin(users, eq(campaigns.creatorId, users.id))
          .where(eq(campaigns.status, 'on_progress'))
          .orderBy(desc(campaigns.createdAt))
          .limit(limit) as any;
      }

      // Get the categories of campaigns user has contributed to
      const contributedCampaigns = await db
        .select()
        .from(campaigns)
        .where(sql`${campaigns.id} = ANY(ARRAY[${contributedCampaignIds.map(id => `'${id}'`).join(',')}])`);

      // Calculate category preferences based on contribution amounts
      const categoryPreferences: Record<string, number> = {};
      for (const contribution of userContributions) {
        const campaign = contributedCampaigns.find(c => c.id === contribution.campaignId);
        if (campaign) {
          const amount = parseFloat(contribution.amount || '0');
          categoryPreferences[campaign.category] = (categoryPreferences[campaign.category] || 0) + amount;
        }
      }

      // Get top preferred categories (expand to include more categories)
      const preferredCategories = Object.entries(categoryPreferences)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3) // Increased from 2 to 3 to include more user interests
        .map(([category]) => category);

      if (preferredCategories.length === 0) {
        // Fallback to recent active campaigns
        return await db
          .select({
            ...campaigns,
            creatorFirstName: users.firstName,
            creatorLastName: users.lastName,
            creatorEmail: users.email,
          })
          .from(campaigns)
          .leftJoin(users, eq(campaigns.creatorId, users.id))
          .where(eq(campaigns.status, 'on_progress'))
          .orderBy(desc(campaigns.createdAt))
          .limit(limit) as any;
      }

      // Find campaigns in preferred categories, excluding campaigns user already contributed to
      return await db
        .select({
          ...campaigns,
          creatorFirstName: users.firstName,
          creatorLastName: users.lastName,
          creatorEmail: users.email,
        })
        .from(campaigns)
        .leftJoin(users, eq(campaigns.creatorId, users.id))
        .where(
          and(
            eq(campaigns.status, 'on_progress'),
            sql`${campaigns.category} = ANY(ARRAY[${preferredCategories.map(cat => `'${cat}'`).join(',')}])`,
            sql`${campaigns.id} != ALL(ARRAY[${contributedCampaignIds.map(id => `'${id}'`).join(',')}])`
          )
        )
        .orderBy(
          sql`
            CASE WHEN ${users.kycStatus} = 'verified' THEN 1 ELSE 0 END DESC,
            ${campaigns.createdAt} DESC
          `
        )
        .limit(limit) as any;

    } catch (error) {
      console.error("Error in getRecommendedCampaigns:", error);
      // Fallback to recent active campaigns
      return await db
        .select({
          ...campaigns,
          creatorFirstName: users.firstName,
          creatorLastName: users.lastName,
          creatorEmail: users.email,
        })
        .from(campaigns)
        .leftJoin(users, eq(campaigns.creatorId, users.id))
        .where(eq(campaigns.status, 'on_progress'))
        .orderBy(desc(campaigns.createdAt))
        .limit(limit) as any;
    }
  }

  // Admin transaction search functionality
  async searchTransactions(params: {
    email?: string;
    transactionId?: string;
    amount?: string;
    type?: string;
  }): Promise<any[]> {
    let query = db
      .select({
        // Transaction fields
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        description: transactions.description,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        transactionHash: transactions.transactionHash,
        blockNumber: transactions.blockNumber,
        exchangeRate: transactions.exchangeRate,
        feeAmount: transactions.feeAmount,
        paymentProvider: transactions.paymentProvider,
        paymentProviderTxId: transactions.paymentProviderTxId,
        userId: transactions.userId,
        // User fields with aliases to avoid conflicts
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userPusoBalance: users.phpBalance,
        userTipsBalance: users.tipsBalance,
        userContributionsBalance: users.contributionsBalance,
        userKycStatus: users.kycStatus,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id));

    const conditions = [];

    // Search by email
    if (params.email) {
      conditions.push(eq(users.email, params.email));
    }

    // Search by transaction ID
    if (params.transactionId) {
      conditions.push(eq(transactions.id, params.transactionId));
    }

    // Search by amount
    if (params.amount) {
      conditions.push(eq(transactions.amount, params.amount));
    }

    // Filter by transaction type - now includes ALL types
    if (params.type) {
      conditions.push(eq(transactions.type, params.type));
    }

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(transactions.createdAt))
      .limit(50); // Limit results for performance

    // Format results for frontend with full backend details
    return results.map(result => ({
      id: result.id,
      type: result.type,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
      description: result.description,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      exchangeRate: result.exchangeRate,
      feeAmount: result.feeAmount,
      paymentProvider: result.paymentProvider,
      paymentProviderTxId: result.paymentProviderTxId,
      user: {
        id: result.userId,
        email: result.userEmail,
        firstName: result.userFirstName,
        lastName: result.userLastName,
        phpBalance: result.userPusoBalance,
        tipsBalance: result.userTipsBalance,
        contributionsBalance: result.userContributionsBalance,
        kycStatus: result.userKycStatus,
      },
      // Calculate PHP equivalent for display
      phpEquivalent: result.exchangeRate 
        ? (parseFloat(result.amount) * parseFloat(result.exchangeRate)).toFixed(2)
        : result.amount
    }));
  }

  // Admin transaction processing methods
  async processTransaction(transactionId: string): Promise<void> {
    try {
      // Update transaction status to completed
      await db.update(transactions)
        .set({ 
          status: 'completed',
          updatedAt: new Date()
        })
        .where(eq(transactions.id, transactionId));
      
      console.log('   Transaction marked as completed:', transactionId);
    } catch (error) {
      console.error('Error processing transaction:', error);
      throw error;
    }
  }

  async rejectTransaction(transactionId: string): Promise<void> {
    try {
      // Update transaction status to failed/rejected
      await db.update(transactions)
        .set({ 
          status: 'failed',
          updatedAt: new Date()
        })
        .where(eq(transactions.id, transactionId));
      
      console.log('   Transaction marked as rejected/failed:', transactionId);
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      throw error;
    }
  }

  // Tip operations
  async createTip(tipData: InsertTip): Promise<Tip> {
    const [tip] = await db.insert(tips).values(tipData).returning();
    
    // Also add to the creator's tips balance
    await this.addTipsBalance(tipData.creatorId, parseFloat(tipData.amount));
    
    // Create transaction record for the tip
    await this.createTransaction({
      userId: tipData.tipperId,
      campaignId: tipData.campaignId,
      type: 'tip',
      amount: tipData.amount,
      currency: 'PUSO',
      description: `Tip to creator: ${tipData.amount} PUSO`,
      status: 'completed',
    });
    
    console.log('💰 Tip created:', tip.amount, 'PUSO to creator:', tipData.creatorId);
    return tip;
  }

  async getTipsByCreator(creatorId: string): Promise<Tip[]> {
    return await db.select().from(tips).where(eq(tips.creatorId, creatorId)).orderBy(desc(tips.createdAt));
  }

  async getTipsByCampaign(campaignId: string): Promise<Tip[]> {
    return await db.select().from(tips).where(eq(tips.campaignId, campaignId)).orderBy(desc(tips.createdAt));
  }

  async getAllTips(): Promise<Tip[]> {
    return await db.select().from(tips).orderBy(desc(tips.createdAt));
  }

  // Claim tips for a specific campaign to tip wallet
  async claimCampaignTips(userId: string, campaignId: string, requestedAmount: number): Promise<{ claimedAmount: number; tipCount: number }> {
    return await db.transaction(async (tx) => {
      // Get tips for this campaign that belong to this user
      const campaignTips = await tx
        .select()
        .from(tips)
        .where(and(eq(tips.campaignId, campaignId), eq(tips.creatorId, userId)))
        .orderBy(desc(tips.createdAt));

      if (campaignTips.length === 0) {
        throw new Error('No tips available to claim for this campaign');
      }

      // Calculate total available tips
      const totalAvailableTips = campaignTips.reduce((sum, tip) => sum + parseFloat(tip.amount), 0);
      
      // Validate requested amount
      if (requestedAmount > totalAvailableTips) {
        throw new Error(`Cannot claim ₱${requestedAmount}. Only ₱${totalAvailableTips} available in tips for this campaign.`);
      }

      // Select tips to claim up to the requested amount
      let amountToClaim = 0;
      let tipsToRemove: string[] = [];
      let partialTipId: string | null = null;
      let partialTipRemainder = 0;
      
      for (const tip of campaignTips) {
        const tipAmount = parseFloat(tip.amount);
        
        if (amountToClaim + tipAmount <= requestedAmount) {
          // Can claim the whole tip
          amountToClaim += tipAmount;
          tipsToRemove.push(tip.id);
          
          if (amountToClaim === requestedAmount) {
            break;
          }
        } else if (amountToClaim < requestedAmount) {
          // Claim partial amount from this tip
          const remainingToClaimable = requestedAmount - amountToClaim;
          amountToClaim += remainingToClaimable;
          partialTipId = tip.id;
          partialTipRemainder = tipAmount - remainingToClaimable;
          break;
        }
      }

      // Ensure we can claim at least something
      if (amountToClaim === 0) {
        // If we can't claim exact amount, claim as much as possible
        amountToClaim = Math.min(requestedAmount, totalAvailableTips);
        if (amountToClaim > 0) {
          // Just claim from the first tip available
          const firstTip = campaignTips[0];
          const firstTipAmount = parseFloat(firstTip.amount);
          if (firstTipAmount >= amountToClaim) {
            partialTipId = firstTip.id;
            partialTipRemainder = firstTipAmount - amountToClaim;
          } else {
            amountToClaim = firstTipAmount;
            tipsToRemove.push(firstTip.id);
          }
        }
      }

      if (amountToClaim === 0) {
        throw new Error('No tips can be claimed for the requested amount');
      }

      // Add to user's tip wallet balance
      const user = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user.length === 0) {
        throw new Error('User not found');
      }

      const currentTipsBalance = parseFloat(user[0].tipsBalance || '0');
      const newTipsBalance = currentTipsBalance + amountToClaim;

      await tx
        .update(users)
        .set({
          tipsBalance: newTipsBalance.toString(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Remove the claimed tips
      if (tipsToRemove.length > 0) {
        await tx.delete(tips).where(inArray(tips.id, tipsToRemove));
      }

      // Update partial tip if applicable
      if (partialTipId && partialTipRemainder > 0) {
        await tx
          .update(tips)
          .set({
            amount: partialTipRemainder.toString()
          })
          .where(eq(tips.id, partialTipId));
      } else if (partialTipId) {
        // If remainder is 0, delete the tip
        await tx.delete(tips).where(eq(tips.id, partialTipId));
      }

      return {
        claimedAmount: amountToClaim,
        tipCount: tipsToRemove.length
      };
    });
  }

  // Admin balance correction methods
  async correctPhpBalance(userId: string, newBalance: number, reason: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Update user balance
      await tx
        .update(users)
        .set({ 
          phpBalance: newBalance.toString(),
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId));

      // Record the correction transaction
      await tx.insert(transactions).values({
        userId,
        type: 'balance_correction',
        amount: newBalance.toString(),
        status: 'completed',
        description: `Admin balance correction: ${reason}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  }

  async correctTipsBalance(userId: string, newBalance: number, reason: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ 
          tipsBalance: newBalance.toString(),
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId));

      await tx.insert(transactions).values({
        userId,
        type: 'tips_correction',
        amount: newBalance.toString(),
        status: 'completed',
        description: `Admin tips balance correction: ${reason}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  }

  async correctContributionsBalance(userId: string, newBalance: number, reason: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ 
          contributionsBalance: newBalance.toString(),
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId));

      await tx.insert(transactions).values({
        userId,
        type: 'contributions_correction',
        amount: newBalance.toString(),
        status: 'completed',
        description: `Admin contributions balance correction: ${reason}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  }

  async updateTransactionStatus(transactionId: string, status: string, reason: string): Promise<void> {
    await db
      .update(transactions)
      .set({ 
        status,
        description: reason ? `${reason}` : undefined,
        updatedAt: new Date() 
      })
      .where(eq(transactions.id, transactionId));
  }

  async getTransactionById(transactionId: string): Promise<any> {
    const [result] = await db
      .select({
        transaction: {
          id: transactions.id,
          type: transactions.type,
          amount: transactions.amount,
          status: transactions.status,
          description: transactions.description,
          createdAt: transactions.createdAt,
          updatedAt: transactions.updatedAt,
          transactionHash: transactions.transactionHash,
          exchangeRate: transactions.exchangeRate,
          feeAmount: transactions.feeAmount,
          paymentProvider: transactions.paymentProvider,
        },
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phpBalance: users.phpBalance,
          tipsBalance: users.tipsBalance,
          contributionsBalance: users.contributionsBalance,
        },
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.id, transactionId));

    if (!result) return null;

    return {
      id: result.transaction.id,
      type: result.transaction.type,
      amount: result.transaction.amount,
      status: result.transaction.status,
      description: result.transaction.description,
      createdAt: result.transaction.createdAt,
      updatedAt: result.transaction.updatedAt,
      transactionHash: result.transaction.transactionHash,
      exchangeRate: result.transaction.exchangeRate,
      feeAmount: result.transaction.feeAmount,
      paymentProvider: result.transaction.paymentProvider,
      user: result.user,
      phpAmount: result.transaction.type === 'withdrawal' 
        ? (parseFloat(result.transaction.amount) * parseFloat(result.transaction.exchangeRate || '1')).toFixed(2)
        : result.transaction.amount
    };
  }

  async getDepositTransactions(): Promise<any[]> {
    const result = await db
      .select({
        id: transactions.id,
        transactionDisplayId: transactions.transactionDisplayId,
        type: transactions.type,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        description: transactions.description,
        paymentProvider: transactions.paymentProvider,
        paymentProviderTxId: transactions.paymentProviderTxId,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.type, 'deposit'))
      .orderBy(desc(transactions.createdAt));

    return result;
  }

  async getWithdrawalTransactions(): Promise<any[]> {
    const result = await db
      .select({
        id: transactions.id,
        transactionDisplayId: transactions.transactionDisplayId,
        type: transactions.type,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        description: transactions.description,
        paymentProvider: transactions.paymentProvider,
        paymentProviderTxId: transactions.paymentProviderTxId,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.type, 'withdrawal'))
      .orderBy(desc(transactions.createdAt));

    return result;
  }

  async getClaimTransactions(): Promise<any[]> {
    const result = await db
      .select({
        id: transactions.id,
        transactionDisplayId: transactions.transactionDisplayId,
        type: transactions.type,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        description: transactions.description,
        transactionHash: transactions.transactionHash,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
        }
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(campaigns, eq(transactions.campaignId, campaigns.id))
      .where(eq(transactions.type, 'claim'))
      .orderBy(desc(transactions.createdAt));

    return result;
  }

  async getContributionTransactions(): Promise<any[]> {
    const result = await db
      .select({
        id: transactions.id,
        transactionDisplayId: transactions.transactionDisplayId,
        type: transactions.type,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        description: transactions.description,
        transactionHash: transactions.transactionHash,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
        }
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(campaigns, eq(transactions.campaignId, campaigns.id))
      .where(eq(transactions.type, 'contribution'))
      .orderBy(desc(transactions.createdAt));

    return result;
  }

  async getTipTransactions(): Promise<any[]> {
    const result = await db
      .select({
        id: transactions.id,
        transactionDisplayId: transactions.transactionDisplayId,
        type: transactions.type,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        description: transactions.description,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
        }
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(campaigns, eq(transactions.campaignId, campaigns.id))
      .where(eq(transactions.type, 'tip'))
      .orderBy(desc(transactions.createdAt));

    return result;
  }

  async getRefundTransactions(): Promise<any[]> {
    const result = await db
      .select({
        id: transactions.id,
        transactionDisplayId: transactions.transactionDisplayId,
        type: transactions.type,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        description: transactions.description,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
        }
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(campaigns, eq(transactions.campaignId, campaigns.id))
      .where(eq(transactions.type, 'refund'))
      .orderBy(desc(transactions.createdAt));

    return result;
  }

  async getConversionTransactions(): Promise<any[]> {
    const result = await db
      .select({
        id: transactions.id,
        transactionDisplayId: transactions.transactionDisplayId,
        type: transactions.type,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        description: transactions.description,
        feeAmount: transactions.feeAmount,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.type, 'conversion'))
      .orderBy(desc(transactions.createdAt));

    return result;
  }

  async getCampaignClosureTransactions(): Promise<any[]> {
    const result = await db
      .select({
        id: transactions.id,
        transactionDisplayId: transactions.transactionDisplayId,
        type: transactions.type,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        description: transactions.description,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
        }
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(campaigns, eq(transactions.campaignId, campaigns.id))
      .where(eq(transactions.type, 'campaign_closure'))
      .orderBy(desc(transactions.createdAt));

    return result;
  }

  async getCompletedTransactions(): Promise<any[]> {
    const result = await db
      .select({
        id: transactions.id,
        transactionDisplayId: transactions.transactionDisplayId,
        type: transactions.type,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        description: transactions.description,
        transactionHash: transactions.transactionHash,
        paymentProvider: transactions.paymentProvider,
        paymentProviderTxId: transactions.paymentProviderTxId,
        feeAmount: transactions.feeAmount,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
        }
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(campaigns, eq(transactions.campaignId, campaigns.id))
      .where(eq(transactions.status, 'completed'))
      .orderBy(desc(transactions.createdAt));

    return result;
  }

async getAllPendingTransactions(): Promise<any[]> {    const result = await db
      .select({
        id: transactions.id,
        transactionDisplayId: transactions.transactionDisplayId,
        type: transactions.type,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        description: transactions.description,
        transactionHash: transactions.transactionHash,
        paymentProvider: transactions.paymentProvider,
        paymentProviderTxId: transactions.paymentProviderTxId,
        feeAmount: transactions.feeAmount,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
        }
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(campaigns, eq(transactions.campaignId, campaigns.id))
      .where(eq(transactions.status, 'pending'))
      .orderBy(desc(transactions.createdAt));

    return result;
  }

  async getFailedTransactions(): Promise<any[]> {
    const result = await db
      .select({
        id: transactions.id,
        transactionDisplayId: transactions.transactionDisplayId,
        type: transactions.type,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        description: transactions.description,
        transactionHash: transactions.transactionHash,
        paymentProvider: transactions.paymentProvider,
        paymentProviderTxId: transactions.paymentProviderTxId,
        feeAmount: transactions.feeAmount,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
        }
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(campaigns, eq(transactions.campaignId, campaigns.id))
      .where(eq(transactions.status, 'failed'))
      .orderBy(desc(transactions.createdAt));

    return result;
  }

  // Admin Financial Management implementations

  async claimFraudReport(reportId: string, adminId: string): Promise<boolean> {
    const result = await db
      .update(fraudReports)
      .set({
        claimedBy: adminId,
        claimedAt: new Date(),
        status: 'claimed',
      })
      .where(
        and(
          eq(fraudReports.id, reportId),
          or(
            isNull(fraudReports.claimedBy),
            eq(fraudReports.claimedBy, adminId)
          ),
          inArray(fraudReports.status, ['pending', 'investigating'])
        )
      )
      .returning({ id: fraudReports.id });
    
    return result.length > 0;
  }

  async claimSupportRequest(requestId: string, adminId: string): Promise<boolean> {
    const result = await db
      .update(supportRequests)
      .set({
        claimedBy: adminId,
        claimedAt: new Date(),
        status: 'claimed',
      })
      .where(
        and(
          eq(supportRequests.id, requestId),
          or(
            isNull(supportRequests.claimedBy),
            eq(supportRequests.claimedBy, adminId)
          ),
          inArray(supportRequests.status, ['pending', 'investigating'])
        )
      )
      .returning({ id: supportRequests.id });
    
    return result.length > 0;
  }

  async getFraudReport(reportId: string): Promise<any> {
    const [report] = await db
      .select()
      .from(fraudReports)
      .where(eq(fraudReports.id, reportId))
      .limit(1);
    return report;
  }

  async getSupportRequest(requestId: string): Promise<any> {
    const [request] = await db
      .select()
      .from(supportRequests)
      .where(eq(supportRequests.id, requestId))
      .limit(1);
    return request;
  }

  async claimKycRequest(userId: string, adminId: string, adminEmail: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({
        processedByAdmin: adminEmail,
        processedAt: new Date(),
        // Keep status as pending - admin has claimed but not yet processed
      })
      .where(
        and(
          eq(users.id, userId),
          isNull(users.processedByAdmin), // Only allow claim if not already claimed
          eq(users.kycStatus, 'pending')
        )
      )
      .returning({ id: users.id });
    
    return result.length > 0;
  }

  async getAdminClaimedReports(adminId: string): Promise<{
    fraudReports: any[];
    supportRequests: any[];
  }> {
    // Get claimed fraud reports (exclude completed ones)
    const claimedFraudReports = await db
      .select({
        id: fraudReports.id,
        reportType: fraudReports.reportType,
        description: fraudReports.description,
        status: fraudReports.status,
        relatedId: fraudReports.relatedId,
        relatedType: fraudReports.relatedType,
        evidenceUrls: fraudReports.evidenceUrls,
        claimedAt: fraudReports.claimedAt,
        createdAt: fraudReports.createdAt,
        reporter: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(fraudReports)
      .leftJoin(users, eq(fraudReports.reporterId, users.id))
      .where(
        and(
          eq(fraudReports.claimedBy, adminId),
          // Only show active claimed reports, exclude completed ones
          or(
            eq(fraudReports.status, 'claimed'),
            eq(fraudReports.status, 'pending'),
            eq(fraudReports.status, 'in_progress'),
            eq(fraudReports.status, 'on_progress')
          )
        )
      )
      .orderBy(desc(fraudReports.claimedAt));

    // Get claimed support requests (exclude completed ones)
    const claimedSupportRequests = await db
      .select({
        id: supportRequests.id,
        requestType: supportRequests.requestType,
        reason: supportRequests.reason,
        status: supportRequests.status,
        currentCredibilityScore: supportRequests.currentCredibilityScore,
        attachments: supportRequests.attachments,
        claimedAt: supportRequests.claimedAt,
        submittedAt: supportRequests.submittedAt,
        eligibleForReviewAt: supportRequests.eligibleForReviewAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(supportRequests)
      .leftJoin(users, eq(supportRequests.userId, users.id))
      .where(
        and(
          eq(supportRequests.claimedBy, adminId),
          // Only show active claimed requests, exclude completed ones
          or(
            eq(supportRequests.status, 'claimed'),
            eq(supportRequests.status, 'pending'),
            eq(supportRequests.status, 'in_progress'),
            eq(supportRequests.status, 'on_progress')
          )
        )
      )
      .orderBy(desc(supportRequests.claimedAt));

    return {
      fraudReports: claimedFraudReports,
      supportRequests: claimedSupportRequests,
    };
  }

  // Campaign claiming methods
  async claimCampaign(campaignId: string, adminId: string, adminEmail: string): Promise<boolean> {
    const result = await db
      .update(campaigns)
      .set({
        claimedBy: adminId,
        claimedAt: new Date(),
      })
      .where(
        and(
          eq(campaigns.id, campaignId),
          isNull(campaigns.claimedBy), // Only allow claim if not already claimed
          eq(campaigns.status, 'pending') // Only pending campaigns can be claimed
        )
      )
      .returning({ id: campaigns.id });
    
    return result.length > 0;
  }

  async getAdminClaimedCampaigns(adminId: string): Promise<any[]> {
    return await db
      .select({
        id: campaigns.id,
        campaignDisplayId: campaigns.campaignDisplayId,
        title: campaigns.title,
        description: campaigns.description,
        category: campaigns.category,
        goalAmount: campaigns.goalAmount,
        minimumAmount: campaigns.minimumAmount,
        currentAmount: campaigns.currentAmount,
        claimedAmount: campaigns.claimedAmount,
        images: campaigns.images,
        status: campaigns.status,
        duration: campaigns.duration,
        street: campaigns.street,
        barangay: campaigns.barangay,
        city: campaigns.city,
        province: campaigns.province,
        region: campaigns.region,
        zipcode: campaigns.zipcode,
        landmark: campaigns.landmark,
        startDate: campaigns.startDate,
        endDate: campaigns.endDate,
        needsVolunteers: campaigns.needsVolunteers,
        volunteerSlots: campaigns.volunteerSlots,
        volunteerSlotsFilledCount: campaigns.volunteerSlotsFilledCount,
        claimedBy: campaigns.claimedBy,
        claimedAt: campaigns.claimedAt,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        creator: {
          id: users.id,
          userDisplayId: users.userDisplayId,
          email: users.email,
          firstName: users.firstName,
          middleInitial: users.middleInitial,
          lastName: users.lastName,
          birthday: users.birthday,
          profileImageUrl: users.profileImageUrl,
          contactNumber: users.contactNumber,
          phoneNumber: users.phoneNumber,
          address: users.address,
          education: users.education,
          profession: users.profession,
          workExperience: users.workExperience,
          organizationName: users.organizationName,
          organizationType: users.organizationType,
          linkedinProfile: users.linkedinProfile,
          funFacts: users.funFacts,
          kycStatus: users.kycStatus,
          phpBalance: users.phpBalance,
          reliabilityScore: users.reliabilityScore,
          credibilityScore: users.credibilityScore,
          isProfileComplete: users.isProfileComplete,
          createdAt: users.createdAt,
        }
      })
      .from(campaigns)
      .leftJoin(users, eq(campaigns.creatorId, users.id))
      .where(
        and(
          eq(campaigns.claimedBy, adminId),
          // Only show pending campaigns that haven't been processed yet
          eq(campaigns.status, 'pending'),
          // Ensure they haven't been approved or rejected yet
          isNull(campaigns.approvedBy),
          isNull(campaigns.rejectedBy)
        )
      )
      .orderBy(desc(campaigns.claimedAt));
  }

  // Get claimed KYC requests by admin
  async getAdminClaimedKyc(adminEmail: string): Promise<any[]> {
    return await db
      .select({
        id: users.id,
        userDisplayId: users.userDisplayId,
        email: users.email,
        firstName: users.firstName,
        middleInitial: users.middleInitial,
        lastName: users.lastName,
        contactNumber: users.contactNumber,
        phoneNumber: users.phoneNumber,
        address: users.address,
        birthday: users.birthday,
        education: users.education,
        profession: users.profession,
        workExperience: users.workExperience,
        createdAt: users.createdAt, // When user created their account/submitted KYC
        processedAt: users.processedAt, // When admin processed the request  
        dateClaimed: users.dateClaimed, // When admin claimed the request
        organizationName: users.organizationName,
        organizationType: users.organizationType,
        linkedinProfile: users.linkedinProfile,
        funFacts: users.funFacts,
        profileImageUrl: users.profileImageUrl,
        kycStatus: users.kycStatus,
        isProfileComplete: users.isProfileComplete,
        emailVerified: users.emailVerified,
        phoneVerified: users.phoneVerified,
        processedByAdmin: users.processedByAdmin,
        rejectionReason: users.rejectionReason,
        kycDocuments: users.kycDocuments,
        creatorRating: users.creatorRating,
        creditScore: users.creditScore,
        reliabilityScore: users.reliabilityScore,
        pusoBalance: users.pusoBalance,
      })
      .from(users)
      .where(and(
        eq(users.processedByAdmin, adminEmail),
        or(eq(users.kycStatus, 'pending'), eq(users.kycStatus, 'on_progress')) // Include both pending and on_progress claimed by admin
      ))
      .orderBy(desc(users.processedAt));
  }

  // Get categorized fraud reports by admin
  async getAdminClaimedFraudReportsByCategory(adminId: string): Promise<{
    documents: any[];
    campaigns: any[];
    volunteers: any[];
    creators: any[];
    users: any[];
    transactions: any[];
  }> {
    const allReports = await db
      .select({
        id: fraudReports.id,
        documentId: fraudReports.documentId,
        reportType: fraudReports.reportType,
        description: fraudReports.description,
        status: fraudReports.status,
        relatedId: fraudReports.relatedId,
        relatedType: fraudReports.relatedType,
        evidenceUrls: fraudReports.evidenceUrls,
        claimedAt: fraudReports.claimedAt,
        createdAt: fraudReports.createdAt,
        reporter: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(fraudReports)
      .leftJoin(users, eq(fraudReports.reporterId, users.id))
      .where(
        and(
          eq(fraudReports.claimedBy, adminId),
          // Only show active claimed reports, exclude completed ones
          not(or(
            eq(fraudReports.status, 'resolved'),
            eq(fraudReports.status, 'closed'),
            eq(fraudReports.status, 'approved'),
            eq(fraudReports.status, 'rejected')
          ))
        )
      )
      .orderBy(desc(fraudReports.claimedAt));

    // Categorize reports by type
    return {
      documents: allReports.filter(r => r.documentId || r.relatedType === 'document'),
      campaigns: allReports.filter(r => r.relatedType === 'campaign'),
      volunteers: allReports.filter(r => r.reportType === 'volunteer' || r.relatedType === 'volunteer'),
      creators: allReports.filter(r => r.reportType === 'Creator Report' || r.relatedType === 'creator'),
      users: allReports.filter(r => r.reportType === 'user' || r.relatedType === 'user'),
      transactions: allReports.filter(r => r.reportType === 'transaction' || r.relatedType === 'transaction'),
    };
  }

  // Get claimed volunteer reports for admin
  async getClaimedVolunteerReports(adminId: string): Promise<any[]> {
    const claimedVolunteerReports = await db
      .select({
        id: volunteerReports.id,
        reportedVolunteerId: volunteerReports.reportedVolunteerId,
        reporterId: volunteerReports.reporterId,
        campaignId: volunteerReports.campaignId,
        reason: volunteerReports.reason,
        description: volunteerReports.description,
        status: volunteerReports.status,
        adminNotes: volunteerReports.adminNotes,
        claimedAt: volunteerReports.claimedAt,
        createdAt: volunteerReports.createdAt,
      })
      .from(volunteerReports)
      .where(
        and(
          eq(volunteerReports.claimedBy, adminId),
          not(inArray(volunteerReports.status, ['resolved', 'closed', 'approved', 'rejected']))
        )
      )
      .orderBy(desc(volunteerReports.claimedAt));

    return claimedVolunteerReports;
  }

  // Get analytics counts for My Works
  async getMyWorksAnalytics(adminId: string, adminEmail: string): Promise<{
    kyc: number;
    documents: number;
    campaigns: number;
    volunteers: number;
    creators: number;
    users: number;
    transactions: number;
    reviewedCampaigns: number;
    total: number;
  }> {
    // Count ALL KYC requests processed by this admin (approved, rejected, or still pending)
    const kycCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.processedByAdmin, adminEmail));

    // Count claimed fraud reports by category
    const fraudReportCounts = await db
      .select({
        count: sql<number>`count(*)`,
        relatedType: fraudReports.relatedType,
        reportType: fraudReports.reportType,
      })
      .from(fraudReports)
      .where(eq(fraudReports.claimedBy, adminId))
      .groupBy(fraudReports.relatedType, fraudReports.reportType);

    // Count claimed support requests  
    const supportCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(supportRequests)
      .where(eq(supportRequests.claimedBy, adminId));

    // Count claimed support tickets
    const supportTicketCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(supportTickets)
      .where(eq(supportTickets.claimedBy, adminId));

    // Count claimed volunteer reports
    const volunteerReportCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(volunteerReports)
      .where(eq(volunteerReports.claimedBy, adminId));

    // Count reviewed campaigns (campaigns approved/rejected by this admin)
    const reviewedCampaignsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(campaigns)
      .where(
        or(
          eq(campaigns.approvedBy, adminId),
          eq(campaigns.rejectedBy, adminId)
        )
      );

    const kyc = Number(kycCount[0]?.count) || 0;
    const support = Number(supportCount[0]?.count) || 0;
    const supportTicketsCount = Number(supportTicketCount[0]?.count) || 0;
    const volunteerReportsCount = Number(volunteerReportCount[0]?.count) || 0;
    const reviewedCampaigns = Number(reviewedCampaignsCount[0]?.count) || 0;
    
    // Categorize fraud report counts
    let documents = 0, campaignReports = 0, volunteers = 0, creators = 0, userReports = 0, transactions = 0;
    
    fraudReportCounts.forEach(item => {
      const count = Number(item.count) || 0;
      if (item.relatedType === 'document') documents += count;
      else if (item.relatedType === 'campaign') campaignReports += count;
      else if (item.reportType === 'volunteer' || item.relatedType === 'volunteer') volunteers += count;
      else if (item.reportType === 'Creator Report' || item.relatedType === 'creator') creators += count;
      else if (item.reportType === 'user' || item.relatedType === 'user') userReports += count;
      else if (item.reportType === 'transaction' || item.relatedType === 'transaction') transactions += count;
    });

    // Add support requests and support tickets to users category
    userReports += support + supportTicketsCount;

    // Add volunteer reports to volunteers count
    volunteers += volunteerReportsCount;

    const total = kyc + documents + campaignReports + volunteers + creators + userReports + transactions + reviewedCampaigns;

    console.log("📊 My Works Analytics Debug:", {
      kyc, documents, campaigns: campaignReports, volunteers, creators, 
      users: userReports, transactions, reviewedCampaigns, total
    });

    return { kyc, documents, campaigns: campaignReports, volunteers, creators, users: userReports, transactions, reviewedCampaigns, total };
  }

  // Admin Completed Works implementations
  async getAdminCompletedKyc(adminId: string): Promise<any[]> {
    try {
      const user = await this.getUser(adminId);
      if (!user) return [];

      // Get KYC requests that were processed by this admin and are now completed (verified/rejected)
      const completedKyc = await db
        .select({
          id: users.id,
          userDisplayId: users.userDisplayId,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          kycStatus: users.kycStatus,
          processedByAdmin: users.processedByAdmin,
          updatedAt: users.updatedAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(
          and(
            eq(users.processedByAdmin, user.email || ''),
            or(eq(users.kycStatus, 'verified'), eq(users.kycStatus, 'rejected'))
          )
        )
        .orderBy(desc(users.updatedAt));

      return completedKyc.map(kyc => ({
        ...kyc,
        completedAt: kyc.updatedAt,
        processedBy: kyc.processedByAdmin,
      }));
    } catch (error) {
      console.error('Error getting completed KYC:', error);
      return [];
    }
  }

  async getAdminCompletedDocuments(adminId: string): Promise<any[]> {
    try {
      // Get document reviews that were completed by this admin
      const completedDocs = await db
        .select({
          id: fraudReports.id,
          title: fraudReports.description, // Use description as title since subject field doesn't exist
          documentId: fraudReports.relatedId,
          reason: fraudReports.description,
          status: fraudReports.status,
          claimedBy: fraudReports.claimedBy,
          adminNotes: fraudReports.adminNotes,
          completedAt: fraudReports.updatedAt,
          createdAt: fraudReports.createdAt,
          reportType: fraudReports.reportType,
        })
        .from(fraudReports)
        .where(
          and(
            eq(fraudReports.claimedBy, adminId),
            or(
              eq(fraudReports.reportType, 'document'),
              eq(fraudReports.reportType, 'inappropriate'),
              eq(fraudReports.reportType, 'misleading_info'),
              eq(fraudReports.reportType, 'fake_documents'),
              eq(fraudReports.reportType, 'other')
            ),
            or(
              eq(fraudReports.status, 'resolved'), 
              eq(fraudReports.status, 'closed'),
              eq(fraudReports.status, 'approved'),
              eq(fraudReports.status, 'rejected')
            )
          )
        )
        .orderBy(desc(fraudReports.updatedAt));

      return completedDocs;
    } catch (error) {
      console.error('Error getting completed documents:', error);
      return [];
    }
  }

  async getAdminCompletedCampaigns(adminId: string): Promise<any[]> {
    try {
      // Get actual campaigns that were completed/processed by this admin
      const completedCampaigns = await db
        .select({
          id: campaigns.id,
          campaignDisplayId: campaigns.campaignDisplayId,
          title: campaigns.title,
          description: campaigns.description,
          category: campaigns.category,
          goalAmount: campaigns.goalAmount,
          minimumAmount: campaigns.minimumAmount,
          currentAmount: campaigns.currentAmount,
          claimedAmount: campaigns.claimedAmount,
          images: campaigns.images,
          status: campaigns.status,
          tesVerified: campaigns.tesVerified,
          duration: campaigns.duration,
          street: campaigns.street,
          barangay: campaigns.barangay,
          city: campaigns.city,
          province: campaigns.province,
          region: campaigns.region,
          zipcode: campaigns.zipcode,
          landmark: campaigns.landmark,
          startDate: campaigns.startDate,
          endDate: campaigns.endDate,
          needsVolunteers: campaigns.needsVolunteers,
          volunteerSlots: campaigns.volunteerSlots,
          volunteerSlotsFilledCount: campaigns.volunteerSlotsFilledCount,
          claimedBy: campaigns.claimedBy,
          claimedAt: campaigns.claimedAt,
          approvedBy: campaigns.approvedBy,
          approvedAt: campaigns.approvedAt,
          rejectedBy: campaigns.rejectedBy,
          rejectedAt: campaigns.rejectedAt,
          rejectionReason: campaigns.rejectionReason,
          completedAt: campaigns.updatedAt,
          createdAt: campaigns.createdAt,
          updatedAt: campaigns.updatedAt,
          creator: {
            id: users.id,
            userDisplayId: users.userDisplayId,
            email: users.email,
            firstName: users.firstName,
            middleInitial: users.middleInitial,
            lastName: users.lastName,
            birthday: users.birthday,
            profileImageUrl: users.profileImageUrl,
            contactNumber: users.contactNumber,
            phoneNumber: users.phoneNumber,
            address: users.address,
            education: users.education,
            profession: users.profession,
            workExperience: users.workExperience,
            organizationName: users.organizationName,
            organizationType: users.organizationType,
            linkedinProfile: users.linkedinProfile,
            funFacts: users.funFacts,
            kycStatus: users.kycStatus,
            phpBalance: users.phpBalance,
            reliabilityScore: users.reliabilityScore,
            credibilityScore: users.credibilityScore,
            isProfileComplete: users.isProfileComplete,
            createdAt: users.createdAt,
          }
        })
        .from(campaigns)
        .leftJoin(users, eq(campaigns.creatorId, users.id))
        .where(
          and(
            or(
              eq(campaigns.claimedBy, adminId),
              eq(campaigns.approvedBy, adminId),
              eq(campaigns.rejectedBy, adminId)
            ),
            or(
              eq(campaigns.status, 'active'),
              eq(campaigns.status, 'completed'),
              eq(campaigns.status, 'approved'),
              eq(campaigns.status, 'rejected'),
              eq(campaigns.status, 'suspended')
            )
          )
        )
        .orderBy(desc(campaigns.updatedAt));

      return completedCampaigns;
    } catch (error) {
      console.error('Error getting completed campaigns:', error);
      return [];
    }
  }

  async getAdminCompletedVolunteers(adminId: string): Promise<any[]> {
    try {
      // Get volunteer reviews that were completed by this admin
      const completedVolunteers = await db
        .select({
          id: volunteerReports.id,
          reportedVolunteerId: volunteerReports.reportedVolunteerId,
          reporterId: volunteerReports.reporterId,
          campaignId: volunteerReports.campaignId,
          reason: volunteerReports.reason,
          description: volunteerReports.description,
          status: volunteerReports.status,
          claimedBy: volunteerReports.claimedBy,
          completedAt: volunteerReports.updatedAt,
          createdAt: volunteerReports.createdAt,
        })
        .from(volunteerReports)
        .where(
          and(
            eq(volunteerReports.claimedBy, adminId),
            or(
              eq(volunteerReports.status, 'resolved'), 
              eq(volunteerReports.status, 'closed'),
              eq(volunteerReports.status, 'approved'),
              eq(volunteerReports.status, 'rejected')
            )
          )
        )
        .orderBy(desc(volunteerReports.updatedAt));

      // Enrich with volunteer and campaign data
      const enrichedVolunteers = await Promise.all(
        completedVolunteers.map(async (report) => {
          let applicantName = 'Unknown Volunteer';
          let campaignTitle = 'Unknown Campaign';

          try {
            // Get volunteer name
            if (report.reportedVolunteerId) {
              const volunteerData = await db
                .select({ firstName: users.firstName, lastName: users.lastName })
                .from(users)
                .where(eq(users.id, report.reportedVolunteerId))
                .limit(1);

              if (volunteerData[0]) {
                applicantName = `${volunteerData[0].firstName} ${volunteerData[0].lastName}`;
              }
            }

            // Get campaign title
            if (report.campaignId) {
              const campaignData = await db
                .select({ title: campaigns.title })
                .from(campaigns)
                .where(eq(campaigns.id, report.campaignId))
                .limit(1);

              if (campaignData[0]) {
                campaignTitle = campaignData[0].title;
              }
            }
          } catch (err) {
            console.error('Error fetching volunteer/campaign data:', err);
          }

          return {
            ...report,
            applicantName,
            campaignTitle,
          };
        })
      );

      return enrichedVolunteers;
    } catch (error) {
      console.error('Error getting completed volunteers:', error);
      return [];
    }
  }

  async getAdminCompletedCreators(adminId: string): Promise<any[]> {
    try {
      // Get creator reviews that were completed by this admin
      const completedCreators = await db
        .select()
        .from(fraudReports)
        .where(
          and(
            eq(fraudReports.claimedBy, adminId),
            or(
              eq(fraudReports.reportType, 'Creator Report'),
              eq(fraudReports.relatedType, 'creator')
            ),
            or(
              eq(fraudReports.status, 'resolved'), 
              eq(fraudReports.status, 'closed'),
              eq(fraudReports.status, 'approved'),
              eq(fraudReports.status, 'rejected')
            )
          )
        )
        .orderBy(desc(fraudReports.updatedAt));

      // Enrich with creator data
      const enrichedCreators = await Promise.all(
        completedCreators.map(async (report) => {
          let creator = null;

          if (report.relatedId) {
            try {
              const creatorData = await db
                .select({
                  id: users.id,
                  firstName: users.firstName,
                  lastName: users.lastName,
                  email: users.email,
                })
                .from(users)
                .where(eq(users.id, report.relatedId))
                .limit(1);

              if (creatorData[0]) {
                creator = creatorData[0];
              }
            } catch (err) {
              console.error('Error fetching creator data:', err);
            }
          }

          return {
            ...report,
            creatorId: report.relatedId,
            firstName: creator?.firstName || 'Unknown',
            lastName: creator?.lastName || 'Creator',
            email: creator?.email || '',
            title: report.subject || 'Creator Report',
            reason: report.reason || '',
            completedAt: report.updatedAt,
          };
        })
      );

      return enrichedCreators;
    } catch (error) {
      console.error('Error getting completed creators:', error);
      return [];
    }
  }

  async getCompletedCampaignReports(): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: fraudReports.id,
          reportType: fraudReports.reportType,
          status: fraudReports.status,
          description: fraudReports.description,
          adminNotes: fraudReports.adminNotes,
          completedAt: fraudReports.updatedAt,
          claimedBy: fraudReports.claimedBy,
          // Campaign fields flattened
          campaignId: campaigns.id,
          campaignTitle: campaigns.title,
          campaignDisplayId: campaigns.campaignDisplayId,
          campaignDescription: campaigns.description,
          campaignCreatedAt: campaigns.createdAt,
          // Reporter fields flattened
          reporterId: users.id,
          reporterFirstName: users.firstName,
          reporterLastName: users.lastName,
          reporterEmail: users.email,
        })
        .from(fraudReports)
        .leftJoin(campaigns, eq(fraudReports.relatedId, campaigns.id))
        .leftJoin(users, eq(fraudReports.reporterId, users.id))
        .where(
          and(
            eq(fraudReports.relatedType, 'campaign'),
            or(
              eq(fraudReports.status, 'resolved'),
              eq(fraudReports.status, 'closed'),
              eq(fraudReports.status, 'approved'),
              eq(fraudReports.status, 'rejected')
            )
          )
        )
        .orderBy(desc(fraudReports.updatedAt));

      // Transform to expected format
      return result.map(row => ({
        ...row,
        campaign: {
          id: row.campaignId,
          title: row.campaignTitle,
          campaignDisplayId: row.campaignDisplayId,
          description: row.campaignDescription,
          createdAt: row.campaignCreatedAt,
        },
        reporter: {
          id: row.reporterId,
          firstName: row.reporterFirstName,
          lastName: row.reporterLastName,
          email: row.reporterEmail,
        }
      }));
    } catch (error) {
      console.error("Error getting completed campaign reports:", error);
      return [];
    }
  }

  async getContributionsAndTips(): Promise<any[]> {
    // Get contributions
    const contributionsResult = await db
      .select({
        id: contributions.id,
        type: sql<string>`'contribution'`,
        amount: contributions.amount,
        message: contributions.message,
        isAnonymous: contributions.isAnonymous,
        transactionHash: contributions.transactionHash,
        createdAt: contributions.createdAt,
        contributor: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
          creatorId: campaigns.creatorId,
        }
      })
      .from(contributions)
      .leftJoin(users, eq(contributions.contributorId, users.id))
      .leftJoin(campaigns, eq(contributions.campaignId, campaigns.id))
      .orderBy(desc(contributions.createdAt));

    // Get tips
    const tipsResult = await db
      .select({
        id: tips.id,
        type: sql<string>`'tip'`,
        amount: tips.amount,
        message: tips.message,
        isAnonymous: tips.isAnonymous,
        transactionHash: sql<string>`NULL`,
        createdAt: tips.createdAt,
        contributor: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
          creatorId: campaigns.creatorId,
        }
      })
      .from(tips)
      .leftJoin(users, eq(tips.tipperId, users.id))
      .leftJoin(campaigns, eq(tips.campaignId, campaigns.id))
      .orderBy(desc(tips.createdAt));

    // Combine and sort
    const combined = [...contributionsResult, ...tipsResult];
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return combined;
  }

  async getClaimedTips(): Promise<any[]> {
    const result = await db
      .select({
        transaction: {
          id: transactions.id,
          type: transactions.type,
          amount: transactions.amount,
          description: transactions.description,
          status: transactions.status,
          createdAt: transactions.createdAt,
        },
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          tipsBalance: users.tipsBalance,
        }
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(sql`${transactions.type} IN ('tip', 'conversion') AND ${transactions.description} LIKE '%tip%'`)
      .orderBy(desc(transactions.createdAt));
    
    return result;
  }

  async getClaimedContributions(): Promise<any[]> {
    const result = await db
      .select({
        transaction: {
          id: transactions.id,
          type: transactions.type,
          amount: transactions.amount,
          description: transactions.description,
          status: transactions.status,
          createdAt: transactions.createdAt,
        },
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          contributionsBalance: users.contributionsBalance,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
        }
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(campaigns, eq(transactions.campaignId, campaigns.id))
      .where(sql`${transactions.type} IN ('contribution', 'conversion') AND ${transactions.description} LIKE '%contribution%'`)
      .orderBy(desc(transactions.createdAt));
    
    return result;
  }

  async getAllTransactionHistories(): Promise<any[]> {
    const result = await db
      .select({
        id: transactions.id,
        transactionDisplayId: transactions.transactionDisplayId,
        type: transactions.type,
        amount: transactions.amount,
        currency: transactions.currency,
        description: transactions.description,
        status: transactions.status,
        transactionHash: transactions.transactionHash,
        blockNumber: transactions.blockNumber,
        paymentProvider: transactions.paymentProvider,
        paymentProviderTxId: transactions.paymentProviderTxId,
        exchangeRate: transactions.exchangeRate,
        feeAmount: transactions.feeAmount,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phpBalance: users.phpBalance,
          tipsBalance: users.tipsBalance,
          contributionsBalance: users.contributionsBalance,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
        }
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(campaigns, eq(transactions.campaignId, campaigns.id))
      .orderBy(desc(transactions.createdAt));
    
    return result;
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [result] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return result;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getAllNotifications(): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteExpiredNotifications(): Promise<void> {
    await db
      .delete(notifications)
      .where(and(
        isNotNull(notifications.expiresAt),
        lt(notifications.expiresAt, new Date())
      ));
  }

  // Public stats methods for landing page
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllVolunteerApplications(): Promise<VolunteerApplication[]> {
    return await db.select().from(volunteerApplications);
  }

  async getAllContributions(): Promise<Contribution[]> {
    return await db.select().from(contributions);
  }

  // Campaign engagement operations
  async toggleCampaignReaction(campaignId: string, userId: string, reactionType: string): Promise<CampaignReaction | null> {
    // Check if reaction already exists
    const [existingReaction] = await db
      .select()
      .from(campaignReactions)
      .where(and(
        eq(campaignReactions.campaignId, campaignId),
        eq(campaignReactions.userId, userId)
      ));

    if (existingReaction) {
      if (existingReaction.reactionType === reactionType) {
        // Same reaction - remove it
        await db
          .delete(campaignReactions)
          .where(eq(campaignReactions.id, existingReaction.id));
        return null;
      } else {
        // Different reaction - update it
        const [updated] = await db
          .update(campaignReactions)
          .set({ reactionType, createdAt: new Date() })
          .where(eq(campaignReactions.id, existingReaction.id))
          .returning();
        return updated;
      }
    } else {
      // No existing reaction - create new one
      const [newReaction] = await db
        .insert(campaignReactions)
        .values({ campaignId, userId, reactionType })
        .returning();
      return newReaction;
    }
  }

  async getCampaignReactions(campaignId: string): Promise<{ [key: string]: { count: number; users: string[] } }> {
    const reactions = await db
      .select({
        reactionType: campaignReactions.reactionType,
        userId: campaignReactions.userId,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(campaignReactions)
      .leftJoin(users, eq(campaignReactions.userId, users.id))
      .where(eq(campaignReactions.campaignId, campaignId));

    const grouped: { [key: string]: { count: number; users: string[] } } = {};
    
    reactions.forEach(reaction => {
      if (!grouped[reaction.reactionType]) {
        grouped[reaction.reactionType] = { count: 0, users: [] };
      }
      grouped[reaction.reactionType].count++;
      const userName = `${reaction.firstName || ''} ${reaction.lastName || ''}`.trim() || 'Anonymous';
      grouped[reaction.reactionType].users.push(userName);
    });

    return grouped;
  }

  async getCampaignReactionByUser(campaignId: string, userId: string): Promise<CampaignReaction | undefined> {
    const [reaction] = await db
      .select()
      .from(campaignReactions)
      .where(and(
        eq(campaignReactions.campaignId, campaignId),
        eq(campaignReactions.userId, userId)
      ));
    return reaction;
  }

  // Campaign comment operations
  async createCampaignComment(comment: InsertCampaignComment): Promise<CampaignComment> {
    const [result] = await db
      .insert(campaignComments)
      .values(comment)
      .returning();
    return result;
  }

  async getCampaignComments(campaignId: string): Promise<(CampaignComment & { user: User; replies: (CommentReply & { user: User })[] })[]> {
    const comments = await db
      .select({
        comment: campaignComments,
        user: users,
      })
      .from(campaignComments)
      .leftJoin(users, eq(campaignComments.userId, users.id))
      .where(eq(campaignComments.campaignId, campaignId))
      .orderBy(desc(campaignComments.createdAt));

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async ({ comment, user }) => {
        const replies = await this.getCommentReplies(comment.id);
        return {
          ...comment,
          user: user!,
          replies,
        };
      })
    );

    return commentsWithReplies;
  }

  async updateCampaignComment(commentId: string, content: string, userId: string): Promise<CampaignComment | undefined> {
    const [updated] = await db
      .update(campaignComments)
      .set({ content, isEdited: true, updatedAt: new Date() })
      .where(and(
        eq(campaignComments.id, commentId),
        eq(campaignComments.userId, userId)
      ))
      .returning();
    return updated;
  }

  async deleteCampaignComment(commentId: string, userId: string): Promise<void> {
    // Delete all replies first
    await db
      .delete(commentReplies)
      .where(eq(commentReplies.commentId, commentId));

    // Delete the comment
    await db
      .delete(campaignComments)
      .where(and(
        eq(campaignComments.id, commentId),
        eq(campaignComments.userId, userId)
      ));
  }

  // Comment reply operations
  async createCommentReply(reply: InsertCommentReply): Promise<CommentReply> {
    const [result] = await db
      .insert(commentReplies)
      .values(reply)
      .returning();
    return result;
  }

  async getCommentReplies(commentId: string): Promise<(CommentReply & { user: User })[]> {
    const replies = await db
      .select({
        reply: commentReplies,
        user: users,
      })
      .from(commentReplies)
      .leftJoin(users, eq(commentReplies.userId, users.id))
      .where(eq(commentReplies.commentId, commentId))
      .orderBy(commentReplies.createdAt);

    return replies.map(({ reply, user }) => ({
      ...reply,
      user: user!,
    }));
  }

  async updateCommentReply(replyId: string, content: string, userId: string): Promise<CommentReply | undefined> {
    const [updated] = await db
      .update(commentReplies)
      .set({ content, isEdited: true, updatedAt: new Date() })
      .where(and(
        eq(commentReplies.id, replyId),
        eq(commentReplies.userId, userId)
      ))
      .returning();
    return updated;
  }

  async deleteCommentReply(replyId: string, userId: string): Promise<void> {
    await db
      .delete(commentReplies)
      .where(and(
        eq(commentReplies.id, replyId),
        eq(commentReplies.userId, userId)
      ));
  }

  // Progress Report operations
  async getProgressReportsForCampaign(campaignId: string): Promise<ProgressReport[]> {
    const reports = await db.select().from(progressReports)
      .where(eq(progressReports.campaignId, campaignId))
      .orderBy(desc(progressReports.reportDate));

    console.log(`🔍 Storage: Found ${reports.length} progress reports for campaign ${campaignId}`);

    const reportsWithDetails = await Promise.all(
      reports.map(async (report) => {
        const createdBy = await this.getUser(report.createdById);
        const documents = await this.getProgressReportDocuments(report.id);
        const creditScore = await this.getProgressReportCreditScore(report.id);
        
        console.log(`🔍 Storage: Report ${report.id} has ${documents.length} documents:`, 
          documents.map(doc => ({ id: doc.id, fileName: doc.fileName, documentType: doc.documentType }))
        );
        
        return { ...report, createdBy, documents, creditScore };
      })
    );

    return reportsWithDetails;
  }

  async createProgressReport(report: InsertProgressReport): Promise<ProgressReport> {
    const [newReport] = await db
      .insert(progressReports)
      .values(report)
      .returning();

    const createdBy = await this.getUser(newReport.createdById);
    return { ...newReport, createdBy, documents: [], creditScore: null };
  }

  async getProgressReport(reportId: string): Promise<ProgressReport | null> {
    const [report] = await db.select().from(progressReports)
      .where(eq(progressReports.id, reportId))
      .limit(1);

    if (!report) {
      return null;
    }

    const createdBy = await this.getUser(report.createdById);
    const documents = await this.getProgressReportDocuments(report.id);
    const creditScore = await this.getProgressReportCreditScore(report.id);
    return { ...report, createdBy, documents, creditScore };
  }

  async updateProgressReport(reportId: string, updates: Partial<InsertProgressReport>): Promise<ProgressReport> {
    const [updatedReport] = await db
      .update(progressReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(progressReports.id, reportId))
      .returning();

    const createdBy = await this.getUser(updatedReport.createdById);
    const documents = await this.getProgressReportDocuments(updatedReport.id);
    const creditScore = await this.getProgressReportCreditScore(updatedReport.id);
    return { ...updatedReport, createdBy, documents, creditScore };
  }

  async deleteProgressReport(reportId: string): Promise<void> {
    // Delete related documents and credit scores first
    await db.delete(progressReportDocuments).where(eq(progressReportDocuments.progressReportId, reportId));
    await db.delete(userCreditScores).where(eq(userCreditScores.progressReportId, reportId));
    await db.delete(progressReports).where(eq(progressReports.id, reportId));
  }

  // Progress Report Document operations
  async getProgressReportDocuments(reportId: string): Promise<ProgressReportDocument[]> {
    console.log(`🔍 getProgressReportDocuments called for reportId: ${reportId}`);
    
    const documents = await db.select().from(progressReportDocuments)
      .where(eq(progressReportDocuments.progressReportId, reportId))
      .orderBy(progressReportDocuments.createdAt);
    
    console.log(`📄 Found ${documents.length} documents for report ${reportId}:`, 
      documents.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        documentType: doc.documentType,
        progressReportId: doc.progressReportId
      }))
    );
    
    return documents;
  }

  async createProgressReportDocument(document: InsertProgressReportDocument): Promise<ProgressReportDocument> {
    console.log(`📄 createProgressReportDocument called with:`, {
      progressReportId: document.progressReportId,
      documentType: document.documentType,
      fileName: document.fileName,
      fileUrl: document.fileUrl
    });    // Generate document display ID if not provided
    if (!document.documentDisplayId) {
      document.documentDisplayId = await generateUniqueDocumentDisplayId();
    }
    
    const [newDocument] = await db
      .insert(progressReportDocuments)
      .values(document)
      .returning();

    console.log(`✅ Document created successfully:`, {
      id: newDocument.id,
      progressReportId: newDocument.progressReportId,
      fileName: newDocument.fileName
    });

    // Update credit score after adding document
    await this.updateProgressReportCreditScore(document.progressReportId);
    
    return newDocument;
  }

  async deleteProgressReportDocument(documentId: string): Promise<void> {
    const document = await db.select({ progressReportId: progressReportDocuments.progressReportId })
      .from(progressReportDocuments)
      .where(eq(progressReportDocuments.id, documentId))
      .limit(1);

    await db.delete(progressReportDocuments).where(eq(progressReportDocuments.id, documentId));

    // Update credit score after removing document
    if (document[0]) {
      await this.updateProgressReportCreditScore(document[0].progressReportId);
    }
  }

  // Generate a shortened ID from a file URL (like Facebook's approach)
  generateDocumentShortId(fileUrl: string): string {
    // Extract meaningful part from the URL and create a short hash
    const urlPath = fileUrl.split('/').pop() || fileUrl;
    const hash = crypto.createHash('md5').update(urlPath).digest('hex');
    return hash.substring(0, 8).toUpperCase(); // 8-character uppercase ID
  }

  async getDocumentById(documentId: string): Promise<any> {
    const [document] = await db
      .select({
        id: progressReportDocuments.id,
        fileName: progressReportDocuments.fileName,
        fileUrl: progressReportDocuments.fileUrl,
        fileSize: progressReportDocuments.fileSize,
        documentType: progressReportDocuments.documentType,
        description: progressReportDocuments.description,
        createdAt: progressReportDocuments.createdAt,
        progressReport: {
          id: progressReports.id,
          title: progressReports.title,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
          creator: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          },
        },
      })
      .from(progressReportDocuments)
      .leftJoin(progressReports, eq(progressReportDocuments.progressReportId, progressReports.id))
      .leftJoin(campaigns, eq(progressReports.campaignId, campaigns.id))
      .leftJoin(users, eq(campaigns.creatorId, users.id))
      .where(eq(progressReportDocuments.id, documentId))
      .limit(1);
    
    if (!document) return null;

    // Convert the signed URL to a proper streaming endpoint path
    const objectStorageService = new ObjectStorageService();
    const normalizedPath = objectStorageService.normalizeObjectEntityPath(document.fileUrl);

    return {
      ...document,
      shortId: this.generateDocumentShortId(document.fileUrl),
      // Use the streaming endpoint instead of expired signed URL
      viewUrl: normalizedPath
    };
  }

  async getDocumentByShortId(shortId: string): Promise<any> {
    // Get all documents and find the one that matches the short ID
    const documents = await db
      .select({
        id: progressReportDocuments.id,
        fileName: progressReportDocuments.fileName,
        fileUrl: progressReportDocuments.fileUrl,
        fileSize: progressReportDocuments.fileSize,
        documentType: progressReportDocuments.documentType,
        description: progressReportDocuments.description,
        createdAt: progressReportDocuments.createdAt,
        progressReport: {
          id: progressReports.id,
          title: progressReports.title,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
          creator: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          },
        },
      })
      .from(progressReportDocuments)
      .leftJoin(progressReports, eq(progressReportDocuments.progressReportId, progressReports.id))
      .leftJoin(campaigns, eq(progressReports.campaignId, campaigns.id))
      .leftJoin(users, eq(campaigns.creatorId, users.id));
    
    // Find document that matches the short ID
    const matchingDocument = documents.find(doc => 
      this.generateDocumentShortId(doc.fileUrl) === shortId.toUpperCase()
    );
    
    if (!matchingDocument) return null;

    // Convert the signed URL to a proper streaming endpoint path
    const objectStorageService = new ObjectStorageService();
    const normalizedPath = objectStorageService.normalizeObjectEntityPath(matchingDocument.fileUrl);

    return {
      ...matchingDocument,
      shortId: shortId.toUpperCase(),
      // Use the streaming endpoint instead of expired signed URL
      viewUrl: normalizedPath
    };
  }

  // Credit Score operations
  async getProgressReportCreditScore(reportId: string): Promise<UserCreditScore | null> {
    const [creditScore] = await db.select().from(userCreditScores)
      .where(eq(userCreditScores.progressReportId, reportId))
      .limit(1);

    return creditScore || null;
  }

  async updateProgressReportCreditScore(reportId: string): Promise<UserCreditScore> {
    // Get report details
    const [report] = await db.select().from(progressReports)
      .where(eq(progressReports.id, reportId))
      .limit(1);

    if (!report) {
      throw new Error('Progress report not found');
    }

    // Get all documents for this report
    const documents = await this.getProgressReportDocuments(reportId);
    
    // Calculate unique document types completed
    const completedTypes = [...new Set(documents.map(doc => doc.documentType))];
    
    // Required document types for 100% score
    const requiredTypes = [
      'image', 'video_link', 'official_receipt', 
      'acknowledgement_receipt', 'expense_summary',
      'invoice', 'contract', 'other'
    ];
    
    // Calculate score percentage
    const scorePercentage = Math.round((completedTypes.length / requiredTypes.length) * 100);
    
    // Check if credit score already exists
    const [existingScore] = await db.select().from(userCreditScores)
      .where(eq(userCreditScores.progressReportId, reportId))
      .limit(1);

    if (existingScore) {
      // Update existing score
      const [updatedScore] = await db
        .update(userCreditScores)
        .set({
          scorePercentage,
          completedDocumentTypes: completedTypes,
          totalRequiredTypes: requiredTypes.length,
          updatedAt: new Date()
        })
        .where(eq(userCreditScores.id, existingScore.id))
        .returning();
      
      return updatedScore;
    } else {
      // Create new score
      const [newScore] = await db
        .insert(userCreditScores)
        .values({
          userId: report.createdById,
          campaignId: report.campaignId,
          progressReportId: reportId,
          scorePercentage,
          completedDocumentTypes: completedTypes,
          totalRequiredTypes: requiredTypes.length,
        })
        .returning();
      
      return newScore;
    }
  }

  async getUserAverageCreditScore(userId: string): Promise<number> {
    const scores = await db.select({ scorePercentage: userCreditScores.scorePercentage })
      .from(userCreditScores)
      .where(eq(userCreditScores.userId, userId));

    if (scores.length === 0) {
      return 0;
    }

    const totalScore = scores.reduce((sum, score) => sum + score.scorePercentage, 0);
    return Math.round(totalScore / scores.length);
  }

  // Creator Rating operations
  async createCreatorRating(rating: InsertCreatorRating): Promise<CreatorRating> {
    const [newRating] = await db
      .insert(creatorRatings)
      .values(rating)
      .onConflictDoUpdate({
        target: [creatorRatings.raterId, creatorRatings.progressReportId],
        set: {
          rating: rating.rating,
          comment: rating.comment,
          updatedAt: new Date(),
        },
      })
      .returning();
    return newRating;
  }

  async getCreatorRatingsByProgressReport(progressReportId: string): Promise<CreatorRating[]> {
    return await db
      .select()
      .from(creatorRatings)
      .where(eq(creatorRatings.progressReportId, progressReportId))
      .orderBy(desc(creatorRatings.createdAt));
  }

  async getUserRatingForProgressReport(raterId: string, progressReportId: string): Promise<CreatorRating | undefined> {
    const [rating] = await db
      .select()
      .from(creatorRatings)
      .where(and(
        eq(creatorRatings.raterId, raterId),
        eq(creatorRatings.progressReportId, progressReportId)
      ))
      .limit(1);
    return rating;
  }

  // Get creator ratings for a specific creator
  async getCreatorRatings(creatorId: string) {
    const ratings = await db
      .select({
        id: creatorRatings.id,
        rating: creatorRatings.rating,
        comment: creatorRatings.comment,
        createdAt: creatorRatings.createdAt,
        campaignTitle: campaigns.title,
        campaignId: creatorRatings.campaignId,
        raterId: creatorRatings.raterId,
      })
      .from(creatorRatings)
      .leftJoin(campaigns, eq(creatorRatings.campaignId, campaigns.id))
      .where(eq(creatorRatings.creatorId, creatorId))
      .orderBy(desc(creatorRatings.createdAt));
    
    return ratings;
  }

  async getAverageCreatorRating(creatorId: string): Promise<{ averageRating: number; totalRatings: number }> {
    const result = await db
      .select({
        averageRating: sql<number>`COALESCE(AVG(CAST(${creatorRatings.rating} AS FLOAT)), 0)`,
        totalRatings: sql<number>`COUNT(${creatorRatings.id})`
      })
      .from(creatorRatings)
      .where(eq(creatorRatings.creatorId, creatorId));
    
    return {
      averageRating: parseFloat(result[0]?.averageRating.toString() || '0'),
      totalRatings: result[0]?.totalRatings || 0
    };
  }

  // Fraud Report operations - for community safety
  async createFraudReport(data: InsertFraudReport): Promise<FraudReport> {
    const [fraudReport] = await db
      .insert(fraudReports)
      .values(data)
      .returning();
    
    return fraudReport;
  }

  async getFraudReportsByStatus(status: string): Promise<FraudReport[]> {
    return await db.select()
      .from(fraudReports)
      .where(eq(fraudReports.status, status))
      .orderBy(desc(fraudReports.createdAt));
  }

  async getAllFraudReports(): Promise<any[]> {
    try {
      // Get basic fraud reports first
      const fraudReportsList = await db
        .select()
        .from(fraudReports)
        .orderBy(desc(fraudReports.createdAt));

      // Simplify the enrichment process to avoid SQL errors
      const enrichedReports = await Promise.all(
        fraudReportsList.map(async (report) => {
          try {
            // Get reporter info 
            const reporter = await db
              .select()
              .from(users)
              .where(eq(users.id, report.reporterId))
              .limit(1);

            let campaign = null;
            let creator = null;

            // If it's a campaign report, get campaign and creator info
            if (report.relatedType === 'campaign' && report.relatedId) {
              const campaignData = await db
                .select()
                .from(campaigns)
                .where(eq(campaigns.id, report.relatedId))
                .limit(1);

              if (campaignData[0]) {
                campaign = campaignData[0];
                
                // Get creator info
                const creatorData = await db
                  .select()
                  .from(users)
                  .where(eq(users.id, campaign.creatorId))
                  .limit(1);

                if (creatorData[0]) {
                  creator = creatorData[0];
                }
              }
            }
            
            // If it's a direct creator report, get creator info directly
            if (report.relatedType === 'creator' && report.relatedId) {
              const creatorData = await db
                .select()
                .from(users)
                .where(eq(users.id, report.relatedId))
                .limit(1);

              if (creatorData[0]) {
                creator = creatorData[0];
                
                // Also get the creator's campaigns for additional context
                const creatorCampaigns = await db
                  .select()
                  .from(campaigns)
                  .where(eq(campaigns.creatorId, report.relatedId))
                  .limit(1);
                
                if (creatorCampaigns[0]) {
                  campaign = creatorCampaigns[0];
                }
              }
            }

            // Get claim admin info if report is claimed
            let claimAdmin = null;
            if (report.claimedBy) {
              const adminData = await db
                .select({
                  id: users.id,
                  email: users.email,
                  userDisplayId: users.userDisplayId,
                  firstName: users.firstName,
                  lastName: users.lastName
                })
                .from(users)
                .where(eq(users.id, report.claimedBy))
                .limit(1);
              
              claimAdmin = adminData[0] || null;
            }

            return {
              ...report,
              reporter: reporter[0] || null,
              claimAdmin: claimAdmin,
              campaign: campaign ? {
                ...campaign,
                creator: creator
              } : null,
              // Add additional fields for display
              reportedEntity: campaign ? 'Campaign' : 'Creator',
              reportedEntityTitle: campaign?.title || creator?.firstName || 'Unknown'
            };
          } catch (err) {
            console.error('Error enriching report:', err);
            return {
              ...report,
              reporter: null,
              campaign: null,
              reportedEntity: 'Unknown',
              reportedEntityTitle: 'Unknown'
            };
          }
        })
      );

      return enrichedReports;
    } catch (error) {
      console.error('Error in getAllFraudReports:', error);
      return [];
    }
  }

  async deleteFraudReport(reportId: string): Promise<boolean> {
    try {
      // First get the report to check for evidence files
      const report = await db
        .select()
        .from(fraudReports)
        .where(eq(fraudReports.id, reportId))
        .limit(1);
      
      if (report.length === 0) {
        console.log(`Report ${reportId} not found`);
        return false;
      }
      
      const fraudReport = report[0];
      
      // Delete evidence files from storage if they exist
      if (fraudReport.evidenceUrls && Array.isArray(fraudReport.evidenceUrls)) {
        try {
          const objectStorageService = new ObjectStorageService();
          const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'verifund-assets';
          
          for (const url of fraudReport.evidenceUrls) {
            if (url && url.startsWith('/public-objects/evidence/')) {
              const fileName = url.replace('/public-objects/evidence/', '');
              const objectPath = `public/evidence/${fileName}`;
              
              console.log(`🗑️ Deleting evidence file: ${objectPath}`);
              await objectStorageService.deleteObject(bucketName, objectPath);
            }
          }
        } catch (storageError) {
          console.error('Error deleting evidence files:', storageError);
          // Continue with report deletion even if file deletion fails
        }
      }
      
      // Delete the report from database
      await db
        .delete(fraudReports)
        .where(eq(fraudReports.id, reportId));
      
      console.log(`✅ Fraud report ${reportId} deleted successfully`);
      return true;
      
    } catch (error) {
      console.error(`Error deleting fraud report ${reportId}:`, error);
      return false;
    }  }

  async updateFraudReportStatus(
    id: string, 
    status: string, 
    adminNotes?: string, 
    validatedBy?: string, 
    socialPointsAwarded?: number
  ): Promise<void> {
    await db.update(fraudReports)
      .set({
        status,
        adminNotes,
        validatedBy,
        socialPointsAwarded,
        updatedAt: new Date(),
      })
      .where(eq(fraudReports.id, id));
  }

  async awardSocialScore(userId: string, points: number): Promise<void> {
    await db.update(users)
      .set({
        socialScore: sql`${users.socialScore} + ${points}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Volunteer Report operations - for reporting problematic volunteers
  async createVolunteerReport(data: InsertVolunteerReport): Promise<VolunteerReport> {
    const [volunteerReport] = await db
      .insert(volunteerReports)
      .values(data)
      .returning();
    
    return volunteerReport;
  }

  async getVolunteerReportsByStatus(status: string): Promise<VolunteerReport[]> {
    return await db.select()
      .from(volunteerReports)
      .where(eq(volunteerReports.status, status))
      .orderBy(desc(volunteerReports.createdAt));
  }

async getVolunteerReportById(reportId: string): Promise<VolunteerReport | null> {
    try {
      const report = await db
        .select()
        .from(volunteerReports)
        .where(eq(volunteerReports.id, reportId))
        .limit(1);
      
      return report[0] || null;
    } catch (error) {
      console.error(`Error getting volunteer report ${reportId}:`, error);
      return null;
    }
  }  async getAllVolunteerReports(): Promise<any[]> {
    try {
      // Get basic volunteer reports first
      const volunteerReportsList = await db
        .select()
        .from(volunteerReports)
        .orderBy(desc(volunteerReports.createdAt));

      // Enrich with reporter, reported volunteer, and campaign info
      const enrichedReports = await Promise.all(
        volunteerReportsList.map(async (report) => {
          try {
            // Get reporter info 
            const reporter = await db
              .select()
              .from(users)
              .where(eq(users.id, report.reporterId))
              .limit(1);

            // Get reported volunteer info
            const reportedVolunteer = await db
              .select()
              .from(users)
              .where(eq(users.id, report.reportedVolunteerId))
              .limit(1);

            // Get campaign info
            const campaign = await db
              .select()
              .from(campaigns)
              .where(eq(campaigns.id, report.campaignId))
              .limit(1);

            // Get claim admin info if report is claimed
            let claimAdmin = null;
            if (report.claimedBy) {
              const adminData = await db
                .select({
                  id: users.id,
                  email: users.email,
                  userDisplayId: users.userDisplayId,
                  firstName: users.firstName,
                  lastName: users.lastName
                })
                .from(users)
                .where(eq(users.id, report.claimedBy))
                .limit(1);
              
              claimAdmin = adminData[0] || null;
            }

            return {
              ...report,
              reporter: reporter[0] || null,
              reportedVolunteer: reportedVolunteer[0] || null,
              campaign: campaign[0] || null,
              claimAdmin: claimAdmin,
              reportedEntityTitle: reportedVolunteer[0] ? 
                `${reportedVolunteer[0].firstName} ${reportedVolunteer[0].lastName}` : 'Unknown Volunteer',
              reportType: report.reason || 'General Report', // Map reason to reportType for consistency
              relatedType: 'volunteer' // Ensure proper categorization
            };
          } catch (err) {
            console.error('Error enriching volunteer report:', err);
            return {
              ...report,
              reporter: null,
              reportedVolunteer: null,
              campaign: null,
              reportedEntityTitle: 'Unknown Volunteer',
              reportType: report.reason || 'General Report', // Map reason to reportType for consistency
              relatedType: 'volunteer' // Ensure proper categorization
            };
          }
        })
      );

      return enrichedReports;
    } catch (error) {
      console.error('Error in getAllVolunteerReports:', error);
      return [];
    }
  }

  async updateVolunteerReportStatus(
    id: string, 
    status: string, 
    adminNotes?: string, 
    reviewedBy?: string
  ): Promise<void> {
    await db.update(volunteerReports)
      .set({
        status,
        adminNotes,
        reviewedBy,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(volunteerReports.id, id));
  }

  async claimVolunteerReport(reportId: string, claimedBy: string): Promise<void> {
    await db.update(volunteerReports)
      .set({
        claimedBy,
        claimedAt: new Date(),
        dateClaimed: new Date(),
        status: 'claimed',
        updatedAt: new Date(),
      })
      .where(eq(volunteerReports.id, reportId));
  }

  async getVolunteerReports(): Promise<any[]> {
    try {
      // Get volunteer reports with enriched data (using alias for getAllVolunteerReports)
      return await this.getAllVolunteerReports();
    } catch (error) {
      console.error('Error in getVolunteerReports:', error);
      return [];
    }
  }

// Delete a volunteer report by ID
  async deleteVolunteerReport(reportId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting volunteer report: ${reportId}`);
      
      // First get the report to check for evidence files
      const report = await db
        .select()
        .from(volunteerReports)
        .where(eq(volunteerReports.id, reportId))
        .limit(1);
      
      if (report.length === 0) {
        console.log(`Volunteer report ${reportId} not found`);
        return;
      }
      
      const volunteerReport = report[0];
      
      // Delete evidence files from storage if they exist
      if (volunteerReport.evidenceUrls && Array.isArray(volunteerReport.evidenceUrls)) {
        try {
          const objectStorageService = new ObjectStorageService();
          const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'verifund-assets';
          
          for (const url of volunteerReport.evidenceUrls) {
            if (url && url.startsWith('/public-objects/evidence/')) {
              const fileName = url.replace('/public-objects/evidence/', '');
              const objectPath = `public/evidence/${fileName}`;
              
              console.log(`🗑️ Deleting volunteer report evidence file: ${objectPath}`);
              await objectStorageService.deleteObject(bucketName, objectPath);
            }
          }
        } catch (storageError) {
          console.error('Error deleting volunteer report evidence files:', storageError);
          // Continue with report deletion even if file deletion fails
        }
      }
      
      // Delete the volunteer report from database
      await db.delete(volunteerReports)
        .where(eq(volunteerReports.id, reportId));
      
      console.log(`✅ Successfully deleted volunteer report: ${reportId}`);
    } catch (error) {
      console.error(`❌ Error deleting volunteer report ${reportId}:`, error);
      throw error;
    }
  }  // Generic report status update method for all report types
  async updateReportStatus(
    reportId: string, 
    status: string, 
    reason?: string, 
    adminId?: string
  ): Promise<void> {
    const updateData = {
      status,
      updatedAt: new Date(),
      ...(reason && { adminNotes: reason }),
      ...(adminId && status === 'escalated' && { escalatedBy: adminId, escalatedAt: new Date() }),
      // Note: resolvedBy and resolvedAt fields don't exist in current schema
      // Could add these in future if needed for audit trail
    };

    // Update fraud reports (campaign/creator reports)
    await db.update(fraudReports)
      .set(updateData)
      .where(eq(fraudReports.id, reportId));

    // Update volunteer reports  
    await db.update(volunteerReports)
      .set(updateData)
      .where(eq(volunteerReports.id, reportId));

    // Update support requests
    await db.update(supportRequests)
      .set(updateData)
      .where(eq(supportRequests.id, reportId));
  }

  // Generic report unclaim method for reassigning reports
  async unclaimReport(
    reportId: string, 
    reason?: string, 
    adminId?: string
  ): Promise<void> {
    const updateData = {
      claimedBy: null,
      claimedAt: null,
      status: 'pending',
      updatedAt: new Date(),
      ...(reason && { adminNotes: reason }),
      ...(adminId && { reassignedBy: adminId, reassignedAt: new Date() }),
    };

    // Unclaim fraud reports (campaign/creator reports)
    await db.update(fraudReports)
      .set(updateData)
      .where(eq(fraudReports.id, reportId));

    // Unclaim volunteer reports
    await db.update(volunteerReports)
      .set(updateData)
      .where(eq(volunteerReports.id, reportId));

    // Unclaim support requests
    await db.update(supportRequests)
      .set(updateData)
      .where(eq(supportRequests.id, reportId));
  }

  // Comment and Reply Voting System (Social Score)
  async voteOnComment(userId: string, commentId: string, voteType: 'upvote' | 'downvote'): Promise<void> {
    await db.transaction(async (tx) => {
      // First, handle the user's vote record
      await tx
        .insert(commentVotes)
        .values({ userId, commentId, voteType })
        .onConflictDoUpdate({
          target: [commentVotes.userId, commentVotes.commentId],
          set: { voteType, createdAt: new Date() }
        });

      // Then update vote counts on the comment
      const [upvoteCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(commentVotes)
        .where(and(eq(commentVotes.commentId, commentId), eq(commentVotes.voteType, 'upvote')));

      const [downvoteCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(commentVotes)
        .where(and(eq(commentVotes.commentId, commentId), eq(commentVotes.voteType, 'downvote')));

      await tx
        .update(campaignComments)
        .set({
          upvotes: upvoteCount.count,
          downvotes: downvoteCount.count,
          updatedAt: new Date()
        })
        .where(eq(campaignComments.id, commentId));

      // Award social score to comment author (1 point per net upvote)
      const [comment] = await tx
        .select({ userId: campaignComments.userId })
        .from(campaignComments)
        .where(eq(campaignComments.id, commentId));

      if (comment) {
        const netScore = upvoteCount.count - downvoteCount.count;
        await tx
          .update(users)
          .set({
            socialScore: sql`GREATEST(0, COALESCE(${users.socialScore}, 0) + ${netScore} - COALESCE((SELECT upvotes - downvotes FROM ${campaignComments} WHERE id = ${commentId} AND user_id = ${comment.userId}), 0) + ${netScore})`,
            updatedAt: new Date()
          })
          .where(eq(users.id, comment.userId));
      }
    });
  }

  async voteOnReply(userId: string, replyId: string, voteType: 'upvote' | 'downvote'): Promise<void> {
    await db.transaction(async (tx) => {
      // First, handle the user's vote record
      await tx
        .insert(replyVotes)
        .values({ userId, replyId, voteType })
        .onConflictDoUpdate({
          target: [replyVotes.userId, replyVotes.replyId],
          set: { voteType, createdAt: new Date() }
        });

      // Then update vote counts on the reply
      const [upvoteCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(replyVotes)
        .where(and(eq(replyVotes.replyId, replyId), eq(replyVotes.voteType, 'upvote')));

      const [downvoteCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(replyVotes)
        .where(and(eq(replyVotes.replyId, replyId), eq(replyVotes.voteType, 'downvote')));

      await tx
        .update(commentReplies)
        .set({
          upvotes: upvoteCount.count,
          downvotes: downvoteCount.count,
          updatedAt: new Date()
        })
        .where(eq(commentReplies.id, replyId));

      // Award social score to reply author (1 point per net upvote)
      const [reply] = await tx
        .select({ userId: commentReplies.userId })
        .from(commentReplies)
        .where(eq(commentReplies.id, replyId));

      if (reply) {
        const netScore = upvoteCount.count - downvoteCount.count;
        await tx
          .update(users)
          .set({
            socialScore: sql`GREATEST(0, COALESCE(${users.socialScore}, 0) + ${netScore} - COALESCE((SELECT upvotes - downvotes FROM ${commentReplies} WHERE id = ${replyId} AND user_id = ${reply.userId}), 0) + ${netScore})`,
            updatedAt: new Date()
          })
          .where(eq(users.id, reply.userId));
      }
    });
  }

  async getUserVoteOnComment(userId: string, commentId: string): Promise<{ voteType: string } | undefined> {
    const [vote] = await db
      .select({ voteType: commentVotes.voteType })
      .from(commentVotes)
      .where(and(eq(commentVotes.userId, userId), eq(commentVotes.commentId, commentId)))
      .limit(1);
    return vote;
  }

  async getUserVoteOnReply(userId: string, replyId: string): Promise<{ voteType: string } | undefined> {
    const [vote] = await db
      .select({ voteType: replyVotes.voteType })
      .from(replyVotes)
      .where(and(eq(replyVotes.userId, userId), eq(replyVotes.replyId, replyId)))
      .limit(1);
    return vote;
  }

  async getExpiredCampaigns(): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(
        and(
          or(
            eq(campaigns.status, 'active'),
            eq(campaigns.status, 'on_progress')
          ),
          gt(sql`now()`, campaigns.endDate)
        )
      );
  }

  async flagUser(userId: string, reason: string): Promise<void> {
    await db.update(users)
      .set({
        isFlagged: true,
        flagReason: reason,
        flaggedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    // Create admin notifications for all admin users
    try {
      const allUsers = await this.getAllUsers();
      const adminUsers = allUsers.filter(user => user.isAdmin);
      
      for (const adminUser of adminUsers) {
        await this.createNotification({
          userId: adminUser.id,
          title: "User Flagged ⚠️",
          message: `User has been flagged: ${reason}`,
          type: "admin_alert",
          relatedId: userId,
          isRead: false,
        });
      }
      console.log(`✅ Admin notifications created for ${adminUsers.length} admin users`);
    } catch (adminNotifyError) {
      console.error('⚠️ Error creating admin notifications:', adminNotifyError);
    }  }
  // Credibility Score System Methods
  async calculateUserCredibilityScore(userId: string): Promise<number> {
    // Get all completed campaigns with progress reports
    const userCampaigns = await db
      .select()
      .from(campaigns)
      .where(and(
        eq(campaigns.creatorId, userId),
        or(
          eq(campaigns.status, 'completed'),
          eq(campaigns.status, 'closed_with_refund'),
          eq(campaigns.status, 'flagged')
        )
      ));

    if (userCampaigns.length === 0) {
      return 100; // Default score for new users
    }

    let totalScore = 0;
    let scoredCampaigns = 0;

    for (const campaign of userCampaigns) {
      const progressReports = await db
        .select()
        .from(progressReports)
        .where(eq(progressReports.campaignId, campaign.id));
      
      if (progressReports.length > 0) {
        // Calculate average rating for this campaign
        const ratings = await db
          .select()
          .from(creatorRatings)
          .where(eq(creatorRatings.campaignId, campaign.id));
        
        const avgRating = ratings.length > 0 
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : 3; // Default if no ratings (middle ground)
        
        // Convert 1-5 rating to percentage (20% per point)
        const progressScore = Math.min(100, avgRating * 20);
        totalScore += progressScore;
        scoredCampaigns++;
      }
    }

    return scoredCampaigns > 0 ? totalScore / scoredCampaigns : 100;
  }

  async updateUserCredibilityScore(userId: string): Promise<void> {
    const credibilityScore = await this.calculateUserCredibilityScore(userId);
    
    // Update account status based on credibility score
    let accountStatus: string;
    let remainingCampaignChances: number;
    
    if (credibilityScore <= 65) {
      accountStatus = 'blocked';
      remainingCampaignChances = 0;
    } else if (credibilityScore >= 65.01 && credibilityScore < 75) {
      accountStatus = 'suspended';
      remainingCampaignChances = 0;
    } else if (credibilityScore >= 75 && credibilityScore <= 80) {
      accountStatus = 'limited';
      remainingCampaignChances = 2;
    } else {
      accountStatus = 'active';
      remainingCampaignChances = 999; // Unlimited
    }
    
    await db
      .update(users)
      .set({ 
        credibilityScore: credibilityScore.toFixed(2),
        accountStatus,
        remainingCampaignChances,
        lastCredibilityUpdate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Check if user has claimed funds from any campaign
  async hasUserClaimedFunds(userId: string): Promise<boolean> {
    const claimedCampaigns = await db.select({ id: campaigns.id })
      .from(campaigns)
      .where(and(eq(campaigns.creatorId, userId), gt(campaigns.claimedAmount, 0)))
      .limit(1);
    
    return claimedCampaigns.length > 0;
  }

  // Check if user has progress reports
  async hasUserProgressReports(userId: string): Promise<boolean> {
    const userReports = await db.select({ id: progressReports.id })
      .from(progressReports)
      .innerJoin(campaigns, eq(progressReports.campaignId, campaigns.id))
      .where(eq(campaigns.creatorId, userId))
      .limit(1);
    
    return userReports.length > 0;
  }

  // Get or create monthly campaign limit record
  async getMonthlyLimitRecord(userId: string): Promise<any> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // JavaScript months are 0-based
    
    const [existing] = await db.select()
      .from(monthlyCampaignLimits)
      .where(and(
        eq(monthlyCampaignLimits.userId, userId),
        eq(monthlyCampaignLimits.year, year),
        eq(monthlyCampaignLimits.month, month)
      ))
      .limit(1);
    
    if (existing) {
      return existing;
    }
    
    // Create new record with current credit score
    const avgCreditScore = await this.getUserAverageCreditScore(userId);
    let maxAllowed = 10; // Default for 85-100%
    
    if (avgCreditScore < 65) {
      maxAllowed = 0; // Suspended
    } else if (avgCreditScore >= 65 && avgCreditScore < 75) {
      maxAllowed = 2;
    } else if (avgCreditScore >= 75 && avgCreditScore < 85) {
      maxAllowed = 5;
    }
    
    const [newRecord] = await db.insert(monthlyCampaignLimits)
      .values({
        userId,
        year,
        month,
        campaignsCreated: 0,
        maxAllowed,
        creditScoreAtMonth: avgCreditScore,
      })
      .returning();
    
    return newRecord;
  }

  // Update monthly campaign count
  async incrementMonthlyCampaignCount(userId: string): Promise<void> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    await db.update(monthlyCampaignLimits)
      .set({ 
        campaignsCreated: sql`${monthlyCampaignLimits.campaignsCreated} + 1`,
        updatedAt: new Date()
      })
      .where(and(
        eq(monthlyCampaignLimits.userId, userId),
        eq(monthlyCampaignLimits.year, year),
        eq(monthlyCampaignLimits.month, month)
      ));
  }

  async canUserCreateCampaign(userId: string): Promise<{canCreate: boolean, reason?: string}> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return { canCreate: false, reason: 'User not found' };
    }

    // Check if user is flagged or suspended from fraud
    if (user.isFlagged || user.isSuspended) {
      return { canCreate: false, reason: 'Account is flagged or suspended for fraudulent activity' };
    }

    // Check if user has claimed funds and has progress reports (new fraud protection rules apply)
    const hasClaimedFunds = await this.hasUserClaimedFunds(userId);
    const hasProgressReports = await this.hasUserProgressReports(userId);
    
    if (hasClaimedFunds && hasProgressReports) {
      // Apply new credit score-based fraud protection
      const avgCreditScore = await this.getUserAverageCreditScore(userId);
      
      // Suspend users with credit score below 65%
      if (avgCreditScore < 65) {
        return { 
          canCreate: false, 
          reason: `Account suspended due to low progress report completion rate (${avgCreditScore}%). Complete more progress report documents to improve your score.`
        };
      }
      
      // Check monthly limits for users with 65%+ credit score
      const monthlyRecord = await this.getMonthlyLimitRecord(userId);
      
      if (monthlyRecord.campaignsCreated >= monthlyRecord.maxAllowed) {
        let nextTierScore = '';
        if (avgCreditScore < 75) {
          nextTierScore = '75% for 5 campaigns/month';
        } else if (avgCreditScore < 85) {
          nextTierScore = '85% for 10 campaigns/month';
        }
        
        return { 
          canCreate: false, 
          reason: `Monthly campaign limit reached (${monthlyRecord.campaignsCreated}/${monthlyRecord.maxAllowed}). Credit score: ${avgCreditScore}%. ${nextTierScore ? `Reach ${nextTierScore}.` : ''}`
        };
      }
    }

    // Check old credibility score system (for users without claimed funds/progress reports)
    switch (user.accountStatus) {
      case 'blocked':
        return { canCreate: false, reason: `Account blocked due to low credibility score (${user.credibilityScore}%). Submit support request for reactivation.` };
      case 'suspended':
        return { canCreate: false, reason: `Account suspended due to credibility score (${user.credibilityScore}%). Submit support request for reactivation.` };
      case 'limited':
        if (user.remainingCampaignChances <= 0) {
          return { canCreate: false, reason: `Campaign creation limit reached. Need 80%+ credibility score for unlimited access.` };
        }
        return { canCreate: true };
      case 'active':
        return { canCreate: true };
      default:
        return { canCreate: true };
    }
  }

  async decrementUserCampaignChances(userId: string): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user && user.accountStatus === 'limited' && user.remainingCampaignChances > 0) {
      await db
        .update(users)
        .set({ 
          remainingCampaignChances: user.remainingCampaignChances - 1,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }
  }

  // Support Request Methods
  async createSupportRequest(supportRequestData: any): Promise<any> {
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    
    const [supportRequest] = await db
      .insert(supportRequests)
      .values({
        ...supportRequestData,
        eligibleForReviewAt: oneMonthFromNow,
      })
      .returning();
    
    // Update user to mark active support request
    await db
      .update(users)
      .set({
        hasActiveSupportRequest: true,
        supportRequestSubmittedAt: new Date(),
        supportRequestReason: supportRequestData.reason,
        updatedAt: new Date(),
      })
      .where(eq(users.id, supportRequestData.userId));
    
    return supportRequest;
  }

  async getSupportRequestsByUser(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(supportRequests)
      .where(eq(supportRequests.userId, userId))
      .orderBy(desc(supportRequests.createdAt));
  }

  async getAllSupportRequests(): Promise<any[]> {
    return await db
      .select({
        request: supportRequests,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          credibilityScore: users.credibilityScore,
          accountStatus: users.accountStatus,
        }
      })
      .from(supportRequests)
      .leftJoin(users, eq(supportRequests.userId, users.id))
      .orderBy(desc(supportRequests.createdAt));
  }

  async updateSupportRequestStatus(requestId: string, status: string, reviewedBy?: string, reviewNotes?: string): Promise<void> {
    const [request] = await db
      .select()
      .from(supportRequests)
      .where(eq(supportRequests.id, requestId));
    
    if (!request) return;
    
    await db
      .update(supportRequests)
      .set({
        status,
        reviewedBy,
        reviewNotes,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supportRequests.id, requestId));
    
    // If approved, reactivate user account
    if (status === 'approved') {
      await db
        .update(users)
        .set({
          accountStatus: 'active',
          remainingCampaignChances: 999,
          hasActiveSupportRequest: false,
          supportRequestSubmittedAt: null,
          supportRequestReason: null,
          // Reset fraud flags if applicable
          isFlagged: false,
          isSuspended: false,
          flagReason: null,
          suspensionReason: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, request.userId));
    } else if (status === 'rejected') {
      await db
        .update(users)
        .set({
          hasActiveSupportRequest: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, request.userId));
    }
  }

  // === VOLUNTEER RELIABILITY RATING OPERATIONS ===

  async createVolunteerReliabilityRating(rating: InsertVolunteerReliabilityRating): Promise<VolunteerReliabilityRating> {
    const [newRating] = await db
      .insert(volunteerReliabilityRatings)
      .values(rating)
      .returning();
    return newRating;
  }

  async getVolunteerReliabilityRating(volunteerId: string, campaignId: string): Promise<VolunteerReliabilityRating | undefined> {
    const [rating] = await db
      .select()
      .from(volunteerReliabilityRatings)
      .where(
        and(
          eq(volunteerReliabilityRatings.volunteerId, volunteerId),
          eq(volunteerReliabilityRatings.campaignId, campaignId)
        )
      );
    return rating;
  }

  async getVolunteerReliabilityRatings(volunteerId: string): Promise<(VolunteerReliabilityRating & { campaign: Campaign; rater: User })[]> {
    const ratings = await db
      .select({
        id: volunteerReliabilityRatings.id,
        raterId: volunteerReliabilityRatings.raterId,
        volunteerId: volunteerReliabilityRatings.volunteerId,
        campaignId: volunteerReliabilityRatings.campaignId,
        volunteerApplicationId: volunteerReliabilityRatings.volunteerApplicationId,
        rating: volunteerReliabilityRatings.rating,
        feedback: volunteerReliabilityRatings.feedback,
        createdAt: volunteerReliabilityRatings.createdAt,
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
          category: campaigns.category,
          status: campaigns.status,
        },
        rater: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(volunteerReliabilityRatings)
      .leftJoin(campaigns, eq(volunteerReliabilityRatings.campaignId, campaigns.id))
      .leftJoin(users, eq(volunteerReliabilityRatings.raterId, users.id))
      .where(eq(volunteerReliabilityRatings.volunteerId, volunteerId))
      .orderBy(desc(volunteerReliabilityRatings.createdAt));

    return ratings as (VolunteerReliabilityRating & { campaign: Campaign; rater: User })[];
  }

  async updateVolunteerReliabilityScore(volunteerId: string): Promise<void> {
    // Calculate the average reliability score for this volunteer
    const result = await db
      .select({
        avgRating: sql<number>`AVG(${volunteerReliabilityRatings.rating})`,
        count: sql<number>`COUNT(${volunteerReliabilityRatings.rating})`,
      })
      .from(volunteerReliabilityRatings)
      .where(eq(volunteerReliabilityRatings.volunteerId, volunteerId));

    const { avgRating, count } = result[0];
    const averageScore = Number(avgRating) || 0;
    const ratingsCount = Number(count) || 0;

    // Update the user's reliability score and ratings count
    await db
      .update(users)
      .set({
        reliabilityScore: averageScore.toFixed(2),
        reliabilityRatingsCount: ratingsCount,
        updatedAt: new Date(),
      })
      .where(eq(users.id, volunteerId));
  }

  async getVolunteersToRate(campaignId: string, creatorId: string): Promise<(User & { application: VolunteerApplication })[]> {
    // Get approved volunteers for this campaign who haven't been rated yet
    const volunteers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
        reliabilityScore: users.reliabilityScore,
        reliabilityRatingsCount: users.reliabilityRatingsCount,
        application: {
          id: volunteerApplications.id,
          intent: volunteerApplications.intent,
          telegramDisplayName: volunteerApplications.telegramDisplayName,
          telegramUsername: volunteerApplications.telegramUsername,
          status: volunteerApplications.status,
          createdAt: volunteerApplications.createdAt,
        },
      })
      .from(volunteerApplications)
      .innerJoin(users, eq(volunteerApplications.volunteerId, users.id))
      .leftJoin(
        volunteerReliabilityRatings,
        and(
          eq(volunteerReliabilityRatings.volunteerId, users.id),
          eq(volunteerReliabilityRatings.campaignId, campaignId)
        )
      )
      .where(
        and(
          eq(volunteerApplications.campaignId, campaignId),
          eq(volunteerApplications.status, 'approved'),
          sql`${volunteerReliabilityRatings.id} IS NULL` // Not rated yet
        )
      )
      .orderBy(desc(volunteerApplications.createdAt));

    return volunteers as (User & { application: VolunteerApplication })[];
  }

  async getAllVolunteerReliabilityRatings(): Promise<any[]> {
    const allUsers = alias(users, 'volunteer_users');
    
    const ratings = await db
      .select({
        id: volunteerReliabilityRatings.id,
        raterId: volunteerReliabilityRatings.raterId,
        volunteerId: volunteerReliabilityRatings.volunteerId,
        campaignId: volunteerReliabilityRatings.campaignId,
        volunteerApplicationId: volunteerReliabilityRatings.volunteerApplicationId,
        rating: volunteerReliabilityRatings.rating,
        feedback: volunteerReliabilityRatings.feedback,
        createdAt: volunteerReliabilityRatings.createdAt,
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
          category: campaigns.category,
          status: campaigns.status,
        },
        rater: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
        volunteer: {
          id: allUsers.id,
          firstName: allUsers.firstName,
          lastName: allUsers.lastName,
          email: allUsers.email,
          profileImageUrl: allUsers.profileImageUrl,
        },
      })
      .from(volunteerReliabilityRatings)
      .leftJoin(campaigns, eq(volunteerReliabilityRatings.campaignId, campaigns.id))
      .leftJoin(users, eq(volunteerReliabilityRatings.raterId, users.id))
      .leftJoin(allUsers, eq(volunteerReliabilityRatings.volunteerId, allUsers.id))
      .orderBy(desc(volunteerReliabilityRatings.createdAt));

    return ratings;
  }

  async getReportedVolunteers(): Promise<any[]> {
    // For now, return empty array as we haven't implemented volunteer reports yet
    // This could be extended to include actual volunteer reports in the future
    // The structure would be similar to fraud reports but for volunteers
    return [];
  }

  async getDocumentReports(): Promise<any[]> {
    try {
      // Get all fraud reports related to progress report documents
      // Only include reports that have a document_id (indicating progress report document fraud)
      const allFraudReports = await this.getAllFraudReports();
      const documentReports = allFraudReports.filter((report: any) => 
        // Only include reports that have a document_id (progress report document fraud)
        report.documentId
      );

      return documentReports.map((report: any) => ({
        ...report,
        reportCategory: 'Progress Report Documents',
        severity: 'High' // Progress report fraud is always high severity
      }));
    } catch (error) {
      console.error('Error fetching document reports:', error);
      return [];
    }
  }

  async getCampaignReports(): Promise<any[]> {
    try {
      // Get all fraud reports related to campaigns only
      const allFraudReports = await this.getAllFraudReports();
      
      console.log('🔍 [DEBUG] All fraud reports:', allFraudReports.map(r => ({ id: r.id, relatedType: r.relatedType, reportType: r.reportType })));
      
      const campaignReports = allFraudReports.filter((report: any) => {
        // Only include reports that are explicitly about campaigns
        const isCampaign = report.relatedType === 'campaign';
        console.log(`🔍 [DEBUG] Report ${report.id}: relatedType=${report.relatedType}, isCampaign=${isCampaign}`);
        return isCampaign;
      });

      console.log('🔍 [DEBUG] Filtered campaign reports:', campaignReports.length);      return campaignReports.map((report: any) => ({
        ...report,
        reportCategory: 'Campaign Issues',
        severity: 'High'
      }));
    } catch (error) {
      console.error('Error fetching campaign reports:', error);
      return [];
    }
  }

  async getCreatorReports(): Promise<any[]> {
    try {
      // Get all fraud reports related to creators specifically
      const allFraudReports = await this.getAllFraudReports();
      
      console.log('🔍 [DEBUG] All fraud reports for creators:', allFraudReports.map(r => ({ id: r.id, relatedType: r.relatedType, reportType: r.reportType })));
      
      const creatorReports = allFraudReports.filter((report: any) => {
        // Only include reports that are explicitly about creators
        const isCreator = report.relatedType === 'creator';
        console.log(`🔍 [DEBUG] Report ${report.id}: relatedType=${report.relatedType}, isCreator=${isCreator}`);
        return isCreator;
      });

      console.log('🔍 [DEBUG] Filtered creator reports:', creatorReports.length);      return creatorReports.map((report: any) => ({
        ...report,
        reportCategory: 'Creator Issues',
        severity: 'High'
      }));
    } catch (error) {
      console.error('Error fetching creator reports:', error);
      return [];
    }
  }

  async getTransactionReports(): Promise<any[]> {
    try {
      // Get all fraud reports related to transactions and payments
      const allFraudReports = await this.getAllFraudReports();
      const transactionReports = allFraudReports.filter((report: any) => 
        report.reportType?.toLowerCase().includes('transaction') ||
        report.reportType?.toLowerCase().includes('payment') ||
        report.reportType?.toLowerCase().includes('financial') ||
        report.description?.toLowerCase().includes('payment') ||
        report.description?.toLowerCase().includes('money')
      );

      return transactionReports.map((report: any) => ({
        ...report,
        reportCategory: 'Transaction Issues',
        severity: 'High'
      }));
    } catch (error) {
      console.error('Error fetching transaction reports:', error);
      return [];
    }
  }

  async getUserReports(): Promise<any[]> {
    try {
      // Get all fraud reports related to users
      const allFraudReports = await this.getAllFraudReports();
      const userReports = allFraudReports.filter((report: any) => 
        report.relatedType === 'user' ||
        report.reportType?.toLowerCase().includes('spam') ||
        report.reportType?.toLowerCase().includes('scam') ||
        report.reportType?.toLowerCase().includes('malicious') ||
        report.reportType?.toLowerCase().includes('inappropriate') ||
        report.reportType?.toLowerCase().includes('harassment') ||
        report.reportType?.toLowerCase().includes('abuse')
      );

      return userReports.map((report: any) => ({
        ...report,
        reportCategory: 'User Behavior Issues',
        severity: report.reportType?.toLowerCase().includes('scam') || 
                 report.reportType?.toLowerCase().includes('malicious') ? 'High' : 'Medium'
      }));
    } catch (error) {
      console.error('Error fetching user reports:', error);
      return [];
    }
  }

  // Processed Reports Methods
  async getProcessedDocumentReports(): Promise<any[]> {
    try {
      // Get all fraud reports related to progress report documents that have been processed
      const allFraudReports = await this.getAllFraudReports();
      const processedDocumentReports = allFraudReports.filter((report: any) => 
        report.documentId && 
        (report.status === 'resolved' || report.status === 'closed' || 
         report.status === 'approved' || report.status === 'rejected')
      );

      return processedDocumentReports.map((report: any) => ({
        ...report,
        reportCategory: 'Progress Report Documents',
        severity: 'High',
        resolvedAt: report.updatedAt,
        resolvedBy: report.claimedBy
      }));
    } catch (error) {
      console.error('Error fetching processed document reports:', error);
      return [];
    }
  }

  async getProcessedCampaignReports(): Promise<any[]> {
    try {
      // Get all processed fraud reports related to campaigns only
      const allFraudReports = await this.getAllFraudReports();
      
      const processedCampaignReports = allFraudReports.filter((report: any) => {
        const isCampaignType = report.relatedType === 'campaign';
        const isProcessed = report.status === 'resolved' || report.status === 'closed' || 
                           report.status === 'approved' || report.status === 'rejected';
        const isCreatorRelated = report.relatedType === 'creator';
        const isAutoGenerated = report.description?.includes('Creator flagged for review due to campaign report');
        
        return isCampaignType && isProcessed && !isCreatorRelated && !isAutoGenerated;
      });

      return processedCampaignReports.map((report: any) => ({
        ...report,
        reportCategory: 'Campaign Issues',
        severity: 'High',
        resolvedAt: report.updatedAt,
        resolvedBy: report.claimedBy
      }));
    } catch (error) {
      console.error('Error fetching processed campaign reports:', error);
      return [];
    }
  }

  async getProcessedVolunteerReports(): Promise<any[]> {
    try {
      // Get all volunteer reports that have been processed
      const allVolunteerReports = await db
        .select()
        .from(volunteerReports)
        .where(
          or(
            eq(volunteerReports.status, 'resolved'),
            eq(volunteerReports.status, 'closed'),
            eq(volunteerReports.status, 'approved'),
            eq(volunteerReports.status, 'rejected')
          )
        )
        .orderBy(desc(volunteerReports.updatedAt));

      return allVolunteerReports.map((report: any) => ({
        ...report,
        reportCategory: 'Volunteer Issues',
        severity: 'Medium',
        resolvedAt: report.updatedAt,
        resolvedBy: report.claimedBy
      }));
    } catch (error) {
      console.error('Error fetching processed volunteer reports:', error);
      return [];
    }
  }

  async getProcessedCreatorReports(): Promise<any[]> {
    try {
      // Get all processed fraud reports related to creators specifically
      const allFraudReports = await this.getAllFraudReports();
      
      const processedCreatorReports = allFraudReports.filter((report: any) => {
        const isCreatorType = report.relatedType === 'creator';
        const isProcessed = report.status === 'resolved' || report.status === 'closed' || 
                           report.status === 'approved' || report.status === 'rejected';
        const hasCreatorInReportType = report.reportType?.toLowerCase().includes('creator');
        const hasCreatorInDescription = report.description?.toLowerCase().includes('creator report') || 
                                       report.description?.toLowerCase().includes('scam creator');
        const isAutoGenerated = report.description?.includes('Creator flagged for review due to campaign report');
        
        return (isCreatorType || hasCreatorInReportType || hasCreatorInDescription || isAutoGenerated) && isProcessed;
      });

      return processedCreatorReports.map((report: any) => ({
        ...report,
        reportCategory: 'Creator Issues',
        severity: 'High',
        resolvedAt: report.updatedAt,
        resolvedBy: report.claimedBy
      }));
    } catch (error) {
      console.error('Error fetching processed creator reports:', error);
      return [];
    }
  }

  async getProcessedTransactionReports(): Promise<any[]> {
    try {
      // Get all processed fraud reports related to transactions and payments
      const allFraudReports = await this.getAllFraudReports();
      const processedTransactionReports = allFraudReports.filter((report: any) => {
        const isTransactionType = report.reportType?.toLowerCase().includes('transaction') ||
                                 report.reportType?.toLowerCase().includes('payment') ||
                                 report.reportType?.toLowerCase().includes('financial') ||
                                 report.description?.toLowerCase().includes('payment') ||
                                 report.description?.toLowerCase().includes('money');
        const isProcessed = report.status === 'resolved' || report.status === 'closed' || 
                           report.status === 'approved' || report.status === 'rejected';
        
        return isTransactionType && isProcessed;
      });

      return processedTransactionReports.map((report: any) => ({
        ...report,
        reportCategory: 'Transaction Issues',
        severity: 'High',
        resolvedAt: report.updatedAt,
        resolvedBy: report.claimedBy
      }));
    } catch (error) {
      console.error('Error fetching processed transaction reports:', error);
      return [];
    }
  }

  async getAllVolunteerOpportunitiesForAdmin(): Promise<any[]> {
    try {
      // Get all campaigns that need volunteers with active, on_progress, completed, or closed statuses
      const opportunities = await db
        .select({
          id: campaigns.id,
          title: campaigns.title,
          description: campaigns.description,
          category: campaigns.category,
          status: campaigns.status,
          volunteerSlots: campaigns.volunteerSlots,
          volunteerSlotsFilledCount: campaigns.volunteerSlotsFilledCount,
          needsVolunteers: campaigns.needsVolunteers,
          createdAt: campaigns.createdAt,
          endDate: campaigns.endDate,
          street: campaigns.street,
          city: campaigns.city,
          province: campaigns.province,
          // Creator information
          creatorId: campaigns.creatorId,
          creatorFirstName: users.firstName,
          creatorLastName: users.lastName,
          creatorEmail: users.email,
          creatorProfileImageUrl: users.profileImageUrl,
        })
        .from(campaigns)
        .leftJoin(users, eq(campaigns.creatorId, users.id))
        .where(
          and(
            eq(campaigns.needsVolunteers, true),
            gt(campaigns.volunteerSlots, 0),
            inArray(campaigns.status, ['active', 'on_progress'])
          )
        )
        .orderBy(desc(campaigns.createdAt));

      return opportunities.map(opp => ({
        id: `volunteer-${opp.id}`,
        campaignId: opp.id,
        title: `Volunteer for: ${opp.title}`,
        description: opp.description,
        location: [opp.street, opp.city, opp.province].filter(Boolean).join(', ') || 'Location TBD',
        category: opp.category,
        status: opp.status,
        slotsNeeded: opp.volunteerSlots,
        slotsFilled: opp.volunteerSlotsFilledCount || 0,
        createdAt: opp.createdAt,
        endDate: opp.endDate,
        creator: {
          id: opp.creatorId,
          firstName: opp.creatorFirstName,
          lastName: opp.creatorLastName,
          email: opp.creatorEmail,
          profileImageUrl: opp.creatorProfileImageUrl,
        }
      }));
    } catch (error) {
      console.error('Error fetching all volunteer opportunities for admin:', error);
      return [];
    }
  }

  async getAllVolunteerApplicationsForAdmin(): Promise<any[]> {
    try {
      // Get all volunteer applications with volunteer and campaign details
      const applications = await db
        .select({
          // Application fields
          id: volunteerApplications.id,
          campaignId: volunteerApplications.campaignId,
          opportunityId: volunteerApplications.opportunityId,
          volunteerId: volunteerApplications.volunteerId,
          status: volunteerApplications.status,
          message: volunteerApplications.message,
          intent: volunteerApplications.intent,
          telegramDisplayName: volunteerApplications.telegramDisplayName,
          telegramUsername: volunteerApplications.telegramUsername,
          rejectionReason: volunteerApplications.rejectionReason,
          createdAt: volunteerApplications.createdAt,
          // Volunteer details
          volunteerFirstName: users.firstName,
          volunteerLastName: users.lastName,
          volunteerEmail: users.email,
          volunteerProfileImageUrl: users.profileImageUrl,
          volunteerKycStatus: users.kycStatus,
          volunteerReliabilityScore: users.reliabilityScore,
          // Campaign details
          campaignTitle: campaigns.title,
          campaignDescription: campaigns.description,
          campaignCategory: campaigns.category,
          campaignStatus: campaigns.status,
          campaignStreet: campaigns.street,
          campaignCity: campaigns.city,
          campaignProvince: campaigns.province,
          campaignVolunteerSlots: campaigns.volunteerSlots,
          campaignVolunteerSlotsFilledCount: campaigns.volunteerSlotsFilledCount,
          campaignCreatorId: campaigns.creatorId,
        })
        .from(volunteerApplications)
        .leftJoin(users, eq(volunteerApplications.volunteerId, users.id))
        .leftJoin(campaigns, eq(volunteerApplications.campaignId, campaigns.id))
        .orderBy(desc(volunteerApplications.createdAt));

      return applications.map(app => ({
        id: app.id,
        campaignId: app.campaignId,
        opportunityId: app.opportunityId,
        status: app.status,
        intent: app.intent,
        message: app.message,
        telegramDisplayName: app.telegramDisplayName,
        telegramUsername: app.telegramUsername,
        rejectionReason: app.rejectionReason,
        createdAt: app.createdAt,
        volunteer: {
          id: app.volunteerId,
          name: `${app.volunteerFirstName} ${app.volunteerLastName}`.trim(),
          firstName: app.volunteerFirstName,
          lastName: app.volunteerLastName,
          email: app.volunteerEmail,
          profileImageUrl: app.volunteerProfileImageUrl,
          kycStatus: app.volunteerKycStatus,
          reliabilityScore: app.volunteerReliabilityScore || 0,
        },
        campaign: {
          id: app.campaignId,
          title: app.campaignTitle,
          description: app.campaignDescription,
          category: app.campaignCategory,
          status: app.campaignStatus,
          location: [app.campaignStreet, app.campaignCity, app.campaignProvince].filter(Boolean).join(', ') || 'Location TBD',
          volunteerSlots: app.campaignVolunteerSlots,
          volunteerSlotsFilledCount: app.campaignVolunteerSlotsFilledCount,
          creatorId: app.campaignCreatorId,
        }
      }));
    } catch (error) {
      console.error('Error fetching all volunteer applications for admin:', error);
      return [];
    }
  }

  async getMostPopularVolunteerCampaignsForAdmin(): Promise<any[]> {
    try {
      // Get campaigns with most volunteer applications (highest interest)
      const campaignsWithApplicationCount = await db
        .select({
          // Campaign fields
          id: campaigns.id,
          title: campaigns.title,
          description: campaigns.description,
          category: campaigns.category,
          status: campaigns.status,
          location: campaigns.location,
          volunteerSlots: campaigns.volunteerSlots,
          volunteerSlotsFilledCount: campaigns.volunteerSlotsFilledCount,
          needsVolunteers: campaigns.needsVolunteers,
          createdAt: campaigns.createdAt,
          endDate: campaigns.endDate,
          // Creator details
          creatorId: campaigns.creatorId,
          creatorFirstName: users.firstName,
          creatorLastName: users.lastName,
          creatorEmail: users.email,
          creatorProfileImageUrl: users.profileImageUrl,
          // Application count
          applicationCount: sql<number>`COALESCE(COUNT(${volunteerApplications.id}), 0)`,
        })
        .from(campaigns)
        .leftJoin(users, eq(campaigns.creatorId, users.id))
        .leftJoin(volunteerApplications, eq(campaigns.id, volunteerApplications.campaignId))
        .where(eq(campaigns.needsVolunteers, true)) // Only campaigns that need volunteers
        .groupBy(
          campaigns.id,
          campaigns.title,
          campaigns.description,
          campaigns.category,
          campaigns.status,
          campaigns.location,
          campaigns.volunteerSlots,
          campaigns.volunteerSlotsFilledCount,
          campaigns.needsVolunteers,
          campaigns.createdAt,
          campaigns.endDate,
          campaigns.creatorId,
          users.firstName,
          users.lastName,
          users.email,
          users.profileImageUrl
        )
        .orderBy(desc(sql<number>`COALESCE(COUNT(${volunteerApplications.id}), 0)`))
        .limit(20); // Show top 20 most popular campaigns

      return campaignsWithApplicationCount.map(campaign => ({
        id: `volunteer-${campaign.id}`,
        campaignId: campaign.id,
        title: `Volunteer for: ${campaign.title}`,
        description: campaign.description,
        location: campaign.location || 'Location TBD',
        category: campaign.category,
        status: campaign.status,
        slotsNeeded: campaign.volunteerSlots,
        slotsFilled: campaign.volunteerSlotsFilledCount || 0,
        createdAt: campaign.createdAt,
        endDate: campaign.endDate,
        applicationCount: campaign.applicationCount,
        creator: {
          id: campaign.creatorId,
          firstName: campaign.creatorFirstName,
          lastName: campaign.creatorLastName,
          email: campaign.creatorEmail,
          profileImageUrl: campaign.creatorProfileImageUrl,
        }
      }));
    } catch (error) {
      console.error('Error fetching most popular volunteer campaigns for admin:', error);
      return [];
    }
  }

  // Support Ticket methods
  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    // Generate unique ticket number
    const ticketCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(supportTickets);
    
    const ticketNumber = `TKT-${String(ticketCount[0].count + 1).padStart(4, '0')}`;
    
    const [newTicket] = await db
      .insert(supportTickets)
      .values({
        ...ticket,
        ticketNumber,
      })
      .returning();
    
    return newTicket;
  }

  async getSupportTickets(adminId?: string): Promise<SupportTicket[]> {
    let query = db
      .select({
        id: supportTickets.id,
        ticketNumber: supportTickets.ticketNumber,
        userId: supportTickets.userId,
        subject: supportTickets.subject,
        message: supportTickets.message,
        attachments: supportTickets.attachments,
        status: supportTickets.status,
        priority: supportTickets.priority,
        category: supportTickets.category,
        claimedBy: supportTickets.claimedBy,
        claimedByEmail: supportTickets.claimedByEmail,
        claimedAt: supportTickets.claimedAt,
        resolvedAt: supportTickets.resolvedAt,
        resolutionNotes: supportTickets.resolutionNotes,
        emailSentAt: supportTickets.emailSentAt,
        emailDelivered: supportTickets.emailDelivered,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(supportTickets)
      .leftJoin(users, eq(supportTickets.userId, users.id));

    if (adminId) {
      query = query.where(eq(supportTickets.claimedBy, adminId));
    }

    return await query.orderBy(desc(supportTickets.createdAt));
  }

  async getSupportTicketById(ticketId: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .select({
        id: supportTickets.id,
        ticketNumber: supportTickets.ticketNumber,
        userId: supportTickets.userId,
        subject: supportTickets.subject,
        message: supportTickets.message,
        attachments: supportTickets.attachments,
        status: supportTickets.status,
        priority: supportTickets.priority,
        category: supportTickets.category,
        claimedBy: supportTickets.claimedBy,
        claimedByEmail: supportTickets.claimedByEmail,
        claimedAt: supportTickets.claimedAt,
        resolvedAt: supportTickets.resolvedAt,
        resolutionNotes: supportTickets.resolutionNotes,
        emailSentAt: supportTickets.emailSentAt,
        emailDelivered: supportTickets.emailDelivered,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(supportTickets)
      .leftJoin(users, eq(supportTickets.userId, users.id))
      .where(eq(supportTickets.id, ticketId));

    return ticket;
  }

  async claimSupportTicket(ticketId: string, adminId: string, adminEmail: string): Promise<SupportTicket> {
    // Check if ticket is already claimed
    const existingTicket = await this.getSupportTicketById(ticketId);
    if (!existingTicket) {
      throw new Error('Ticket not found');
    }
    
    if (existingTicket.claimedBy && existingTicket.claimedBy !== adminId) {
      throw new Error('Ticket is already claimed by another admin');
    }

    const [updatedTicket] = await db
      .update(supportTickets)
      .set({
        claimedBy: adminId,
        claimedByEmail: adminEmail,
        claimedAt: new Date(),
        status: 'pending', // Auto-set to pending when claimed
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, ticketId))
      .returning();

    return updatedTicket;
  }

  async updateSupportTicketStatus(
    ticketId: string, 
    status: string, 
    resolutionNotes?: string
  ): Promise<SupportTicket> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = new Date();
    }

    if (resolutionNotes) {
      updateData.resolutionNotes = resolutionNotes;
    }

    const [updatedTicket] = await db
      .update(supportTickets)
      .set(updateData)
      .where(eq(supportTickets.id, ticketId))
      .returning();

    return updatedTicket;
  }

  async getSupportStaff(): Promise<User[]> {
    const supportStaff = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isSupport: users.isSupport,
        isAdmin: users.isAdmin,
      })
      .from(users)
      .where(eq(users.isSupport, true));

    return supportStaff;
  }

  async assignSupportTicket(ticketId: string, assigneeId: string): Promise<SupportTicket> {
    // Check if ticket exists and is not already assigned or claimed
    const existingTicket = await this.getSupportTicketById(ticketId);
    if (!existingTicket) {
      throw new Error('Ticket not found');
    }
    
    if (existingTicket.assignedTo) {
      throw new Error('Ticket is already assigned to another staff member');
    }

    if (existingTicket.claimedBy) {
      throw new Error('Ticket is already claimed. Cannot assign a claimed ticket.');
    }

    // Verify the assignee is a support staff member
    const assignee = await this.getUser(assigneeId);
    if (!assignee?.isSupport) {
      throw new Error('Assignee must be a support staff member');
    }

    const [updatedTicket] = await db
      .update(supportTickets)
      .set({
        assignedTo: assigneeId,
        assignedByAdmin: assigneeId, // TODO: This should be the admin ID from the request context
        assignedAt: new Date(),
        status: 'pending', // Auto-set to pending when assigned
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, ticketId))
      .returning();

    return updatedTicket;
  }

  async updateSupportTicketAssignedBy(ticketId: string, adminId: string): Promise<void> {
    await db
      .update(supportTickets)
      .set({
        assignedByAdmin: adminId,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, ticketId));
  }

  async updateSupportTicketEmailStatus(ticketId: string, emailDelivered: boolean): Promise<void> {
    await db
      .update(supportTickets)
      .set({
        emailSentAt: new Date(),
        emailDelivered,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, ticketId));
  }

  async getUserSupportTickets(userId: string): Promise<SupportTicket[]> {
    return await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.createdAt));
  }

  async getSupportTicketAnalytics(): Promise<{
    total: number;
    open: number;
    claimed: number;
    resolved: number;
    byPriority: { priority: string; count: number }[];
    byCategory: { category: string; count: number }[];
  }> {
    // Total tickets
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(supportTickets);

    // Tickets by status
    const statusCounts = await db
      .select({
        status: supportTickets.status,
        count: sql<number>`count(*)`,
      })
      .from(supportTickets)
      .groupBy(supportTickets.status);

    // Tickets by priority
    const priorityCounts = await db
      .select({
        priority: supportTickets.priority,
        count: sql<number>`count(*)`,
      })
      .from(supportTickets)
      .groupBy(supportTickets.priority);

    // Tickets by category
    const categoryCounts = await db
      .select({
        category: supportTickets.category,
        count: sql<number>`count(*)`,
      })
      .from(supportTickets)
      .groupBy(supportTickets.category);

    const total = totalResult[0]?.count || 0;
    const open = statusCounts.find(s => s.status === 'open')?.count || 0;
    const claimed = statusCounts.find(s => s.status === 'claimed')?.count || 0;
    const resolved = statusCounts.find(s => ['resolved', 'closed'].includes(s.status || ''))?.count || 0;

    return {
      total,
      open,
      claimed,
      resolved,
      byPriority: priorityCounts.map(p => ({ priority: p.priority || 'unknown', count: p.count })),
      byCategory: categoryCounts.map(c => ({ category: c.category || 'unknown', count: c.count })),
    };
  }

  // ID Assignment Methods
  async assignDisplayIdsToExistingRecords(): Promise<void> {
    try {
      console.log('🆔 Starting ID assignment process...');
      
      // Assign User Display IDs
      const usersWithoutDisplayId = await db
        .select()
        .from(users)
        .where(isNull(users.userDisplayId));
      
      console.log(`Found ${usersWithoutDisplayId.length} users without display IDs`);
      
      for (const user of usersWithoutDisplayId) {
        const displayId = await generateUniqueUserDisplayId();
        await db
          .update(users)
          .set({ userDisplayId: displayId })
          .where(eq(users.id, user.id));
        console.log(`✅ Assigned user ID ${displayId} to user ${user.email}`);
      }
      
      // Assign Transaction Display IDs
      const transactionsWithoutDisplayId = await db
        .select()
        .from(transactions)
        .where(isNull(transactions.transactionDisplayId));
      
      console.log(`Found ${transactionsWithoutDisplayId.length} transactions without display IDs`);
      
      for (const transaction of transactionsWithoutDisplayId) {
        const displayId = await generateUniqueTransactionDisplayId();
        await db
          .update(transactions)
          .set({ transactionDisplayId: displayId })
          .where(eq(transactions.id, transaction.id));
        console.log(`✅ Assigned transaction ID ${displayId} to transaction ${transaction.id}`);
      }
      
      // Assign Document Display IDs
      const documentsWithoutDisplayId = await db
        .select()
        .from(progressReportDocuments)
        .where(isNull(progressReportDocuments.documentDisplayId));
      
      console.log(`Found ${documentsWithoutDisplayId.length} documents without display IDs`);
      
      for (const document of documentsWithoutDisplayId) {
        const displayId = await generateUniqueDocumentDisplayId();
        await db
          .update(progressReportDocuments)
          .set({ documentDisplayId: displayId })
          .where(eq(progressReportDocuments.id, document.id));
        console.log(`✅ Assigned document ID ${displayId} to document ${document.fileName}`);
      }
      
      // Assign Campaign Display IDs
      const campaignsWithoutDisplayId = await db
        .select()
        .from(campaigns)
        .where(isNull(campaigns.campaignDisplayId));
      
      console.log(`Found ${campaignsWithoutDisplayId.length} campaigns without display IDs`);
      
      for (const campaign of campaignsWithoutDisplayId) {
        const displayId = await generateUniqueCampaignDisplayId();
        await db
          .update(campaigns)
          .set({ campaignDisplayId: displayId })
          .where(eq(campaigns.id, campaign.id));
        console.log(`✅ Assigned campaign ID ${displayId} to campaign ${campaign.title}`);
      }
      
      console.log('🎉 ID assignment process completed successfully!');
    } catch (error) {
      console.error('❌ Error during ID assignment process:', error);
      throw error;
    }
  }

  // Email ticket operations for Admin Tickets tab
  async getEmailTickets(): Promise<SupportEmailTicket[]> {
    return await db
      .select()
      .from(supportEmailTickets)
      .orderBy(desc(supportEmailTickets.emailReceivedAt));
  }

  async createEmailTicket(ticketData: InsertSupportEmailTicket): Promise<SupportEmailTicket> {
    // Generate ticket number
    const ticketNumber = await generateUniqueEmailTicketNumber();
    
    const [ticket] = await db
      .insert(supportEmailTickets)
      .values({
        ...ticketData,
        ticketNumber,
      })
      .returning();
    return ticket;
  }

  async claimEmailTicket(ticketId: string, staffId: string, staffEmail: string): Promise<void> {
    await db
      .update(supportEmailTickets)
      .set({
        status: "claimed",
        claimedBy: staffId,
        claimedByEmail: staffEmail,
        dateClaimed: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supportEmailTickets.id, ticketId));
  }

  async assignEmailTicket(ticketId: string, assignedToId: string, adminId: string): Promise<void> {
    await db
      .update(supportEmailTickets)
      .set({
        status: "assigned",
        assignedTo: assignedToId,
        assignedByAdmin: adminId,
        dateAssigned: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supportEmailTickets.id, ticketId));
  }

  async resolveEmailTicket(ticketId: string, resolutionNotes?: string): Promise<void> {
    await db
      .update(supportEmailTickets)
      .set({
        status: "resolved",
        dateResolved: new Date(),
        resolutionNotes,
        updatedAt: new Date(),
      })
      .where(eq(supportEmailTickets.id, ticketId));
  }

  // ================== PUBLICATIONS METHODS ==================

  // Create a new story
  async createStory(storyData: InsertStory): Promise<Story> {
    console.log('📝 Creating story:', storyData.title);
    try {
      // Generate slug from title if not provided
      if (!storyData.slug) {
        storyData.slug = storyData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .substring(0, 50);
      }

      // Set publishedAt if status is published
      if (storyData.status === 'published' && !storyData.publishedAt) {
        storyData.publishedAt = new Date();
      }

      const [story] = await db
        .insert(stories)
        .values(storyData)
        .returning();
      
      console.log('✅ Story created successfully:', story.id);
      return story;
    } catch (error) {
      console.error('❌ Error creating story:', error);
      throw error;
    }
  }

  // Update an existing story
  async updateStory(id: string, updates: Partial<InsertStory>): Promise<Story | null> {
    console.log('📝 Updating story:', id);
    try {
      // Set publishedAt if status is being changed to published
      if (updates.status === 'published') {
        const currentStory = await this.getStory(id);
        if (currentStory && !currentStory.publishedAt) {
          updates.publishedAt = new Date();
        }
      }

      const [story] = await db
        .update(stories)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(stories.id, id))
        .returning();
      
      return story || null;
    } catch (error) {
      console.error('❌ Error updating story:', error);
      throw error;
    }
  }

  // Get a single publication by ID
  async getStory(id: string): Promise<Story | null> {
    try {
      const [publication] = await db
        .select()
        .from(stories)
        .where(eq(stories.id, id));
      
      return publication || null;
    } catch (error) {
      console.error('❌ Error getting publication:', error);
      throw error;
    }
  }

  // Get a publication by slug
  async getPublicationBySlug(slug: string): Promise<Story | null> {
    try {
      const [publication] = await db
        .select()
        .from(stories)
        .where(eq(stories.slug, slug));
      
      return publication || null;
    } catch (error) {
      console.error('❌ Error getting publication by slug:', error);
      throw error;
    }
  }

  // Get all stories with filters
  async getStories(filters?: {
    status?: string;
    authorId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Story[]> {
    try {
      let query = db
        .select()
        .from(stories)
        .orderBy(desc(stories.createdAt));

      // Apply filters
      if (filters?.status) {
        query = query.where(eq(stories.status, filters.status));
      }
      if (filters?.authorId) {
        query = query.where(eq(stories.authorId, filters.authorId));
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.offset(filters.offset);
      }

      return await query;
    } catch (error) {
      console.error('❌ Error getting stories:', error);
      throw error;
    }
  }

  // Get published stories for public display
  async getPublishedStories(limit = 10, offset = 0): Promise<Story[]> {
    try {
      return await db
        .select({
          id: stories.id,
          title: stories.title,
          body: stories.body,
          excerpt: stories.excerpt,
          coverImageUrl: stories.coverImageUrl,
          coverVideoUrl: stories.coverVideoUrl,
          authorId: stories.authorId,
          status: stories.status,
          publishedAt: stories.publishedAt,
          viewCount: stories.viewCount,
          tags: stories.tags,
          metaDescription: stories.metaDescription,
          createdAt: stories.createdAt,
          updatedAt: stories.updatedAt,
        })
        .from(stories)
        .where(eq(stories.status, 'published'))
        .orderBy(desc(stories.publishedAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error('❌ Error getting published stories:', error);
      throw error;
    }
  }

  // Get publication statistics by author
  async getStoryStatsByAuthor(): Promise<any[]> {
    try {
      return await db
        .select({
          authorId: stories.authorId,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          publishedCount: sql<number>`count(case when ${stories.status} = 'published' then 1 end)`,
          totalCount: sql<number>`count(*)`,
          totalViews: sql<number>`sum(${stories.viewCount})`,
          totalReacts: sql<number>`sum(${stories.reactCount})`,
        })
        .from(stories)
        .leftJoin(users, eq(stories.authorId, users.id))
        .groupBy(stories.authorId, users.firstName, users.lastName, users.email);
    } catch (error) {
      console.error('❌ Error getting publication stats by author:', error);
      throw error;
    }
  }

  // Delete a publication
  async deleteStory(id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(stories)
        .where(eq(stories.id, id));
      
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('❌ Error deleting publication:', error);
      throw error;
    }
  }

  // ================== PUBLICATION REACTIONS ==================

  // Add or remove reaction to a publication
  async togglePublicationReaction(
    storyId: string, 
    userId: string, 
    reactionType = 'like'
  ): Promise<{ added: boolean; count: number }> {
    try {
      // Check if reaction already exists
      const [existingReaction] = await db
        .select()
        .from(storyReactions)
        .where(
          and(
            eq(storyReactions.storyId, storyId),
            eq(storyReactions.userId, userId)
          )
        );

      let added = false;
      if (existingReaction) {
        // Remove existing reaction
        await db
          .delete(storyReactions)
          .where(eq(storyReactions.id, existingReaction.id));
      } else {
        // Add new reaction
        await db
          .insert(storyReactions)
          .values({
            storyId,
            userId,
            reactionType,
          });
        added = true;
      }

      // Update reaction count on publication
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(storyReactions)
        .where(eq(storyReactions.storyId, storyId));

      const count = countResult?.count || 0;
      
      // Update the publication's react count
      await db
        .update(stories)
        .set({ reactCount: count })
        .where(eq(stories.id, storyId));

      return { added, count };
    } catch (error) {
      console.error('❌ Error toggling publication reaction:', error);
      throw error;
    }
  }

  // ================== PUBLICATION COMMENTS ==================

  // Add a comment to a publication
  async addPublicationComment(commentData: InsertStoryComment): Promise<StoryComment> {
    try {
      const [comment] = await db
        .insert(storyComments)
        .values(commentData)
        .returning();

      // Update comment count on publication
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(storyComments)
        .where(eq(storyComments.storyId, commentData.storyId));

      const count = countResult?.count || 0;
      
      await db
        .update(stories)
        .set({ commentCount: count })
        .where(eq(stories.id, commentData.storyId));

      return comment;
    } catch (error) {
      console.error('❌ Error adding publication comment:', error);
      throw error;
    }
  }

  // Get comments for a publication
  async getPublicationComments(storyId: string): Promise<any[]> {
    try {
      return await db
        .select({
            id: storyComments.id,
            content: storyComments.content,
            createdAt: storyComments.createdAt,
            userId: storyComments.userId,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        })
          .from(storyComments)
          .leftJoin(users, eq(storyComments.userId, users.id))
        .where(
          and(
              eq(storyComments.storyId, storyId),
              eq(storyComments.isApproved, true)
          )
        )
          .orderBy(desc(storyComments.createdAt));
    } catch (error) {
      console.error('❌ Error getting publication comments:', error);
      throw error;
    }
  }

  // ================== PUBLICATION SHARES ==================

  // Track a publication share
  async trackStoryShare(shareData: InsertStoryShare): Promise<StoryShare> {
    try {
      const [share] = await db
        .insert(storyShares)
        .values(shareData)
        .returning();

      // Update share count on story
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(storyShares)
        .where(eq(storyShares.storyId, shareData.storyId));

      const count = countResult?.count || 0;
      
      await db
        .update(stories)
        .set({ shareCount: count })
        .where(eq(stories.id, shareData.storyId));

      return share;
    } catch (error) {
      console.error('❌ Error tracking publication share:', error);
      throw error;
    }
  }

  // Increment view count for a publication
  async incrementStoryViewCount(storyId: string): Promise<void> {
    try {
      await db
        .update(stories)
        .set({ 
          viewCount: sql`${stories.viewCount} + 1` 
        })
        .where(eq(stories.id, storyId));
    } catch (error) {
      console.error('❌ Error incrementing publication view count:', error);
      throw error;
    }
  }

  // Admin Staff Profile Methods
  async getStaffMilestones(staffId: string): Promise<any> {
    try {
      // Get first KYC verification by this staff member
      const firstKyc = await db
        .select({ createdAt: users.createdAt })
        .from(users)
        .where(and(eq(users.kycVerifiedBy, staffId), eq(users.isKycVerified, true)))
        .orderBy(users.createdAt)
        .limit(1);

      // Get first creator report by this staff member
      const firstCreatorReport = await db
        .select({ createdAt: fraudReports.createdAt })
        .from(fraudReports)
        .where(and(eq(fraudReports.reviewedBy, staffId), eq(fraudReports.reportType, 'Creator Report')))
        .orderBy(fraudReports.createdAt)
        .limit(1);

      return {
        firstKycVerified: firstKyc[0]?.createdAt?.toISOString(),
        firstCreatorReport: firstCreatorReport[0]?.createdAt?.toISOString(),
      };
    } catch (error) {
      console.error('Error getting staff milestones:', error);
      return {};
    }
  }

  async getStaffAnalytics(staffId: string): Promise<any> {
    try {
      // Get verified users by this staff member
      const verifiedUsersResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.kycVerifiedBy, staffId), eq(users.isKycVerified, true)));

      // Get reports handled by this staff member
      const reportsResult = await db
        .select({
          reportType: fraudReports.reportType,
          count: sql<number>`count(*)`
        })
        .from(fraudReports)
        .where(eq(fraudReports.reviewedBy, staffId))
        .groupBy(fraudReports.reportType);

      // Get suspended accounts by this staff member
      const suspendedResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.suspendedBy, staffId), eq(users.isSuspended, true)));

      const reportCounts = reportsResult.reduce((acc, curr) => {
        if (curr.reportType === 'volunteer') acc.volunteerReports = curr.count;
        else if (curr.reportType === 'Creator Report') acc.creatorReports = curr.count;
        else if (curr.reportType === 'user') acc.userReports = curr.count;
        else if (curr.reportType === 'fraud') acc.fraudReports = curr.count;
        return acc;
      }, { volunteerReports: 0, creatorReports: 0, userReports: 0, fraudReports: 0 });

      return {
        verifiedUsers: verifiedUsersResult[0]?.count || 0,
        ...reportCounts,
        suspendedAccounts: suspendedResult[0]?.count || 0,
        deposits: 0,
        withdrawals: 0,
        contributions: 0,
        claimedContributions: 0,
        claimedTips: 0
      };
    } catch (error) {
      console.error('Error getting staff analytics:', error);
      return {};
    }
  }

  async getKycEvaluationsLeaderboard(): Promise<any[]> {
    try {
      const leaderboard = await db
        .select({
          userId: users.kycVerifiedBy,
          name: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
          email: users.email,
          count: sql<number>`count(*)`
        })
        .from(users)
        .where(and(isNotNull(users.kycVerifiedBy), eq(users.isKycVerified, true)))
        .groupBy(users.kycVerifiedBy, users.firstName, users.lastName, users.email)
        .orderBy(desc(sql<number>`count(*)`))
        .limit(10);

      return leaderboard.map(entry => ({
        userId: entry.userId,
        name: entry.name,
        email: entry.email,
        count: entry.count
      }));
    } catch (error) {
      console.error('Error getting KYC evaluations leaderboard:', error);
      return [];
    }
  }

  async getReportsAccommodatedLeaderboard(): Promise<any[]> {
    try {
      const leaderboard = await db
        .select({
          userId: fraudReports.reviewedBy,
          count: sql<number>`count(*)`
        })
        .from(fraudReports)
        .where(isNotNull(fraudReports.reviewedBy))
        .groupBy(fraudReports.reviewedBy)
        .orderBy(desc(sql<number>`count(*)`))
        .limit(10);

      // Get user details for each staff member
      const enrichedLeaderboard = await Promise.all(
        leaderboard.map(async (entry) => {
          if (!entry.userId) return { userId: '', name: 'Unknown', email: 'Unknown', count: entry.count };
          
          const user = await this.getUser(entry.userId);
          return {
            userId: entry.userId,
            name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
            email: user?.email || 'Unknown',
            count: entry.count
          };
        })
      );

      return enrichedLeaderboard;
    } catch (error) {
      console.error('Error getting reports accommodated leaderboard:', error);
      return [];
    }
  }

  async getFastestResolveLeaderboard(): Promise<any[]> {
    try {
      const leaderboard = await db
        .select({
          userId: supportTickets.resolvedBy,
          avgTimeHours: sql<number>`avg(extract(epoch from (${supportTickets.resolvedAt} - ${supportTickets.createdAt})) / 3600)`,
          count: sql<number>`count(*)`
        })
        .from(supportTickets)
        .where(and(isNotNull(supportTickets.resolvedBy), isNotNull(supportTickets.resolvedAt)))
        .groupBy(supportTickets.resolvedBy)
        .having(sql`count(*) >= 5`)
        .orderBy(sql<number>`avg(extract(epoch from (${supportTickets.resolvedAt} - ${supportTickets.createdAt})) / 3600)`)
        .limit(10);

      // Get user details for each staff member
      const enrichedLeaderboard = await Promise.all(
        leaderboard.map(async (entry) => {
          if (!entry.userId) return { 
            userId: '', 
            name: 'Unknown', 
            email: 'Unknown', 
            count: entry.count, 
            avgTime: entry.avgTimeHours 
          };
          
          const user = await this.getUser(entry.userId);
          return {
            userId: entry.userId,
            name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
            email: user?.email || 'Unknown',
            count: entry.count,
            avgTime: entry.avgTimeHours
          };
        })
      );

      return enrichedLeaderboard;
    } catch (error) {
      console.error('Error getting fastest resolve leaderboard:', error);
      return [];
    }
  }

  async trackPublicationShare(data: any): Promise<any> {
    // Mock implementation for now
    return { success: true };
  }

  // Standardized ID search methods
  async getUserByDisplayId(displayId: string): Promise<User | null> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.userDisplayId, displayId))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching user by display ID:', error);
      return null;
    }
  }

  async getCampaignByDisplayId(displayId: string): Promise<Campaign | null> {
    try {
      const result = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.campaignDisplayId, displayId))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching campaign by display ID:', error);
      return null;
    }
  }

  async getTransactionByDisplayId(displayId: string): Promise<Transaction | null> {
    try {
      const result = await db
        .select()
        .from(transactions)
        .where(eq(transactions.transactionDisplayId, displayId))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching transaction by display ID:', error);
      return null;
    }
  }

  async getDocumentByDisplayId(displayId: string): Promise<ProgressReportDocument | null> {
    try {
      const result = await db
        .select()
        .from(progressReportDocuments)
        .where(eq(progressReportDocuments.documentDisplayId, displayId))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching document by display ID:', error);
      return null;
    }
  }

  async getTicketByNumber(displayId: string): Promise<SupportTicket | SupportEmailTicket | null> {
    try {
      // Try support tickets first
      const ticketResult = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.ticketNumber, displayId))
        .limit(1);
      
      if (ticketResult[0]) {
        return ticketResult[0];
      }

      // Try email tickets
      const emailTicketResult = await db
        .select()
        .from(supportEmailTickets)
        .where(eq(supportEmailTickets.ticketNumber, displayId))
        .limit(1);
      
      return emailTicketResult[0] || null;
    } catch (error) {
      console.error('Error fetching ticket by number:', error);
      return null;
    }
  }

  async getCampaignSlotInfo(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) { throw new Error('User not found'); }

    const avgCreditScore = await this.getUserAverageCreditScore(userId);
    
    // Get ALL campaigns for this user (same logic as Analytics card)
    const allUserCampaigns = await this.getCampaignsByCreator(userId);
    const totalCampaignsCreated = allUserCampaigns.length;
    
    // Find the first campaign ever created by this user
    const firstCampaign = allUserCampaigns.length > 0 ? allUserCampaigns[allUserCampaigns.length - 1] : null;
    
    let daysUntilReset = 0;
    let isFirstMonth = false;
    let freeCampaign = 3; // Default free campaign slots for new users
    
    if (firstCampaign) {
      const now = new Date();
      const firstCampaignDate = new Date(firstCampaign.createdAt);
      const daysSinceFirstCampaign = Math.floor((now.getTime() - firstCampaignDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate days in current 30-day cycle
      const daysInCurrentCycle = daysSinceFirstCampaign % 30;
      daysUntilReset = 30 - daysInCurrentCycle;
      
      // Check if still in first month (first 30 days)
      isFirstMonth = daysSinceFirstCampaign < 30;
      
      if (isFirstMonth) {
        // In first month: freeCampaign starts at 3, deduct based on operational campaigns
        freeCampaign = 3;
        
        // Count campaigns that have reached operational amount
        const operationalCampaigns = allUserCampaigns.filter(campaign => 
          parseFloat(campaign.currentAmount) >= parseFloat(campaign.minimumAmount)
        );
        
        // Deduct from freeCampaign based on operational campaigns
        freeCampaign = Math.max(0, 3 - operationalCampaigns.length);
      } else {
        // After first month: apply credit score restrictions
        freeCampaign = 0; // No more free slots
      }
    } else {
      // No campaigns yet: full 3 free slots available, countdown hasn't started
      isFirstMonth = true;
      daysUntilReset = 30; // Show 30 days since countdown hasn't started yet
      freeCampaign = 3;
    }

    // Get or create monthly limit record
    const monthlyRecord = await this.getMonthlyLimitRecord(userId);
    
    let maxAllowed = 0;
    let paidSlotsAvailable = 0;
    let paidSlotPrice = 0;
    
    if (isFirstMonth) {
      // First month: use freeCampaign system
      maxAllowed = freeCampaign;
      paidSlotsAvailable = 0;
      paidSlotPrice = 0;
    } else {
      // After first month: apply credit score tiers
      if (avgCreditScore >= 80) { maxAllowed = 5; paidSlotsAvailable = 0; paidSlotPrice = 0; }
      else if (avgCreditScore >= 75) { maxAllowed = 3; paidSlotsAvailable = 0; paidSlotPrice = 0; }
      else if (avgCreditScore >= 65) { maxAllowed = 1; paidSlotsAvailable = 0; paidSlotPrice = 0; }
      else if (avgCreditScore >= 50) { maxAllowed = 0; paidSlotsAvailable = 3; paidSlotPrice = 9000; }
      else if (avgCreditScore >= 35) { maxAllowed = 0; paidSlotsAvailable = 2; paidSlotPrice = 6000; }
      else if (avgCreditScore >= 20) { maxAllowed = 0; paidSlotsAvailable = 1; paidSlotPrice = 3000; }
      else { maxAllowed = 0; paidSlotsAvailable = 0; paidSlotPrice = 0; }
    }

    // Calculate remaining slots
    const slotsRemaining = Math.max(0, maxAllowed - monthlyRecord.campaignsCreated);
    
    // Next tier information
    let nextTierInfo = null;
          if (avgCreditScore < 80) {
        if (avgCreditScore < 75) { nextTierInfo = { nextTier: '75%', message: 'Reach 75% credit score for 3 free slots/month', requiredScore: 75 }; }
        else if (avgCreditScore < 80) { nextTierInfo = { nextTier: '80%', message: 'Reach 80% credit score for 5 free slots/month', requiredScore: 80 }; }
      }

    return {
      userId, 
      creditScore: avgCreditScore, 
      isFirstMonth, 
      daysUntilReset, 
      maxAllowed,
      freeCampaign, // New field for free campaign slots
      campaignsCreated: monthlyRecord.campaignsCreated, 
      totalCampaignsCreated: totalCampaignsCreated, // Total campaigns ever created
      slotsRemaining, 
      paidSlotsAvailable, 
      paidSlotPrice,
      nextTierInfo, 
      firstCampaignDate: firstCampaign?.createdAt || null, 
      hasOperationalCampaign: allUserCampaigns.some(c => parseFloat(c.currentAmount) >= parseFloat(c.minimumAmount))
    };
  }

  async getMonthlyLimitRecord(userId: string): Promise<any> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    const [existing] = await db.select()
      .from(monthlyCampaignLimits)
      .where(and(
        eq(monthlyCampaignLimits.userId, userId),
        eq(monthlyCampaignLimits.year, year),
        eq(monthlyCampaignLimits.month, month)
      ))
      .limit(1);
    
    if (existing) { return existing; }
    
    const avgCreditScore = await this.getUserAverageCreditScore(userId);
    
    // Count existing campaigns for this user in the current month
    const existingCampaigns = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(and(
        eq(campaigns.creatorId, userId),
        sql`EXTRACT(YEAR FROM ${campaigns.createdAt}) = ${year}`,
        sql`EXTRACT(MONTH FROM ${campaigns.createdAt}) = ${month}`
      ));
    
    const campaignsCreated = existingCampaigns.length;
    
    // Default values for new campaign slot system
    let maxAllowed = 3; // Default 3 free slots for all users
    let paidSlotsAvailable = 0;
    let paidSlotPrice = 0;
    let isFirstMonth = false;
    
    // Check if user has any campaigns to determine first month status
    const allUserCampaigns = await this.getCampaignsByCreator(userId);
    if (allUserCampaigns.length > 0) {
      const firstCampaign = allUserCampaigns[allUserCampaigns.length - 1]; // Oldest campaign
      const now = new Date();
      const firstCampaignDate = new Date(firstCampaign.createdAt);
      const daysSinceFirstCampaign = Math.floor((now.getTime() - firstCampaignDate.getTime()) / (1000 * 60 * 60 * 24));
      isFirstMonth = daysSinceFirstCampaign < 30;
      
      if (isFirstMonth) {
        // Still in first month - give 3 free slots regardless of credit score
        maxAllowed = 3;
        paidSlotsAvailable = 0;
        paidSlotPrice = 0;
      } else {
        // First month ended, apply credit score tiers
        if (avgCreditScore >= 80) { maxAllowed = 5; paidSlotsAvailable = 0; paidSlotPrice = 0; }
        else if (avgCreditScore >= 75) { maxAllowed = 3; paidSlotsAvailable = 0; paidSlotPrice = 0; }
        else if (avgCreditScore >= 65) { maxAllowed = 1; paidSlotsAvailable = 0; paidSlotPrice = 0; }
        else if (avgCreditScore >= 50) { maxAllowed = 0; paidSlotsAvailable = 3; paidSlotPrice = 9000; }
        else if (avgCreditScore >= 35) { maxAllowed = 0; paidSlotsAvailable = 2; paidSlotPrice = 6000; }
        else if (avgCreditScore >= 20) { maxAllowed = 0; paidSlotsAvailable = 1; paidSlotPrice = 3000; }
        else { maxAllowed = 0; paidSlotsAvailable = 0; paidSlotPrice = 0; }
      }
    } else {
      // No campaigns yet: show 3 free slots but no countdown
      isFirstMonth = true;
      paidSlotsAvailable = 0;
      paidSlotPrice = 0;
    }
    
    try {
      const [newRecord] = await db.insert(monthlyCampaignLimits)
        .values({
          userId, year, month, campaignsCreated, maxAllowed, creditScoreAtMonth: avgCreditScore,
          paidSlotsAvailable, paidSlotPrice, isFirstMonth,
        })
        .returning();
      return newRecord;
    } catch (error) {
      // Fallback to old schema if new columns don't exist yet
      const [newRecord] = await db.insert(monthlyCampaignLimits)
        .values({
          userId, year, month, campaignsCreated, maxAllowed, creditScoreAtMonth: avgCreditScore,
        })
        .returning();
      return newRecord;
    }
  }
}

// Helper function to generate unique email ticket numbers
async function generateUniqueEmailTicketNumber(): Promise<string> {
  try {
    const prefix = 'TKT';
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const randomNum = Math.floor(Math.random() * 9000 + 1000).toString(); // 4-digit number
      const ticketNumber = `${prefix}-${randomNum}`;

      // Check both support tickets and email tickets to ensure uniqueness
      const existingTicket = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.ticketNumber, ticketNumber))
        .limit(1);

      const existingEmailTicket = await db
        .select()
        .from(supportEmailTickets)
        .where(eq(supportEmailTickets.ticketNumber, ticketNumber))
        .limit(1);

      if (existingTicket.length === 0 && existingEmailTicket.length === 0) {
        return ticketNumber;
      }

      attempts++;
    }

    throw new Error('Unable to generate unique email ticket number after maximum attempts');
  } catch (error) {
    console.error('❌ Error generating email ticket number:', error);
    throw error;
  }
}

export const storage = new DatabaseStorage();
