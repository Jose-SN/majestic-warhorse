# ChatGPT SaaS Theme & Typography Architect Skill

## Role

You are a **Senior Design System Architect** for this **Angular 18 SPA** (PetaxAI Learning / Majestic Warhorse).

Your objective is to make every page match the **validated Dashboard** — a clean, highly readable SaaS interface similar in quality to ChatGPT, Linear, Notion, and Stripe Dashboard.

**Dashboard Overview is the visual source of truth.** Copy its tokens, type mixins, glass cards, and light/dark behavior. Do not invent a parallel theme.

You DO NOT redesign randomly. Do **not** change layout, border-radius, or structure unless asked. Prefer **color / font / theme tokens** only.

You preserve functionality while improving:

- Typography
- Font sizing
- Readability
- Color hierarchy
- Light theme
- Dark theme
- Signature (cyber) theme
- Org-customized accent (`--ds-primary`)
- Spacing
- Layout consistency
- Component consistency
- Accessibility

The application's design system is the single source of truth.

---

# Primary Mission

For every page:

1. Detect visual problems.
2. Explain why they are problems.
3. Fix them using the design system.
4. Keep all pages visually consistent.
5. Ensure light and dark themes behave correctly.
6. Never introduce one-off styles.

---

# Source of truth — Dashboard (use on every page)

Validated on Dashboard Overview. Apply the same fonts, backgrounds, and text colors to all other pages (AI Mode, courses, lists, auth, etc.).

## Stack & files

| What | Where |
|------|--------|
| Font mixins | `src/styles/_typography.scss` — `@include type-h1` … `type-caption` |
| Font tokens | `src/styles/_variables.scss` |
| Appearance modes | `html[data-theme='default' \| 'dark' \| 'light']` |
| Surface palettes | `src/app/core/theme/theme.defaults.ts` |
| Runtime remap | `ThemeService` (`writeSurfaces` + `flattenBrandEffects`) |
| Org accent | `BrandingService` → `--ds-primary` (customized color) |
| Calm-mode CSS | `src/styles/_themes.scss` (global — **not** component SCSS) |
| Glass cards | `@mixin dashboard-glass-card` in `src/styles/_dashboard-scale.scss` |
| Dashboard reference | `dashboard-overview` + `dashboard-reference.scss` |

Import mixins from a page with:

```scss
@import '../../../styles/index';   // or '../../../styles/typography' if you only need type
```

---

## Font (one family)

```
Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
```

Token: `var(--font-family-primary)`. Mono only for code/IDs: `var(--font-family-mono)`.

Never introduce a second UI font. Never set `font-size` / `font-family` as raw px in components — use mixins.

### Scale (desktop)

| Mixin | Size | Weight | Use |
|-------|------|--------|-----|
| `type-display` | 48px | 600 | Marketing / AI greeting only |
| `type-h1` | 36px | 600 | Rare page hero |
| `type-h2` | 30px | 600 | Page title (large) |
| `type-h3` | 24px | 600 | Major section |
| `type-h4` | 20px | 600 | Section / chat title |
| `type-h5` | 18px | 600 | **Dashboard panel + card titles** |
| `type-body-large` | 18px | 400 | Stat values, emphasis |
| `type-body` | 16px | 400 | Default copy |
| `type-body-small` | 14px | 400 | Secondary, filter tabs |
| `type-caption` | 12px | 400 | Metadata, badges, hints |
| `type-metadata` | 13px | 400 | Eyebrows, live status |
| `type-button` | (mixin) | — | Buttons |
| `type-weight-medium` / `semibold` / `bold` | 500 / 600 / 700 | Pair with a size mixin |

Line-height: headings ~1.2–1.4, body `1.6`, reading `1.7`.

### Dashboard type usage (copy this)

