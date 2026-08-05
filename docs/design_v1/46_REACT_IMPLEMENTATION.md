# React Implementation Guidelines

## Component Architecture

**Use:** Functional components

**TypeScript** required.

---

# Structure

**Example:**

```
components/
  Button/
    Button.tsx
    Button.types.ts
    Button.styles.ts
    index.ts
```

---

# Props

Components must expose:

- `variant`
- `size`
- `state`
- `disabled`
- `loading`

**Example:**

```tsx
<Button variant="primary" size="large" />
```

---

# State Management

**Prefer:**

- Local state
- Context
- Redux / Zustand when required

---

# Styling

**Preferred:**

- Tailwind
- CSS Modules
- Styled Components

---

# Rules

**DO:**

- Build reusable components
- Use design tokens

**DON'T:**

- Hardcode colors
- Duplicate components

---

# Accessibility

Every component requires:

- ARIA
- Keyboard support
- Focus state
