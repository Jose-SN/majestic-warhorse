# Enterprise Bitcoin Design System V1

Complete. **Canonical source:** root [`design.xml`](../../design.xml)  
Runtime CSS: `src/styles/_variables.scss` (maps XML colors → `--color-*` / `--ds-*` / `--mc-*`).  
Org white-label overrides those color tokens via `BrandingService` after login.

**Docs index:** [../DOCUMENTATION-INDEX.md](../DOCUMENTATION-INDEX.md)  
**Angular architecture:** [../frontend_architecture/FRONTEND-ARCHITECTURE.md](../frontend_architecture/FRONTEND-ARCHITECTURE.md)

**Visual language:** True Void background · Digital Gold accents · Orange energy · Glass surfaces · Technical precision · Enterprise usability

---

## Package layout

```
docs/design_v1/
├── foundations/          → 01–10 (flat files)
├── layouts/              → 11–17
├── components/           → 18–37
├── navigation/           → 38–40
├── interaction/          → 41–43
├── accessibility/        → 44–45
├── engineering/          → 46–49
├── ai/                   → 50
├── design-tokens.json
├── variables.scss
├── tailwind.config.js
└── README.md
```

*(Markdown files are numbered flat `01_`…`50_` for easy browsing; groups above are conceptual.)*

---

## Batch 1 — Foundations (01–10)

| Doc | Topic |
|-----|-------|
| [01_COLOR_SYSTEM.md](./01_COLOR_SYSTEM.md) | Palette, brand, semantics |
| [02_DESIGN_TOKENS.md](./02_DESIGN_TOKENS.md) | Token catalog |
| [03_TYPOGRAPHY.md](./03_TYPOGRAPHY.md) | Fonts and scale |
| [04_SPACING_SYSTEM.md](./04_SPACING_SYSTEM.md) | 8pt grid |
| [05_GRID_SYSTEM.md](./05_GRID_SYSTEM.md) | Column grids |
| [06_BREAKPOINTS.md](./06_BREAKPOINTS.md) | Breakpoints |
| [07_RADIUS_SYSTEM.md](./07_RADIUS_SYSTEM.md) | Radii |
| [08_SHADOWS_AND_GLOW.md](./08_SHADOWS_AND_GLOW.md) | Glow |
| [09_ELEVATION_SYSTEM.md](./09_ELEVATION_SYSTEM.md) | Elevation + glass |
| [10_ICONOGRAPHY.md](./10_ICONOGRAPHY.md) | Lucide icons |

---

## Batch 2 — Layouts (11–17)

| Doc | Topic |
|-----|-------|
| [11_WEB_LAYOUT_SYSTEM.md](./11_WEB_LAYOUT_SYSTEM.md) | Desktop shell |
| [12_MOBILE_LAYOUT_SYSTEM.md](./12_MOBILE_LAYOUT_SYSTEM.md) | Mobile-first |
| [13_DASHBOARD_LAYOUTS.md](./13_DASHBOARD_LAYOUTS.md) | Dashboards |
| [14_ADMIN_LAYOUTS.md](./14_ADMIN_LAYOUTS.md) | Admin shell |
| [15_AUTH_LAYOUTS.md](./15_AUTH_LAYOUTS.md) | Auth |
| [16_SETTINGS_LAYOUTS.md](./16_SETTINGS_LAYOUTS.md) | Settings |
| [17_DETAIL_PAGE_LAYOUTS.md](./17_DETAIL_PAGE_LAYOUTS.md) | Detail pages |

---

## Batch 3 — Components (18–37)