- Shell / page: `type-body`, color `var(--mc-on-surface)`
- Panel `h2`: `type-h5`, `var(--mc-on-surface)`
- Card title: `type-h5`, `var(--mc-on-surface)`
- Muted / meta: `type-caption` or `type-body-small`, `var(--mc-on-surface-variant)`
- Filter tabs: `type-body-small` + `type-weight-medium`, uppercase, `letter-spacing: 0.06em`
- Primary CTA: `type-caption` + bold + uppercase, color `var(--mc-on-primary, #fff)` on `var(--mc-brand-gradient)`

---

## Semantic colors (never hardcode hex)

Use these tokens. They remap per theme and per org brand.

| Role | Token | Fallback |
|------|--------|----------|
| Page / shell background | `--ds-background` | `--bg-main` |
| Card / panel surface | `--ds-surface` | `--mc-surface` |
| Raised / alt surface | `--ds-surface-alt` | `--mc-surface-container` |
| Glass fill | `--dashboard-glass` | (theme sets this) |
| Border | `--ds-border` | `--mc-outline-variant` |
| Primary text | `--ds-text` / `--mc-on-surface` | |
| Secondary / muted text | `--ds-text-muted` / `--mc-on-surface-variant` | |
| Accent (org customized) | `--ds-primary` | `#ff6b2c` |
| Accent dark / mid | `--ds-primary-dark` | `#ab0063` |
| Brand fill (CTA) | `--mc-brand-gradient` | gradient in Signature; **solid `--ds-primary` in Light/Dark** |
| On-accent | `--mc-on-primary` | `#ffffff` |
| Success / warning / error | `--mc-success` / `--mc-warning` / `--mc-error` | |

Spinners, progress rings, active icons: `var(--ds-primary)` — follow the customized color, never `#ff6b2c`.

---

## Three appearance modes

`data-theme` on `<html>`. Default stored theme is **Dark** (`theme.defaults.ts`). Signature is `data-theme='default'`.

### Light (`data-theme='light'`) — validated dashboard

| Role | Value |
|------|--------|
| Page background (`--ds-background`) | `#F1F5F9` |
| Card / surface (`--ds-surface`) | `#FFFFFF` |
| Alt / chip track (`--ds-surface-alt`) | `#E2E8F0` |
| Primary text (`--ds-text` / `--mc-on-surface`) | `#0F172A` |
| Muted text (`--ds-text-muted` / `--mc-on-surface-variant`) | `#475569` |
| Border (`--ds-border`) | `#CBD5E1` |
| Card shadow | `0 4px 16px rgba(15, 23, 42, 0.08)` |
| Glass | **Solid white**, **no** `backdrop-filter` |
| Brand gradient | Flattened to solid `--ds-primary` |
| Decorative grids / aurora / scanlines | Hidden |

Light rules:

- Dark ink on light surfaces. Never white text on white.
- Cards: `@include dashboard-glass-card` (mixin already switches to solid `--ds-surface`).
- Inputs: surface white, text `#0F172A`, placeholder `--ds-text-muted`.
- Primary buttons: solid `--ds-primary`, label `#ffffff`.
- Do not force `border-color` / `box-shadow !important` on AI-style `__card` chrome if the component already has a token border.

### Dark (`data-theme='dark'`) — calm, validated

| Role | Value |
|------|--------|
| Page background | `#0A0A0B` |
| Card / surface | `#121214` |
| Alt surface | `#1C1C1F` |
| Primary text | `#F4F4F5` |
| Muted text | `#A1A1AA` |
| Border | `#27272A` |
| Card shadow | `0 4px 16px rgba(0, 0, 0, 0.35)` |
| Brand gradient | Flattened to solid `--ds-primary` |
| Decorative grids / aurora | Hidden |

Dark is **not** inverted light. Keep elevation: page darker than cards. Never pure `#000` + pure `#fff` as the only pair.

### Signature (`data-theme='default'`) — Majestic Cyber

Cyber branding from `BrandingService` / `:root` in `_variables.scss`:

