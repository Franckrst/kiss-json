# GitHub Link & README Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Mettre a jour le lien GitHub dans le header et creer un README axe sur la simplicite, la rapidite et l'absence de pubs.

**Architecture:** Deux modifications simples : corriger l'URL du lien GitHub dans le composant Header, puis creer un README.md a la racine du projet.

**Tech Stack:** React/TypeScript, Markdown

---

### Task 1: Mettre a jour le lien GitHub dans le Header

**Files:**
- Modify: `src/components/Header.tsx:37`

**Step 1: Corriger l'URL GitHub**

Remplacer le placeholder `https://github.com/OWNER/kiss-json` par l'URL reelle :

```tsx
// Dans src/components/Header.tsx, ligne 37
// Avant:
href="https://github.com/OWNER/kiss-json"
// Apres:
href="https://github.com/Franckrst/kiss-json"
```

**Step 2: Verifier le changement**

Run: `grep -n "github.com" src/components/Header.tsx`
Expected: Ligne 37 affiche `https://github.com/Franckrst/kiss-json`

**Step 3: Commit**

```bash
git add src/components/Header.tsx
git commit -m "fix: update GitHub repository URL in header"
```

---

### Task 2: Creer le README.md

**Files:**
- Create: `README.md`

**Step 1: Creer le fichier README.md**

```markdown
# KISS JSON

**Formateur, validateur et comparateur JSON — simple, rapide, sans pub.**

[Utiliser KISS JSON](https://kissjson.com) | [GitHub](https://github.com/Franckrst/kiss-json)

---

## Pourquoi KISS JSON ?

- **Simple** — Interface epuree, zero distraction. Collez votre JSON, formatez, c'est fait.
- **Rapide** — Tout tourne dans votre navigateur. Pas de serveur, pas d'attente, pas de limite de taille.
- **Sans pub** — Aucune publicite, aucun tracking, aucun cookie. Jamais.

## Fonctionnalites

- Formater / Beautifier du JSON (2 espaces, 4 espaces, tabs)
- Minifier du JSON
- Trier les cles alphabetiquement
- Comparer deux JSON cote a cote avec diff visuel
- Valider du JSON avec messages d'erreur en temps reel
- Filtrer par chemin (ex: `.data.users[0].name`)
- Importer depuis un fichier ou une URL
- Theme clair / sombre
- Raccourcis clavier (`Ctrl+Shift+F` formater, `Ctrl+Shift+M` minifier, `Ctrl+Shift+S` trier)

## Stack technique

React, TypeScript, CodeMirror 6, Tailwind CSS, Vite.

## Developpement

```bash
npm install
npm run dev
```

## Licence

MIT
```

**Step 2: Verifier le rendu**

Run: `cat README.md | head -5`
Expected: Affiche le titre et la tagline

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README focused on simplicity, speed, and no ads"
```
