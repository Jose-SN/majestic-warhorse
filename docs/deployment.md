# Cloudflare Deployment — PetaxAI Learning (majestic-warhorse)

Deploy this **Angular 18 SPA** to Cloudflare via **Workers Builds (static assets)**.

**Repo:** [Jose-SN/majestic-warhorse](https://github.com/Jose-SN/majestic-warhorse)  
**Production URL (current):** https://majestic.petaxai.com

---

## Table of contents

1. [Deployment model](#deployment-model)
2. [Cloudflare dashboard settings](#cloudflare-dashboard-settings)
3. [Repo files](#repo-files)
4. [Environment / build notes](#environment--build-notes)
5. [Package manager / lockfile](#package-manager--lockfile)
6. [Local commands](#local-commands)
7. [Manual CLI deploy](#manual-cli-deploy)
8. [Legacy EC2 deploy](#legacy-ec2-deploy)
9. [Troubleshooting](#troubleshooting)
10. [Checklist](#checklist)
11. [Instance values](#instance-values)

---

## Deployment model

| Item | Value |
|------|-------|
| **Model** | Workers Builds (static) |
| **Framework** | Angular 18 browser build (SPA) |
| **Build command** | `npm run build:cloudflare` |
| **Deploy command** | `npx wrangler deploy` |
| **Output** | `dist/majestic-warhorse/` |
| **Config** | `wrangler.jsonc` |
| **SPA routing** | `assets.not_found_handling: "single-page-application"` |

### Pipeline

```
Git push
  ↓
Cloudflare clones repo (root = /, NOT dist)
  ↓
npm ci / npm install (from package-lock.json)
  ↓
npm run build:cloudflare  →  dist/majestic-warhorse/
  ↓
npx wrangler deploy  →  reads wrangler.jsonc, uploads assets
  ↓
Live on Cloudflare edge
```

---

## Cloudflare dashboard settings

### Create project

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages**
2. **Create** → **Import a repository**
3. Select `Jose-SN/majestic-warhorse` and branch (`master` or `main`)

### Builds configuration — copy these values

| Field | Value | Notes |
|-------|-------|-------|
| **Root directory** | *(empty)* | Source root. **Never** set to `dist`. |
| **Build command** | `npm run build:cloudflare` | Angular production build |
| **Deploy command** | `npx wrangler deploy` | Required on Workers Builds |
| **Framework preset** | `None` | Prevents Cloudflare overriding the build |
| **Production branch** | `master` | Matches current GitHub default (change if you rename) |

### Build variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `NODE_VERSION` | `22` | Pin Node LTS (`package.json` engines: `>=20 <23`) |

### Match Wrangler project name

The `"name"` in `wrangler.jsonc` **must match** the Cloudflare Workers project name:

```jsonc
{
  "name": "majestic-warhorse"
}
```

If you create the project under a different name in the dashboard, update `wrangler.jsonc` to match.

### Custom domain

After first successful deploy:

1. Project → **Settings** → **Domains & Routes**
2. Add `majestic.petaxai.com` (or your domain)
3. Update DNS as Cloudflare instructs

Also keep `src/environments/environment.prod.ts` → `appUrl` aligned with the live domain.

---

## Repo files

### 1. `wrangler.jsonc`

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "majestic-warhorse",
  "compatibility_date": "2026-08-12",
  "assets": {
    "directory": "./dist/majestic-warhorse",
    "not_found_handling": "single-page-application"
  }
}
```

| Field | Description |
|-------|-------------|
| `name` | Cloudflare Workers project name |
| `assets.directory` | Angular `outputPath` from `angular.json` |
| `not_found_handling` | Serves `index.html` for client routes (`/dashboard/...`) |

No TanStack / Vite / Nitro / `prepare-static-dist` step — Angular already emits a flat SPA folder.

### 2. `package.json` scripts

| Script | Purpose |
|--------|---------|
| `build:cloudflare` | `ng build --configuration production` |
| `deploy:cloudflare` | Local build + `wrangler deploy` |
| `preview:static` | Serve `dist/majestic-warhorse` locally |

`wrangler` is a `devDependency`.

### 3. `.gitignore`

Ensure these are ignored:

```gitignore
/dist
.wrangler/
.dev.vars
bun.lock
bun.lockb
```

Do **not** commit `bun.lock` if you want Cloudflare to use **npm**.

### 4. Expected build output

```
dist/majestic-warhorse/
├── index.html
├── favicon.ico
├── manifest.webmanifest
├── assets/
└── *.js / *.css   # hashed bundles
```

---

## Environment / build notes

Angular bakes config at **build time** via file replacements:

| File | When |
|------|------|
| `src/environments/environment.ts` | Local / `ng serve` |
| `src/environments/environment.prod.ts` | Production / `build:cloudflare` |

Production API hosts live in `environment.prod.ts` (`iamApi`, `majesticWarhorseApi`, `supabaseUrl`, `appUrl`, etc.). Change those files and rebuild to update the deployed app — they are **not** Cloudflare runtime secrets.

Optional Cloudflare build vars:

| Variable | Example | Purpose |
|----------|---------|---------|
| `NODE_VERSION` | `22` | Pin Node on CI |

---

## Package manager / lockfile

| Lockfile in repo | Cloudflare install |
|------------------|--------------------|
| `package-lock.json` | npm (**this repo**) |
| `bun.lock` / `bun.lockb` | Bun (avoid — gitignored) |
| `pnpm-lock.yaml` | pnpm |
| `yarn.lock` | yarn |

Rules:

1. Commit **exactly one** lockfile (`package-lock.json`)
2. After dependency changes: `npm install` and commit both `package.json` + `package-lock.json`
3. Do not commit `bun.lock`

---

## Local commands

```bash
npm install

# Dev
npm start

# Same build Cloudflare CI runs
npm run build:cloudflare

# Preview static output
npm run preview:static

# Build + deploy from your machine (npx wrangler login first)
npm run deploy:cloudflare
```

---

## Manual CLI deploy

```bash
npx wrangler login
npm run build:cloudflare
npx wrangler deploy
```

Or: `npm run deploy:cloudflare`

---

## Legacy EC2 deploy

`.github/workflows/main.yml` still deploys `dist/` to EC2 on push to `master` via SSH. Cloudflare Workers Builds is the path described in this doc; leave or remove the EC2 workflow once Cloudflare is primary.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| 404 on client routes (`/dashboard/...`) | Confirm `not_found_handling: "single-page-application"` in `wrangler.jsonc` |
| Wrong / empty deploy | Root directory must be empty (not `dist`) |
| Build can’t find output | `assets.directory` must be `./dist/majestic-warhorse` (matches `angular.json` `outputPath`) |
| Wrangler name mismatch | `"name"` in `wrangler.jsonc` = Cloudflare project name |
| Bun used on CI | Remove committed `bun.lock`; keep it gitignored |
| Lockfile out of sync | Run `npm install`, commit `package-lock.json` |
| Node version errors | Set `NODE_VERSION=22` in Cloudflare build variables |
| Old API URLs in prod | Update `environment.prod.ts` and redeploy |

---

## Checklist

- [ ] Connect GitHub repo `Jose-SN/majestic-warhorse`
- [ ] Root directory: **empty**
- [ ] Build command: `npm run build:cloudflare`
- [ ] Deploy command: `npx wrangler deploy`
- [ ] Framework preset: **None**
- [ ] Build variable: `NODE_VERSION=22`
- [ ] `wrangler.jsonc` `"name"` matches Cloudflare project name
- [ ] Push to production branch and verify build logs
- [ ] Add custom domain (e.g. `majestic.petaxai.com`)
- [ ] Confirm `environment.prod.ts` `appUrl` matches the live domain

---

## Instance values

| Item | Value |
|------|-------|
| **App** | PetaxAI Learning (majestic-warhorse) |
| **GitHub** | [Jose-SN/majestic-warhorse](https://github.com/Jose-SN/majestic-warhorse) |
| **Branch** | `master` |
| **Cloudflare project name** | `majestic-warhorse` |
| **Framework** | Angular 18 SPA |
| **Deploy model** | Workers Builds (static) |
| **Package manager (CI)** | npm |
| **Build output** | `dist/majestic-warhorse` |

### Cloudflare settings

| Field | Value |
|-------|-------|
| Root directory | *(empty)* |
| Build command | `npm run build:cloudflare` |
| Deploy command | `npx wrangler deploy` |
| Build variable | `NODE_VERSION=22` |

### Files in this repo

| File | Status |
|------|--------|
| `wrangler.jsonc` | ✅ `name: majestic-warhorse`, SPA assets |
| `package.json` | ✅ `build:cloudflare`, `deploy:cloudflare`, `wrangler` |
| `package-lock.json` | ✅ committed (npm) |
| `bun.lock` | ❌ gitignored |
| `angular.json` | ✅ `outputPath: dist/majestic-warhorse` |

---

## Quick copy — minimal Cloudflare config

**Dashboard:**

```
Root directory:     (empty)
Build command:      npm run build:cloudflare
Deploy command:     npx wrangler deploy
NODE_VERSION:       22
```

**`wrangler.jsonc`:**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "majestic-warhorse",
  "compatibility_date": "2026-08-12",
  "assets": {
    "directory": "./dist/majestic-warhorse",
    "not_found_handling": "single-page-application"
  }
}
```