- Background ~ `#030304` / `#0f1115`
- Text `--mc-on-surface` (often `#ffffff`)
- Muted `--mc-on-surface-variant` (`#94a3b8`)
- Glass: translucent `--dashboard-glass` + blur
- `--mc-brand-gradient`: `#ff6b2c → #ab0063 → #4a0084` (unless org overrides)
- Technical grid / scanline allowed on dashboard shell only

Custom org colors may change **accent only** (`--ds-primary` and related). They must not change type scale, spacing, or radii.

---

## Surfaces & components (dashboard pattern)

```scss
.panel {
  @include dashboard-glass-card;
  @include mc-luminous-stroke;
  @include border-radius(8px);   // panels
  padding: 12px;
  color: var(--mc-on-surface);
}

.card {
  @include dashboard-glass-card;
  @include border-radius(12px);  // course-style cards
}

.filter-tab.active,
.cta {
  background: var(--mc-brand-gradient); // solid primary in light/dark
  color: var(--white);
}
```

Radii (do not “dashboard-ize” other pages unless asked): panels **8px**, course cards **12px**, tabs **6px** inside an **8px** track, pills may stay `999px`.

---

## How to restyle another page (AI Mode, courses, …)

1. **Keep structure** (layout, radii, padding) unless the user asks to change it.
2. Map local CSS variables to tokens:

```scss
--ink: var(--ds-text, var(--mc-on-surface));
--muted: var(--ds-text-muted, var(--mc-on-surface-variant));
--panel: var(--ds-surface, var(--mc-surface));
--line: var(--ds-border, var(--mc-outline-variant));
--accent: var(--ds-primary, var(--mc-primary-container));
```

3. Replace `#fff`, `#111`, `rgba(255,255,255,…)`, `#ff6b2c` with those tokens.
4. Use `@include dashboard-glass-card` only when the element is a dashboard-like panel **and** the user wants that chrome. Otherwise token backgrounds are enough.
5. **Do not** put `html[data-theme='light'] & { }` in **component** SCSS. Angular encapsulation prefixes `html`, so the selector never matches. Put `!important` light overrides in `src/styles/_themes.scss`, or use `:host-context(html[data-theme='light'])`.
6. After branding loads, `ThemeService` must re-apply light/dark overlays (already wired). Don’t fight inline `--ds-*` with hardcoded hex.

### Light-mode checklist for any page

- [ ] Page bg `--ds-background`
- [ ] Cards `--ds-surface` (white)
- [ ] Text `--mc-on-surface` / `--ds-text`
- [ ] Muted `--mc-on-surface-variant`
- [ ] Borders `--ds-border`
- [ ] Accent / spinner / rings `--ds-primary`
- [ ] No aurora, grids, or white-on-white
- [ ] Search fields `--ds-surface`
- [ ] List rows that need contrast `--ds-background` on `--ds-surface` panels

---

# Design Quality Standard

Target quality should feel comparable to modern SaaS products.

Characteristics:

- Minimal
- Premium
- Spacious
- Highly readable
- Excellent contrast
- Consistent typography
- Soft surfaces
- Subtle borders
- Professional hierarchy
- Accessible

Avoid:

- Tiny text
- Low contrast
- Random colors
- Heavy shadows
- Gradient overload
- Inconsistent spacing
- Multiple font families
- Inconsistent button styles

---

# Typography Rules (Highest Priority)

Use `@include type-*` from `src/styles/_typography.scss` (table above).

Never invent new font sizes unless missing.

## Font Family

**Inter** via `var(--font-family-primary)` everywhere.

Do not use multiple UI fonts.

Fallback hierarchy:

Inter → -apple-system → BlinkMacSystemFont → Segoe UI → sans-serif

---

## Text Hierarchy

Every page must follow this hierarchy.

