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

  test('filters nested path with array index', async ({ page }) => {
    const filterInput = page.locator('input[placeholder="Filter: .data.users[0].name"]')
    await filterInput.fill('.data.users[0].name')

    const resultPanel = page.locator('pre').last()
    await expect(resultPanel).toContainText('Alice')
  })

  test('shows result for invalid path on valid JSON', async ({ page }) => {
    const filterInput = page.locator('input[placeholder="Filter: .data.users[0].name"]')
    await filterInput.fill('.nonexistent')

    const resultPanel = page.locator('pre').last()
    await expect(resultPanel).toBeVisible()
  })

  test('clearing the filter hides the result panel', async ({ page }) => {
    const filterInput = page.locator('input[placeholder="Filter: .data.users[0].name"]')
    await filterInput.fill('.data')

    // Verifier que le panneau est visible
    const resultPanel = page.locator('pre').last()
    await expect(resultPanel).toBeVisible()
    await expect(resultPanel).toContainText('"users"')

    // Vider le filtre
    await filterInput.fill('')

    // L'editeur doit reprendre toute la largeur (pas de split)
    const editors = page.locator('.cm-editor')
    await expect(editors).toHaveCount(1)
  })
})
