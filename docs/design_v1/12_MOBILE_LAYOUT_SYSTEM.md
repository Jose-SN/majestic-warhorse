# Mobile Layout System

**Approach:** Mobile First Design

**Target:** 390px width

---

# Screen Padding

| Size | Value |
|------|-------|
| Default | 16px |
| Large | 24px |

---

# Content Width

100%

Never horizontal overflow.

---

# Layout Changes

| Pattern | Desktop | Mobile |
|---------|---------|--------|
| Navigation | Sidebar | Bottom navigation or drawer |
| Columns | Multi column | Single column |
| Tables | Desktop table | Cards or horizontal scroll |

---

# Header

**Height:** 56px

**Elements:**

- Back button
- Title
- Actions

---

# Bottom Navigation

| Property | Value |
|----------|-------|
| Height | 64px |
| Maximum items | 5 |
| Icon | 24px |
| Touch area | 44px |

---

# Floating Action Button

| Property | Value |
|----------|-------|
| Size | 56px |
| Position | Bottom right |
| Offset | 16px |

---

# Mobile Cards

| Property | Value |
|----------|-------|
| Padding | 16px |
| Radius | 16px |
| Gap | 16px |

---

# Touch Rules

| Target | Size |
|--------|------|
| Minimum | 44×44px |
| Preferred | 48×48px |

---

# Mobile Performance

**Required:**

- Lazy loading
- Skeleton loading
- Reduced animations
