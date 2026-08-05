# Tailwind Implementation

## Philosophy

Tailwind classes must come from design tokens.

---

# Theme

**Map:**

- Colors
- Spacing
- Radius
- Shadows
- Typography

See [`tailwind.config.js`](./tailwind.config.js) and [`design-tokens.json`](./design-tokens.json).

---

# Example

**Correct:**

```html
<div class="bg-surface text-primary rounded-card">
```

**Incorrect:**

```html
<div class="bg-[#0F1115]">
```

---

# Components

Create reusable classes.

**Example:**

```css
.btn-primary
.card
```

---

# Responsive

**Use:** Mobile first

**Example:**

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
```

---

# Rules

No random utility combinations.

Design tokens are the source.
