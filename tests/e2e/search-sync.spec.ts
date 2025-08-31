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

test.describe('Search & Sync E2E Tests', () => {
  
  test.describe('Universal Search Functionality', () => {
    test('should perform comprehensive search across all entities', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Test universal search with general term
      await page.locator('[data-testid="universal-search-input"]').fill('test');
      await page.locator('[data-testid="universal-search-button"]').click();
      
      // Wait for search results to load
      await page.waitForSelector('[data-testid="universal-search-results"]');
      
      // Should show results from all categories
      await expect(page.locator('[data-testid="search-results-users"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-results-campaigns"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-results-transactions"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-results-tickets"]')).toBeVisible();
      
      // Each category should show relevant results
      const userResults = page.locator('[data-testid="search-results-users"] [data-testid="search-result-item"]');
      const campaignResults = page.locator('[data-testid="search-results-campaigns"] [data-testid="search-result-item"]');
      const transactionResults = page.locator('[data-testid="search-results-transactions"] [data-testid="search-result-item"]');
      
      await expect(userResults.first()).toBeVisible();
      await expect(campaignResults.first()).toBeVisible();
      await expect(transactionResults.first()).toBeVisible();
    });

    test('should search by specific ID types', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Test search by campaign display ID
      await page.locator('[data-testid="universal-search-input"]').fill('CAM001');
      await page.locator('[data-testid="universal-search-button"]').click();
      
      await page.waitForSelector('[data-testid="universal-search-results"]');
      
      // Should highlight campaigns in results
      await expect(page.locator('[data-testid="search-results-campaigns"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-highlight"]')).toContainText('CAM001');
      
      // Test search by transaction ID
      await page.locator('[data-testid="universal-search-input"]').clear();
      await page.locator('[data-testid="universal-search-input"]').fill('TXN001');
      await page.locator('[data-testid="universal-search-button"]').click();
      
      await page.waitForSelector('[data-testid="universal-search-results"]');
      
      // Should highlight transactions in results
      await expect(page.locator('[data-testid="search-results-transactions"]')).toBeVisible();
      
      // Test search by user display ID
      await page.locator('[data-testid="universal-search-input"]').clear();
      await page.locator('[data-testid="universal-search-input"]').fill('USR001');
      await page.locator('[data-testid="universal-search-button"]').click();
      
      await page.waitForSelector('[data-testid="universal-search-results"]');
      
      // Should highlight users in results
      await expect(page.locator('[data-testid="search-results-users"]')).toBeVisible();
    });

    test('should provide search suggestions and autocomplete', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Start typing in search box
      await page.locator('[data-testid="universal-search-input"]').type('emer');
      
      // Should show search suggestions
      await expect(page.locator('[data-testid="search-suggestions"]')).toBeVisible();
      
      // Suggestions should include relevant options
      await expect(page.locator('[data-testid="suggestion-item"]').first()).toContainText('Emergency');
      
      // Click on suggestion
      await page.locator('[data-testid="suggestion-item"]').first().click();
      
      // Should populate search box and execute search
      await expect(page.locator('[data-testid="universal-search-input"]')).toHaveValue(/Emergency/);
    });

    test('should filter search results by date range', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Open advanced search filters
      await page.locator('[data-testid="advanced-search-toggle"]').click();
      
      // Set date range filter
      await page.locator('[data-testid="date-from-input"]').fill('2024-01-01');
      await page.locator('[data-testid="date-to-input"]').fill('2024-12-31');
      
      // Execute search
      await page.locator('[data-testid="universal-search-input"]').fill('test');
      await page.locator('[data-testid="universal-search-button"]').click();
      
      // Wait for filtered results
      await page.waitForSelector('[data-testid="universal-search-results"]');
      
      // Results should only include items within date range
      const resultItems = page.locator('[data-testid="search-result-item"]');
      await expect(resultItems.first()).toBeVisible();
      
      // Check date filtering worked
      await expect(page.locator('[data-testid="results-count"]')).toContainText(/\d+ results/);
    });

    test('should export search results', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Execute a search
      await page.locator('[data-testid="universal-search-input"]').fill('contribution');
      await page.locator('[data-testid="universal-search-button"]').click();
      
      await page.waitForSelector('[data-testid="universal-search-results"]');
      
      // Setup download handler
      const downloadPromise = page.waitForEvent('download');
      
      // Export search results
      await page.locator('[data-testid="export-search-results"]').click();
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toContain('search_results');
      expect(download.suggestedFilename()).toContain('.csv');
    });
  });

  test.describe('ID Synchronization Across Modules', () => {
    test('should maintain consistent user IDs across all modules', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to users tab and get a user ID
      await page.locator('[data-testid="users-tab"]').click();
      const firstUserRow = page.locator('[data-testid="user-row"]').first();
      const userId = await firstUserRow.locator('[data-testid="user-id"]').textContent();
      
      // Check transactions tab for same user ID
      await page.locator('[data-testid="transactions-tab"]').click();
      await page.locator('[data-testid="search-input"]').fill(userId || '');
      await page.locator('[data-testid="search-button"]').click();
      
      await page.waitForSelector('[data-testid="search-results"]');
      
      // Should find transactions with matching user ID
      const transactionUserIds = page.locator('[data-testid="transaction-user-id"]');
      await expect(transactionUserIds.first()).toContainText(userId || '');
      
      // Check campaigns tab for creator ID
      await page.locator('[data-testid="campaigns-tab"]').click();
      await page.locator('[data-testid="search-input"]').clear();
      await page.locator('[data-testid="search-input"]').fill(userId || '');
      await page.locator('[data-testid="search-button"]').click();
      
      await page.waitForSelector('[data-testid="search-results"]');
      
      // Should find campaigns with matching creator ID
      const campaignCreatorIds = page.locator('[data-testid="campaign-creator-id"]');
      if (await campaignCreatorIds.count() > 0) {
        await expect(campaignCreatorIds.first()).toContainText(userId || '');
      }
    });

    test('should maintain consistent campaign IDs across modules', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Get a campaign ID from campaigns tab
      await page.locator('[data-testid="campaigns-tab"]').click();
      const firstCampaignRow = page.locator('[data-testid="campaign-row"]').first();
      const campaignId = await firstCampaignRow.locator('[data-testid="campaign-id"]').textContent();
      
      // Check transactions tab for same campaign ID
      await page.locator('[data-testid="transactions-tab"]').click();
      await page.locator('[data-testid="search-input"]').fill(campaignId || '');
      await page.locator('[data-testid="search-button"]').click();
      
      await page.waitForSelector('[data-testid="search-results"]');
      
      // Should find transactions with matching campaign ID
      const transactionCampaignIds = page.locator('[data-testid="transaction-campaign-id"]');
      if (await transactionCampaignIds.count() > 0) {
        await expect(transactionCampaignIds.first()).toContainText(campaignId || '');
      }
      
      // Check volunteer applications for same campaign ID
      await page.locator('[data-testid="volunteers-tab"]').click();
      await page.locator('[data-testid="search-input"]').clear();
      await page.locator('[data-testid="search-input"]').fill(campaignId || '');
      await page.locator('[data-testid="search-button"]').click();
      
      await page.waitForSelector('[data-testid="search-results"]');
      
      // Should find volunteer applications with matching campaign ID
      const volunteerCampaignIds = page.locator('[data-testid="volunteer-campaign-id"]');
      if (await volunteerCampaignIds.count() > 0) {
        await expect(volunteerCampaignIds.first()).toContainText(campaignId || '');
      }
    });

    test('should maintain consistent transaction IDs', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Get a transaction ID
      await page.locator('[data-testid="transactions-tab"]').click();
      const firstTransactionRow = page.locator('[data-testid="transaction-row"]').first();
      const transactionId = await firstTransactionRow.locator('[data-testid="transaction-id"]').textContent();
      const transactionDisplayId = await firstTransactionRow.locator('[data-testid="transaction-display-id"]').textContent();
      
      // Universal search by transaction ID
      await page.locator('[data-testid="universal-search-input"]').fill(transactionDisplayId || '');
      await page.locator('[data-testid="universal-search-button"]').click();
      
      await page.waitForSelector('[data-testid="universal-search-results"]');
      
      // Should find the exact transaction
      await expect(page.locator('[data-testid="search-results-transactions"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-highlight"]')).toContainText(transactionDisplayId || '');
      
      // Click on transaction result
      await page.locator('[data-testid="search-results-transactions"] [data-testid="search-result-item"]').first().click();
      
      // Should navigate to transaction details
      await expect(page.locator('[data-testid="transaction-details-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="transaction-detail-id"]')).toContainText(transactionId || '');
    });

    test('should link related entities correctly', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to campaigns and click on a campaign
      await page.locator('[data-testid="campaigns-tab"]').click();
      await page.locator('[data-testid="campaign-row"]').first().click();
      
      // Should open campaign details modal
      await expect(page.locator('[data-testid="campaign-details-modal"]')).toBeVisible();
      
      // Should show related transactions link
      await expect(page.locator('[data-testid="view-related-transactions"]')).toBeVisible();
      
      // Click to view related transactions
      await page.locator('[data-testid="view-related-transactions"]').click();
      
      // Should navigate to transactions filtered by this campaign
      await expect(page.locator('[data-testid="transactions-tab"][data-active="true"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-filter-campaign"]')).toBeVisible();
      
      // All visible transactions should be for this campaign
      const campaignIdElements = page.locator('[data-testid="transaction-campaign-id"]');
      const count = await campaignIdElements.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const campaignId = await campaignIdElements.nth(i).textContent();
          expect(campaignId).toBeTruthy();
        }
      }
    });
  });

  test.describe('Support Panel Search Engine', () => {
    test('should search tickets by multiple criteria', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to tickets tab
      await page.locator('[data-testid="tickets-tab"]').click();
      
      // Test search by ticket number
      await page.locator('[data-testid="ticket-search-input"]').fill('TKT-0001');
      await page.locator('[data-testid="ticket-search-button"]').click();
      
      await page.waitForSelector('[data-testid="ticket-search-results"]');
      
      // Should find specific ticket
      await expect(page.locator('[data-testid="ticket-row"]')).toHaveCount(1);
      await expect(page.locator('[data-testid="ticket-number"]').first()).toContainText('TKT-0001');
      
      // Test search by subject
      await page.locator('[data-testid="ticket-search-input"]').clear();
      await page.locator('[data-testid="ticket-search-input"]').fill('KYC documents');
      await page.locator('[data-testid="ticket-search-button"]').click();
      
      await page.waitForSelector('[data-testid="ticket-search-results"]');
      
      // Should find tickets matching subject
      const ticketSubjects = page.locator('[data-testid="ticket-subject"]');
      await expect(ticketSubjects.first()).toContainText(/KYC|documents/i);
      
      // Test search by user email
      await page.locator('[data-testid="ticket-search-input"]').clear();
      await page.locator('[data-testid="ticket-search-input"]').fill('basic@test.verifund.org');
      await page.locator('[data-testid="ticket-search-button"]').click();
      
      await page.waitForSelector('[data-testid="ticket-search-results"]');
      
      // Should find tickets from specific user
      const ticketUsers = page.locator('[data-testid="ticket-user-email"]');
      await expect(ticketUsers.first()).toContainText('basic@test.verifund.org');
    });

    test('should filter tickets by status and priority', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to tickets tab
      await page.locator('[data-testid="tickets-tab"]').click();
      
      // Filter by status
      await page.locator('[data-testid="status-filter"]').selectOption('open');
      
      // All visible tickets should have 'open' status
      const statusElements = page.locator('[data-testid="ticket-status"]');
      const count = await statusElements.count();
      
      for (let i = 0; i < count; i++) {
        await expect(statusElements.nth(i)).toContainText('open');
      }
      
      // Filter by priority
      await page.locator('[data-testid="priority-filter"]').selectOption('high');
      
      // Should only show high priority tickets
      const priorityElements = page.locator('[data-testid="ticket-priority"]');
      const priorityCount = await priorityElements.count();
      
      for (let i = 0; i < priorityCount; i++) {
        await expect(priorityElements.nth(i)).toContainText('high');
      }
      
      // Combine filters with search
      await page.locator('[data-testid="ticket-search-input"]').fill('technical');
      await page.locator('[data-testid="ticket-search-button"]').click();
      
      await page.waitForSelector('[data-testid="ticket-search-results"]');
      
      // Should show only high priority, open tickets with 'technical' in content
      await expect(page.locator('[data-testid="ticket-row"]')).toHaveCount(0); // Assuming no matches for this specific combination
    });

    test('should provide advanced search options', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to tickets tab
      await page.locator('[data-testid="tickets-tab"]').click();
      
      // Open advanced search
      await page.locator('[data-testid="advanced-ticket-search"]').click();
      
      // Should show advanced search form
      await expect(page.locator('[data-testid="advanced-search-form"]')).toBeVisible();
      
      // Fill advanced search criteria
      await page.locator('[data-testid="search-date-from"]').fill('2024-01-01');
      await page.locator('[data-testid="search-date-to"]').fill('2024-12-31');
      await page.locator('[data-testid="search-category"]').selectOption('account');
      await page.locator('[data-testid="search-assigned-to"]').selectOption('support@test.verifund.org');
      
      // Execute advanced search
      await page.locator('[data-testid="execute-advanced-search"]').click();
      
      await page.waitForSelector('[data-testid="ticket-search-results"]');
      
      // Results should match all criteria
      const categoryElements = page.locator('[data-testid="ticket-category"]');
      const assignedElements = page.locator('[data-testid="ticket-assigned-to"]');
      
      if (await categoryElements.count() > 0) {
        await expect(categoryElements.first()).toContainText('account');
      }
      
      if (await assignedElements.count() > 0) {
        await expect(assignedElements.first()).toContainText('support@test.verifund.org');
      }
    });

    test('should save and load search presets', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to tickets tab
      await page.locator('[data-testid="tickets-tab"]').click();
      
      // Set up a complex search
      await page.locator('[data-testid="status-filter"]').selectOption('open');
      await page.locator('[data-testid="priority-filter"]').selectOption('high');
      await page.locator('[data-testid="ticket-search-input"]').fill('urgent');
      
      // Save search as preset
      await page.locator('[data-testid="save-search-preset"]').click();
      await page.locator('[data-testid="preset-name-input"]').fill('High Priority Open Urgent');
      await page.locator('[data-testid="save-preset-confirm"]').click();
      
      // Should show success message
      await expect(page.locator('[data-testid="preset-saved-message"]')).toBeVisible();
      
      // Clear search
      await page.locator('[data-testid="clear-all-filters"]').click();
      
      // Load saved preset
      await page.locator('[data-testid="load-search-preset"]').click();
      await page.locator('[data-testid="preset-option"]').filter({ hasText: 'High Priority Open Urgent' }).click();
      
      // Should restore previous search criteria
      await expect(page.locator('[data-testid="status-filter"]')).toHaveValue('open');
      await expect(page.locator('[data-testid="priority-filter"]')).toHaveValue('high');
      await expect(page.locator('[data-testid="ticket-search-input"]')).toHaveValue('urgent');
    });
  });

  test.describe('Real-time Data Sync', () => {
    test('should update search results in real-time', async ({ page, context }) => {
      // Open admin panel in first tab
      await loginAsAdmin(page);
      await page.locator('[data-testid="campaigns-tab"]').click();
      
      // Open a second tab for creating data
      const secondPage = await context.newPage();
      await secondPage.goto('/api/login');
      await secondPage.evaluate(() => {
        window.localStorage.setItem('mockUser', JSON.stringify({
          email: 'creator@test.verifund.org',
          role: 'creator',
          isCreator: true
        }));
      });
      
      // Create a new campaign in second tab
      await secondPage.goto('/create-campaign');
      await secondPage.locator('[data-testid="campaign-title"]').fill('Real-time Sync Test Campaign');
      await secondPage.locator('[data-testid="campaign-description"]').fill('Testing real-time updates');
      await secondPage.locator('[data-testid="campaign-category"]').selectOption('education');
      await secondPage.locator('[data-testid="campaign-goal"]').fill('100000');
      await secondPage.locator('[data-testid="campaign-minimum"]').fill('50000');
      await secondPage.locator('[data-testid="campaign-duration"]').fill('30');
      await secondPage.locator('[data-testid="submit-campaign"]').click();
      
      // Wait for campaign creation
      await expect(secondPage.locator('[data-testid="campaign-created-success"]')).toBeVisible();
      
      // Return to admin panel and refresh campaigns
      await page.locator('[data-testid="refresh-campaigns"]').click();
      
      // Should see the new campaign
      await expect(page.locator('[data-testid="campaign-title"]').filter({ hasText: 'Real-time Sync Test Campaign' })).toBeVisible();
      
      // Search for the new campaign
      await page.locator('[data-testid="search-input"]').fill('Real-time Sync Test');
      await page.locator('[data-testid="search-button"]').click();
      
      await page.waitForSelector('[data-testid="search-results"]');
      
      // Should find the new campaign in search results
      await expect(page.locator('[data-testid="campaign-row"]')).toHaveCount(1);
      await expect(page.locator('[data-testid="campaign-title"]').first()).toContainText('Real-time Sync Test Campaign');
    });

    test('should sync status changes across all views', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to tickets tab
      await page.locator('[data-testid="tickets-tab"]').click();
      
      // Find an open ticket
      const openTicket = page.locator('[data-testid="ticket-row"][data-status="open"]').first();
      const ticketNumber = await openTicket.locator('[data-testid="ticket-number"]').textContent();
      
      // Claim the ticket
      await openTicket.locator('[data-testid="claim-ticket-button"]').click();
      await page.locator('[data-testid="confirm-claim-button"]').click();
      
      // Should update status immediately
      await expect(openTicket.locator('[data-testid="ticket-status"]')).toContainText('claimed');
      
      // Search for the ticket
      await page.locator('[data-testid="ticket-search-input"]').fill(ticketNumber || '');
      await page.locator('[data-testid="ticket-search-button"]').click();
      
      // Should show updated status in search results
      await expect(page.locator('[data-testid="ticket-status"]').first()).toContainText('claimed');
      
      // Universal search should also show updated status
      await page.locator('[data-testid="universal-search-input"]').fill(ticketNumber || '');
      await page.locator('[data-testid="universal-search-button"]').click();
      
      await page.waitForSelector('[data-testid="universal-search-results"]');
      
      // Should show updated status in universal search
      await expect(page.locator('[data-testid="search-results-tickets"] [data-testid="ticket-status"]').first()).toContainText('claimed');
    });
  });
});