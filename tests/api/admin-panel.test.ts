import request from 'supertest';
import { app } from '../../server/index';
import { getTestUser, createAuthHeaders } from '../helpers/testData';

describe('Admin Panel Tests', () => {
  const adminUser = getTestUser('admin');
  const supportUser = getTestUser('support');
  const basicUser = getTestUser('basicUser');

  const adminHeaders = createAuthHeaders(adminUser.id);
  const supportHeaders = createAuthHeaders(supportUser.id);
  const basicHeaders = createAuthHeaders(basicUser.id);

  describe('Admin Panel Tab Access', () => {
    test('admin should access Reports tab', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalCampaigns');
      expect(response.body).toHaveProperty('totalContributions');
      expect(response.body).toHaveProperty('verifiedUsers');
    });

    test('admin should access Support Tickets tab', async () => {
      const response = await request(app)
        .get('/api/admin/support-tickets')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('admin should access Users management', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('admin should access Campaigns management', async () => {
      const response = await request(app)
        .get('/api/admin/campaigns')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('admin should access Transactions', async () => {
      const response = await request(app)
        .get('/api/admin/transactions')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('admin should access Documents (KYC)', async () => {
      const response = await request(app)
        .get('/api/admin/kyc-requests')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('admin should access Volunteers management', async () => {
      const response = await request(app)
        .get('/api/admin/volunteer-applications')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('support should have limited access to admin endpoints', async () => {
      // Support can access tickets and some user management
      const ticketsResponse = await request(app)
        .get('/api/admin/support-tickets')
        .set(supportHeaders);
      
      expect(ticketsResponse.status).toBe(200);

      // But cannot access full analytics
      const analyticsResponse = await request(app)
        .get('/api/admin/analytics')
        .set(supportHeaders);
      
      expect(analyticsResponse.status).toBe(403);
    });

    test('basic user should NOT access any admin endpoints', async () => {
      const endpoints = [
        '/api/admin/analytics',
        '/api/admin/support-tickets',
        '/api/admin/users',
        '/api/admin/campaigns',
        '/api/admin/transactions'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .set(basicHeaders);

        expect(response.status).toBe(403);
      }
    });
  });

  describe('ID Visibility and Search', () => {
    test('admin should see all transaction IDs', async () => {
      const response = await request(app)
        .get('/api/admin/transactions')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('transactionDisplayId');
        expect(response.body[0]).toHaveProperty('userId');
      }
    });

    test('admin should see all user IDs', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('userDisplayId');
        expect(response.body[0]).toHaveProperty('email');
      }
    });

    test('admin should see all campaign IDs', async () => {
      const response = await request(app)
        .get('/api/admin/campaigns')
        .set(adminHeaders);

      expect(response.status).toBe(200);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('campaignDisplayId');
        expect(response.body[0]).toHaveProperty('creatorId');
      }
    });

    test('admin should be able to search by ID', async () => {
      const response = await request(app)
        .get('/api/admin/search')
        .query({ q: 'test-campaign-001', type: 'campaign' })
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('admin should be able to search users by email', async () => {
      const response = await request(app)
        .get('/api/admin/search')
        .query({ q: 'creator@test.verifund.org', type: 'user' })
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Support Ticket Claim System', () => {
    test('support staff should be able to claim tickets', async () => {
      const response = await request(app)
        .patch('/api/admin/support-tickets/test-ticket-001/claim')
        .set(supportHeaders);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('claimed');
      expect(response.body.claimedBy).toBe(supportUser.id);
    });

    test('admin should be able to assign tickets to support staff', async () => {
      const response = await request(app)
        .patch('/api/admin/support-tickets/test-ticket-001/assign')
        .set(adminHeaders)
        .send({ assignTo: supportUser.id });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('assigned');
      expect(response.body.assignedTo).toBe(supportUser.id);
      expect(response.body.assignedByAdmin).toBe(adminUser.id);
    });

    test('basic user should NOT be able to claim tickets', async () => {
      const response = await request(app)
        .patch('/api/admin/support-tickets/test-ticket-001/claim')
        .set(basicHeaders);

      expect(response.status).toBe(403);
    });

    test('should track ticket status changes correctly', async () => {
      // Create a new ticket
      const createResponse = await request(app)
        .post('/api/support-tickets')
        .set(basicHeaders)
        .send({
          subject: 'Test Status Tracking',
          message: 'Testing status changes',
          category: 'general'
        });

      expect(createResponse.status).toBe(201);
      const ticketId = createResponse.body.id;

      // Check initial status
      let statusResponse = await request(app)
        .get(`/api/admin/support-tickets/${ticketId}`)
        .set(adminHeaders);
      
      expect(statusResponse.body.status).toBe('open');

      // Claim ticket (pending → in progress)
      await request(app)
        .patch(`/api/admin/support-tickets/${ticketId}/claim`)
        .set(supportHeaders);

      statusResponse = await request(app)
        .get(`/api/admin/support-tickets/${ticketId}`)
        .set(adminHeaders);
      
      expect(statusResponse.body.status).toBe('claimed');

      // Resolve ticket (in progress → resolved)
      await request(app)
        .patch(`/api/admin/support-tickets/${ticketId}/resolve`)
        .set(supportHeaders)
        .send({ resolutionNotes: 'Issue resolved successfully' });

      statusResponse = await request(app)
        .get(`/api/admin/support-tickets/${ticketId}`)
        .set(adminHeaders);
      
      expect(statusResponse.body.status).toBe('resolved');
      expect(statusResponse.body.resolutionNotes).toBe('Issue resolved successfully');
    });
  });

  describe('Admin Panel Search Engine', () => {
    test('should search across all entities', async () => {
      const searchTerms = ['test', 'creator', 'CAM001', 'TXN001'];
      
      for (const term of searchTerms) {
        const response = await request(app)
          .get('/api/admin/universal-search')
          .query({ q: term })
          .set(adminHeaders);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('users');
        expect(response.body).toHaveProperty('campaigns');
        expect(response.body).toHaveProperty('transactions');
        expect(response.body).toHaveProperty('tickets');
        expect(Array.isArray(response.body.users)).toBe(true);
        expect(Array.isArray(response.body.campaigns)).toBe(true);
        expect(Array.isArray(response.body.transactions)).toBe(true);
        expect(Array.isArray(response.body.tickets)).toBe(true);
      }
    });

    test('should filter search results by type', async () => {
      const response = await request(app)
        .get('/api/admin/universal-search')
        .query({ q: 'test', type: 'campaigns' })
        .set(adminHeaders);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('campaigns');
      expect(response.body).not.toHaveProperty('users');
    });

    test('support staff should have limited search access', async () => {
      const response = await request(app)
        .get('/api/admin/universal-search')
        .query({ q: 'test' })
        .set(supportHeaders);

      expect(response.status).toBe(200);
      // Support can search tickets and basic user info but not full analytics
      expect(response.body).toHaveProperty('tickets');
    });
  });
});