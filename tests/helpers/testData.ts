import { db } from '../../server/db';
import { users, campaigns, contributions, tips, transactions, supportTickets, volunteerOpportunities, volunteerApplications } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Test user data for different roles
export const testUsers = {
  admin: {
    id: 'test-admin-001',
    userDisplayId: 'ADMIN001',
    email: 'admin@test.verifund.org',
    firstName: 'Admin',
    lastName: 'User',
    kycStatus: 'verified',
    isAdmin: true,
    isSupport: false,
    profileImageUrl: 'https://example.com/admin.jpg',
    phpBalance: '50000.00',
    contributionsBalance: '0.00',
    tipsBalance: '0.00',
    credibilityScore: '100.00',
    accountStatus: 'active',
    remainingCampaignChances: 0, // Admins can't create campaigns
  },
  
  support: {
    id: 'test-support-001',
    userDisplayId: 'SUP001',
    email: 'support@test.verifund.org',
    firstName: 'Support',
    lastName: 'Staff',
    kycStatus: 'verified',
    isAdmin: false,
    isSupport: true,
    profileImageUrl: 'https://example.com/support.jpg',
    phpBalance: '25000.00',
    contributionsBalance: '0.00',
    tipsBalance: '0.00',
    credibilityScore: '100.00',
    accountStatus: 'active',
    remainingCampaignChances: 0, // Support can't create campaigns
    supportStatus: 'active',
  },
  
  verifiedCreator: {
    id: 'test-creator-001',
    userDisplayId: 'CRT001',
    email: 'creator@test.verifund.org',
    firstName: 'Verified',
    lastName: 'Creator',
    kycStatus: 'verified',
    isAdmin: false,
    isSupport: false,
    profileImageUrl: 'https://example.com/creator.jpg',
    phpBalance: '10000.00',
    contributionsBalance: '15000.00',
    tipsBalance: '5000.00',
    credibilityScore: '95.50',
    accountStatus: 'active',
    remainingCampaignChances: 2,
    profession: 'Software Developer',
    education: 'Computer Science Graduate',
  },
  
  basicUser: {
    id: 'test-basic-001',
    userDisplayId: 'USR001',
    email: 'basic@test.verifund.org',
    firstName: 'Basic',
    lastName: 'User',
    kycStatus: 'pending',
    isAdmin: false,
    isSupport: false,
    profileImageUrl: 'https://example.com/basic.jpg',
    phpBalance: '5000.00',
    contributionsBalance: '0.00',
    tipsBalance: '0.00',
    credibilityScore: '100.00',
    accountStatus: 'active',
    remainingCampaignChances: 2,
  },
  
  volunteer: {
    id: 'test-volunteer-001',
    userDisplayId: 'VOL001',
    email: 'volunteer@test.verifund.org',
    firstName: 'Active',
    lastName: 'Volunteer',
    kycStatus: 'verified',
    isAdmin: false,
    isSupport: false,
    profileImageUrl: 'https://example.com/volunteer.jpg',
    phpBalance: '3000.00',
    contributionsBalance: '0.00',
    tipsBalance: '2000.00',
    credibilityScore: '98.75',
    accountStatus: 'active',
    remainingCampaignChances: 2,
    reliabilityScore: '4.8',
    reliabilityRatingsCount: 15,
  },
  
  tipper: {
    id: 'test-tipper-001',
    userDisplayId: 'TIP001',
    email: 'tipper@test.verifund.org',
    firstName: 'Generous',
    lastName: 'Tipper',
    kycStatus: 'verified',
    isAdmin: false,
    isSupport: false,
    profileImageUrl: 'https://example.com/tipper.jpg',
    phpBalance: '25000.00',
    contributionsBalance: '0.00',
    tipsBalance: '0.00',
    credibilityScore: '100.00',
    accountStatus: 'active',
    remainingCampaignChances: 2,
  },
  
  flaggedUser: {
    id: 'test-flagged-001',
    userDisplayId: 'FLG001',
    email: 'flagged@test.verifund.org',
    firstName: 'Flagged',
    lastName: 'User',
    kycStatus: 'verified',
    isAdmin: false,
    isSupport: false,
    profileImageUrl: 'https://example.com/flagged.jpg',
    phpBalance: '1000.00',
    contributionsBalance: '0.00',
    tipsBalance: '0.00',
    credibilityScore: '45.00',
    accountStatus: 'limited',
    remainingCampaignChances: 0,
    isFlagged: true,
    flagReason: 'Suspicious campaign behavior',
    flaggedAt: new Date('2024-01-15'),
  }
};

