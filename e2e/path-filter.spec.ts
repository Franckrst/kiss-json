import { test, expect } from '@playwright/test'

test.describe('PathFilter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const editor = page.locator('.cm-editor .cm-content').first()
    await editor.click()
    await page.keyboard.type('{"data":{"users":[{"name":"Alice"},{"name":"Bob"}]}}')
  })

  test('typing a filter path shows the filter result panel', async ({ page }) => {
    const filterInput = page.locator('input[placeholder="Filter: .data.users[0].name"]')
    await filterInput.fill('.data')

    // Le panneau PathFilter doit apparaitre avec le resultat
    const resultPanel = page.locator('pre').last()
    await expect(resultPanel).toBeVisible()
    await expect(resultPanel).toContainText('"users"')
  })
})
