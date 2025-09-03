import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  integer,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { relations } from 'drizzle-orm';

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userDisplayId: varchar("user_display_id", { length: 20 }).unique(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  middleInitial: varchar("middle_initial", { length: 5 }),
  lastName: varchar("last_name"),
  displayName: varchar("display_name"), // User's preferred display name/nickname
  birthday: timestamp("birthday"),
  funFacts: text("fun_facts"),
  profileImageUrl: varchar("profile_image_url"),
  
  // KYC and verification fields
  kycStatus: varchar("kyc_status").default(null), // null=basic, pending, in_progress, verified, rejected
  kycDocuments: text("kyc_documents"), // JSON string
  governmentIdUrl: varchar("government_id_url"), // Government ID document URL
  proofOfAddressUrl: varchar("proof_of_address_url"), // Proof of address document URL
  rejectionReason: text("rejection_reason"), // Reason for KYC rejection
  processedByAdmin: varchar("processed_by_admin"), // Email of admin who processed KYC
  processedAt: timestamp("processed_at"), // When KYC was processed
  
  // KYC tracking fields
  dateRequested: timestamp("date_requested").defaultNow(), // When KYC was submitted
  dateClaimed: timestamp("date_claimed"), // When staff member claimed it
  dateEvaluated: timestamp("date_evaluated"), // When it was approved/rejected
  claimedBy: varchar("claimed_by"), // Staff member who claimed the KYC request
  
  // Professional details for enhanced verification
  education: text("education"), // Educational background
  profession: varchar("profession"), // Current profession/job title
  workExperience: text("work_experience"), // Work experience details
  linkedinProfile: varchar("linkedin_profile"), // LinkedIn URL for professional verification
  organizationName: varchar("organization_name"), // Current organization/company
  organizationType: varchar("organization_type"), // Government, NGO, Private, etc.
  phoneNumber: varchar("phone_number"), // Contact number for verification
  contactNumber: varchar("contact_number"), // Alternative contact field for profile completion
  address: text("address"), // Complete address
  
  // Account details - Multiple wallet types
  phpBalance: decimal("php_balance", { precision: 15, scale: 2 }).default("0.00"), // Main wallet for deposits/withdrawals
  tipsBalance: decimal("tips_balance", { precision: 15, scale: 2 }).default("0.00"), // Tips from contributors
  contributionsBalance: decimal("contributions_balance", { precision: 15, scale: 2 }).default("0.00"), // Claimable contributions
  
  // Community safety scoring
  socialScore: integer("social_score").default(0), // Points earned from validated fraud reports
  reliabilityScore: decimal("reliability_score", { precision: 3, scale: 2 }).default("0.00"), // Average reliability rating from creators (0.00-5.00)
  reliabilityRatingsCount: integer("reliability_ratings_count").default(0), // Number of reliability ratings received
  isFlagged: boolean("is_flagged").default(false), // Flagged for suspicious campaign behavior
  flagReason: text("flag_reason"), // Reason for being flagged
  flaggedAt: timestamp("flagged_at"), // When the user was flagged
  isSuspended: boolean("is_suspended").default(false), // Suspended from creating campaigns
  suspensionReason: text("suspension_reason"), // Reason for suspension
  suspendedAt: timestamp("suspended_at"), // When the user was suspended
  
  // Credibility Score System
  credibilityScore: decimal("credibility_score", { precision: 5, scale: 2 }).default("100.00"),
  accountStatus: varchar("account_status", { length: 20 }).default("active"), // active, limited, suspended, blocked
  remainingCampaignChances: integer("remaining_campaign_chances").default(2),
  lastCredibilityUpdate: timestamp("last_credibility_update"),
  
  // Support Request Fields
  hasActiveSupportRequest: boolean("has_active_support_request").default(false),
  supportRequestSubmittedAt: timestamp("support_request_submitted_at"),
  supportRequestReason: text("support_request_reason"),
  
  // Role management
  isAdmin: boolean("is_admin").default(false),
  isManager: boolean("is_manager").default(false), // Manager with enhanced oversight capabilities
  isSupport: boolean("is_support").default(false), // Support staff with limited admin access
  isProfileComplete: boolean("is_profile_complete").default(false),
  
  // Support staff extended profile information
  dateInvited: timestamp("date_invited"), // When the user was invited as support
  dateJoined: timestamp("date_joined"), // When the user accepted the support role
  invitedBy: varchar("invited_by"), // ID of admin who sent the invite
  supportStatus: varchar("support_status").default("active"), // active, pending, inactive
  
  // Professional background for support staff
  workExperienceDetails: text("work_experience_details"), // Detailed work experience
  skills: text("skills"), // JSON array of skills
  certifications: text("certifications"), // JSON array of certifications
  previousRoles: text("previous_roles"), // JSON array of previous roles
  
  // Personal background (optional, editable by user or admin)
  bio: text("bio"), // Short personal bio
  interests: text("interests"), // Personal interests
  languages: text("languages"), // Languages spoken
  location: text("location"), // Current location
  
  // Blockchain wallet integration
  celoWalletAddress: varchar("celo_wallet_address"), // User's Celo wallet address
  walletPrivateKey: text("wallet_private_key"), // Encrypted private key
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignDisplayId: varchar("campaign_display_id", { length: 20 }).unique(), // User-friendly ID like CAM-001234
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(), // emergency, education, healthcare, community, environment
  goalAmount: decimal("goal_amount", { precision: 15, scale: 2 }).notNull(),
  minimumAmount: decimal("minimum_amount", { precision: 15, scale: 2 }).notNull(), // Minimum operational amount
  currentAmount: decimal("current_amount", { precision: 15, scale: 2 }).default("0.00"),
  claimedAmount: decimal("claimed_amount", { precision: 15, scale: 2 }).default("0.00"), // Track claimed contributions
  images: text("images"), // JSON array of image URLs
  status: varchar("status").default("pending"), // pending, active, on_progress, completed, cancelled, rejected, flagged, closed_with_refund
  tesVerified: boolean("tes_verified").default(false),
  duration: integer("duration").notNull(), // days
  
  // Event location details
  street: varchar("street"),
  barangay: varchar("barangay"),
  city: varchar("city"),
  province: varchar("province"),
  region: varchar("region"), // Auto-populated based on province
  zipcode: varchar("zipcode"),
  landmark: text("landmark"), // Optional but recommended
  
  // Campaign dates
  startDate: timestamp("start_date"), // Target start date for campaign
  endDate: timestamp("end_date"), // Target end date for campaign
  
  // Volunteer requirements
  needsVolunteers: boolean("needs_volunteers").default(false),
  volunteerSlots: integer("volunteer_slots").default(0),
  volunteerSlotsFilledCount: integer("volunteer_slots_filled_count").default(0),
  
  // Admin claiming for review
  claimedBy: varchar("claimed_by").references(() => users.id), // Admin who claimed this campaign for review
  claimedAt: timestamp("claimed_at"), // When the campaign was claimed for review
  
  // Processing fields for approval/rejection tracking
  approvedBy: varchar("approved_by").references(() => users.id), // Admin who approved this campaign
  approvedAt: timestamp("approved_at"), // When the campaign was approved
  rejectedBy: varchar("rejected_by").references(() => users.id), // Admin who rejected this campaign
  rejectedAt: timestamp("rejected_at"), // When the campaign was rejected
  rejectionReason: text("rejection_reason"), // Reason for campaign rejection
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contributions = pgTable("contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  contributorId: varchar("contributor_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  message: text("message"),
  isAnonymous: boolean("is_anonymous").default(false),
  transactionHash: varchar("transaction_hash"), // Mock blockchain hash
  createdAt: timestamp("created_at").defaultNow(),
});

