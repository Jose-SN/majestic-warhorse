# Sidebar Navigation System

## Purpose

Primary application navigation.

---

# Desktop Sidebar

| Property | Value |
|----------|-------|
| Width | 280px |
| Collapsed | 72px |
| Position | Fixed |
| Height | 100vh |

---

# Structure

```
Logo
↓
Navigation Groups
↓
Secondary Links
↓
User Area
```

---

# Navigation Item

| Property | Value |
|----------|-------|
| Height | 44px |
| Padding | 12px 16px |
| Radius | 10px |
| Icon | 24px |
| Gap | 12px |

---

# Active State

| Property | Value |
|----------|-------|
| Background | `rgba(247,147,26,0.12)` |
| Border-left | 3px Bitcoin Orange |
| Icon | Orange |
| Text | White |
| Glow | Subtle |

---

# Hover

**Background:** `rgba(255,255,255,0.05)`

---

# Groups

**Example:**

```
MAIN
  Dashboard
  Wallet
  Transactions

MANAGEMENT
  Users
  Reports
  Settings
```

---

# Collapsed Mode

**Show:** Icon only

**Tooltip:** Required

---

# Scroll

Sidebar scrolls independently.

---

# Rules

**DO:**

- Keep navigation shallow

**DON'T:**

- More than 3 levels deep
- Too many menu items
