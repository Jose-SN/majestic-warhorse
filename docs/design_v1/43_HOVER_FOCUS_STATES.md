# Interaction States

Every interactive element requires:

1. Default
2. Hover
3. Active
4. Focus
5. Disabled
6. Loading

---

# Hover

**Purpose:** Show click possibility

Desktop only.

| Element | Effect |
|---------|--------|
| Button | Glow increase |
| Card | Lift |

---

# Active

**Purpose:** Show pressed state

**Transform:** `scale(0.98)`

---

# Focus

Accessibility required.

| Property | Value |
|----------|-------|
| Outline | 2px orange |
| Gap | 4px transparent |

---

# Disabled

| Property | Value |
|----------|-------|
| Opacity | 50% |
| Cursor | not-allowed |

Never remove completely.

---

# Loading

Keep layout stable.

Replace content → spinner

---

# Keyboard Navigation

**Required:**

- Tab navigation
- Enter activation
- Escape close

---

# Touch Devices

No hover dependency.

Every action must work with tap only.

---

# Rules

**DO:**

- Provide visible feedback
- Maintain consistency

**DON'T:**

- Invisible interactions
- Color-only states