export const tips = pgTable("tips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  tipperId: varchar("tipper_id").notNull().references(() => users.id),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  message: text("message"),
  isAnonymous: boolean("is_anonymous").default(false),
  transactionHash: varchar("transaction_hash"), // Blockchain hash for tip transaction
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(), // Types: campaign_interest_match, campaign_update, volunteer_task, contribution_received, tip_received, comment_mention, admin_announcement, reward_distribution, security_update
  isRead: boolean("is_read").default(false),
  relatedId: varchar("related_id"), // ID of related entity (campaign, volunteer application, etc.)
  actionUrl: text("action_url"), // URL to redirect when notification is clicked
  metadata: jsonb("metadata"), // Additional flexible data for notification context
  priority: varchar("priority").default("normal"), // low, normal, high, urgent
  expiresAt: timestamp("expires_at"), // Optional expiration date for notifications
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionDisplayId: varchar("transaction_display_id", { length: 20 }).unique(), // User-friendly ID like TXN-001234
  userId: varchar("user_id").references(() => users.id),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  type: varchar("type").notNull(), // deposit, withdrawal, contribution, tip, expense, conversion, refund, campaign_closure
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default("PHP"), // PHP
  description: text("description").notNull(),
  status: varchar("status").default("pending"), // pending, completed, failed
  
  // Blockchain data
  transactionHash: varchar("transaction_hash"), // Celo blockchain hash
  blockNumber: varchar("block_number"), // Block number
  
  // Payment provider data
  paymentProvider: varchar("payment_provider"), // paymongo, celo
  paymentProviderTxId: varchar("payment_provider_tx_id"), // PayMongo payment ID
  
  // Conversion data
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }), // Exchange rate
  feeAmount: decimal("fee_amount", { precision: 15, scale: 2 }).default("0.00"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const volunteerOpportunities = pgTable("volunteer_opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  slotsNeeded: integer("slots_needed").notNull(),
  slotsFilled: integer("slots_filled").default(0),
  status: varchar("status").default("active"), // active, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

export const volunteerApplications = pgTable("volunteer_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  opportunityId: varchar("opportunity_id").references(() => volunteerOpportunities.id), // Made nullable for direct campaign applications
  campaignId: varchar("campaign_id").references(() => campaigns.id), // Link to campaign for direct volunteer applications
  volunteerId: varchar("volunteer_id").notNull().references(() => users.id),
  status: varchar("status").default("pending"), // pending, approved, rejected
  message: text("message"),
  intent: text("intent").notNull(), // Why they want to volunteer - required field
  telegramDisplayName: varchar("telegram_display_name", { length: 100 }), // Telegram display name - private until approved
  telegramUsername: varchar("telegram_username", { length: 50 }), // Telegram username - private until approved
  rejectionReason: text("rejection_reason"), // Reason for rejection if applicable
  createdAt: timestamp("created_at").defaultNow(),
});

export const campaignUpdates = pgTable("campaign_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  images: text("images"), // JSON array of image URLs
  createdAt: timestamp("created_at").defaultNow(),
});

