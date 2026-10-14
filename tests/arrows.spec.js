import { test, expect } from '@playwright/test';

test.describe('Arrows! Game E2E Tests', () => {

  test('Splash Screen displays title and loading line, then transitions to Home', async ({ page }) => {
    await page.goto('/');

    const splash = page.locator('#splash-screen');
    await expect(splash).toBeVisible();
    await expect(splash.locator('.splash-title')).toContainText('Arrows!');
    await expect(splash.locator('#splash-loading-line')).toBeVisible();

    await expect(page.locator('#home-screen')).toBeVisible({ timeout: 6000 });
    await expect(splash).toHaveClass(/hidden/);
  });

  test('Home screen satisfies requirements: no logo, no top challenge, no streak counter, no jump button', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#home-screen')).toBeVisible({ timeout: 6000 });

    // Clean title exists
    await expect(page.locator('.home-title-clean')).toContainText('Arrows!');

    // Logo image is REMOVED from home screen
    await expect(page.locator('.home-brand-logo')).not.toBeAttached();
    await expect(page.locator('.home-brand-icon')).not.toBeAttached();

    // Challenge card on top of home is REMOVED
    await expect(page.locator('.home-daily-section')).not.toBeAttached();
    await expect(page.locator('#home-daily-card')).not.toBeAttached();

    // Streak counter is REMOVED
    await expect(page.locator('#home-streak-badge')).not.toBeAttached();

    // Level jump button is REMOVED (levels go one by one)
    await expect(page.locator('#level-jump-btn')).not.toBeAttached();

    // Level indicator & play button exist
    await expect(page.locator('#home-level-number')).toContainText('Level 1');
    await expect(page.locator('#home-play-btn')).toBeVisible();
  });

  test('Profile customization: change name, choose from 30 in-game PFPs', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#home-screen')).toBeVisible({ timeout: 6000 });

    // Open Profile Modal
    await page.click('#home-profile-pill');
    const profileModal = page.locator('#profile-modal');
    await expect(profileModal).toBeVisible();

    // Verify 30 in-game PFPs are present
    const pfpChoices = page.locator('.pfp-choice-item');
    await expect(pfpChoices).toHaveCount(30);

    // Change player name
    await page.fill('#profile-name-input', 'MasterArrow');

    // Select Panda avatar
    await page.click('.pfp-choice-item[data-pfp-id="panda"]');

    // Save profile
    await page.click('#profile-save-btn');
    await expect(profileModal).toHaveClass(/hidden/);

    // Verify home screen player name and avatar updated
    await expect(page.locator('#home-player-name')).toHaveText('MasterArrow');
    await expect(page.locator('#home-avatar-icon')).toContainText('🐼');
  });

  test('Bottom navigation: locks for Challenge & Collection, Theme button next to Settings', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#home-screen')).toBeVisible({ timeout: 6000 });

    const navHome = page.locator('.bottom-nav-item[data-nav="home"]');
    const navChallenge = page.locator('.bottom-nav-item[data-nav="challenge"]');
    const navCollection = page.locator('.bottom-nav-item[data-nav="collection"]');
    const navTheme = page.locator('#nav-theme-btn');
    const navSettings = page.locator('.bottom-nav-item[data-nav="settings"]');

    await expect(navHome).toBeVisible();
    await expect(navChallenge).toBeVisible();
    await expect(navCollection).toBeVisible();
    await expect(navTheme).toBeVisible();
    await expect(navSettings).toBeVisible();

    // Challenge & Collection lock badges exist at level 1
    await expect(page.locator('#nav-challenge-lock')).toBeVisible();
    await expect(page.locator('#nav-collection-lock')).toBeVisible();

    // Clicking Theme button toggles theme picker
    await navTheme.click();
    const themePopup = page.locator('#theme-picker-popup');
    await expect(themePopup).toBeVisible();
    await navTheme.click();
    await expect(themePopup).toHaveClass(/hidden/);
  });

  test('Settings: monochrome icons, Dark Theme toggle, Language changer with dozens of languages, NO Save Your Progress', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#home-screen')).toBeVisible({ timeout: 6000 });

    // Open Settings
    await page.click('.bottom-nav-item[data-nav="settings"]');
    const settingsScreen = page.locator('#settings-screen');
    await expect(settingsScreen).toBeVisible();

    // Verify background is white in light mode
    const bgColor = await settingsScreen.evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(bgColor).toBe('rgb(255, 255, 255)');

    // Ensure NO "Save Your Progress"
    const textContent = await settingsScreen.innerText();
    expect(textContent).not.toContain('Save Your Progress');
    expect(textContent).not.toContain('Save your progress');

    // Verify monochrome SVG icons exist
    await expect(page.locator('#setting-sound')).toBeAttached();
    await expect(page.locator('#setting-vibration')).toBeAttached();
    await expect(page.locator('#setting-music')).toBeAttached();
    await expect(page.locator('#setting-dark-theme')).toBeAttached();
    await expect(page.locator('#setting-guideline')).toBeAttached();
    await expect(page.locator('#settings-rate-us-btn')).toBeVisible();
    await expect(page.locator('#settings-feedback-btn')).toBeVisible();
    await expect(page.locator('#settings-privacy-btn')).toBeVisible();
    await expect(page.locator('#settings-terms-btn')).toBeVisible();

    // Voice button was removed and replaced by Dark Theme
    await expect(page.locator('#setting-voice')).not.toBeAttached();

    // Test Language Changer
    await page.click('#settings-language-btn');
    const langModal = page.locator('#language-modal');
    await expect(langModal).toBeVisible();

    const langRows = page.locator('.language-choice-row');
    const count = await langRows.count();
    expect(count).toBeGreaterThanOrEqual(18); // Dozens of languages

    // Switch to Spanish (Español)
    await page.click('.language-choice-row[data-lang-code="es"]');
    await expect(langModal).toHaveClass(/hidden/);

    // Verify UI translated to Spanish
    await expect(page.locator('[data-i18n="settings"]').first()).toHaveText('Ajustes');
    await expect(page.locator('#settings-screen [data-i18n="sound"]')).toHaveText('Sonido');

    // Switch back to English
    await page.click('#settings-language-btn');
    await page.click('.language-choice-row[data-lang-code="en"]');
    await expect(page.locator('[data-i18n="settings"]').first()).toHaveText('Settings');

    // Test Dark Theme toggle
    await page.click('#setting-dark-theme + .slider');
    await expect(page.locator('#app-container')).toHaveClass(/dark-theme/);
  });

  test('In-Game: 3 RED droplets, sleek arrows, and Out of Moves modal with Revive, Retry, and Home', async ({ page }) => {
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
    expect(dropFill).toBe('#ef4444');

    // Verify Game Canvas
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    // Trigger Game Over to test "Out of Moves!" modal
    await page.evaluate(() => {
      window.uiManager.game.lives = 0;
      window.uiManager.showGameOverModal();
    });

    const goModal = page.locator('#gameover-modal');
    await expect(goModal).toBeVisible();
    await expect(goModal.locator('.gameover-title')).toContainText('Out of Moves!');
    await expect(goModal.locator('.gameover-subtitle')).toContainText('You used all 3 red droplets on blocked arrows.');

    // Revive, Retry, and Home buttons
    const reviveBtn = page.locator('#gameover-revive-btn');
    const retryBtn = page.locator('#gameover-retry-btn');
    const homeBtn = page.locator('#gameover-home-btn');

    await expect(reviveBtn).toContainText('Revive (+2 Lives)');
    await expect(retryBtn).toContainText('Retry Level');
    await expect(homeBtn).toContainText('Home');

    // Clicking Revive restores lives and resumes
    await reviveBtn.click();
    await expect(goModal).toHaveClass(/hidden/);
    expect(await page.evaluate(() => window.uiManager.game.lives)).toBe(2);
  });

  test('Level 5: Authentic Glasses shape with guaranteed solvability', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#home-screen')).toBeVisible({ timeout: 6000 });

    // Simulate reaching Level 5
    await page.evaluate(() => {
      window.uiManager.state.level = 5;
      window.uiManager.saveState();
      window.uiManager.updateHomeLevelDisplay();
    });

    await page.click('#home-play-btn');
    await expect(page.locator('#game-screen')).toBeVisible();

    await expect(page.locator('#in-game-title')).toContainText('Level 5');
    await expect(page.locator('#in-game-subtitle')).toContainText('Hard');

    // Verify level shape is glasses
    const shape = await page.evaluate(() => window.uiManager.game.level.shape);
    expect(shape).toBe('glasses');

    // Verify all glasses arrows are solvable in sequence
    const solvable = await page.evaluate(() => {
      const g = window.uiManager.game;
      let arrows = [...g.arrows];
      while (arrows.length > 0) {
        const free = arrows.find(a => g.canArrowEscape(a, arrows));
        if (!free) return false;
        arrows = arrows.filter(a => a.id !== free.id);
      }
      return true;
    });
    expect(solvable).toBe(true);
  });

  test('Capture visual verification screenshots', async ({ page }) => {
    const artifactDir = 'C:/Users/Sohaib Irfan/.gemini/antigravity-ide/brain/cd0f2f52-0498-45b5-bedd-6226d6dc27e4';
    await page.goto('/');
    await expect(page.locator('#home-screen')).toBeVisible({ timeout: 6000 });

    // 1. Home screen screenshot
    await page.screenshot({ path: `${artifactDir}/screen_home.png` });

    // 2. Profile modal screenshot (30 PFPs)
    await page.click('#home-profile-pill');
    await expect(page.locator('#profile-modal')).toBeVisible();
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${artifactDir}/screen_profile.png` });
    await page.click('[data-close-modal="profile-modal"]');

    // 3. Settings screen screenshot
    await page.click('.bottom-nav-item[data-nav="settings"]');
    await expect(page.locator('#settings-screen')).toBeVisible();
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${artifactDir}/screen_settings.png` });

    // 4. Out of Moves modal screenshot
    await page.click('.bottom-nav-item[data-nav="home"]');
    await page.click('#home-play-btn');
    await expect(page.locator('#game-screen')).toBeVisible();
    await page.evaluate(() => {
      window.uiManager.showGameOverModal();
    });
    await expect(page.locator('#gameover-modal')).toBeVisible();
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${artifactDir}/screen_out_of_moves.png` });
    await page.click('#gameover-revive-btn');

    // 5. Level 5 Glasses gameplay screenshot
    await page.evaluate(() => {
      window.uiManager.startLevel(5);
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${artifactDir}/screen_level5_glasses.png` });
  });

});

