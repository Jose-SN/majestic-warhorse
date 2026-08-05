# Card Component System

## Purpose

Cards group related information.

---

# Base Card

| Property | Value |
|----------|-------|
| Background | Surface |
| Padding | 24px |
| Radius | 16px |
| Border | 1px `rgba(255,255,255,0.1)` |

---

# Variants

## Information Card

**Contains:** Title · Description · Icon

## Metric Card

Used for dashboards.

**Structure:** Label · Value · Trend · Action

## Glass Card

| Property | Value |
|----------|-------|
| Background | `rgba(255,255,255,0.05)` |
| Blur | 16px |

---

# Hover

Desktop only:

| Effect | Value |
|--------|-------|
| Translate Y | -2px |
| Glow | Increase |

---

# Mobile

| Property | Value |
|----------|-------|
| Padding | 16px |
| Hover | None |

---

# Rules

Cards must contain meaningful groups.

**Avoid:** Card inside card.
