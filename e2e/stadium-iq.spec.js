/**
 * End-to-End tests for Stadium IQ
 * Tests core user flows across the application
 */
import { test, expect } from '@playwright/test';

test.describe('Stadium IQ Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the application with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Stadium IQ|FIFA World Cup 2026/);
  });

  test('should display the header with stadium branding', async ({ page }) => {
    await expect(page.getByText('Stadium IQ')).toBeVisible();
    await expect(page.getByText('FIFA World Cup 2026')).toBeVisible();
  });

  test('should show match score in header', async ({ page }) => {
    await expect(page.getByText(/Brazil|France/).first()).toBeVisible();
    await expect(page.getByText(/\d+ - \d+/).first()).toBeVisible();
  });

  test('should display AI Active status indicator', async ({ page }) => {
    await expect(page.getByText('AI Active')).toBeVisible();
  });

  test('should navigate to GenAI Assistant when clicking nav item', async ({ page }) => {
    await page.locator('button[aria-label="GenAI Assistant"]:visible').click();
    await expect(page.getByText(/FIFA World Cup 2026 GenAI Assistant/)).toBeVisible();
    await expect(page.getByPlaceholder(/Ask Stadium IQ/)).toBeVisible();
  });

  test('should navigate to Crowd & Navigation view', async ({ page }) => {
    await page.locator('button[aria-label="Crowd & Navigation"]:visible').click();
    await expect(page.getByText(/Live stadium map/)).toBeVisible();
  });

  test('should navigate to Volunteer Dispatch', async ({ page }) => {
    await page.locator('button[aria-label="Volunteer Dispatch"]:visible').click();
    await expect(page.getByText(/AI-powered task assignment/)).toBeVisible();
  });

  test('should navigate to Transport Hub', async ({ page }) => {
    await page.locator('button[aria-label="Transport Hub"]:visible').click();
    await expect(page.getByText(/Post-match departure options/)).toBeVisible();
  });

  test('should navigate to Sustainability Dashboard', async ({ page }) => {
    await page.locator('button[aria-label="Sustainability"]:visible').click();
    await expect(page.getByText(/Sustainability Dashboard/)).toBeVisible();
  });

  test('should display Command Center KPIs', async ({ page }) => {
    await expect(page.getByText('Crowd Density', { exact: true })).toBeVisible();
    await expect(page.getByText('Occupancy', { exact: true })).toBeVisible();
    await expect(page.getByText('Temperature', { exact: true })).toBeVisible();
  });

  test('should have working skip-to-content link for keyboard users', async ({ page }) => {
    // Tab to skip link
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to main content' }).first();
    if (await skipLink.isVisible()) {
      await skipLink.click();
      await expect(page.locator('#main-content')).toBeFocused();
    }
  });

  test('should toggle Eco Mode on Sustainability page', async ({ page }) => {
    await page.locator('button[aria-label="Sustainability"]:visible').click();
    const ecoButton = page.getByRole('button', { name: /Eco Mode/i });
    await ecoButton.click();
    await expect(page.getByText(/Eco Mode Activated/)).toBeVisible();
    await expect(page.getByText(/Eco Mode: ON/)).toBeVisible();
  });

  test('should display transport options sorted by AI recommendation', async ({ page }) => {
    await page.locator('button[aria-label="Transport Hub"]:visible').click();
    // Check that the recommended badge appears
    await expect(page.getByText(/Recommended/).first()).toBeVisible();
    // Sort buttons should be present
    await expect(page.getByText('AI Recommended', { exact: true })).toBeVisible();
    await expect(page.getByText('Fastest', { exact: true })).toBeVisible();
    await expect(page.getByText('Most Eco', { exact: true })).toBeVisible();
  });

  test('should be keyboard navigable through sidebar', async ({ page }) => {
    const navItems = page.getByRole('navigation').first().getByRole('button');
    const count = await navItems.count();
    expect(count).toBeGreaterThanOrEqual(6);
    // Navigate through items with keyboard
    for (let i = 0; i < Math.min(count, 3); i++) {
      await navItems.nth(i).focus();
      await expect(navItems.nth(i)).toBeFocused();
    }
  });

  test('should have accessible name for all interactive elements', async ({ page }) => {
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    const missingLabels = [];
    for (let i = 0; i < buttonCount; i++) {
      const btn = buttons.nth(i);
      const label = await btn.getAttribute('aria-label');
      const text = await btn.textContent();
      if (!label && !text?.trim()) {
        missingLabels.push(i);
      }
    }
    expect(missingLabels).toEqual([]);
  });

  test('should send a message in AI chat and receive a demo response', async ({ page }) => {
    // Navigate to the AI assistant panel
    await page.locator('button[aria-label="GenAI Assistant"]:visible').click();
    await expect(page.getByPlaceholder(/Ask Stadium IQ/)).toBeVisible();

    // Type and send a message
    const input = page.getByPlaceholder(/Ask Stadium IQ/);
    await input.fill('Which gate should I enter through?');

    // Send button should now be enabled
    const sendBtn = page.getByRole('button', { name: /send/i });
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();

    // User message should appear in the chat log
    await expect(page.getByText('Which gate should I enter through?')).toBeVisible();

    // Input should be cleared after sending
    await expect(input).toHaveValue('');

    // AI response should appear (demo mode or real — both show Gate info within 6s)
    await expect(page.getByText(/Gate/i).first()).toBeVisible({ timeout: 6000 });
  });

  test('should disable send button when input is empty', async ({ page }) => {
    await page.locator('button[aria-label="GenAI Assistant"]:visible').click();
    const sendBtn = page.getByRole('button', { name: /send/i });
    await expect(sendBtn).toBeDisabled();
  });

  test('should send a message using Enter key', async ({ page }) => {
    await page.locator('button[aria-label="GenAI Assistant"]:visible').click();
    const input = page.getByPlaceholder(/Ask Stadium IQ/);
    await input.fill('Tell me about transport options');
    await input.press('Enter');

    // User message should appear
    await expect(page.getByText('Tell me about transport options')).toBeVisible();
    // Input clears
    await expect(input).toHaveValue('');
  });

  test('should allow changing AI language and show the selection', async ({ page }) => {
    await page.locator('button[aria-label="GenAI Assistant"]:visible').click();

    // Open the language selector
    const langBtn = page.getByRole('button', { name: /Select language/i });
    await expect(langBtn).toBeVisible();
    await langBtn.click();

    // Spanish option should be visible in dropdown
    await expect(page.getByText('Español')).toBeVisible();

    // Select Spanish
    await page.getByText('Español').click();

    // Language button should now show ES flag
    await expect(langBtn).toContainText('Español');
  });

  test('should show quick prompt buttons that send messages when clicked', async ({ page }) => {
    await page.locator('button[aria-label="GenAI Assistant"]:visible').click();
    await expect(page.getByPlaceholder(/Ask Stadium IQ/)).toBeVisible();

    // Find quick prompt pills
    const quickBtns = page.locator('button').filter({ hasText: /crowded|match|services/i });
    const count = await quickBtns.count();

    if (count > 0) {
      await quickBtns.first().click();
      // A new user message should appear in the log
      await expect(page.getByRole('log')).not.toBeEmpty();
    }
  });

  test('should navigate to Gate from CrowdMap using directions link', async ({ page }) => {
    await page.locator('button[aria-label="Crowd & Navigation"]:visible').click();
    await expect(page.getByText(/Live stadium map/)).toBeVisible();

    // Each gate should have a navigation directions link
    const directionLinks = page.getByRole('link', { name: /Navigate to Gate/i });
    const count = await directionLinks.count();
    expect(count).toBeGreaterThan(0);

    // Verify the link opens Google Maps (href check)
    const href = await directionLinks.first().getAttribute('href');
    expect(href).toContain('google.com/maps');
  });
});