// Test campaign data
export const testCampaigns = [
  {
    id: 'test-campaign-001',
    campaignDisplayId: 'CAM001',
    creatorId: testUsers.verifiedCreator.id,
    title: 'Emergency Medical Fund for Test Patient',
    description: 'Urgent medical assistance needed for life-saving surgery',
    category: 'healthcare',
    goalAmount: '500000.00',
    minimumAmount: '250000.00',
    currentAmount: '350000.00',
    claimedAmount: '100000.00',
    status: 'active',
    tesVerified: true,
    duration: 30,
    needsVolunteers: true,
    volunteerSlots: 10,
    volunteerSlotsFilledCount: 3,
    street: '123 Test Street',
    barangay: 'Test Barangay',
    city: 'Manila',
    province: 'Metro Manila',
    region: 'NCR',
    zipcode: '1000',
  },
  {
    id: 'test-campaign-002',
    campaignDisplayId: 'CAM002',
    creatorId: testUsers.verifiedCreator.id,
    title: 'Community School Renovation Project',
    description: 'Renovating classrooms for better learning environment',
    category: 'education',
    goalAmount: '800000.00',
    minimumAmount: '400000.00',
    currentAmount: '125000.00',
    claimedAmount: '0.00',
    status: 'pending',
    tesVerified: false,
    duration: 60,
    needsVolunteers: true,
    volunteerSlots: 25,
    volunteerSlotsFilledCount: 0,
    street: '456 School Road',
    barangay: 'Education Barangay',
    city: 'Quezon City',
    province: 'Metro Manila',
    region: 'NCR',
    zipcode: '1100',
  }
];

// Test transactions data
export const testTransactions = [
  {
    id: 'test-txn-001',
    transactionDisplayId: 'TXN001',
    userId: testUsers.tipper.id,
    campaignId: testCampaigns[0].id,
    type: 'contribution',
    amount: '10000.00',
    currency: 'PHP',
    description: 'Contribution to Emergency Medical Fund',
    status: 'completed',
    transactionHash: 'test-hash-001',
    paymentProvider: 'paymongo',
    paymentProviderTxId: 'pm_test_001',
  },
  {
    id: 'test-txn-002',
    transactionDisplayId: 'TXN002',
    userId: testUsers.tipper.id,
    campaignId: testCampaigns[0].id,
    type: 'tip',
    amount: '5000.00',
    currency: 'PHP',
    description: 'Tip for campaign creator',
    status: 'completed',
    transactionHash: 'test-hash-002',
    paymentProvider: 'paymongo',
    paymentProviderTxId: 'pm_test_002',
  }
];

// Test support tickets
export const testSupportTickets = [
  {
    id: 'test-ticket-001',
    ticketNumber: 'TKT-0001',
    userId: testUsers.basicUser.id,
    subject: 'Unable to verify KYC documents',
    message: 'I have uploaded my documents but the verification is stuck',
    status: 'open',
    priority: 'medium',
    category: 'account',
  },
  {
    id: 'test-ticket-002',
    ticketNumber: 'TKT-0002',
    userId: testUsers.verifiedCreator.id,
    subject: 'Campaign not appearing in search',
    message: 'My approved campaign is not showing up in the public listing',
    status: 'claimed',
    priority: 'high',
    category: 'technical',
    claimedBy: testUsers.support.id,
    claimedByEmail: testUsers.support.email,
    claimedAt: new Date(),
  }
];

// Test volunteer opportunities
export const testVolunteerOpportunities = [
  {
    id: 'test-vol-001',
    campaignId: testCampaigns[0].id,
    title: 'Medical Support Volunteer',
    description: 'Help coordinate medical appointments and documentation',
    location: 'Manila General Hospital',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-02-28'),
    slotsNeeded: 5,
    slotsFilled: 2,
    status: 'active',
  }
];

