import { test, expect, Page } from '@playwright/test';

async function loginAsAdmin(page: Page) {
  await page.goto('/api/login');
  await page.evaluate(() => {
    window.localStorage.setItem('mockUser', JSON.stringify({
      email: 'admin@test.verifund.org',
      role: 'admin',
      isAdmin: true
    }));
  });
  await page.goto('/admin');
  await page.waitForLoadState('networkidle');
}

async function loginAsSupport(page: Page) {
  await page.goto('/api/login');
  await page.evaluate(() => {
    window.localStorage.setItem('mockUser', JSON.stringify({
      email: 'support@test.verifund.org',
      role: 'support',
      isSupport: true
    }));
  });
  await page.goto('/admin');
  await page.waitForLoadState('networkidle');
}

test.describe('Admin Panel E2E Tests', () => {
  
  test.describe('Admin Panel Tab Navigation', () => {
    test('admin should see all admin tabs', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Check for all admin tabs
      const expectedTabs = [
        'reports-tab',
        'tickets-tab',
        'support-management-tab',
        'users-tab',
        'campaigns-tab',
        'transactions-tab',
        'documents-tab',
        'volunteers-tab'
      ];
      
      for (const tabId of expectedTabs) {
        await expect(page.locator(`[data-testid="${tabId}"]`)).toBeVisible();
      }
    });

    test('support staff should see limited tabs', async ({ page }) => {
      await loginAsSupport(page);
      
      // Should see support-related tabs
      await expect(page.locator('[data-testid="tickets-tab"]')).toBeVisible();
      await expect(page.locator('[data-testid="support-management-tab"]')).toBeVisible();
      
      // Should NOT see full admin tabs
      await expect(page.locator('[data-testid="reports-tab"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="users-tab"]')).not.toBeVisible();
    });

    test('should be able to navigate between tabs', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Click Reports tab
      await page.locator('[data-testid="reports-tab"]').click();
      await expect(page.locator('[data-testid="reports-content"]')).toBeVisible();
      
      // Click Users tab
      await page.locator('[data-testid="users-tab"]').click();
      await expect(page.locator('[data-testid="users-content"]')).toBeVisible();
      
      // Click Campaigns tab
      await page.locator('[data-testid="campaigns-tab"]').click();
      await expect(page.locator('[data-testid="campaigns-content"]')).toBeVisible();
    });
  });

  test.describe('ID Visibility and Search', () => {
    test('admin should see all transaction IDs in transactions tab', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to transactions tab
      await page.locator('[data-testid="transactions-tab"]').click();
      
      // Wait for transactions to load
      await page.waitForSelector('[data-testid="transactions-table"]');
      
      // Check for transaction ID columns
      await expect(page.locator('[data-testid="transaction-id-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-id-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="campaign-id-header"]')).toBeVisible();
      
      // Check that actual IDs are visible in rows
      const firstRow = page.locator('[data-testid="transaction-row"]').first();
      await expect(firstRow.locator('[data-testid="transaction-id"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="user-id"]')).toBeVisible();
    });

    test('admin should see all user IDs in users tab', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to users tab
      await page.locator('[data-testid="users-tab"]').click();
      
      // Wait for users to load
      await page.waitForSelector('[data-testid="users-table"]');
      
      // Check for user ID columns
      await expect(page.locator('[data-testid="user-id-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="display-id-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-header"]')).toBeVisible();
      
      // Check that actual IDs are visible
      const firstUserRow = page.locator('[data-testid="user-row"]').first();
      await expect(firstUserRow.locator('[data-testid="user-id"]')).toBeVisible();
      await expect(firstUserRow.locator('[data-testid="user-display-id"]')).toBeVisible();
    });

    test('admin should see all campaign IDs in campaigns tab', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to campaigns tab
      await page.locator('[data-testid="campaigns-tab"]').click();
      
      // Wait for campaigns to load
      await page.waitForSelector('[data-testid="campaigns-table"]');
      
      // Check for campaign ID columns
      await expect(page.locator('[data-testid="campaign-id-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="campaign-display-id-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="creator-id-header"]')).toBeVisible();
      
      // Check that actual IDs are visible
      const firstCampaignRow = page.locator('[data-testid="campaign-row"]').first();
      await expect(firstCampaignRow.locator('[data-testid="campaign-id"]')).toBeVisible();
      await expect(firstCampaignRow.locator('[data-testid="creator-id"]')).toBeVisible();
    });

    test('admin should see document IDs in documents tab', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to documents tab
      await page.locator('[data-testid="documents-tab"]').click();
      
      // Wait for documents to load
      await page.waitForSelector('[data-testid="kyc-documents-table"]');
      
      // Check for document ID columns
      await expect(page.locator('[data-testid="document-id-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-id-header"]')).toBeVisible();
      
      // Check document rows
      const firstDocRow = page.locator('[data-testid="kyc-document-row"]').first();
      await expect(firstDocRow.locator('[data-testid="document-id"]')).toBeVisible();
    });
  });

  test.describe('Search Functionality', () => {
    test('should be able to search by transaction ID', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to transactions tab
      await page.locator('[data-testid="transactions-tab"]').click();
      
      // Use search box
      await page.locator('[data-testid="search-input"]').fill('TXN001');
      await page.locator('[data-testid="search-button"]').click();
      
      // Wait for search results
      await page.waitForSelector('[data-testid="search-results"]');
      
      // Should show matching transactions
      await expect(page.locator('[data-testid="transaction-row"]')).toHaveCount(1);
      await expect(page.locator('[data-testid="transaction-id"]').first()).toContainText('TXN001');
    });

    test('should be able to search by user email', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to users tab
      await page.locator('[data-testid="users-tab"]').click();
      
      // Search for specific user
      await page.locator('[data-testid="search-input"]').fill('creator@test.verifund.org');
      await page.locator('[data-testid="search-button"]').click();
      
      // Wait for search results
      await page.waitForSelector('[data-testid="search-results"]');
      
      // Should show matching user
      await expect(page.locator('[data-testid="user-row"]')).toHaveCount(1);
      await expect(page.locator('[data-testid="user-email"]').first()).toContainText('creator@test.verifund.org');
    });

    test('should be able to search by campaign ID', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to campaigns tab
      await page.locator('[data-testid="campaigns-tab"]').click();
      
      // Search for specific campaign
      await page.locator('[data-testid="search-input"]').fill('CAM001');
      await page.locator('[data-testid="search-button"]').click();
      
      // Wait for search results
      await page.waitForSelector('[data-testid="search-results"]');
      
      // Should show matching campaign
      await expect(page.locator('[data-testid="campaign-row"]')).toHaveCount(1);
      await expect(page.locator('[data-testid="campaign-display-id"]').first()).toContainText('CAM001');
    });

    test('universal search should work across all entities', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Use universal search bar
      await page.locator('[data-testid="universal-search-input"]').fill('test');
      await page.locator('[data-testid="universal-search-button"]').click();
      
      // Wait for universal search results
      await page.waitForSelector('[data-testid="universal-search-results"]');
      
      // Should show results from multiple categories
      await expect(page.locator('[data-testid="search-category-users"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-category-campaigns"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-category-transactions"]')).toBeVisible();
    });

    test('search should highlight matching terms', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Search for specific term
      await page.locator('[data-testid="universal-search-input"]').fill('Emergency');
      await page.locator('[data-testid="universal-search-button"]').click();
      
      // Check that search terms are highlighted
      await expect(page.locator('[data-testid="search-highlight"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-highlight"]').first()).toContainText('Emergency');
    });
  });

  test.describe('Support Ticket Management', () => {
    test('support staff should see claim buttons for open tickets', async ({ page }) => {
      await loginAsSupport(page);
      
      // Navigate to tickets tab
      await page.locator('[data-testid="tickets-tab"]').click();
      
      // Filter for open tickets
      await page.locator('[data-testid="status-filter"]').selectOption('open');
      
      // Should see claim buttons for open tickets
      const openTicketRows = page.locator('[data-testid="ticket-row"][data-status="open"]');
      const claimButtons = openTicketRows.locator('[data-testid="claim-ticket-button"]');
      
      await expect(claimButtons.first()).toBeVisible();
      await expect(claimButtons.first()).toBeEnabled();
    });

    test('support staff should be able to claim tickets', async ({ page }) => {
      await loginAsSupport(page);
      
      // Navigate to tickets tab
      await page.locator('[data-testid="tickets-tab"]').click();
      
      // Find an open ticket and claim it
      const openTicket = page.locator('[data-testid="ticket-row"][data-status="open"]').first();
      const ticketNumber = await openTicket.locator('[data-testid="ticket-number"]').textContent();
      
      await openTicket.locator('[data-testid="claim-ticket-button"]').click();
      
      // Should show confirmation dialog
      await expect(page.locator('[data-testid="claim-confirmation-dialog"]')).toBeVisible();
      await page.locator('[data-testid="confirm-claim-button"]').click();
      
      // Ticket status should change to claimed
      await expect(openTicket.locator('[data-testid="ticket-status"]')).toContainText('claimed');
      
      // Claim button should be replaced with other actions
      await expect(openTicket.locator('[data-testid="claim-ticket-button"]')).not.toBeVisible();
      await expect(openTicket.locator('[data-testid="resolve-ticket-button"]')).toBeVisible();
    });

    test('admin should be able to assign tickets to support staff', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to tickets tab
      await page.locator('[data-testid="tickets-tab"]').click();
      
      // Find an open ticket
      const openTicket = page.locator('[data-testid="ticket-row"][data-status="open"]').first();
      
      // Click assign button
      await openTicket.locator('[data-testid="assign-ticket-button"]').click();
      
      // Should show assignment dialog
      await expect(page.locator('[data-testid="assignment-dialog"]')).toBeVisible();
      
      // Select support staff member
      await page.locator('[data-testid="support-staff-select"]').selectOption('support@test.verifund.org');
      await page.locator('[data-testid="confirm-assignment-button"]').click();
      
      // Ticket should show as assigned
      await expect(openTicket.locator('[data-testid="ticket-status"]')).toContainText('assigned');
      await expect(openTicket.locator('[data-testid="assigned-to"]')).toContainText('support@test.verifund.org');
    });

    test('claimed tickets should not show claim buttons', async ({ page }) => {
      await loginAsSupport(page);
      
      // Navigate to tickets tab
      await page.locator('[data-testid="tickets-tab"]').click();
      
      // Filter for claimed tickets
      await page.locator('[data-testid="status-filter"]').selectOption('claimed');
      
      // Claimed tickets should not have claim buttons
      const claimedTicketRows = page.locator('[data-testid="ticket-row"][data-status="claimed"]');
      await expect(claimedTicketRows.locator('[data-testid="claim-ticket-button"]')).toHaveCount(0);
      
      // Should have other action buttons instead
      await expect(claimedTicketRows.locator('[data-testid="resolve-ticket-button"]').first()).toBeVisible();
    });

    test('should show ticket status progression correctly', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to tickets tab
      await page.locator('[data-testid="tickets-tab"]').click();
      
      // Create a new test ticket first
      await page.locator('[data-testid="create-test-ticket-button"]').click();
      await page.locator('[data-testid="test-ticket-subject"]').fill('Status Progression Test');
      await page.locator('[data-testid="test-ticket-message"]').fill('Testing status changes');
      await page.locator('[data-testid="create-ticket-submit"]').click();
      
      // Find the newly created ticket
      const newTicket = page.locator('[data-testid="ticket-row"]').first();
      
      // Initial status should be 'open'
      await expect(newTicket.locator('[data-testid="ticket-status"]')).toContainText('open');
      
      // Claim the ticket
      await newTicket.locator('[data-testid="claim-ticket-button"]').click();
      await page.locator('[data-testid="confirm-claim-button"]').click();
      
      // Status should change to 'claimed'
      await expect(newTicket.locator('[data-testid="ticket-status"]')).toContainText('claimed');
      
      // Set to in progress
      await newTicket.locator('[data-testid="set-progress-button"]').click();
      await expect(newTicket.locator('[data-testid="ticket-status"]')).toContainText('on_progress');
      
      // Resolve the ticket
      await newTicket.locator('[data-testid="resolve-ticket-button"]').click();
      await page.locator('[data-testid="resolution-notes"]').fill('Issue resolved successfully');
      await page.locator('[data-testid="confirm-resolve-button"]').click();
      
      // Status should change to 'resolved'
      await expect(newTicket.locator('[data-testid="ticket-status"]')).toContainText('resolved');
    });
  });

  test.describe('Export and Bulk Actions', () => {
    test('admin should be able to export CSV reports', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to reports tab
      await page.locator('[data-testid="reports-tab"]').click();
      
      // Setup download handler
      const downloadPromise = page.waitForEvent('download');
      
      // Click export CSV button
      await page.locator('[data-testid="export-csv-button"]').click();
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toContain('.csv');
    });

    test('admin should be able to perform bulk actions', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to users tab
      await page.locator('[data-testid="users-tab"]').click();
      
      // Select multiple users
      await page.locator('[data-testid="user-checkbox"]').first().check();
      await page.locator('[data-testid="user-checkbox"]').nth(1).check();
      
      // Bulk action dropdown should be enabled
      await expect(page.locator('[data-testid="bulk-actions-dropdown"]')).toBeEnabled();
      
      // Select bulk action
      await page.locator('[data-testid="bulk-actions-dropdown"]').selectOption('send-notification');
      
      // Should open bulk action dialog
      await expect(page.locator('[data-testid="bulk-action-dialog"]')).toBeVisible();
      
      // Fill notification details
      await page.locator('[data-testid="notification-subject"]').fill('Bulk Test Notification');
      await page.locator('[data-testid="notification-message"]').fill('This is a test bulk notification');
      
      // Execute bulk action
      await page.locator('[data-testid="execute-bulk-action"]').click();
      
      // Should show success message
      await expect(page.locator('[data-testid="bulk-action-success"]')).toBeVisible();
    });
  });

  test.describe('Analytics and Reports', () => {
    test('admin should see analytics dashboard', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to reports tab
      await page.locator('[data-testid="reports-tab"]').click();
      
      // Check for analytics widgets
      await expect(page.locator('[data-testid="total-users-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-campaigns-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-contributions-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="verified-users-widget"]')).toBeVisible();
      
      // Check for charts
      await expect(page.locator('[data-testid="contributions-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-growth-chart"]')).toBeVisible();
    });

    test('support staff should see limited analytics', async ({ page }) => {
      await loginAsSupport(page);
      
      // Navigate to support management tab
      await page.locator('[data-testid="support-management-tab"]').click();
      
      // Should see support-specific metrics
      await expect(page.locator('[data-testid="open-tickets-count"]')).toBeVisible();
      await expect(page.locator('[data-testid="claimed-tickets-count"]')).toBeVisible();
      await expect(page.locator('[data-testid="resolved-tickets-count"]')).toBeVisible();
      
      // Should NOT see full platform analytics
      await expect(page.locator('[data-testid="total-revenue-widget"]')).not.toBeVisible();
    });
  });
});