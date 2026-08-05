# Button Component System

## Purpose

Buttons represent user actions.

Every screen should have a clear primary action.

---

# Button Hierarchy

## Primary Button

**Usage:** Main conversion action

**Examples:** Create Wallet · Save Changes · Confirm Transaction

| Property | Value |
|----------|-------|
| Background | Bitcoin Orange Gradient |
| Gradient | `#EA580C` → `#F7931A` |
| Text | `#FFFFFF` |
| Height | 48px |
| Padding | 24px horizontal |
| Radius | 999px |

---

## Secondary Button

**Usage:** Alternative actions

| Property | Value |
|----------|-------|
| Background | Surface |
| Border | 1px `#334155` |
| Text | White |

---

## Ghost Button

**Usage:** Low priority actions

| Property | Value |
|----------|-------|
| Background | Transparent |
| Hover | Surface |

---

## Danger Button

**Usage:** Destructive actions

**Color:** `#EF4444`

---

# Sizes

| Size | Height | Padding |
|------|--------|---------|
| Small | 36px | 16px |
| Medium | 48px | 24px |
| Large | 56px | 32px |

---

# States

| State | Behaviour |
|-------|-----------|
| Default | Base style |
| Hover | Increase glow |
| Active | Scale 0.98 |
| Focus | Orange outline |
| Disabled | 50% opacity |
| Loading | Spinner replaces icon |

---

# Icons

Left icon preferred.

**Size:** 20px

---

# Mobile

Full width preferred.

**Touch area:** 44px minimum

---

# Do

- One primary button per section

# Don't

- Multiple orange buttons competing