// Test volunteer applications
export const testVolunteerApplications = [
  {
    id: 'test-app-001',
    opportunityId: testVolunteerOpportunities[0].id,
    campaignId: testCampaigns[0].id,
    volunteerId: testUsers.volunteer.id,
    status: 'approved',
    message: 'I have medical background and want to help',
    intent: 'Contributing my medical knowledge to help patients',
    telegramDisplayName: 'VolunteerHelper',
    telegramUsername: '@volunteer_helper',
  }
];

export async function cleanupDatabase() {
  try {
    console.log('🧹 Cleaning test data...');
    
    // Delete in reverse order of dependencies
    await db.delete(volunteerApplications).where(eq(volunteerApplications.id, testVolunteerApplications[0].id));
    await db.delete(volunteerOpportunities).where(eq(volunteerOpportunities.id, testVolunteerOpportunities[0].id));
    await db.delete(supportTickets).where(eq(supportTickets.ticketNumber, 'TKT-0001'));
    await db.delete(supportTickets).where(eq(supportTickets.ticketNumber, 'TKT-0002'));
    
    for (const txn of testTransactions) {
      await db.delete(transactions).where(eq(transactions.id, txn.id));
    }
    
    await db.delete(contributions).where(eq(contributions.campaignId, testCampaigns[0].id));
    await db.delete(tips).where(eq(tips.campaignId, testCampaigns[0].id));
    
    for (const campaign of testCampaigns) {
      await db.delete(campaigns).where(eq(campaigns.id, campaign.id));
    }
    
    for (const user of Object.values(testUsers)) {
      await db.delete(users).where(eq(users.id, user.id));
    }
    
    console.log('✅ Test data cleanup complete');
  } catch (error) {
    console.error('❌ Error cleaning test data:', error);
    // Don't throw to allow tests to continue
  }
}

export async function seedTestData() {
  try {
    console.log('🌱 Seeding test data...');
    
    // Insert test users
    for (const user of Object.values(testUsers)) {
      await db.insert(users).values(user).onConflictDoNothing();
    }
    
    // Insert test campaigns
    for (const campaign of testCampaigns) {
      await db.insert(campaigns).values(campaign).onConflictDoNothing();
    }
    
    // Insert test transactions
    for (const transaction of testTransactions) {
      await db.insert(transactions).values(transaction).onConflictDoNothing();
    }
    
    // Insert test contributions
    await db.insert(contributions).values({
      id: 'test-contrib-001',
      campaignId: testCampaigns[0].id,
      contributorId: testUsers.tipper.id,
      amount: '10000.00',
      message: 'Hope this helps with the medical expenses',
      isAnonymous: false,
      transactionHash: 'contrib-hash-001',
    }).onConflictDoNothing();
    
    // Insert test tips
    await db.insert(tips).values({
      id: 'test-tip-001',
      campaignId: testCampaigns[0].id,
      tipperId: testUsers.tipper.id,
      creatorId: testUsers.verifiedCreator.id,
      amount: '5000.00',
      message: 'Great work on organizing this campaign!',
      isAnonymous: false,
      transactionHash: 'tip-hash-001',
    }).onConflictDoNothing();
    
    // Insert test support tickets
    for (const ticket of testSupportTickets) {
      await db.insert(supportTickets).values(ticket).onConflictDoNothing();
    }
    
    // Insert test volunteer opportunities
    for (const opportunity of testVolunteerOpportunities) {
      await db.insert(volunteerOpportunities).values(opportunity).onConflictDoNothing();
    }
    
    // Insert test volunteer applications
    for (const application of testVolunteerApplications) {
      await db.insert(volunteerApplications).values(application).onConflictDoNothing();
    }
    
    console.log('✅ Test data seeding complete');
    console.log(`   Users: ${Object.keys(testUsers).length}`);
    console.log(`   Campaigns: ${testCampaigns.length}`);
    console.log(`   Transactions: ${testTransactions.length}`);
    console.log(`   Support Tickets: ${testSupportTickets.length}`);
    console.log(`   Volunteer Opportunities: ${testVolunteerOpportunities.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
}

// Helper function to get test user by role
export function getTestUser(role: keyof typeof testUsers) {
  return testUsers[role];
}

// Helper function to get test campaign by index
export function getTestCampaign(index: number = 0) {
  return testCampaigns[index];
}

// Helper function to create mock authentication headers
export function createAuthHeaders(userId: string) {
  return {
    'Authorization': `Bearer mock-token-${userId}`,
    'Content-Type': 'application/json',
  };
}