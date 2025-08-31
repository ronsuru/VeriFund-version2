import { test, expect, Page } from '@playwright/test';

// Test data for different user roles
const testUsers = {
  admin: { email: 'admin@test.verifund.org', role: 'admin' },
  support: { email: 'support@test.verifund.org', role: 'support' },
  creator: { email: 'creator@test.verifund.org', role: 'creator' },
  basic: { email: 'basic@test.verifund.org', role: 'basic' },
  volunteer: { email: 'volunteer@test.verifund.org', role: 'volunteer' },
  tipper: { email: 'tipper@test.verifund.org', role: 'tipper' }
};

// Helper function to mock login for different user roles
async function mockLogin(page: Page, userRole: keyof typeof testUsers) {
  const user = testUsers[userRole];
  
  // Navigate to login page
  await page.goto('/api/login');
  
  // Mock the authentication process
  await page.evaluate((userData) => {
    // Simulate successful login by setting session data
    window.localStorage.setItem('mockUser', JSON.stringify(userData));
  }, user);
  
  // Navigate to home page
  await page.goto('/');
  
  // Wait for authentication to be processed
  await page.waitForLoadState('networkidle');
}

test.describe('Authentication & Role Access E2E Tests', () => {
  
  test.describe('User Authentication Flow', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access a protected route
      await page.goto('/admin');
      
      // Should be redirected to login
      await expect(page).toHaveURL(/.*\/api\/login/);
    });

    test('should allow authenticated admin to access admin panel', async ({ page }) => {
      await mockLogin(page, 'admin');
      
      // Navigate to admin panel
      await page.goto('/admin');
      
      // Should be able to access admin panel
      await expect(page).toHaveURL('/admin');
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    });

    test('should allow support staff limited admin access', async ({ page }) => {
      await mockLogin(page, 'support');
      
      // Navigate to admin panel
      await page.goto('/admin');
      
      // Should be able to access admin panel
      await expect(page).toHaveURL('/admin');
      
      // Should see support-specific sections
      await expect(page.locator('[data-testid="support-tickets-tab"]')).toBeVisible();
      
      // Should NOT see full admin analytics
      await expect(page.locator('[data-testid="full-analytics-tab"]')).not.toBeVisible();
    });

    test('should block basic users from admin panel', async ({ page }) => {
      await mockLogin(page, 'basic');
      
      // Try to navigate to admin panel
      await page.goto('/admin');
      
      // Should be redirected or show access denied
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    });
  });

  test.describe('Role-Specific Navigation', () => {
    test('admin should see all navigation options', async ({ page }) => {
      await mockLogin(page, 'admin');
      
      await page.goto('/');
      
      // Check for admin-specific navigation
      await expect(page.locator('[data-testid="nav-admin-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-campaigns"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-volunteer"]')).toBeVisible();
    });

    test('creator should see creator-specific options', async ({ page }) => {
      await mockLogin(page, 'creator');
      
      await page.goto('/');
      
      // Should see create campaign option
      await expect(page.locator('[data-testid="nav-create-campaign"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-my-campaigns"]')).toBeVisible();
      
      // Should NOT see admin panel
      await expect(page.locator('[data-testid="nav-admin-panel"]')).not.toBeVisible();
    });

    test('basic user should see limited navigation', async ({ page }) => {
      await mockLogin(page, 'basic');
      
      await page.goto('/');
      
      // Should see public options
      await expect(page.locator('[data-testid="nav-campaigns"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-volunteer"]')).toBeVisible();
      
      // Should NOT see admin or creator-specific options
      await expect(page.locator('[data-testid="nav-admin-panel"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="nav-create-campaign"]')).not.toBeVisible();
    });
  });

  test.describe('Protected Route Access', () => {
    const protectedRoutes = [
      { path: '/admin', allowedRoles: ['admin', 'support'] },
      { path: '/create-campaign', allowedRoles: ['creator', 'basic'] },
      { path: '/my-campaigns', allowedRoles: ['creator'] },
      { path: '/wallet', allowedRoles: ['creator', 'basic', 'tipper'] }
    ];

    for (const route of protectedRoutes) {
      test(`should protect ${route.path} route correctly`, async ({ page }) => {
        // Test each user role
        for (const [role, userData] of Object.entries(testUsers)) {
          await mockLogin(page, role as keyof typeof testUsers);
          
          await page.goto(route.path);
          
          if (route.allowedRoles.includes(userData.role)) {
            // Should be able to access
            await expect(page).toHaveURL(route.path);
          } else {
            // Should be blocked or redirected
            await expect(page).not.toHaveURL(route.path);
          }
        }
      });
    }
  });

  test.describe('Session Management', () => {
    test('should handle session expiration', async ({ page }) => {
      await mockLogin(page, 'admin');
      
      // Simulate session expiration
      await page.evaluate(() => {
        window.localStorage.removeItem('mockUser');
      });
      
      // Try to access protected route
      await page.goto('/admin');
      
      // Should be redirected to login
      await expect(page).toHaveURL(/.*\/api\/login/);
    });

    test('should maintain session across page refreshes', async ({ page }) => {
      await mockLogin(page, 'creator');
      
      await page.goto('/create-campaign');
      await expect(page).toHaveURL('/create-campaign');
      
      // Refresh page
      await page.reload();
      
      // Should still be authenticated
      await expect(page).toHaveURL('/create-campaign');
    });

    test('should handle logout correctly', async ({ page }) => {
      await mockLogin(page, 'admin');
      
      await page.goto('/');
      
      // Click logout
      await page.locator('[data-testid="button-logout"]').click();
      
      // Should be redirected to login/home
      await expect(page).toHaveURL(/.*\/(api\/logout|$)/);
      
      // Try to access protected route
      await page.goto('/admin');
      await expect(page).toHaveURL(/.*\/api\/login/);
    });
  });

  test.describe('User Profile and Permissions', () => {
    test('should display correct user information for admin', async ({ page }) => {
      await mockLogin(page, 'admin');
      
      await page.goto('/profile');
      
      // Check admin-specific profile elements
      await expect(page.locator('[data-testid="user-role"]')).toContainText('Administrator');
      await expect(page.locator('[data-testid="admin-privileges"]')).toBeVisible();
    });

    test('should show KYC status for basic users', async ({ page }) => {
      await mockLogin(page, 'basic');
      
      await page.goto('/profile');
      
      // Should show KYC status
      await expect(page.locator('[data-testid="kyc-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="kyc-verification-prompt"]')).toBeVisible();
    });

    test('should display verification badge for verified users', async ({ page }) => {
      await mockLogin(page, 'creator');
      
      await page.goto('/profile');
      
      // Should show verification status
      await expect(page.locator('[data-testid="verified-badge"]')).toBeVisible();
    });
  });

  test.describe('Feature Access Control', () => {
    test('flagged users should have restricted access', async ({ page }) => {
      // Mock a flagged user
      await page.goto('/api/login');
      await page.evaluate(() => {
        window.localStorage.setItem('mockUser', JSON.stringify({
          email: 'flagged@test.verifund.org',
          role: 'flagged',
          isFlagged: true,
          accountStatus: 'limited'
        }));
      });
      
      await page.goto('/');
      
      // Try to create campaign
      await page.goto('/create-campaign');
      
      // Should show restriction message
      await expect(page.locator('[data-testid="account-restricted-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="campaign-form"]')).not.toBeVisible();
    });

    test('suspended users should be blocked from key features', async ({ page }) => {
      // Mock a suspended user
      await page.goto('/api/login');
      await page.evaluate(() => {
        window.localStorage.setItem('mockUser', JSON.stringify({
          email: 'suspended@test.verifund.org',
          role: 'suspended',
          isSuspended: true,
          suspensionReason: 'Fraudulent activity detected'
        }));
      });
      
      await page.goto('/');
      
      // Should show suspension notice
      await expect(page.locator('[data-testid="suspension-notice"]')).toBeVisible();
      await expect(page.locator('[data-testid="suspension-reason"]')).toContainText('Fraudulent activity detected');
      
      // Key features should be disabled
      await expect(page.locator('[data-testid="button-create-campaign"]')).toBeDisabled();
      await expect(page.locator('[data-testid="button-contribute"]')).toBeDisabled();
    });
  });
});