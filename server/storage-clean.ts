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
import { eq, desc, sql, and, or, not, gt, lt, inArray, isNull, isNotNull, asc } from "drizzle-orm";
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
}

async function generateUniqueTransactionDisplayId(): Promise<string> {
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

// Database Storage Class
class DatabaseStorage {
  // User Management Methods
  async getUser(userId: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user || null;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(userId: string, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
    return user;
  }

  // Campaign Management Methods
  async createCampaign(campaignData: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db.insert(campaigns).values(campaignData).returning();
    return campaign;
  }

  async getCampaign(campaignId: string): Promise<Campaign | null> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    return campaign || null;
  }

  async updateCampaign(campaignId: string, updates: Partial<InsertCampaign>): Promise<Campaign> {
    const [campaign] = await db.update(campaigns).set(updates).where(eq(campaigns.id, campaignId)).returning();
    return campaign;
  }

  // Campaign Slot System Methods - CORRECTED VERSION
  async getUserFirstCampaign(userId: string): Promise<any | null> {
    // Get the first campaign created by the user that achieved operational funding
    const [firstCampaign] = await db
      .select({
        id: campaigns.id,
        createdAt: campaigns.createdAt,
        currentAmount: campaigns.currentAmount,
        minimumAmount: campaigns.minimumAmount,
      })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.creatorId, userId),
          sql`${campaigns.currentAmount} >= ${campaigns.minimumAmount}`
        )
      )
      .orderBy(asc(campaigns.createdAt))
      .limit(1);
    
    return firstCampaign || null;
  }

  async getCampaignSlotInfo(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const avgCreditScore = await this.getUserAverageCreditScore(userId);
    const firstCampaign = await this.getUserFirstCampaign(userId);
    
    // Calculate days until reset and first month status
    let daysUntilReset = 0;
    let isFirstMonth = false;
    
    if (firstCampaign) {
      // Calculate days since first operational campaign
      const now = new Date();
      const firstCampaignDate = new Date(firstCampaign.createdAt);
      const daysSinceFirstCampaign = Math.floor((now.getTime() - firstCampaignDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate days until next 30-day cycle reset
      const daysInCurrentCycle = daysSinceFirstCampaign % 30;
      daysUntilReset = 30 - daysInCurrentCycle;
      
      // Check if still in first month (first 30 days from operational campaign)
      isFirstMonth = daysSinceFirstCampaign < 30;
    } else {
      // No operational campaign yet - show 3 free slots but no countdown
      isFirstMonth = true;
      daysUntilReset = 0;
    }

    // Get current month's record
    const monthlyRecord = await this.getMonthlyLimitRecord(userId);
    
    // Calculate available slots based on CORRECTED logic
    let maxAllowed = 3; // Default 3 free slots for all users
    let paidSlotsAvailable = 0;
    let paidSlotPrice = 0;
    
    if (firstCampaign) {
      // Check if still in first month (first 30 days from operational campaign)
      const now = new Date();
      const firstCampaignDate = new Date(firstCampaign.createdAt);
      const daysSinceFirstCampaign = Math.floor((now.getTime() - firstCampaignDate.getTime()) / (1000 * 60 * 60 * 24));
      const isInFirstMonth = daysSinceFirstCampaign < 30;
      
      if (isInFirstMonth) {
        // Still in first month - give 3 free slots regardless of credit score
        maxAllowed = 3;
        paidSlotsAvailable = 0;
        paidSlotPrice = 0;
      } else {
        // First month ended, apply credit score tiers
        if (avgCreditScore >= 80) {
          maxAllowed = 5; // 80-100%: 5 slots
          paidSlotsAvailable = 0;
          paidSlotPrice = 0;
        } else if (avgCreditScore >= 75) {
          maxAllowed = 3; // 75-79%: 3 slots
          paidSlotsAvailable = 0;
          paidSlotPrice = 0;
        } else if (avgCreditScore >= 65) {
          maxAllowed = 1; // 65-74%: 1 slot
          paidSlotsAvailable = 0;
          paidSlotPrice = 0;
        } else if (avgCreditScore >= 50) {
          maxAllowed = 0; // 50-64%: 0 slots, but can buy up to 3
          paidSlotsAvailable = 3;
          paidSlotPrice = 9000;
        } else if (avgCreditScore >= 35) {
          maxAllowed = 0; // 35-49%: 0 slots, but can buy up to 2
          paidSlotsAvailable = 2;
          paidSlotPrice = 6000;
        } else if (avgCreditScore >= 20) {
          maxAllowed = 0; // 20-34%: 0 slots, but can buy 1
          paidSlotsAvailable = 1;
          paidSlotPrice = 3000;
        } else {
          maxAllowed = 0; // <20%: 0 slots, cannot buy
          paidSlotsAvailable = 0;
          paidSlotPrice = 0;
        }
      }
    }

    // Calculate slots remaining
    const slotsRemaining = Math.max(0, maxAllowed - monthlyRecord.campaignsCreated);
    
    // Next tier information
    let nextTierInfo = null;
    if (avgCreditScore < 80) {
      if (avgCreditScore < 75) {
        nextTierInfo = {
          nextTier: '75%',
          message: 'Reach 75% credit score for 3 free slots/month',
          requiredScore: 75
        };
      } else if (avgCreditScore < 80) {
        nextTierInfo = {
          nextTier: '80%',
          message: 'Reach 80% credit score for 5 free slots/month',
          requiredScore: 80
        };
      }
    }

    return {
      userId,
      creditScore: avgCreditScore,
      isFirstMonth,
      daysUntilReset,
      maxAllowed,
      campaignsCreated: monthlyRecord.campaignsCreated,
      slotsRemaining,
      paidSlotsAvailable,
      paidSlotPrice,
      nextTierInfo,
      firstCampaignDate: firstCampaign?.createdAt || null,
      hasOperationalCampaign: !!firstCampaign
    };
  }

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
    
    // Create new record with current credit score and new campaign slot logic
    const avgCreditScore = await this.getUserAverageCreditScore(userId);
    const firstCampaign = await this.getUserFirstCampaign(userId);
    
    // Default values for new campaign slot system
    let maxAllowed = 3; // Default 3 free slots for all users
    let paidSlotsAvailable = 0;
    let paidSlotPrice = 0;
    let isFirstMonth = false;
    
    if (firstCampaign) {
      // Check if still in first month (first 30 days from operational campaign)
      const now = new Date();
      const firstCampaignDate = new Date(firstCampaign.createdAt);
      const daysSinceFirstCampaign = Math.floor((now.getTime() - firstCampaignDate.getTime()) / (1000 * 60 * 60 * 24));
      isFirstMonth = daysSinceFirstCampaign < 30;
      
      if (isFirstMonth) {
        // Still in first month - give 10 free slots regardless of credit score
        maxAllowed = 10;
        paidSlotsAvailable = 0;
        paidSlotPrice = 0;
      } else {
        // First month ended, apply credit score tiers
        if (avgCreditScore >= 81) {
          maxAllowed = 25; // 81-100%: 25 slots
          paidSlotsAvailable = 0;
          paidSlotPrice = 0;
        } else if (avgCreditScore >= 66) {
          maxAllowed = 20; // 66-80%: 20 slots
          paidSlotsAvailable = 0;
          paidSlotPrice = 0;
        } else if (avgCreditScore >= 51) {
          maxAllowed = 15; // 51-65%: 15 slots
          paidSlotsAvailable = 0;
          paidSlotPrice = 0;
        } else if (avgCreditScore >= 36) {
          maxAllowed = 10; // 36-50%: 10 slots
          paidSlotsAvailable = 0;
          paidSlotPrice = 0;
        } else if (avgCreditScore >= 21) {
          maxAllowed = 5; // 21-35%: 5 slots
          paidSlotsAvailable = 0;
          paidSlotPrice = 0;
        } else if (avgCreditScore >= 0) {
          maxAllowed = 3; // 0-20%: 3 slots
          paidSlotsAvailable = 0;
          paidSlotPrice = 0;
        } else {
          maxAllowed = 0; // <0%: 0 slots, cannot buy
          paidSlotsAvailable = 0;
          paidSlotPrice = 0;
        }
      }
    } else {
      // No operational campaign yet - show 10 free slots but no countdown
      isFirstMonth = true;
      maxAllowed = 10;
      paidSlotsAvailable = 0;
      paidSlotPrice = 0;
    }
    
    try {
      const [newRecord] = await db.insert(monthlyCampaignLimits)
        .values({
          userId,
          year,
          month,
          campaignsCreated: 0,
          maxAllowed,
          creditScoreAtMonth: avgCreditScore,
          paidSlotsAvailable,
          paidSlotPrice,
          isFirstMonth,
        })
        .returning();
      
      return newRecord;
    } catch (error) {
      // Fallback to old schema if new columns don't exist yet
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
  }

  // Credit Score Methods
  async getUserAverageCreditScore(userId: string): Promise<number> {
    const scores = await db
      .select({ score: userCreditScores.score })
      .from(userCreditScores)
      .where(eq(userCreditScores.userId, userId));
    
    if (scores.length === 0) return 0;
    
    const totalScore = scores.reduce((sum, record) => sum + record.score, 0);
    return Math.round(totalScore / scores.length);
  }

  // Add other essential methods here...
  // (This is a simplified version - you'll need to add back other methods)

  // Helper function to generate unique email ticket numbers
  async generateUniqueEmailTicketNumber(): Promise<string> {
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
}

export const storage = new DatabaseStorage();