// PayMongo payment records
export const paymentRecords = pgTable("payment_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  transactionId: varchar("transaction_id").references(() => transactions.id),
  
  // PayMongo data
  paymongoPaymentId: varchar("paymongo_payment_id").unique(),
  paymongoPaymentIntentId: varchar("paymongo_payment_intent_id"),
  paymongoSourceId: varchar("paymongo_source_id"),
  
  // Payment details
  paymentMethod: varchar("payment_method"), // gcash, grabpay, card, bank_transfer
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency").default("PHP"),
  status: varchar("status").default("pending"), // pending, paid, failed, cancelled
  
  // Metadata
  description: text("description"),
  metadata: jsonb("metadata"), // Additional PayMongo data
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exchange rates for currency conversion
export const exchangeRates = pgTable("exchange_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromCurrency: varchar("from_currency").notNull(),
  toCurrency: varchar("to_currency").notNull(),
  rate: decimal("rate", { precision: 10, scale: 6 }).notNull(),
  source: varchar("source").default("manual"), // manual, api, oracle
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Blockchain configuration
export const blockchainConfig = pgTable("blockchain_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  network: varchar("network").notNull(), // celo-mainnet, celo-alfajores
  contractAddress: varchar("contract_address"), // Token contract
  contractAbi: jsonb("contract_abi"), // Contract ABI
  rpcUrl: varchar("rpc_url").notNull(),
  explorerUrl: varchar("explorer_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Support staff invitation system
export const supportInvitations = pgTable("support_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  invitedBy: varchar("invited_by").notNull().references(() => users.id), // Admin who sent invitation
  token: varchar("token").notNull().unique(),
  status: varchar("status").default("pending"), // pending, accepted, expired, revoked
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // Expires after 72 hours
  acceptedAt: timestamp("accepted_at"), // When the invitation was accepted
  revokedAt: timestamp("revoked_at"), // When the invitation was revoked
});

// Campaign engagement features
export const campaignReactions = pgTable("campaign_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  reactionType: varchar("reaction_type").notNull(), // like, love, support, wow, sad, angry
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_campaign_reactions_campaign_user").on(table.campaignId, table.userId),
]);

export const campaignComments = pgTable("campaign_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isEdited: boolean("is_edited").default(false),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const commentReplies = pgTable("comment_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").notNull().references(() => campaignComments.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isEdited: boolean("is_edited").default(false),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comment votes table - users can upvote/downvote comments (like Reddit karma)
export const commentVotes = pgTable("comment_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").notNull().references(() => campaignComments.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  voteType: varchar("vote_type").notNull(), // 'upvote' or 'downvote'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Unique constraint: one vote per user per comment
  uniqueUserComment: unique("unique_user_comment_vote").on(table.userId, table.commentId),
}));

// Reply votes table - users can upvote/downvote replies
export const replyVotes = pgTable("reply_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  replyId: varchar("reply_id").notNull().references(() => commentReplies.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  voteType: varchar("vote_type").notNull(), // 'upvote' or 'downvote'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Unique constraint: one vote per user per reply
  uniqueUserReply: unique("unique_user_reply_vote").on(table.userId, table.replyId),
}));

// Volunteer Reliability Ratings table - Creators rate volunteers after working together
export const volunteerReliabilityRatings = pgTable("volunteer_reliability_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  raterId: varchar("rater_id").notNull().references(() => users.id), // Creator giving the rating
  volunteerId: varchar("volunteer_id").notNull().references(() => users.id), // Volunteer being rated
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  volunteerApplicationId: varchar("volunteer_application_id").references(() => volunteerApplications.id),
  rating: integer("rating").notNull(), // 1-5 stars
  feedback: text("feedback"), // Optional text feedback
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
// Unique constraint: one reliability rating per creator per volunteer per campaign
  uniqueCreatorVolunteerCampaign: unique("unique_creator_volunteer_campaign_reliability").on(table.raterId, table.volunteerId, table.campaignId),}));

