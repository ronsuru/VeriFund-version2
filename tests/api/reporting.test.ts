import request from 'supertest';
import { app } from '../../server/index';
import { getTestUser, createAuthHeaders } from '../helpers/testData';

describe('Reporting & Claim Flow Tests', () => {
  const basicUser = getTestUser('basicUser');
  const admin = getTestUser('admin');
  const support = getTestUser('support');
  const creator = getTestUser('verifiedCreator');

  const basicHeaders = createAuthHeaders(basicUser.id);
  const adminHeaders = createAuthHeaders(admin.id);
  const supportHeaders = createAuthHeaders(support.id);
  const creatorHeaders = createAuthHeaders(creator.id);

  describe('Report Submission Flow', () => {
    test('user should be able to submit support ticket', async () => {
      const ticketData = {
        subject: 'Test Support Request',
        message: 'This is a test support ticket to verify the reporting system',
        category: 'technical',
        priority: 'medium'
      };

      const response = await request(app)
        .post('/api/support-tickets')
        .set(basicHeaders)
        .send(ticketData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('ticketNumber');
      expect(response.body.subject).toBe(ticketData.subject);
      expect(response.body.status).toBe('open');
      expect(response.body.userId).toBe(basicUser.id);
    });

    test('ticket should be routed correctly to support queue', async () => {
      // Create ticket
      const ticketResponse = await request(app)
        .post('/api/support-tickets')
        .set(basicHeaders)
        .send({
          subject: 'Routing Test Ticket',
          message: 'Testing ticket routing',
          category: 'account',
          priority: 'high'
        });

      expect(ticketResponse.status).toBe(201);
      const ticketId = ticketResponse.body.id;

      // Check that support staff can see the ticket
      const supportQueueResponse = await request(app)
        .get('/api/admin/support-tickets')
        .set(supportHeaders);

      expect(supportQueueResponse.status).toBe(200);
      const ticket = supportQueueResponse.body.find((t: any) => t.id === ticketId);
      expect(ticket).toBeDefined();
      expect(ticket.status).toBe('open');
      expect(ticket.priority).toBe('high');
    });

    test('should handle ticket attachments', async () => {
      const ticketData = {
        subject: 'Ticket with Attachments',
        message: 'This ticket includes file attachments',
        category: 'technical',
        attachments: JSON.stringify([
          { name: 'screenshot.png', url: '/uploads/screenshot.png' },
          { name: 'log.txt', url: '/uploads/log.txt' }
        ])
      };

      const response = await request(app)
        .post('/api/support-tickets')
        .set(basicHeaders)
        .send(ticketData);

      expect(response.status).toBe(201);
      expect(response.body.attachments).toBeTruthy();
      
      const attachments = JSON.parse(response.body.attachments);
      expect(Array.isArray(attachments)).toBe(true);
      expect(attachments).toHaveLength(2);
    });

    test('should validate ticket data', async () => {
      // Missing subject
      const invalidResponse = await request(app)
        .post('/api/support-tickets')
        .set(basicHeaders)
        .send({
          message: 'Missing subject',
          category: 'general'
        });

      expect(invalidResponse.status).toBe(400);

      // Empty message
      const emptyMessageResponse = await request(app)
        .post('/api/support-tickets')
        .set(basicHeaders)
        .send({
          subject: 'Empty Message Test',
          message: '',
          category: 'general'
        });

      expect(emptyMessageResponse.status).toBe(400);
    });
  });

  describe('Ticket Claiming System', () => {
    let testTicketId: string;

    beforeEach(async () => {
      // Create a fresh ticket for each test
      const response = await request(app)
        .post('/api/support-tickets')
        .set(basicHeaders)
        .send({
          subject: 'Claiming Test Ticket',
          message: 'This ticket is for testing the claim system',
          category: 'general'
        });
      
      testTicketId = response.body.id;
    });

    test('support staff should be able to claim open tickets', async () => {
      const response = await request(app)
        .patch(`/api/admin/support-tickets/${testTicketId}/claim`)
        .set(supportHeaders);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('claimed');
      expect(response.body.claimedBy).toBe(support.id);
      expect(response.body.claimedByEmail).toBe(support.email);
      expect(response.body.claimedAt).toBeTruthy();
    });

    test('admin should be able to assign tickets to support staff', async () => {
      const response = await request(app)
        .patch(`/api/admin/support-tickets/${testTicketId}/assign`)
        .set(adminHeaders)
        .send({
          assignTo: support.id
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('assigned');
      expect(response.body.assignedTo).toBe(support.id);
      expect(response.body.assignedByAdmin).toBe(admin.id);
      expect(response.body.assignedAt).toBeTruthy();
    });

    test('claim buttons should only appear under correct tabs', async () => {
      // Support should see claim button for open tickets
      const openTicketsResponse = await request(app)
        .get('/api/admin/support-tickets')
        .query({ status: 'open' })
        .set(supportHeaders);

      expect(openTicketsResponse.status).toBe(200);
      
      const openTicket = openTicketsResponse.body.find((t: any) => t.id === testTicketId);
      expect(openTicket.status).toBe('open');
      // In real implementation, the frontend would show claim button for open tickets

      // Claim the ticket
      await request(app)
        .patch(`/api/admin/support-tickets/${testTicketId}/claim`)
        .set(supportHeaders);

      // Check claimed tickets tab
      const claimedTicketsResponse = await request(app)
        .get('/api/admin/support-tickets')
        .query({ status: 'claimed' })
        .set(supportHeaders);

      const claimedTicket = claimedTicketsResponse.body.find((t: any) => t.id === testTicketId);
      expect(claimedTicket.status).toBe('claimed');
      // Claimed tickets should not show claim button
    });

    test('basic users should not be able to claim tickets', async () => {
      const response = await request(app)
        .patch(`/api/admin/support-tickets/${testTicketId}/claim`)
        .set(basicHeaders);

      expect(response.status).toBe(403);
    });

    test('should prevent double claiming', async () => {
      // First claim
      const firstClaimResponse = await request(app)
        .patch(`/api/admin/support-tickets/${testTicketId}/claim`)
        .set(supportHeaders);

      expect(firstClaimResponse.status).toBe(200);

      // Second claim attempt should fail
      const secondClaimResponse = await request(app)
        .patch(`/api/admin/support-tickets/${testTicketId}/claim`)
        .set(adminHeaders); // Different user trying to claim

      expect(secondClaimResponse.status).toBe(400);
      expect(secondClaimResponse.body.message).toContain('already claimed');
    });
  });

  describe('Ticket Status Progression', () => {
    let testTicketId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/support-tickets')
        .set(basicHeaders)
        .send({
          subject: 'Status Progression Test',
          message: 'Testing status changes',
          category: 'technical'
        });
      
      testTicketId = response.body.id;
    });

    test('should follow proper status progression: open → claimed → resolved', async () => {
      // Initial status should be 'open'
      let statusResponse = await request(app)
        .get(`/api/admin/support-tickets/${testTicketId}`)
        .set(adminHeaders);
      
      expect(statusResponse.body.status).toBe('open');

      // Claim ticket (open → claimed)
      const claimResponse = await request(app)
        .patch(`/api/admin/support-tickets/${testTicketId}/claim`)
        .set(supportHeaders);

      expect(claimResponse.body.status).toBe('claimed');

      // Update status to in progress
      const progressResponse = await request(app)
        .patch(`/api/admin/support-tickets/${testTicketId}/status`)
        .set(supportHeaders)
        .send({ status: 'on_progress' });

      expect(progressResponse.body.status).toBe('on_progress');

      // Resolve ticket (in progress → resolved)
      const resolveResponse = await request(app)
        .patch(`/api/admin/support-tickets/${testTicketId}/resolve`)
        .set(supportHeaders)
        .send({
          resolutionNotes: 'Issue has been resolved successfully'
        });

      expect(resolveResponse.body.status).toBe('resolved');
      expect(resolveResponse.body.resolutionNotes).toBe('Issue has been resolved successfully');
      expect(resolveResponse.body.resolvedAt).toBeTruthy();
    });

    test('should handle assignment workflow: open → assigned → resolved', async () => {
      // Admin assigns ticket to support staff
      const assignResponse = await request(app)
        .patch(`/api/admin/support-tickets/${testTicketId}/assign`)
        .set(adminHeaders)
        .send({ assignTo: support.id });

      expect(assignResponse.body.status).toBe('assigned');

      // Assigned support staff resolves the ticket
      const resolveResponse = await request(app)
        .patch(`/api/admin/support-tickets/${testTicketId}/resolve`)
        .set(supportHeaders)
        .send({
          resolutionNotes: 'Resolved by assigned staff member'
        });

      expect(resolveResponse.body.status).toBe('resolved');
      expect(resolveResponse.body.assignedTo).toBe(support.id);
    });

    test('should track timestamps for each status change', async () => {
      // Claim ticket
      const claimResponse = await request(app)
        .patch(`/api/admin/support-tickets/${testTicketId}/claim`)
        .set(supportHeaders);

      expect(claimResponse.body.claimedAt).toBeTruthy();
      
      const claimTime = new Date(claimResponse.body.claimedAt);
      
      // Wait a moment to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));

      // Resolve ticket
      const resolveResponse = await request(app)
        .patch(`/api/admin/support-tickets/${testTicketId}/resolve`)
        .set(supportHeaders)
        .send({
          resolutionNotes: 'Timestamp tracking test'
        });

      expect(resolveResponse.body.resolvedAt).toBeTruthy();
      
      const resolveTime = new Date(resolveResponse.body.resolvedAt);
      expect(resolveTime.getTime()).toBeGreaterThan(claimTime.getTime());
    });

    test('should validate status transitions', async () => {
      // Cannot resolve without claiming first
      const directResolveResponse = await request(app)
        .patch(`/api/admin/support-tickets/${testTicketId}/resolve`)
        .set(supportHeaders)
        .send({
          resolutionNotes: 'Attempting to resolve without claiming'
        });

      expect(directResolveResponse.status).toBe(400);
      expect(directResolveResponse.body.message).toContain('must be claimed');

      // Cannot change status to invalid value
      const invalidStatusResponse = await request(app)
        .patch(`/api/admin/support-tickets/${testTicketId}/status`)
        .set(supportHeaders)
        .send({ status: 'invalid_status' });

      expect(invalidStatusResponse.status).toBe(400);
    });
  });

  describe('Email Notifications', () => {
    test('should send email notification when ticket is created', async () => {
      const ticketResponse = await request(app)
        .post('/api/support-tickets')
        .set(basicHeaders)
        .send({
          subject: 'Email Notification Test',
          message: 'Testing email notifications',
          category: 'general'
        });

      expect(ticketResponse.status).toBe(201);

      // Check that email tracking fields are set
      const ticketId = ticketResponse.body.id;
      const ticketDetailsResponse = await request(app)
        .get(`/api/admin/support-tickets/${ticketId}`)
        .set(adminHeaders);

      // In real implementation, emailSentAt would be set after successful email send
      expect(ticketDetailsResponse.body).toHaveProperty('emailSentAt');
    });

    test('should send notification when ticket status changes', async () => {
      // Create ticket
      const ticketResponse = await request(app)
        .post('/api/support-tickets')
        .set(basicHeaders)
        .send({
          subject: 'Status Change Notification',
          message: 'Testing status change notifications',
          category: 'general'
        });

      const ticketId = ticketResponse.body.id;

      // Claim ticket (should trigger notification)
      const claimResponse = await request(app)
        .patch(`/api/admin/support-tickets/${ticketId}/claim`)
        .set(supportHeaders);

      expect(claimResponse.status).toBe(200);

      // Resolve ticket (should trigger notification)
      const resolveResponse = await request(app)
        .patch(`/api/admin/support-tickets/${ticketId}/resolve`)
        .set(supportHeaders)
        .send({
          resolutionNotes: 'Issue resolved - notification test'
        });

      expect(resolveResponse.status).toBe(200);
      
      // Check user notifications
      const notificationsResponse = await request(app)
        .get('/api/notifications')
        .set(basicHeaders);

      expect(notificationsResponse.status).toBe(200);
      
      const ticketNotifications = notificationsResponse.body.filter((n: any) => 
        n.relatedId === ticketId
      );
      
      expect(ticketNotifications.length).toBeGreaterThan(0);
    });
  });
});