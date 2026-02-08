# PathFilter E2E Tests Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ajouter des tests e2e Playwright pour la fonctionnalite PathFilter et corriger les bugs trouves.

**Architecture:** Un fichier de test e2e Playwright qui couvre les scenarios cles du filtre par chemin : saisie, affichage du resultat, chemin invalide, reset. Si un test echoue, on corrige le code source.

**Tech Stack:** Playwright, TypeScript

---

### Task 1: Creer le fichier e2e pour PathFilter — test basique de saisie

**Files:**
- Create: `e2e/path-filter.spec.ts`

**Step 1: Ecrire le test — le filtre affiche le panneau de resultat**

```typescript
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
```

**Step 2: Lancer le test**

Run: `npx playwright test e2e/path-filter.spec.ts --project=chromium`
Observer si le test passe ou echoue. Si echoue, noter l'erreur.

**Step 3: Commit (si passe) ou passer a Task 2 pour corriger**

```bash
git add e2e/path-filter.spec.ts
git commit -m "test: add e2e test for PathFilter basic input"
```

---

### Task 2: Corriger les bugs trouves (si applicable)

**Files:**
- Modify: `src/components/FormatView.tsx` (si besoin)
- Modify: `src/components/PathFilter.tsx` (si besoin)
- Modify: `src/utils/json-filter.ts` (si besoin)

**Step 1: Analyser l'echec du test**

Si le test de Task 1 echoue :
- Lancer en mode debug : `npx playwright test e2e/path-filter.spec.ts --debug`
- Identifier la cause (selecteur incorrect, filtre qui ne fonctionne pas, panneau qui ne s'affiche pas)

**Step 2: Corriger le bug**

Appliquer le fix dans le fichier concerne.

**Step 3: Relancer les tests**

Run: `npx playwright test e2e/path-filter.spec.ts --project=chromium`
Expected: PASS

**Step 4: Commit**

```bash
git add -A
git commit -m "fix: resolve PathFilter bug found by e2e test"
```

---

### Task 3: Ajouter les tests e2e supplementaires

**Files:**
- Modify: `e2e/path-filter.spec.ts`

**Step 1: Ajouter le test — filtre sur un chemin nested avec index**

```typescript
  test('filters nested path with array index', async ({ page }) => {
    const filterInput = page.locator('input[placeholder="Filter: .data.users[0].name"]')
    await filterInput.fill('.data.users[0].name')

    const resultPanel = page.locator('pre').last()
    await expect(resultPanel).toContainText('Alice')
  })
```

**Step 2: Ajouter le test — chemin invalide affiche une erreur**

```typescript
  test('shows error for invalid path on valid JSON', async ({ page }) => {
    const filterInput = page.locator('input[placeholder="Filter: .data.users[0].name"]')
    await filterInput.fill('.nonexistent')

    const resultPanel = page.locator('pre').last()
    await expect(resultPanel).toBeVisible()
  })
```

**Step 3: Ajouter le test — vider le filtre cache le panneau**

```typescript
  test('clearing the filter hides the result panel', async ({ page }) => {
    const filterInput = page.locator('input[placeholder="Filter: .data.users[0].name"]')
    await filterInput.fill('.data')

    // Verifier que le panneau est visible
    const pathFilterPanel = page.locator('pre').last()
    await expect(pathFilterPanel).toBeVisible()
    await expect(pathFilterPanel).toContainText('"users"')

    // Vider le filtre
    await filterInput.fill('')

    // L'editeur doit reprendre toute la largeur (pas de split)
    const editors = page.locator('.cm-editor')
    await expect(editors).toHaveCount(1)
  })
```

**Step 4: Lancer tous les tests**

Run: `npx playwright test e2e/path-filter.spec.ts --project=chromium`
Expected: Tous les tests passent

**Step 5: Commit**

```bash
git add e2e/path-filter.spec.ts
git commit -m "test: add e2e tests for PathFilter nested path, error, and clear"
```

---

### Task 4: Lancer la suite e2e complete

**Files:**
- Aucun changement

**Step 1: Lancer tous les tests e2e**

Run: `npx playwright test --project=chromium`
Expected: Tous les tests passent (path-filter + format-to-compare)

**Step 2: Commit le plan**

```bash
git add docs/plans/2026-02-08-pathfilter-e2e-tests.md
git commit -m "docs: add PathFilter e2e test plan"
```
