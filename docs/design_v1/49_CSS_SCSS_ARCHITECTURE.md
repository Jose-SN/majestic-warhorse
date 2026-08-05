# CSS SCSS Architecture

## Structure

```
styles/
  tokens/
  components/
  layouts/
  utilities/
```

---

# Tokens

`variables.scss` contains:

- Colors
- Spacing
- Typography
- Radius

See [`variables.scss`](./variables.scss) (design-system package) and app `src/styles/_variables.scss`.

---

# Components

Each component owns:

- Structure
- States
- Responsive rules

---

# Naming

**Use:** BEM

**Example:**

```css
.card
.card__title
.card--featured
```

---

# Variables

**Never:**

```css
color: red;
```

**Use:**

```css
color: var(--color-error);
```

---

# Dark Theme

**Use:** CSS custom properties

**Example:**

```css
--surface-primary
```

---

# Rules

**DO:**

- Use tokens
- Keep styles isolated

**DON'T:**

- Global overrides
- Magic numbers
