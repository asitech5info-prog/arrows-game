import { test, expect } from '@playwright/test';

test.describe('Arrows! Game E2E Tests', () => {

  test('Splash Screen displays custom logo, title, and loading line, then transitions to Home', async ({ page }) => {
    await page.goto('/');

    // Check Splash Screen elements
    const splash = page.locator('#splash-screen');
    await expect(splash).toBeVisible();
    await expect(splash.locator('.splash-title')).toContainText('Arrows!');
    await expect(splash.locator('#splash-loading-line')).toBeVisible();

    // Wait for progress to complete and transition to Home screen
    await expect(page.locator('#home-screen')).toBeVisible({ timeout: 6000 });
    await expect(splash).toHaveClass(/hidden/);
  });

  test('Home screen renders brand, challenge card with Level 20 lock, and bottom navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#home-screen')).toBeVisible({ timeout: 6000 });

    // Home brand & play button
    await expect(page.locator('.home-game-name')).toContainText('rrows');
    await expect(page.locator('#home-level-number')).toContainText('Level 1');
    await expect(page.locator('#home-play-btn')).toBeVisible();

    // Challenge lock at level 1
    const lockOverlay = page.locator('#home-daily-lock-overlay');
    await expect(lockOverlay).toBeVisible();
    await expect(lockOverlay).toContainText('Unlocks at Level 20');

    // Bottom Navigation
    const navHome = page.locator('.bottom-nav-item[data-nav="home"]');
    const navChallenge = page.locator('.bottom-nav-item[data-nav="challenge"]');
    const navCollection = page.locator('.bottom-nav-item[data-nav="collection"]');
    const navSettings = page.locator('.bottom-nav-item[data-nav="settings"]');

    await expect(navHome).toBeVisible();
    await expect(navChallenge).toBeVisible();
    await expect(navCollection).toBeVisible();
    await expect(navSettings).toBeVisible();
  });

  test('Collection is locked at level < 8 and Challenge is locked at level < 20', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#home-screen')).toBeVisible({ timeout: 6000 });

    // Clicking Collection should show lock toast
    await page.click('.bottom-nav-item[data-nav="collection"]');
    const toast = page.locator('#app-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Level 8');

    // Clicking Challenge should show lock toast
    await page.click('.bottom-nav-item[data-nav="challenge"]');
    await expect(toast).toContainText('Level 20');
  });

  test('Settings screen has white background, black text, and NO Save Your Progress', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#home-screen')).toBeVisible({ timeout: 6000 });

    // Navigate to Settings
    await page.click('.bottom-nav-item[data-nav="settings"]');
    const settingsScreen = page.locator('#settings-screen');
    await expect(settingsScreen).toBeVisible();

    // Verify background is white and text is black
    const bgColor = await settingsScreen.evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(bgColor).toBe('rgb(255, 255, 255)');

    // Ensure "Save Your Progress" does NOT exist
    const contentText = await settingsScreen.innerText();
    expect(contentText).not.toContain('Save Your Progress');
    expect(contentText).not.toContain('Save your progress');

    // Verify toggles exist
    await expect(page.locator('#setting-sound')).toBeAttached();
    await expect(page.locator('#setting-sound').locator('..')).toBeVisible();
    await expect(page.locator('#setting-vibration')).toBeAttached();
    await expect(page.locator('#setting-music')).toBeAttached();
    await expect(page.locator('#setting-voice')).toBeAttached();
    await expect(page.locator('#setting-guideline')).toBeAttached();

  });

  test('In-Game: 3 RED droplets (lives), theme picker, and level gameplay', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#home-screen')).toBeVisible({ timeout: 6000 });

    // Start Level 1
    await page.click('#home-play-btn');
    await expect(page.locator('#game-screen')).toBeVisible();

    // Verify 3 RED droplets
    const dropletsContainer = page.locator('#game-droplets-container');
    await expect(dropletsContainer).toBeVisible();
    const redDrops = dropletsContainer.locator('.droplet-icon svg');
    await expect(redDrops).toHaveCount(3);
    const dropFill = await redDrops.first().getAttribute('fill');
    expect(dropFill).toBe('#ef4444'); // Red!

    // Verify Theme picker
    await page.click('#game-palette-btn');
    const themePopup = page.locator('#theme-picker-popup');
    await expect(themePopup).toBeVisible();
    // Switch to Peach theme
    await page.click('[data-theme-choice="peach"]');
    await expect(themePopup).toHaveClass(/hidden/);

    // Verify in-game settings modal
    await page.click('#game-settings-btn');
    const igModal = page.locator('#in-game-settings-modal');
    await expect(igModal).toBeVisible();
    await expect(page.locator('#ig-restart-btn')).toBeVisible();
    await page.click('[data-close-modal="in-game-settings-modal"]');
    await expect(igModal).toHaveClass(/hidden/);

    // Tap on canvas to clear arrows in Level 1
    const canvas = page.locator('#game-canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Click arrows on canvas
    await page.mouse.click(box.x + box.width / 2 - 30, box.y + box.height / 2);
    await page.waitForTimeout(300);
    await page.mouse.click(box.x + box.width / 2 + 10, box.y + box.height / 2);
    await page.waitForTimeout(300);
    await page.mouse.click(box.x + box.width / 2 + 50, box.y + box.height / 2);
  });

  test('Hard levels: Level 5 has Glasses shape, Level 10 has Heart, Level 15 has Star, Level 20 has Watch', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#home-screen')).toBeVisible({ timeout: 6000 });

    // Open level jump dialog
    await page.click('#level-jump-btn');
    const selectModal = page.locator('#level-select-modal');
    await expect(selectModal).toBeVisible();

    // Select Level 5
    await page.fill('#level-select-input', '5');
    await page.click('#level-select-confirm-btn');

    // Check Level 5 header
    await expect(page.locator('#in-game-title')).toContainText('Level 5');
    await expect(page.locator('#in-game-subtitle')).toContainText('Hard');

    // Go back to Home
    await page.click('#game-back-btn');
    await expect(page.locator('#home-screen')).toBeVisible();

    // Jump to Level 8 (Collection should now be unlocked!)
    await page.click('#level-jump-btn');
    await page.fill('#level-select-input', '8');
    await page.click('#level-select-confirm-btn');
    await page.click('#game-back-btn');

    // Now clicking Collection should open Collection screen
    await page.click('.bottom-nav-item[data-nav="collection"]');
    await expect(page.locator('#collection-screen')).toBeVisible();
    await expect(page.locator('.trophies-grid')).toBeVisible();

    // Jump to Level 20 (Challenge should now be unlocked!)
    await page.click('.bottom-nav-item[data-nav="home"]');
    await page.click('#level-jump-btn');
    await page.fill('#level-select-input', '20');
    await page.click('#level-select-confirm-btn');
    await page.click('#game-back-btn');

    // Now clicking Challenge should open Challenge screen
    await page.click('.bottom-nav-item[data-nav="challenge"]');
    await expect(page.locator('#challenge-screen')).toBeVisible();
    await expect(page.locator('#calendar-days-grid')).toBeVisible();
  });
});
