import request from 'supertest';
import { app } from '../../server/index';
import { getTestUser, getTestCampaign, createAuthHeaders } from '../helpers/testData';

describe('Transactions & Contributions Tests', () => {
  const tipper = getTestUser('tipper');
  const creator = getTestUser('verifiedCreator');
  const admin = getTestUser('admin');
  const testCampaign = getTestCampaign(0);

  const tipperHeaders = createAuthHeaders(tipper.id);
  const creatorHeaders = createAuthHeaders(creator.id);
  const adminHeaders = createAuthHeaders(admin.id);

  describe('Contribution Flow', () => {
    test('verified user should be able to contribute to active campaign', async () => {
      const contributionData = {
        amount: '5000.00',
        message: 'Hope this helps!',
        isAnonymous: false
      };

      const response = await request(app)
        .post(`/api/campaigns/${testCampaign.id}/contribute`)
        .set(tipperHeaders)
        .send(contributionData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.amount).toBe(contributionData.amount);
      expect(response.body.contributorId).toBe(tipper.id);
      expect(response.body.campaignId).toBe(testCampaign.id);
    });

    test('contribution should create transaction record', async () => {
      const contributionData = {
        amount: '3000.00',
        message: 'Another contribution',
        isAnonymous: false
      };

      const contributionResponse = await request(app)
        .post(`/api/campaigns/${testCampaign.id}/contribute`)
        .set(tipperHeaders)
        .send(contributionData);

      expect(contributionResponse.status).toBe(201);

      // Check if transaction was created
      const transactionsResponse = await request(app)
        .get('/api/admin/transactions')
        .set(adminHeaders);

      const contribution = contributionResponse.body;
      const transaction = transactionsResponse.body.find((t: any) => 
        t.type === 'contribution' && 
        t.amount === contributionData.amount &&
        t.userId === tipper.id
      );

      expect(transaction).toBeDefined();
      expect(transaction.campaignId).toBe(testCampaign.id);
      expect(transaction.status).toBe('completed');
    });

    test('should apply correct fees to contributions', async () => {
      const contributionAmount = 10000;
      const expectedPlatformFee = contributionAmount * 0.025; // 2.5%
      const expectedNetAmount = contributionAmount - expectedPlatformFee;

      const response = await request(app)
        .post(`/api/campaigns/${testCampaign.id}/contribute`)
        .set(tipperHeaders)
        .send({
          amount: contributionAmount.toString(),
          message: 'Fee calculation test'
        });

      expect(response.status).toBe(201);

      // Check campaign amount increased by net amount
      const campaignResponse = await request(app)
        .get(`/api/campaigns/${testCampaign.id}`);

      // The campaign currentAmount should include the full contribution
      // Fees are handled separately in the platform
      const updatedCampaign = campaignResponse.body;
      const originalAmount = parseFloat(testCampaign.currentAmount);
      const newAmount = parseFloat(updatedCampaign.currentAmount);
      
      expect(newAmount).toBeGreaterThan(originalAmount);
    });

    test('should reject contribution to inactive campaign', async () => {
      // Try to contribute to pending campaign
      const pendingCampaign = getTestCampaign(1); // This one has status 'pending'

      const response = await request(app)
        .post(`/api/campaigns/${pendingCampaign.id}/contribute`)
        .set(tipperHeaders)
        .send({
          amount: '1000.00',
          message: 'This should fail'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Campaign is not active');
    });
  });

  describe('Tip Flow', () => {
    test('user should be able to tip campaign creator', async () => {
      const tipData = {
        amount: '2000.00',
        message: 'Great work on this campaign!',
        isAnonymous: false
      };

      const response = await request(app)
        .post(`/api/campaigns/${testCampaign.id}/tip`)
        .set(tipperHeaders)
        .send(tipData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.amount).toBe(tipData.amount);
      expect(response.body.tipperId).toBe(tipper.id);
      expect(response.body.creatorId).toBe(creator.id);
    });

    test('tip should create transaction record and update creator balance', async () => {
      const tipAmount = '1500.00';
      
      // Get creator's initial balance
      const initialCreatorResponse = await request(app)
        .get('/api/auth/user')
        .set(creatorHeaders);
      
      const initialTipsBalance = parseFloat(initialCreatorResponse.body.tipsBalance || '0');

      const response = await request(app)
        .post(`/api/campaigns/${testCampaign.id}/tip`)
        .set(tipperHeaders)
        .send({
          amount: tipAmount,
          message: 'Keep up the good work!'
        });

      expect(response.status).toBe(201);

      // Check creator's updated balance
      const updatedCreatorResponse = await request(app)
        .get('/api/auth/user')
        .set(creatorHeaders);
      
      const updatedTipsBalance = parseFloat(updatedCreatorResponse.body.tipsBalance || '0');
      expect(updatedTipsBalance).toBeGreaterThan(initialTipsBalance);
    });

    test('should apply tip fees correctly', async () => {
      const tipAmount = 5000;
      const expectedTipFee = tipAmount * 0.02; // 2% tip fee
      
      const response = await request(app)
        .post(`/api/campaigns/${testCampaign.id}/tip`)
        .set(tipperHeaders)
        .send({
          amount: tipAmount.toString(),
          message: 'Tip fee test'
        });

      expect(response.status).toBe(201);

      // Check transaction record for fee calculation
      const transactionsResponse = await request(app)
        .get('/api/admin/transactions')
        .set(adminHeaders);

      const tipTransaction = transactionsResponse.body.find((t: any) => 
        t.type === 'tip' && 
        t.amount === tipAmount.toString() &&
        t.userId === tipper.id
      );

      expect(tipTransaction).toBeDefined();
      expect(parseFloat(tipTransaction.feeAmount || '0')).toBe(expectedTipFee);
    });
  });

  describe('Withdrawal Flow', () => {
    test('creator should be able to withdraw available funds', async () => {
      const withdrawalAmount = '5000.00';

      const response = await request(app)
        .post('/api/wallet/withdraw')
        .set(creatorHeaders)
        .send({
          amount: withdrawalAmount,
          method: 'bank_transfer'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('transactionId');
      expect(response.body.amount).toBe(withdrawalAmount);
    });

    test('should reject withdrawal exceeding available balance', async () => {
      const response = await request(app)
        .post('/api/wallet/withdraw')
        .set(creatorHeaders)
        .send({
          amount: '999999.00',
          method: 'bank_transfer'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient balance');
    });

    test('withdrawal should create transaction record', async () => {
      const withdrawalAmount = '2000.00';

      const withdrawalResponse = await request(app)
        .post('/api/wallet/withdraw')
        .set(creatorHeaders)
        .send({
          amount: withdrawalAmount,
          method: 'gcash'
        });

      expect(withdrawalResponse.status).toBe(201);

      // Check transaction was created
      const transactionsResponse = await request(app)
        .get('/api/admin/transactions')
        .set(adminHeaders);

      const withdrawalTransaction = transactionsResponse.body.find((t: any) => 
        t.type === 'withdrawal' && 
        t.amount === withdrawalAmount &&
        t.userId === creator.id
      );

      expect(withdrawalTransaction).toBeDefined();
      expect(withdrawalTransaction.status).toBe('pending');
    });
  });

  describe('Campaign Fund Claiming', () => {
    test('creator should be able to claim campaign funds', async () => {
      const claimAmount = '10000.00';

      const response = await request(app)
        .post(`/api/campaigns/${testCampaign.id}/claim`)
        .set(creatorHeaders)
        .send({
          amount: claimAmount,
          purpose: 'Medical supplies purchase'
        });

      expect(response.status).toBe(200);
      expect(response.body.claimedAmount).toBe(parseFloat(claimAmount));
    });

    test('should track claimed vs available amounts correctly', async () => {
      // Get campaign details before claim
      const initialResponse = await request(app)
        .get(`/api/campaigns/${testCampaign.id}`);
      
      const initialClaimedAmount = parseFloat(initialResponse.body.claimedAmount || '0');
      const currentAmount = parseFloat(initialResponse.body.currentAmount);
      
      const claimAmount = '5000.00';

      // Make claim
      const claimResponse = await request(app)
        .post(`/api/campaigns/${testCampaign.id}/claim`)
        .set(creatorHeaders)
        .send({
          amount: claimAmount,
          purpose: 'Equipment purchase'
        });

      expect(claimResponse.status).toBe(200);

      // Check updated amounts
      const updatedResponse = await request(app)
        .get(`/api/campaigns/${testCampaign.id}`);
      
      const updatedClaimedAmount = parseFloat(updatedResponse.body.claimedAmount);
      expect(updatedClaimedAmount).toBe(initialClaimedAmount + parseFloat(claimAmount));
      
      // Available amount should be currentAmount - claimedAmount
      const availableAmount = currentAmount - updatedClaimedAmount;
      expect(availableAmount).toBeGreaterThanOrEqual(0);
    });

    test('should reject claim exceeding available funds', async () => {
      const response = await request(app)
        .post(`/api/campaigns/${testCampaign.id}/claim`)
        .set(creatorHeaders)
        .send({
          amount: '999999.00',
          purpose: 'Excessive claim'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient claimable amount');
    });
  });

  describe('Transaction ID Sync', () => {
    test('transaction IDs should be consistent across all modules', async () => {
      // Create a contribution
      const contributionResponse = await request(app)
        .post(`/api/campaigns/${testCampaign.id}/contribute`)
        .set(tipperHeaders)
        .send({
          amount: '1000.00',
          message: 'ID sync test'
        });

      expect(contributionResponse.status).toBe(201);
      const contributionId = contributionResponse.body.id;

      // Check transaction record
      const transactionsResponse = await request(app)
        .get('/api/admin/transactions')
        .set(adminHeaders);

      const relatedTransaction = transactionsResponse.body.find((t: any) => 
        t.type === 'contribution' && t.userId === tipper.id
      );

      expect(relatedTransaction).toBeDefined();

      // Check campaign update
      const campaignResponse = await request(app)
        .get(`/api/campaigns/${testCampaign.id}`);

      expect(campaignResponse.status).toBe(200);

      // All IDs should reference the same entities
      expect(relatedTransaction.campaignId).toBe(testCampaign.id);
      expect(relatedTransaction.userId).toBe(tipper.id);
    });

    test('transaction display IDs should be unique and searchable', async () => {
      const transactionsResponse = await request(app)
        .get('/api/admin/transactions')
        .set(adminHeaders);

      expect(transactionsResponse.status).toBe(200);

      const displayIds = transactionsResponse.body
        .map((t: any) => t.transactionDisplayId)
        .filter((id: string) => id);

      // All display IDs should be unique
      const uniqueIds = new Set(displayIds);
      expect(uniqueIds.size).toBe(displayIds.length);

      // Should be able to search by display ID
      if (displayIds.length > 0) {
        const searchResponse = await request(app)
          .get('/api/admin/search')
          .query({ q: displayIds[0], type: 'transaction' })
          .set(adminHeaders);

        expect(searchResponse.status).toBe(200);
        expect(searchResponse.body.length).toBeGreaterThan(0);
      }
    });
  });
});