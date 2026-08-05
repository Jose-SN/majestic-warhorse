# Color System

Version: 1.0

Theme: Bitcoin DeFi Enterprise Dark Interface

## Philosophy

Colors communicate:

- Security
- Trust
- Digital value
- Technical precision
- Financial confidence

The system is dark-first.

No pure generic black theme.

The interface should feel like a digital vault powered by blockchain technology.

---

# Core Colors

## Background

**Name:** True Void

**Token:** `color.background.primary`

**Value:** `#030304`

**Usage:**

- Application background
- Main canvas
- Hero sections

Do not use pure black (`#000000`).

---

## Surface

**Name:** Dark Matter

**Token:** `color.surface.primary`

**Value:** `#0F1115`

**Usage:**

- Cards
- Panels
- Modals
- Dropdowns
- Sidebars

---

## Surface Elevated

**Token:** `color.surface.elevated`

**Value:** `#171A20`

**Usage:**

- Hover cards
- Active panels
- Floating components

---

# Text Colors

## Primary Text

**Token:** `color.text.primary`

**Value:** `#FFFFFF`

**Usage:**

- Headlines
- Important information

## Secondary Text

**Token:** `color.text.secondary`

**Value:** `#94A3B8`

**Usage:**

- Descriptions
- Metadata
- Helper text

## Disabled Text

**Value:** `#64748B`

---

# Brand Colors

## Bitcoin Orange

**Token:** `color.brand.primary`

**Value:** `#F7931A`

**Usage:**

- Primary actions
- Links
- Active navigation
- Highlights

## Burnt Orange

**Token:** `color.brand.secondary`

**Value:** `#EA580C`

**Usage:**

- Gradient starts
- Secondary actions

## Digital Gold

**Token:** `color.brand.gold`

**Value:** `#FFD600`

**Usage:**

- Premium indicators
- Success highlights
- Important values

---

# Semantic Colors

| Name | Value |
|------|-------|
| Success | `#22C55E` |
| Warning | `#F59E0B` |
| Error | `#EF4444` |
| Info | `#3B82F6` |

---

# Gradients

## Primary Brand Gradient

```css
linear-gradient(
  to right,
  #EA580C,
  #F7931A
)
```

## Gold Gradient

```css
linear-gradient(
  to right,
  #F7931A,
  #FFD600
)
```

---

# Opacity Rules

| Use | Rule |
|-----|------|
| Borders | white 10% |
| Hover | white 20% |
| Disabled | 50% opacity |
| Glass | white 5% |

---

# Rules

**DO:**

- Use orange for action
- Use gold for value
- Maintain high contrast

**DON'T:**

- Use random colors
- Add extra accent colors
- Use neon colors outside palette
