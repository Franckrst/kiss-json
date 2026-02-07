# KISS JSON — Design Document

Outil web open-source de formatage et comparaison de JSON.

## Stack technique

- React + TypeScript
- CodeMirror 6 (editeur JSON)
- Vite (bundler)
- Tailwind CSS (styling + theme dark/light)
- SPA statique, zero backend

## Architecture

Deux modes principaux accessibles par onglets : **Format** et **Compare**.

### Header (compact, ~40px)

- A gauche : nom "KISS JSON"
- Au centre : onglets Format / Compare
- A droite : lien GitHub + toggle dark/light

### Mode Format

Un editeur CodeMirror plein ecran avec coloration syntaxique JSON, numeros de ligne et pliage de code.

**Toolbar d'actions :**
- Formater (indentation configurable : 2 espaces, 4 espaces, tab)
- Minifier (un clic)
- Trier les cles (tri alphabetique recursif)
- Copier (presse-papier)
- Importer (bouton + drag & drop)

**Validation en temps reel :**
- Validation continue pendant la saisie
- Si invalide : bandeau d'erreur avec message et position (ligne:colonne), ligne surlignee
- Si valide : indicateur vert discret

**Filtrage par chemin (dot-notation) :**
- Champ texte pour taper un chemin (ex: `.data.users[0].name`)
- Resultat filtre en temps reel dans un panneau de previsualisation

### Mode Compare

**Entree :**
- Deux editeurs CodeMirror cote a cote (A / B)
- Chaque editeur a son bouton Importer + drag & drop
- Bouton Swap pour inverser les cotes

**Vue Side-by-side (par defaut) :**
- JSON formates automatiquement pour aligner les lignes
- Ajouts en vert (cote B), suppressions en rouge (cote A), modifications en jaune
- Diff au niveau des caracteres pour les modifications
- Scroll synchronise

**Vue Arbre interactif :**
- Toggle Texte / Arbre dans la toolbar
- Arbre depliable/repliable, noeuds colores par type de diff
- Clic sur un noeud pour le detail
- Compteur de differences

**Toolbar Compare :**
- Toggle Texte / Arbre
- Navigation entre les diffs (precedent / suivant)
- Bouton Swap

## UI et theme

- Dark par defaut, light en alternative
- Preference sauvegardee en localStorage
- Couleurs du diff adaptees aux deux themes
- Desktop-first, panneaux empiles sur mobile
- Toasts discrets pour le feedback (pas de modales)

**Raccourcis clavier :**
- `Ctrl+Shift+F` : Formater
- `Ctrl+Shift+M` : Minifier
- `Ctrl+Shift+S` : Trier les cles

## Structure du projet

```
kiss-json/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── FormatView.tsx
│   │   ├── CompareView.tsx
│   │   ├── JsonEditor.tsx        (wrapper CodeMirror)
│   │   ├── TreeDiffView.tsx
│   │   ├── PathFilter.tsx
│   │   └── Toast.tsx
│   ├── utils/
│   │   ├── json-format.ts        (format, minify, sort keys)
│   │   ├── json-diff.ts          (calcul des diffs)
│   │   ├── json-filter.ts        (filtrage dot-notation)
│   │   └── json-validate.ts      (validation + messages d'erreur)
│   ├── hooks/
│   │   └── useTheme.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

## Dependances cles

- `react`, `react-dom`
- `@codemirror/lang-json` + extensions CodeMirror
- `tailwindcss`
- `fast-diff` ou `diff` (diff texte/caracteres)

## Deploiement

Site statique deployable sur Vercel ou Netlify. `vite build` produit le livrable.

## Input utilisateur

- Coller du texte dans l'editeur
- Importer un fichier .json (bouton + drag & drop)