| Doc | Topic |
|-----|-------|
| [18_BUTTONS.md](./18_BUTTONS.md) | Buttons |
| [19_CARDS.md](./19_CARDS.md) | Cards |
| [20_INPUTS.md](./20_INPUTS.md) | Inputs |
| [21_FORMS.md](./21_FORMS.md) | Forms |
| [22_SELECTS_AND_DROPDOWNS.md](./22_SELECTS_AND_DROPDOWNS.md) | Selects |
| [23_CHECKBOX_RADIO_SWITCH.md](./23_CHECKBOX_RADIO_SWITCH.md) | Selection |
| [24_TABLES.md](./24_TABLES.md) | Tables |
| [25_LISTS.md](./25_LISTS.md) | Lists |
| [26_TABS.md](./26_TABS.md) | Tabs |
| [27_BADGES_AND_TAGS.md](./27_BADGES_AND_TAGS.md) | Badges |
| [28_MODAL_DIALOGS.md](./28_MODAL_DIALOGS.md) | Modals |
| [29_DRAWERS_AND_SIDEPANELS.md](./29_DRAWERS_AND_SIDEPANELS.md) | Drawers |
| [30_TOASTS_ALERTS.md](./30_TOASTS_ALERTS.md) | Toasts |
| [31_SEARCH_FILTERS.md](./31_SEARCH_FILTERS.md) | Search / filters |
| [32_DATE_TIME_COMPONENTS.md](./32_DATE_TIME_COMPONENTS.md) | Date / time |
| [33_FILE_UPLOAD.md](./33_FILE_UPLOAD.md) | File upload |
| [34_AVATARS.md](./34_AVATARS.md) | Avatars |
| [35_EMPTY_STATES.md](./35_EMPTY_STATES.md) | Empty states |
| [36_ERROR_STATES.md](./36_ERROR_STATES.md) | Error states |
| [37_LOADING_SKELETONS.md](./37_LOADING_SKELETONS.md) | Skeletons |

---

## Batch 4 — Navigation + Interaction (38–43)

| Doc | Topic |
|-----|-------|
| [38_HEADER_NAVIGATION.md](./38_HEADER_NAVIGATION.md) | Header |
| [39_SIDEBAR_NAVIGATION.md](./39_SIDEBAR_NAVIGATION.md) | Sidebar |
| [40_MOBILE_NAVIGATION.md](./40_MOBILE_NAVIGATION.md) | Mobile nav |
| [41_MOTION_SYSTEM.md](./41_MOTION_SYSTEM.md) | Motion |
| [42_MICRO_INTERACTIONS.md](./42_MICRO_INTERACTIONS.md) | Micro-interactions |
| [43_HOVER_FOCUS_STATES.md](./43_HOVER_FOCUS_STATES.md) | Hover / focus / states |

---

## Batch 5 — Accessibility + Engineering + AI (44–50)

| Doc | Topic |
|-----|-------|
| [44_ACCESSIBILITY_WCAG.md](./44_ACCESSIBILITY_WCAG.md) | WCAG 2.2 AA |
| [45_KEYBOARD_NAVIGATION.md](./45_KEYBOARD_NAVIGATION.md) | Keyboard |
| [46_REACT_IMPLEMENTATION.md](./46_REACT_IMPLEMENTATION.md) | React |
| [47_ANGULAR_IMPLEMENTATION.md](./47_ANGULAR_IMPLEMENTATION.md) | Angular |
| [48_TAILWIND_IMPLEMENTATION.md](./48_TAILWIND_IMPLEMENTATION.md) | Tailwind |
| [49_CSS_SCSS_ARCHITECTURE.md](./49_CSS_SCSS_ARCHITECTURE.md) | SCSS architecture |
| [50_AI_GENERATION_RULES.md](./50_AI_GENERATION_RULES.md) | AI generation rules |

---

## Machine-readable assets

| File | Role |
|------|------|
| [`../../design.xml`](../../design.xml) | Compact design-system summary (repo root) |
| [`design-tokens.json`](./design-tokens.json) | JSON tokens |
| [`variables.scss`](./variables.scss) | CSS custom properties |
| [`tailwind.config.js`](./tailwind.config.js) | Tailwind theme extension |

**Enterprise Bitcoin Design System V1 is complete (01–50 + assets).**
