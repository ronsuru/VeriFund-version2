import { test, expect, Page } from '@playwright/test';

async function loginAsUser(page: Page, userType: string) {
  await page.goto('/api/login');
  await page.evaluate((type) => {
    const users = {
      creator: { email: 'creator@test.verifund.org', role: 'creator', isCreator: true },
      tipper: { email: 'tipper@test.verifund.org', role: 'tipper', phpBalance: '25000.00' },
      admin: { email: 'admin@test.verifund.org', role: 'admin', isAdmin: true }
    };
    window.localStorage.setItem('mockUser', JSON.stringify(users[type] || users.creator));
  }, userType);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

test.describe('Transactions & Contributions E2E Tests', () => {
  
  test.describe('Contribution Flow', () => {
    test('should allow users to contribute to active campaigns', async ({ page }) => {
      await loginAsUser(page, 'tipper');
      
      // Navigate to campaigns page
      await page.goto('/campaigns');
      
      // Find an active campaign
      const activeCampaign = page.locator('[data-testid="campaign-card"][data-status="active"]').first();
      await expect(activeCampaign).toBeVisible();
      
      // Click on campaign to view details
      await activeCampaign.click();
      
      // Should open campaign details
      await expect(page.locator('[data-testid="campaign-details"]')).toBeVisible();
      
      // Click contribute button
      await page.locator('[data-testid="contribute-button"]').click();
      
      // Should open contribution modal
      await expect(page.locator('[data-testid="contribution-modal"]')).toBeVisible();
      
      // Fill contribution form
      await page.locator('[data-testid="contribution-amount"]').fill('5000');
      await page.locator('[data-testid="contribution-message"]').fill('Hope this helps with your cause!');
      
      // Should show fee calculation
      await expect(page.locator('[data-testid="platform-fee"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-amount"]')).toContainText('5,125'); // Including 2.5% fee
      
      // Submit contribution
      await page.locator('[data-testid="submit-contribution"]').click();
      
      // Should show payment options
      await expect(page.locator('[data-testid="payment-options"]')).toBeVisible();
      
      // Select payment method
      await page.locator('[data-testid="payment-gcash"]').click();
      
      // Mock payment success
      await page.locator('[data-testid="mock-payment-success"]').click();
      
      // Should show success message
      await expect(page.locator('[data-testid="contribution-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="transaction-id"]')).toBeVisible();
      
      // Campaign amount should be updated
      await page.locator('[data-testid="close-modal"]').click();
      await page.reload();
      
      // Should see updated contribution amount
      await expect(page.locator('[data-testid="current-amount"]')).toContainText(/5,000|5000/);
    });

    test('should prevent contribution to inactive campaigns', async ({ page }) => {
      await loginAsUser(page, 'tipper');
      
      await page.goto('/campaigns');
      
      // Find a pending campaign
      const pendingCampaign = page.locator('[data-testid="campaign-card"][data-status="pending"]').first();
      
      if (await pendingCampaign.isVisible()) {
        await pendingCampaign.click();
        
        // Contribute button should be disabled or not visible
        await expect(page.locator('[data-testid="contribute-button"]')).not.toBeVisible();
        await expect(page.locator('[data-testid="campaign-inactive-message"]')).toBeVisible();
      }
    });

    test('should show contribution history', async ({ page }) => {
      await loginAsUser(page, 'tipper');
      
      // Navigate to wallet/transaction history
      await page.goto('/wallet');
      
      // Should see contributions tab
      await page.locator('[data-testid="contributions-tab"]').click();
      
      // Should show contribution history
      await expect(page.locator('[data-testid="contribution-history"]')).toBeVisible();
      
      // Should show individual contribution entries
      const contributionEntries = page.locator('[data-testid="contribution-entry"]');
      await expect(contributionEntries.first()).toBeVisible();
      
      // Each entry should show relevant details
      await expect(contributionEntries.first().locator('[data-testid="contribution-amount"]')).toBeVisible();
      await expect(contributionEntries.first().locator('[data-testid="contribution-campaign"]')).toBeVisible();
      await expect(contributionEntries.first().locator('[data-testid="contribution-date"]')).toBeVisible();
      await expect(contributionEntries.first().locator('[data-testid="transaction-id"]')).toBeVisible();
    });

    test('should validate contribution amounts', async ({ page }) => {
      await loginAsUser(page, 'tipper');
      
      await page.goto('/campaigns');
      const activeCampaign = page.locator('[data-testid="campaign-card"][data-status="active"]').first();
      await activeCampaign.click();
      await page.locator('[data-testid="contribute-button"]').click();
      
      // Test minimum amount validation
      await page.locator('[data-testid="contribution-amount"]').fill('10'); // Too low
      await page.locator('[data-testid="submit-contribution"]').click();
      
      await expect(page.locator('[data-testid="amount-error"]')).toContainText('Minimum contribution is ₱100');
      
      // Test maximum amount validation
      await page.locator('[data-testid="contribution-amount"]').clear();
      await page.locator('[data-testid="contribution-amount"]').fill('1000000'); // Too high
      await page.locator('[data-testid="submit-contribution"]').click();
      
      await expect(page.locator('[data-testid="amount-error"]')).toContainText('Maximum contribution exceeded');
      
      // Test valid amount
      await page.locator('[data-testid="contribution-amount"]').clear();
      await page.locator('[data-testid="contribution-amount"]').fill('2000');
      
      // Should not show error
      await expect(page.locator('[data-testid="amount-error"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="submit-contribution"]')).toBeEnabled();
    });
  });

  test.describe('Tip Flow', () => {
    test('should allow users to tip campaign creators', async ({ page }) => {
      await loginAsUser(page, 'tipper');
      
      await page.goto('/campaigns');
      const campaign = page.locator('[data-testid="campaign-card"]').first();
      await campaign.click();
      
      // Click tip button
      await page.locator('[data-testid="tip-button"]').click();
      
      // Should open tip modal
      await expect(page.locator('[data-testid="tip-modal"]')).toBeVisible();
      
      // Fill tip form
      await page.locator('[data-testid="tip-amount"]').fill('1000');
      await page.locator('[data-testid="tip-message"]').fill('Great work on this campaign!');
      
      // Should show tip fee calculation
      await expect(page.locator('[data-testid="tip-fee"]')).toBeVisible();
      await expect(page.locator('[data-testid="tip-total"]')).toContainText('1,020'); // Including 2% tip fee
      
      // Submit tip
      await page.locator('[data-testid="submit-tip"]').click();
      
      // Select payment method
      await page.locator('[data-testid="payment-gcash"]').click();
      await page.locator('[data-testid="mock-payment-success"]').click();
      
      // Should show tip success
      await expect(page.locator('[data-testid="tip-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="tip-transaction-id"]')).toBeVisible();
    });

    test('should update creator tip balance', async ({ page }) => {
      await loginAsUser(page, 'creator');
      
      // Check initial balance
      await page.goto('/wallet');
      const initialTipBalance = await page.locator('[data-testid="tips-balance"]').textContent();
      
      // Now simulate receiving a tip (would normally come from another user)
      // For testing, we'll mock this by navigating to admin and creating a tip transaction
      await loginAsUser(page, 'admin');
      await page.goto('/admin');
      
      // Create mock tip transaction
      await page.locator('[data-testid="transactions-tab"]').click();
      await page.locator('[data-testid="create-test-transaction"]').click();
      await page.locator('[data-testid="transaction-type"]').selectOption('tip');
      await page.locator('[data-testid="transaction-amount"]').fill('500');
      await page.locator('[data-testid="transaction-user"]').selectOption('creator@test.verifund.org');
      await page.locator('[data-testid="create-transaction"]').click();
      
      // Go back to creator account and check updated balance
      await loginAsUser(page, 'creator');
      await page.goto('/wallet');
      
      const updatedTipBalance = await page.locator('[data-testid="tips-balance"]').textContent();
      expect(updatedTipBalance).not.toBe(initialTipBalance);
    });
  });

  test.describe('Withdrawal Flow', () => {
    test('should allow creators to withdraw available funds', async ({ page }) => {
      await loginAsUser(page, 'creator');
      
      await page.goto('/wallet');
      
      // Should see available balances
      await expect(page.locator('[data-testid="php-balance"]')).toBeVisible();
      await expect(page.locator('[data-testid="contributions-balance"]')).toBeVisible();
      await expect(page.locator('[data-testid="tips-balance"]')).toBeVisible();
      
      // Click withdraw button
      await page.locator('[data-testid="withdraw-button"]').click();
      
      // Should open withdrawal modal
      await expect(page.locator('[data-testid="withdrawal-modal"]')).toBeVisible();
      
      // Select withdrawal source
      await page.locator('[data-testid="withdrawal-source"]').selectOption('tips-balance');
      
      // Fill withdrawal amount
      await page.locator('[data-testid="withdrawal-amount"]').fill('1000');
      
      // Select withdrawal method
      await page.locator('[data-testid="withdrawal-method"]').selectOption('gcash');
      await page.locator('[data-testid="gcash-number"]').fill('09123456789');
      
      // Should show withdrawal fee
      await expect(page.locator('[data-testid="withdrawal-fee"]')).toBeVisible();
      await expect(page.locator('[data-testid="net-amount"]')).toContainText('975'); // After 2.5% withdrawal fee
      
      // Submit withdrawal
      await page.locator('[data-testid="submit-withdrawal"]').click();
      
      // Should show confirmation
      await expect(page.locator('[data-testid="withdrawal-confirmation"]')).toBeVisible();
      await page.locator('[data-testid="confirm-withdrawal"]').click();
      
      // Should show success message
      await expect(page.locator('[data-testid="withdrawal-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="withdrawal-transaction-id"]')).toBeVisible();
      
      // Balance should be updated
      await page.locator('[data-testid="close-modal"]').click();
      await page.reload();
      
      // Tips balance should be reduced
      const updatedBalance = await page.locator('[data-testid="tips-balance"]').textContent();
      expect(updatedBalance).toContain('0') // Assuming it was reduced to 0 or close to it
    });

    test('should prevent withdrawal exceeding available balance', async ({ page }) => {
      await loginAsUser(page, 'creator');
      
      await page.goto('/wallet');
      await page.locator('[data-testid="withdraw-button"]').click();
      
      // Try to withdraw more than available
      await page.locator('[data-testid="withdrawal-source"]').selectOption('php-balance');
      await page.locator('[data-testid="withdrawal-amount"]').fill('999999');
      
      await page.locator('[data-testid="submit-withdrawal"]').click();
      
      // Should show error
      await expect(page.locator('[data-testid="insufficient-balance-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirm-withdrawal"]')).toBeDisabled();
    });

    test('should show withdrawal history', async ({ page }) => {
      await loginAsUser(page, 'creator');
      
      await page.goto('/wallet');
      await page.locator('[data-testid="withdrawals-tab"]').click();
      
      // Should show withdrawal history
      await expect(page.locator('[data-testid="withdrawal-history"]')).toBeVisible();
      
      // Should show withdrawal entries
      const withdrawalEntries = page.locator('[data-testid="withdrawal-entry"]');
      if (await withdrawalEntries.count() > 0) {
        await expect(withdrawalEntries.first().locator('[data-testid="withdrawal-amount"]')).toBeVisible();
        await expect(withdrawalEntries.first().locator('[data-testid="withdrawal-method"]')).toBeVisible();
        await expect(withdrawalEntries.first().locator('[data-testid="withdrawal-status"]')).toBeVisible();
        await expect(withdrawalEntries.first().locator('[data-testid="withdrawal-date"]')).toBeVisible();
      }
    });
  });

  test.describe('Fee Calculations', () => {
    test('should calculate platform fees correctly', async ({ page }) => {
      await loginAsUser(page, 'tipper');
      
      await page.goto('/campaigns');
      const campaign = page.locator('[data-testid="campaign-card"]').first();
      await campaign.click();
      await page.locator('[data-testid="contribute-button"]').click();
      
      // Test different contribution amounts
      const testAmounts = [
        { amount: '1000', expectedFee: '25', expectedTotal: '1025' },
        { amount: '5000', expectedFee: '125', expectedTotal: '5125' },
        { amount: '10000', expectedFee: '250', expectedTotal: '10250' }
      ];
      
      for (const test of testAmounts) {
        await page.locator('[data-testid="contribution-amount"]').clear();
        await page.locator('[data-testid="contribution-amount"]').fill(test.amount);
        
        // Wait for fee calculation
        await page.waitForFunction(() => {
          const feeElement = document.querySelector('[data-testid="platform-fee"]');
          return feeElement && feeElement.textContent?.includes('₱');
        });
        
        // Check fee calculation
        await expect(page.locator('[data-testid="platform-fee"]')).toContainText(test.expectedFee);
        await expect(page.locator('[data-testid="total-amount"]')).toContainText(test.expectedTotal);
      }
    });

    test('should calculate tip fees correctly', async ({ page }) => {
      await loginAsUser(page, 'tipper');
      
      await page.goto('/campaigns');
      const campaign = page.locator('[data-testid="campaign-card"]').first();
      await campaign.click();
      await page.locator('[data-testid="tip-button"]').click();
      
      // Test tip fee calculation (2%)
      await page.locator('[data-testid="tip-amount"]').fill('1000');
      
      // Should show 2% tip fee
      await expect(page.locator('[data-testid="tip-fee"]')).toContainText('20');
      await expect(page.locator('[data-testid="tip-total"]')).toContainText('1020');
    });

    test('should calculate withdrawal fees correctly', async ({ page }) => {
      await loginAsUser(page, 'creator');
      
      await page.goto('/wallet');
      await page.locator('[data-testid="withdraw-button"]').click();
      
      // Test withdrawal fee calculation (2.5%)
      await page.locator('[data-testid="withdrawal-amount"]').fill('2000');
      
      // Should show 2.5% withdrawal fee
      await expect(page.locator('[data-testid="withdrawal-fee"]')).toContainText('50');
      await expect(page.locator('[data-testid="net-amount"]')).toContainText('1950');
    });

    test('should show fee breakdown in transaction details', async ({ page }) => {
      await loginAsUser(page, 'tipper');
      
      await page.goto('/wallet');
      await page.locator('[data-testid="transactions-tab"]').click();
      
      // Click on a transaction to view details
      const transaction = page.locator('[data-testid="transaction-entry"]').first();
      await transaction.click();
      
      // Should show transaction details modal
      await expect(page.locator('[data-testid="transaction-details-modal"]')).toBeVisible();
      
      // Should show fee breakdown
      await expect(page.locator('[data-testid="transaction-amount"]')).toBeVisible();
      await expect(page.locator('[data-testid="platform-fee"]')).toBeVisible();
      await expect(page.locator('[data-testid="net-amount"]')).toBeVisible();
      
      // Should show fee percentage
      await expect(page.locator('[data-testid="fee-percentage"]')).toBeVisible();
    });
  });

  test.describe('Transaction History and Tracking', () => {
    test('should display comprehensive transaction history', async ({ page }) => {
      await loginAsUser(page, 'creator');
      
      await page.goto('/wallet');
      await page.locator('[data-testid="all-transactions-tab"]').click();
      
      // Should show all types of transactions
      const transactionTypes = ['contribution', 'tip', 'withdrawal', 'claim'];
      
      for (const type of transactionTypes) {
        const typeFilter = page.locator('[data-testid="transaction-type-filter"]');
        await typeFilter.selectOption(type);
        
        const transactions = page.locator('[data-testid="transaction-entry"]');
        if (await transactions.count() > 0) {
          await expect(transactions.first().locator('[data-testid="transaction-type"]')).toContainText(type);
        }
      }
    });

    test('should provide transaction search and filtering', async ({ page }) => {
      await loginAsUser(page, 'creator');
      
      await page.goto('/wallet');
      await page.locator('[data-testid="all-transactions-tab"]').click();
      
      // Search by transaction ID
      await page.locator('[data-testid="transaction-search"]').fill('TXN001');
      await page.locator('[data-testid="search-transactions"]').click();
      
      // Should show matching transactions
      const searchResults = page.locator('[data-testid="transaction-entry"]');
      if (await searchResults.count() > 0) {
        await expect(searchResults.first().locator('[data-testid="transaction-id"]')).toContainText('TXN001');
      }
      
      // Filter by date range
      await page.locator('[data-testid="date-from"]').fill('2024-01-01');
      await page.locator('[data-testid="date-to"]').fill('2024-12-31');
      await page.locator('[data-testid="apply-date-filter"]').click();
      
      // Should show transactions within date range
      await expect(page.locator('[data-testid="filtered-results"]')).toBeVisible();
    });

    test('should export transaction history', async ({ page }) => {
      await loginAsUser(page, 'creator');
      
      await page.goto('/wallet');
      await page.locator('[data-testid="all-transactions-tab"]').click();
      
      // Setup download handler
      const downloadPromise = page.waitForEvent('download');
      
      // Export transactions
      await page.locator('[data-testid="export-transactions"]').click();
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toContain('transactions');
      expect(download.suggestedFilename()).toContain('.csv');
    });
  });
});