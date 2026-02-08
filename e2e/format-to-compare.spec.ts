import { test, expect } from '@playwright/test'

test('format content appears in compare original editor when switching tabs', async ({ page }) => {
  await page.goto('/')

  // Type JSON content into the Format tab's CodeMirror editor
  const formatEditor = page.locator('.cm-editor .cm-content').first()
  await formatEditor.click()
  await page.keyboard.type('{"hello":"world"}')

  // Verify content is present
  await expect(formatEditor).toContainText('"hello"')

  // Switch to Compare tab (the tab button is inside <nav>)
  await page.locator('nav button', { hasText: 'Compare' }).click()

  // The left (Original) editor in Compare should now contain the format content
  // Compare view has label "A - Original" above its first editor
  await expect(page.getByText('A - Original')).toBeVisible()

  // The Compare tab's left editor has aria-label "Original JSON editor"
  const compareLeftEditor = page.getByRole('textbox', { name: 'Original JSON editor' })
  await expect(compareLeftEditor).toContainText('"hello"')
  await expect(compareLeftEditor).toContainText('"world"')
})
