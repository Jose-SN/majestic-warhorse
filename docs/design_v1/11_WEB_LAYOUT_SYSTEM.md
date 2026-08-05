# Web Layout System

Version: 1.0

**Purpose:** Define consistent desktop application layouts.

**Goal:** Every page should feel like the same product.

---

# Desktop Foundation

## Application Container

| Context | Width |
|---------|-------|
| Maximum width | 1280px |
| Large screens | 1440px+ |

Content remains centered.

---

# Page Structure

Every page follows:

```
Application Shell
↓
Header
↓
Sidebar + Main Content
↓
Page Header
↓
Content Sections
↓
Footer (optional)
```

---

# Page Padding

| Viewport | Padding |
|----------|---------|
| Desktop | 32px |
| Large Desktop | 40px |

Never touch screen edges.

---

# Main Content

| Constraint | Value |
|------------|-------|
| Width | Flexible |
| Minimum | 720px |
| Maximum | 1280px |

---

# Section Rules

**Major sections — vertical spacing:** 64px–96px

**Cards inside sections:** 24px gap

**Components inside cards:** 16px gap

---

# Background Layers

| Layer | Role | Value |
|-------|------|-------|
| Layer 1 | True Void | `#030304` |
| Layer 2 | Surface sections | `#0F1115` |
| Layer 3 | Glass floating elements | — |

---

# Dashboard Density

Enterprise dashboards: **Medium density**

| Avoid | Prefer |
|-------|--------|
| Too much empty space | Balance |
| Crowded information | Breathing room |

**Balance:** 40% content · 60% breathing room

---

# Responsive Behaviour

| Viewport | Navigation |
|----------|------------|
| Desktop | Full navigation |
| Tablet | Compact navigation |
| Mobile | Drawer navigation |

---

# Rules

**DO:**

- Align all content
- Reuse layouts
- Maintain spacing

**DON'T:**

- Create unique page structures
- Random widths
- Random padding