// Support Invitation types
export type SupportInvitation = typeof supportInvitations.$inferSelect;
export type InsertSupportInvitation = typeof supportInvitations.$inferInsert;

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;


// Support Tickets table for comprehensive ticket management system
export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNumber: varchar("ticket_number", { length: 20 }).unique(), // TKT-0001, TKT-0002, etc.
  userId: varchar("user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  attachments: text("attachments"), // JSON array of file URLs
  status: varchar("status").notNull().default("open"), // open, claimed, assigned, pending, in_progress, resolved, closed
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, urgent
  category: varchar("category").notNull().default("general"), // general, technical, billing, account, bug_report
  
  // Claim system for admin assignment
  claimedBy: varchar("claimed_by"), // Admin user ID who claimed the ticket
  claimedByEmail: varchar("claimed_by_email"), // Admin email for easier tracking
  claimedAt: timestamp("claimed_at"), // When the ticket was claimed
  
  // Assignment tracking (admin assigns to support staff)
  assignedTo: varchar("assigned_to").references(() => users.id), // Support staff assigned to the ticket
  assignedByAdmin: varchar("assigned_by_admin").references(() => users.id), // Admin who made the assignment
  assignedAt: timestamp("assigned_at"), // When the ticket was assigned
  
  // Resolution tracking
  resolvedAt: timestamp("resolved_at"), // When the ticket was resolved
  resolutionNotes: text("resolution_notes"), // Admin notes on resolution
  
  // Email tracking
  emailSentAt: timestamp("email_sent_at"), // When email notification was sent
  emailDelivered: boolean("email_delivered").default(false), // Email delivery status
  
  // Auto-generated timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

// Support Email Tickets table for managing incoming support emails from trexiaamable@gmail.com
export const supportEmailTickets = pgTable("support_email_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNumber: varchar("ticket_number", { length: 20 }).unique(), // ETK-0001, ETK-0002, etc.
  senderEmail: varchar("sender_email").notNull(), // Email of person who sent the support request
  subject: text("subject").notNull(),
  emailBody: text("email_body").notNull(), // Full email content
  emailBodyPreview: text("email_body_preview"), // First 200 chars for list view
  attachments: text("attachments"), // JSON string of file URLs/names
  status: varchar("status").notNull().default("pending"), // pending, claimed, assigned, resolved
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, urgent
  
  // Claim system for staff assignment
  claimedBy: varchar("claimed_by").references(() => users.id), // Support staff who claimed it
  claimedByEmail: varchar("claimed_by_email"), // Staff email for easier tracking
  dateClaimed: timestamp("date_claimed"), // When staff member claimed it
  
  // Assignment tracking (admin assigns to support staff)
  assignedTo: varchar("assigned_to").references(() => users.id), // Support staff assigned by admin
  assignedByAdmin: varchar("assigned_by_admin").references(() => users.id), // Admin who made the assignment
  dateAssigned: timestamp("date_assigned"), // When admin assigned it
  
  // Resolution tracking
  dateResolved: timestamp("date_resolved"), // When it was marked resolved
  resolutionNotes: text("resolution_notes"), // Staff notes on resolution
  
  // Email metadata
  emailReceivedAt: timestamp("email_received_at").notNull(), // When email was received
  internalNotes: text("internal_notes"), // Staff notes not visible to user
  
  // Auto-generated timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SupportEmailTicket = typeof supportEmailTickets.$inferSelect;
export type InsertSupportEmailTicket = typeof supportEmailTickets.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// Extended Campaign type with creator information (for API responses with joins)
export type CampaignWithCreator = Campaign & {
  creatorFirstName?: string;
  creatorLastName?: string;
  creatorEmail?: string;
};
export type Contribution = typeof contributions.$inferSelect;
export type InsertContribution = typeof contributions.$inferInsert;
export type Tip = typeof tips.$inferSelect;
export type InsertTip = typeof tips.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type VolunteerOpportunity = typeof volunteerOpportunities.$inferSelect;
export type InsertVolunteerOpportunity = typeof volunteerOpportunities.$inferInsert;
export type VolunteerApplication = typeof volunteerApplications.$inferSelect;
export type InsertVolunteerApplication = typeof volunteerApplications.$inferInsert;
export type CampaignUpdate = typeof campaignUpdates.$inferSelect;
export type InsertCampaignUpdate = typeof campaignUpdates.$inferInsert;
export type PaymentRecord = typeof paymentRecords.$inferSelect;
export type InsertPaymentRecord = typeof paymentRecords.$inferInsert;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = typeof exchangeRates.$inferInsert;
export type BlockchainConfig = typeof blockchainConfig.$inferSelect;
export type InsertBlockchainConfig = typeof blockchainConfig.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type CampaignReaction = typeof campaignReactions.$inferSelect;
export type InsertCampaignReaction = typeof campaignReactions.$inferInsert;
export type CampaignComment = typeof campaignComments.$inferSelect;
export type InsertCampaignComment = typeof campaignComments.$inferInsert;
export type CommentReply = typeof commentReplies.$inferSelect;
export type InsertCommentReply = typeof commentReplies.$inferInsert;
export type CommentVote = typeof commentVotes.$inferSelect;
export type InsertCommentVote = typeof commentVotes.$inferInsert;
export type ReplyVote = typeof replyVotes.$inferSelect;
export type InsertReplyVote = typeof replyVotes.$inferInsert;
export type VolunteerReliabilityRating = typeof volunteerReliabilityRatings.$inferSelect;
export type InsertVolunteerReliabilityRating = typeof volunteerReliabilityRatings.$inferInsert;

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  currentAmount: true,
  status: true,
  tesVerified: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContributionSchema = createInsertSchema(contributions).omit({
  id: true,
  transactionHash: true,
  createdAt: true,
});

export const insertTipSchema = createInsertSchema(tips).omit({
  id: true,
  transactionHash: true,
  createdAt: true,
});

export const insertVolunteerApplicationSchema = createInsertSchema(volunteerApplications).omit({
  id: true,
  status: true,
  rejectionReason: true,
  createdAt: true,
});

// Stories (News/Articles) table
export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  body: text("body").notNull(),
  excerpt: text("excerpt"), // Short summary for previews
  coverImageUrl: varchar("cover_image_url"), // Cover photo URL
  coverVideoUrl: varchar("cover_video_url"), // Cover video URL
  authorId: varchar("author_id").notNull().references(() => users.id), // Admin/Support who wrote it
  status: varchar("status").notNull().default("draft"), // draft, published, archived
  publishedAt: timestamp("published_at"),
  viewCount: integer("view_count").default(0),
  reactCount: integer("react_count").default(0),
  shareCount: integer("share_count").default(0),
  commentCount: integer("comment_count").default(0),
  
  // SEO and metadata
  tags: text("tags"), // JSON array of tags
  metaDescription: text("meta_description"),
  slug: varchar("slug").unique(), // URL-friendly identifier
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Story reactions (likes/hearts)
export const storyReactions = pgTable("story_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reactionType: varchar("reaction_type").notNull().default("like"), // like, heart, etc.
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique().on(table.storyId, table.userId), // Prevent duplicate reactions
]);

// Story comments
export const storyComments = pgTable("story_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isApproved: boolean("is_approved").default(true), // For moderation
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Story shares tracking
export const storyShares = pgTable("story_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // Optional for anonymous shares
  platform: varchar("platform"), // facebook, twitter, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Type exports for stories
export type Story = typeof stories.$inferSelect;
export type InsertStory = typeof stories.$inferInsert;
export type StoryReaction = typeof storyReactions.$inferSelect;
export type InsertStoryReaction = typeof storyReactions.$inferInsert;
export type StoryComment = typeof storyComments.$inferSelect;
export type InsertStoryComment = typeof storyComments.$inferInsert;
export type StoryShare = typeof storyShares.$inferSelect;
export type InsertStoryShare = typeof storyShares.$inferInsert;

// Insert schemas
export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  viewCount: true,
  reactCount: true,
  shareCount: true,
  commentCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStoryCommentSchema = createInsertSchema(storyComments).omit({
  id: true,
  isApproved: true,
  createdAt: true,
  updatedAt: true,
});

// Enhanced schema for volunteer applications with intent requirement and Telegram fields
export const volunteerApplicationFormSchema = insertVolunteerApplicationSchema.extend({
  intent: z.string().min(20, "Please provide at least 20 characters explaining why you want to volunteer"),
  telegramDisplayName: z.string().min(1, "Telegram Display Name is required").max(100, "Display name must be under 100 characters"),
  telegramUsername: z.string().min(1, "Telegram Username is required").max(50, "Username must be under 50 characters").regex(/^@?[a-zA-Z0-9_]{3,32}$/, "Please enter a valid Telegram username (e.g., @username or username)"),
}).omit({ opportunityId: true, campaignId: true, volunteerId: true });

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignReactionSchema = createInsertSchema(campaignReactions).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignCommentSchema = createInsertSchema(campaignComments).omit({
  id: true,
  isEdited: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVolunteerReliabilityRatingSchema = createInsertSchema(volunteerReliabilityRatings).omit({
  id: true,
  createdAt: true,
});

export const insertCommentReplySchema = createInsertSchema(commentReplies).omit({
  id: true,
  isEdited: true,
  createdAt: true,
  updatedAt: true,
});

// Progress Reports table
export const progressReports = pgTable("progress_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  reportDate: timestamp("report_date").notNull(),
  status: varchar("status").default("pending"), // pending, in_progress, resolved, rejected
  
  // Report tracking fields
  dateClaimed: timestamp("date_claimed"), // When staff member claimed it
  dateCompleted: timestamp("date_completed"), // When it was resolved/completed
  claimedBy: varchar("claimed_by").references(() => users.id), // Staff member who claimed the report
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document types enum  
export const documentTypeEnum = [
  'image',
  'video_link', 
  'official_receipt',
  'acknowledgement_receipt',
  'expense_summary',
  'invoice',
  'contract',
  'other'
] as const;

// Progress Report Documents table
export const progressReportDocuments = pgTable("progress_report_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentDisplayId: varchar("document_display_id", { length: 20 }).unique(), // User-friendly ID like DOC-001234
  progressReportId: varchar("progress_report_id").notNull().references(() => progressReports.id),
  documentType: varchar("document_type", { enum: documentTypeEnum }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 1000 }).notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  description: text("description"),
  status: varchar("status").default("pending"), // pending, in_progress, resolved, rejected
  
  // Document tracking fields
  dateClaimed: timestamp("date_claimed"), // When staff member claimed it
  dateCompleted: timestamp("date_completed"), // When it was resolved/completed
  claimedBy: varchar("claimed_by").references(() => users.id), // Staff member who claimed the document review
  
  createdAt: timestamp("created_at").defaultNow(),
});

// User Credit Scores table
export const userCreditScores = pgTable("user_credit_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  progressReportId: varchar("progress_report_id").notNull().references(() => progressReports.id),
  scorePercentage: integer("score_percentage").notNull().default(0),
  completedDocumentTypes: text("completed_document_types").array().notNull().default(sql`ARRAY[]::text[]`),
  totalRequiredTypes: integer("total_required_types").notNull().default(8),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Monthly Campaign Limits table - Track monthly campaign creation limits per user
export const monthlyCampaignLimits = pgTable("monthly_campaign_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  campaignsCreated: integer("campaigns_created").notNull().default(0),
  maxAllowed: integer("max_allowed").notNull().default(0),
  creditScoreAtMonth: integer("credit_score_at_month").notNull().default(0),
  paidSlotsAvailable: integer("paid_slots_available").notNull().default(0),
  paidSlotPrice: integer("paid_slot_price").notNull().default(0),
  isFirstMonth: boolean("is_first_month").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Unique constraint: one record per user per month
  uniqueUserMonth: unique("unique_user_month").on(table.userId, table.year, table.month),
}));

// Creator Ratings table - Users can rate creators 1-5 stars for their progress reports
export const creatorRatings = pgTable("creator_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  raterId: varchar("rater_id").notNull().references(() => users.id), // User giving the rating
  creatorId: varchar("creator_id").notNull().references(() => users.id), // Creator being rated
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  progressReportId: varchar("progress_report_id").notNull().references(() => progressReports.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"), // Optional comment
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Unique constraint: one rating per user per progress report
  uniqueRaterReport: unique("unique_rater_report").on(table.raterId, table.progressReportId),
}));

// Insert schemas for progress reports
export const insertProgressReportSchema = createInsertSchema(progressReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProgressReportDocumentSchema = createInsertSchema(progressReportDocuments).omit({
  id: true,
  createdAt: true,
});

export const insertUserCreditScoreSchema = createInsertSchema(userCreditScores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCreatorRatingSchema = createInsertSchema(creatorRatings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMonthlyCampaignLimitSchema = createInsertSchema(monthlyCampaignLimits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Relations for progress reports
export const progressReportsRelations = relations(progressReports, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [progressReports.campaignId],
    references: [campaigns.id],
  }),
  createdBy: one(users, {
    fields: [progressReports.createdById],
    references: [users.id],
  }),
  documents: many(progressReportDocuments),
  creditScore: one(userCreditScores),
  ratings: many(creatorRatings),
}));

export const progressReportDocumentsRelations = relations(progressReportDocuments, ({ one }) => ({
  progressReport: one(progressReports, {
    fields: [progressReportDocuments.progressReportId],
    references: [progressReports.id],
  }),
}));

export const userCreditScoresRelations = relations(userCreditScores, ({ one }) => ({
  user: one(users, {
    fields: [userCreditScores.userId],
    references: [users.id],
  }),
  campaign: one(campaigns, {
    fields: [userCreditScores.campaignId],
    references: [campaigns.id],
  }),
  progressReport: one(progressReports, {
    fields: [userCreditScores.progressReportId],
    references: [progressReports.id],
  }),
}));

export const creatorRatingsRelations = relations(creatorRatings, ({ one }) => ({
  rater: one(users, {
    fields: [creatorRatings.raterId],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [creatorRatings.creatorId], 
    references: [users.id],
  }),
  campaign: one(campaigns, {
    fields: [creatorRatings.campaignId],
    references: [campaigns.id],
  }),
  progressReport: one(progressReports, {
    fields: [creatorRatings.progressReportId],
    references: [progressReports.id],
  }),
}));

// Types
export type ProgressReport = typeof progressReports.$inferSelect;
export type InsertProgressReport = z.infer<typeof insertProgressReportSchema>;
export type ProgressReportDocument = typeof progressReportDocuments.$inferSelect;
export type InsertProgressReportDocument = z.infer<typeof insertProgressReportDocumentSchema>;
export type UserCreditScore = typeof userCreditScores.$inferSelect;
export type InsertUserCreditScore = z.infer<typeof insertUserCreditScoreSchema>;
export type CreatorRating = typeof creatorRatings.$inferSelect;
export type InsertCreatorRating = z.infer<typeof insertCreatorRatingSchema>;

// Fraud Reports table - for community safety
export const fraudReports = pgTable("fraud_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").notNull().references(() => users.id),
  documentId: varchar("document_id").references(() => progressReportDocuments.id), // nullable for campaign reports
  reportType: varchar("report_type").notNull(), // fraud, inappropriate, fake, other
  description: text("description").notNull(),
  status: varchar("status").default("pending"), // pending, in_progress, resolved, rejected
  adminNotes: text("admin_notes"), // Admin's investigation notes
  validatedBy: varchar("validated_by").references(() => users.id), // Admin who validated
  claimedBy: varchar("claimed_by").references(() => users.id), // Admin who claimed this report
  claimedAt: timestamp("claimed_at"), // When the report was claimed
  socialPointsAwarded: integer("social_points_awarded").default(0), // Points awarded to reporter if valid
  relatedId: varchar("related_id"), // campaign_id for campaign reports, null for document reports
  relatedType: varchar("related_type"), // 'campaign' for campaign reports, 'document' for document reports
  evidenceUrls: text("evidence_urls").array(), // Array of URLs to evidence files
  
  // Report tracking fields
  dateClaimed: timestamp("date_claimed"), // When staff member claimed it
  dateCompleted: timestamp("date_completed"), // When it was resolved/completed
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFraudReportSchema = createInsertSchema(fraudReports).omit({
  id: true,
  status: true,
  adminNotes: true,
  validatedBy: true,
  socialPointsAwarded: true,
  createdAt: true,
  updatedAt: true,
});

export type FraudReport = typeof fraudReports.$inferSelect;
export type InsertFraudReport = z.infer<typeof insertFraudReportSchema>;

// Volunteer Reports table - for reporting problematic volunteers
export const volunteerReports = pgTable("volunteer_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportedVolunteerId: varchar("reported_volunteer_id").notNull().references(() => users.id),
  reporterId: varchar("reporter_id").notNull().references(() => users.id),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  reason: varchar("reason").notNull(), // inappropriate_behavior, unreliable, poor_communication, etc.
  description: text("description").notNull(),
  evidenceUrls: text("evidence_urls").array(), // Array of URLs to evidence files
  status: varchar("status").notNull().default("pending"), // pending, under_review, resolved, dismissed
  adminNotes: text("admin_notes"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  claimedBy: varchar("claimed_by").references(() => users.id), // Admin who claimed this report
  claimedAt: timestamp("claimed_at"), // When the report was claimed
  
  // Report tracking fields
  dateClaimed: timestamp("date_claimed"), // When staff member claimed it
  dateCompleted: timestamp("date_completed"), // When it was resolved/completed
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVolunteerReportSchema = createInsertSchema(volunteerReports).omit({
  id: true,
  status: true,
  adminNotes: true,
  reviewedBy: true,
  reviewedAt: true,
  claimedBy: true,
  claimedAt: true,
  dateClaimed: true,
  dateCompleted: true,
  createdAt: true,
  updatedAt: true,
});

export type VolunteerReport = typeof volunteerReports.$inferSelect;
export type InsertVolunteerReport = z.infer<typeof insertVolunteerReportSchema>;

// Relations for fraud reports
export const fraudReportsRelations = relations(fraudReports, ({ one }) => ({
  reporter: one(users, {
    fields: [fraudReports.reporterId],
    references: [users.id],
  }),
  document: one(progressReportDocuments, {
    fields: [fraudReports.documentId],
    references: [progressReportDocuments.id],
  }),
  validatedByAdmin: one(users, {
    fields: [fraudReports.validatedBy],
    references: [users.id],
  }),
  claimedByAdmin: one(users, {
    fields: [fraudReports.claimedBy],
    references: [users.id],
  }),
}));

// Relations for volunteer reports
export const volunteerReportsRelations = relations(volunteerReports, ({ one }) => ({
  reportedVolunteer: one(users, {
    fields: [volunteerReports.reportedVolunteerId],
    references: [users.id],
  }),
  reporter: one(users, {
    fields: [volunteerReports.reporterId],
    references: [users.id],
  }),
  campaign: one(campaigns, {
    fields: [volunteerReports.campaignId],
    references: [campaigns.id],
  }),
  reviewedByAdmin: one(users, {
    fields: [volunteerReports.reviewedBy],
    references: [users.id],
  }),
  claimedByAdmin: one(users, {
    fields: [volunteerReports.claimedBy],
    references: [users.id],
  }),
}));

export const progressReportDocumentsRelationsUpdated = relations(progressReportDocuments, ({ one, many }) => ({
  progressReport: one(progressReports, {
    fields: [progressReportDocuments.progressReportId],
    references: [progressReports.id],
  }),
  fraudReports: many(fraudReports),
}));

// Support Requests table - for account reactivation requests
export const supportRequests = pgTable("support_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  requestType: varchar("request_type").notNull(), // account_reactivation
  reason: text("reason").notNull(),
  currentCredibilityScore: decimal("current_credibility_score", { precision: 5, scale: 2 }),
  attachments: text("attachments"), // JSON array of file URLs
  status: varchar("status").default("pending"), // pending, in_progress, resolved, rejected
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  claimedBy: varchar("claimed_by").references(() => users.id), // Admin who claimed this request
  claimedAt: timestamp("claimed_at"), // When the request was claimed
  
  // Minimum 1-month processing
  submittedAt: timestamp("submitted_at").defaultNow(),
  eligibleForReviewAt: timestamp("eligible_for_review_at").notNull(), // submittedAt + 1 month
  
  // Support request tracking fields
  dateClaimed: timestamp("date_claimed"), // When staff member claimed it (same as claimedAt)
  dateCompleted: timestamp("date_completed"), // When it was resolved/completed
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Support Tickets schema and validation
export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  ticketNumber: true,
  claimedBy: true,
  claimedByEmail: true,
  claimedAt: true,
  assignedTo: true,
  assignedByAdmin: true,
  assignedAt: true,
  resolvedAt: true,
  resolutionNotes: true,
  emailSentAt: true,
  emailDelivered: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupportEmailTicketSchema = createInsertSchema(supportEmailTickets).omit({
  id: true,
  ticketNumber: true,
  claimedBy: true,
  claimedByEmail: true,
  dateClaimed: true,
  assignedTo: true,
  assignedByAdmin: true,
  dateAssigned: true,
  dateResolved: true,
  resolutionNotes: true,
  internalNotes: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSupportTicketForm = z.infer<typeof insertSupportTicketSchema>;

// Relations for support tickets
export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
  }),
  claimedByAdmin: one(users, {
    fields: [supportTickets.claimedBy],
    references: [users.id],
  }),
  assignedToStaff: one(users, {
    fields: [supportTickets.assignedTo],
    references: [users.id],
  }),
  assignedByAdmin: one(users, {
    fields: [supportTickets.assignedByAdmin],
    references: [users.id],
  }),
}));

export const supportEmailTicketsRelations = relations(supportEmailTickets, ({ one }) => ({
  claimedByUser: one(users, {
    fields: [supportEmailTickets.claimedBy],
    references: [users.id],
  }),
  assignedToUser: one(users, {
    fields: [supportEmailTickets.assignedTo],
    references: [users.id],
  }),
  assignedByAdminUser: one(users, {
    fields: [supportEmailTickets.assignedByAdmin],
    references: [users.id],
  }),
}));

export const insertSupportRequestSchema = createInsertSchema(supportRequests).omit({
  id: true,
  status: true,
  reviewedBy: true,
  reviewNotes: true,
  reviewedAt: true,
  submittedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type SupportRequest = typeof supportRequests.$inferSelect;
export type InsertSupportRequest = z.infer<typeof insertSupportRequestSchema>;

// Relations for support requests
export const supportRequestsRelations = relations(supportRequests, ({ one }) => ({
  user: one(users, {
    fields: [supportRequests.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [supportRequests.reviewedBy],
    references: [users.id],
  }),
  claimedByAdmin: one(users, {
    fields: [supportRequests.claimedBy],
    references: [users.id],
  }),
}));

// Relations for monthly campaign limits
export const monthlyCampaignLimitsRelations = relations(monthlyCampaignLimits, ({ one }) => ({
  user: one(users, {
    fields: [monthlyCampaignLimits.userId],
    references: [users.id],
  }),
}));
