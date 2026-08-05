# Angular Implementation Guidelines

## Architecture

**Use:**

- Standalone components
- Feature modules
- Reusable UI library

---

# Component Structure

**Example:**

```
button/
  button.component.ts
  button.component.html
  button.component.scss
  button.spec.ts
```

---

# Inputs

**Use:** Strong typing

**Example:**

```ts
@Input() variant: ButtonVariant;
```

---

# Services

| Layer | Responsibility |
|-------|----------------|
| Services | Business logic |
| Components | UI |

---

# Styling

**Preferred:**

- SCSS
- CSS variables
- Angular Material integration (when needed)

---

# Forms

**Use:** Reactive Forms

**Validation:** Centralised

---

# Performance

**Use:**

- OnPush change detection
- Lazy loading
- `trackBy` for lists

---

# Rules

**DO:**

- Use shared components

**DON'T:**

- Duplicate UI logic

**Majestic Warhorse note:** Prefer tokens from `docs/design_v1` / `src/styles/_variables.scss` (`--ds-*`, `--mc-*`) and reuse existing page/components before adding new ones.