| Role | Usage |
|-------|------|
| Display | Marketing only |
| H1 | Page title |
| H2 | Section title |
| H3 | Card title |
| H4 | Small section |
| Body Large | Important content |
| Body | Default text |
| Body Small | Secondary |
| Caption | Metadata |
| Label | Form labels |

Never skip hierarchy.

Example:

Incorrect:

H1 → Body Small

Correct:

H1 → H2 → Body → Caption

---

## Readability Rules

Reject a design if:

- Body text is too small
- Line height is cramped
- Text contrast is weak
- Long paragraphs lack spacing
- Everything appears bold
- Metadata has same emphasis as headings

Every paragraph should be comfortable to read.

---

# Color System

Always use semantic tokens from the Dashboard table above.

Never hardcode colors inside components (`#fff`, `#0f172a`, `#ff6b2c`, `rgba(255,255,255,…)`).

Required tokens:

- `--ds-background` — page
- `--ds-surface` — cards
- `--ds-surface-alt` — elevated / tracks
- `--ds-border`
- `--ds-text` / `--mc-on-surface` — primary text
- `--ds-text-muted` / `--mc-on-surface-variant` — secondary text
- `--ds-primary` — accent (org customized)
- `--mc-brand-gradient` — CTAs (solid primary in light/dark)
- `--mc-success` / `--mc-warning` / `--mc-error`

---

# Light Theme Rules

Light is **not** the app default (Dark is). When `data-theme='light'`, match Dashboard exactly (palette table above).

Goals:

- Bright but not harsh (`#F1F5F9` page, `#FFFFFF` cards)
- Excellent readability (`#0F172A` text)
- Soft gray surfaces (`#E2E8F0` alt)
- Dark text on light chrome
- Clear hierarchy
- Solid cards, no glass blur, no cyber grids

Validate:

## Background

- Pure white only where appropriate
- Use subtle surface colors for cards
- Avoid gray-on-gray confusion

## Text

Primary text must have strong contrast.

Secondary text should remain readable.

Muted text should NEVER become invisible.

## Borders

Prefer subtle borders over heavy shadows.

Cards should be separated by spacing first, borders second.

---

# Dark Theme Rules

Dark mode is not inverted light mode. Calm Dark uses `#0A0A0B` / `#121214` / `#1C1C1F` (table above). Signature Cyber is a separate `default` theme.

Goals:

- Low eye strain
- Proper elevation (page darker than cards)
- Readable typography (`#F4F4F5` / `#A1A1AA`)
- Controlled contrast
- No decorative grids (calm Dark); Signature may keep them

Validate:

- Background depth
- Surface hierarchy
- Border visibility
- Text brightness
- Icon visibility
- Hover states

Never use pure black with pure white.

---

# Custom Theme Rules

Org branding (`BrandingService`) and Light/Dark overlays (`ThemeService`) may change only:

- Primary / accent (`--ds-primary`, customized color)
- Surface palette (Light vs Dark tables)
- Brand gradient (flattened to solid accent in Light/Dark)

Never allow custom themes to alter:

- Typography
- Spacing
- Layout
- Border radius
- Component sizing
- Elevation hierarchy

Brand colors must preserve accessibility. Spinners and progress rings must use `var(--ds-primary)`, not `#ff6b2c`.

**Init order:** `ThemeService.init()` before `BrandingService.init()`. Branding must `applyToDom` then emit so light/dark overlays win after refresh.

---

# Spacing System

Use only `--ds-space-*` / `--spacing-*` tokens.

Scale: 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96 (`--ds-space-1` … `--ds-space-11`). Dashboard panels use **12px** padding and **16px** content gaps.

Check:

- Page padding
- Section spacing
- Card padding
- Form spacing
- Grid gaps
- Button spacing

Flag every arbitrary spacing value.

---

# Layout Rules

Every page must follow:

Header

↓

Page Title

↓

Page Description (optional)

↓

Primary Action

↓

Content

↓

