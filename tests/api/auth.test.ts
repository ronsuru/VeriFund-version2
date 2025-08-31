import request from 'supertest';
import { app } from '../../server/index';
import { getTestUser, createAuthHeaders } from '../helpers/testData';

describe('Authentication & Role Access Tests', () => {
  const testUsers = {
    admin: getTestUser('admin'),
    support: getTestUser('support'),
    verifiedCreator: getTestUser('verifiedCreator'),
    basicUser: getTestUser('basicUser'),
    volunteer: getTestUser('volunteer'),
    tipper: getTestUser('tipper'),
    flaggedUser: getTestUser('flaggedUser')
  };

  describe('Authentication Endpoints', () => {
    test('should authenticate admin user', async () => {
      const response = await request(app)
        .get('/api/auth/user')
        .set(createAuthHeaders(testUsers.admin.id));

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testUsers.admin.id);
      expect(response.body.isAdmin).toBe(true);
    });

    test('should authenticate support user', async () => {
      const response = await request(app)
        .get('/api/auth/user')
        .set(createAuthHeaders(testUsers.support.id));

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testUsers.support.id);
      expect(response.body.isSupport).toBe(true);
    });

    test('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/auth/user');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });
  });

  describe('Role-Based Access Control', () => {
    test('admin should access admin-only endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set(createAuthHeaders(testUsers.admin.id));

      expect(response.status).toBe(200);
    });

    test('support should access support endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/support-tickets')
        .set(createAuthHeaders(testUsers.support.id));

      expect(response.status).toBe(200);
    });

    test('basic user should NOT access admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set(createAuthHeaders(testUsers.basicUser.id));

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Admin or Support access required');
    });

    test('flagged user should have limited access', async () => {
      const response = await request(app)
        .post('/api/campaigns')
        .set(createAuthHeaders(testUsers.flaggedUser.id))
        .send({
          title: 'Test Campaign',
          description: 'Test Description',
          category: 'education',
          goalAmount: '100000',
          minimumAmount: '50000',
          duration: 30
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Campaign creation restricted');
    });

    test('admin and support cannot create campaigns', async () => {
      const adminResponse = await request(app)
        .post('/api/campaigns')
        .set(createAuthHeaders(testUsers.admin.id))
        .send({
          title: 'Admin Campaign',
          description: 'Test Description',
          category: 'education',
          goalAmount: '100000',
          minimumAmount: '50000',
          duration: 30
        });

      expect(adminResponse.status).toBe(403);
      expect(adminResponse.body.message).toBe('Administrative accounts cannot create campaigns');

      const supportResponse = await request(app)
        .post('/api/campaigns')
        .set(createAuthHeaders(testUsers.support.id))
        .send({
          title: 'Support Campaign',
          description: 'Test Description',
          category: 'education',
          goalAmount: '100000',
          minimumAmount: '50000',
          duration: 30
        });

      expect(supportResponse.status).toBe(403);
      expect(supportResponse.body.message).toBe('Administrative accounts cannot create campaigns');
    });

    test('admin and support cannot contribute to campaigns', async () => {
      const adminResponse = await request(app)
        .post('/api/campaigns/test-campaign-001/contribute')
        .set(createAuthHeaders(testUsers.admin.id))
        .send({
          amount: '1000',
          message: 'Admin contribution'
        });

      expect(adminResponse.status).toBe(403);
      expect(adminResponse.body.message).toBe('Administrative accounts cannot contribute to campaigns');
    });
  });

  describe('User Status Checks', () => {
    test('should check suspension status', async () => {
      const response = await request(app)
        .get('/api/users/suspension-status')
        .set(createAuthHeaders(testUsers.flaggedUser.id));

      expect(response.status).toBe(200);
      expect(response.body.isFlagged).toBe(true);
      expect(response.body.flagReason).toBe('Suspicious campaign behavior');
    });

    test('should check KYC status for basic user', async () => {
      const response = await request(app)
        .get('/api/auth/user')
        .set(createAuthHeaders(testUsers.basicUser.id));

      expect(response.status).toBe(200);
      expect(response.body.kycStatus).toBe('pending');
    });

    test('should check verified status for creator', async () => {
      const response = await request(app)
        .get('/api/auth/user')
        .set(createAuthHeaders(testUsers.verifiedCreator.id));

      expect(response.status).toBe(200);
      expect(response.body.kycStatus).toBe('verified');
      expect(response.body.credibilityScore).toBe('95.50');
    });
  });
});