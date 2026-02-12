#!/usr/bin/env node

/**
 * Capture screenshots of app features for the home page showcase.
 *
 * Prerequisites:
 *   - `bin/dev` running with seeded data
 *   - `npx playwright install chromium`
 *
 * Usage:
 *   node scripts/capture-screenshots.mjs
 *
 * Output:
 *   app/frontend/assets/screenshots/
 *     radar-cards.png
 *     dividend-calendar.png
 *     buy-plan-mode.png
 *     mobile-radar.png
 */

import { chromium } from 'playwright'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = resolve(__dirname, '../app/frontend/assets/screenshots')
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const EMAIL = process.env.LOGIN_EMAIL || 'default@example.com'
const PASSWORD = process.env.LOGIN_PASSWORD || 'password'

async function login(page) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForSelector('#email', { timeout: 10000 })
  await page.fill('#email', EMAIL)
  await page.fill('#password', PASSWORD)
  await page.click('button[type="submit"]')
  // After login, the app redirects to "/" (home) by default via React Router
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 })
}

function forceLight(page) {
  return page.addInitScript(() => {
    localStorage.setItem('dividend-portfolio-theme', 'light')
  })
}

async function waitForContent(page) {
  // Wait for stock cards or rows to render
  await page.waitForSelector('[data-slot="card"], [role="group"]', { timeout: 15000 }).catch(() => {})
  // Extra settle time for images / animations
  await page.waitForTimeout(2000)
}

async function main() {
  const browser = await chromium.launch({ headless: true })

  try {
    // ── Desktop context ──
    const desktopCtx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      colorScheme: 'light',
    })
    const page = await desktopCtx.newPage()
    await forceLight(page)
    await login(page)

    // 1. Radar cards
    console.log('Capturing radar-cards.png ...')
    await page.goto(`${BASE_URL}/radar`)
    await waitForContent(page)
    await page.screenshot({
      path: `${OUTPUT_DIR}/radar-cards.png`,
      fullPage: false,
    })
    console.log('  done')

    // 2. Dividend calendar
    console.log('Capturing dividend-calendar.png ...')
    // Scroll to the calendar table if it exists
    const calendarTable = page.locator('table').first()
    if (await calendarTable.isVisible({ timeout: 5000 }).catch(() => false)) {
      await calendarTable.scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
      await calendarTable.screenshot({ path: `${OUTPUT_DIR}/dividend-calendar.png` })
    } else {
      // Fallback: scroll to bottom and capture viewport
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(500)
      await page.screenshot({ path: `${OUTPUT_DIR}/dividend-calendar.png`, fullPage: false })
    }
    console.log('  done')

    // 3. Buy plan mode
    console.log('Capturing buy-plan-mode.png ...')
    // Scroll back to top first
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(300)
    const buyPlanBtn = page.getByRole('button', { name: /Plan Purchases/i })
    if (await buyPlanBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await buyPlanBtn.click()
      await page.waitForTimeout(1000)
    }
    await page.screenshot({
      path: `${OUTPUT_DIR}/buy-plan-mode.png`,
      fullPage: false,
    })
    console.log('  done')

    // Turn off buy plan mode
    const exitBtn = page.getByRole('button', { name: /Exit Plan/i })
    if (await exitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await exitBtn.click()
      await page.waitForTimeout(500)
    }

    await desktopCtx.close()

    // ── Mobile context ──
    console.log('Capturing mobile-radar.png ...')
    const mobileCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: 'light',
      isMobile: true,
    })
    const mobilePage = await mobileCtx.newPage()
    await forceLight(mobilePage)
    await login(mobilePage)
    await mobilePage.goto(`${BASE_URL}/radar`)
    await waitForContent(mobilePage)
    await mobilePage.screenshot({
      path: `${OUTPUT_DIR}/mobile-radar.png`,
      fullPage: false,
    })
    console.log('  done')

    await mobileCtx.close()

    console.log(`\nAll screenshots saved to ${OUTPUT_DIR}`)
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err)
  process.exit(1)
})
