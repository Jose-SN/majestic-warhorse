# Motion System

## Philosophy

Motion communicates:

- State change
- Relationship
- Feedback

Motion is not decoration.

---

# Timing

| Token | Duration |
|-------|----------|
| Instant | 100ms |
| Fast | 150ms |
| Normal | 250ms |
| Slow | 400ms |

---

# Easing

**Default:** `ease-out`

---

# Page Transitions

**Enter:** Fade + translate

**Duration:** 250ms

**Example:**

| Property | From → To |
|----------|-----------|
| opacity | 0 → 1 |
| translate | 20px → 0 |

---

# Component Motion

| Component | Motion |
|-----------|--------|
| Cards | Lift |
| Buttons | Scale |
| Dialogs | Fade + scale |
| Drawers | Slide |

---

# Loading

**Use:** Skeletons

**Avoid:** Large spinning loaders

---

# Hover Animation

Desktop only.

**Scale:** 1.02 maximum

---

# Rules

**DO:**

- Explain changes
- Keep motion subtle

**DON'T:**

- Animate everything
- Slow user workflows