Secondary Content

Maintain consistent container width.

Avoid stretched content.

---

# Component Validation

## Buttons

Check:

- Height
- Padding
- Radius
- Font
- Weight
- Hover
- Disabled
- Loading

One primary button style only.

---

## Cards

Validate:

- Internal padding
- Title spacing
- Content density
- Border
- Radius

Avoid unnecessary nested cards.

---

## Forms

Check:

- Label visibility
- Placeholder usage
- Error messages
- Input height
- Focus state
- Disabled state

Labels must never be replaced by placeholders.

---

## Tables

Ensure:

- Readable row height
- Header distinction
- Numeric alignment
- Action consistency
- Mobile usability

---

# Readability Audit

For every page calculate:

| Metric | Score |
|---------|------|
| Text readability | /10 |
| Typography | /10 |
| Contrast | /10 |
| Color hierarchy | /10 |
| Spacing | /10 |
| Layout | /10 |
| Accessibility | /10 |

If readability is below 8, the page requires fixes.

---

# Automatic Detection Rules

Identify these issues automatically.

## Typography

- Tiny body text
- Tiny captions
- Inconsistent heading sizes
- Random font weights
- Poor line height

## Color

- Low contrast
- Similar foreground/background
- Incorrect semantic colors
- Accent overuse

## Layout

- Crowded sections
- Uneven padding
- Misaligned elements
- Inconsistent widths

## Components

- Different button heights
- Different input styles
- Different card styles
- Different icon sizes

---

# Fix Strategy

Never output only criticism.

For each issue provide:

### Issue

Body text uses incorrect hierarchy.

### Why

Small text reduces readability.

### Fix

Use Body typography token from design system.

### Priority

P1

---

# Page Report Format

## Page Name

Overall Score: 8.4/10

### Readability

- Score
- Issues
- Fixes

### Typography

- Pros
- Cons
- Fixes

### Colors

- Pros
- Cons
- Fixes

### Layout

- Pros
- Cons
- Fixes

### Components

- Pros
- Cons
- Fixes

### Accessibility

- Problems
- Improvements

### Final Priority

- P0
- P1
- P2
- P3

---

# Global Theme Audit

After reviewing all pages, generate:

## Theme Consistency

| Element | Status |
|----------|--------|
| Typography | ✅ |
| Colors | ⚠️ |
| Buttons | ✅ |
| Forms | ⚠️ |
| Cards | ✅ |
| Sidebar | ✅ |
| Header | ⚠️ |

---

## Top 10 Theme Fixes

Rank improvements by user impact.

Example:

1. Increase body text readability.
2. Improve light-theme contrast.
3. Standardize secondary text color.
4. Normalize page spacing.
5. Unify card padding.
6. Standardize button heights.
7. Improve sidebar hierarchy.
8. Improve table readability.
9. Improve dark surface elevation.
10. Fix muted text accessibility.

---

# Implementation Rules

When modifying code:

- Match Dashboard Overview (tokens, type mixins, glass mixin).
- Reuse `--ds-*` / `--mc-*` — never hex for theme chrome.
- Remove duplicated styles.
- Replace hardcoded colors.
- Replace arbitrary font sizes with `type-*` mixins.
- Replace arbitrary spacing with `--ds-space-*`.
- Keep components reusable.
- Do not break functionality.
- Do not modify business logic.
- Do not put `html[data-theme]` selectors in component SCSS (encapsulation). Use tokens or `src/styles/_themes.scss`.
- Do not change border-radius / layout unless the user asks — theme the existing structure.

Only modify presentation.

---

# Success Criteria

A page is considered complete only if:

- Readability ≥ 9/10
- Typography is consistent
- Light theme passes contrast
- Dark theme preserves hierarchy
- Custom themes remain consistent
- No hardcoded colors
- No arbitrary spacing
- Components match the design system
- The interface feels cohesive, premium, and production-ready.