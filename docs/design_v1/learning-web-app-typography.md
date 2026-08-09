# Learning Web App Typography System

## 1. Purpose

This typography system defines the standard font family, sizes, weights, line heights, letter spacing, and spacing rules for the learning web application.

The goal is to provide a clean, modern, highly readable interface suitable for:

- Student dashboards
- Teacher dashboards
- Courses
- Lessons
- AI Tutor
- Chat
- Quizzes
- Assignments
- Notes
- Forms
- Tables
- Navigation
- Course cards
- Mobile responsive views

The typography should remain consistent across the entire product.

---

## 2. Font Family

Use **Inter** as the primary application font.

```css
font-family:
  Inter,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

### Recommended font weights

Only use the following weights unless a specific design requirement requires otherwise:

| Weight | Name | Usage |
|---:|---|---|
| 400 | Regular | Body and learning content |
| 500 | Medium | Buttons, navigation, labels |
| 600 | Semibold | Headings and important emphasis |
| 700 | Bold | Strong emphasis only |

Avoid using bold typography everywhere. The default reading experience should use **400 Regular**.

---

## 3. Base Typography

```css
:root {
  --font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  --font-size-base: 16px;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-base: 1.6;
}
```

```css
body {
  font-family: var(--font-family);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
}
```

---

## 4. Typography Scale

| Element | Desktop | Mobile | Weight | Line Height |
|---|---:|---:|---:|---:|
| Display / Hero | 48px | 36px | 600 | 1.15 |
| H1 | 36px | 30px | 600 | 1.2 |
| H2 | 30px | 24px | 600 | 1.25 |
| H3 | 24px | 20px | 600 | 1.3 |
| H4 | 20px | 18px | 600 | 1.35 |
| H5 | 18px | 17px | 600 | 1.4 |
| Body Large | 18px | 17px | 400 | 1.6 |
| Learning Content | 17px | 17px | 400 | 1.7 |
| Body / Chat | 16px | 16px | 400 | 1.6 |
| Quiz Question | 18px | 17px | 500 | 1.5 |
| Answer Option | 16px | 16px | 400 | 1.5 |
| Button | 14px | 14px | 500 | 1.4 |
| Navigation | 14px | 14px | 500 | 1.4 |
| Body Small | 14px | 14px | 400 | 1.5 |
| Metadata | 13px | 13px | 400 | 1.4 |
| Caption | 12px | 12px | 400 | 1.4 |
| Code | 14px | 13px | 400 | 1.6 |

---

## 5. Learning Content

Learning content is the most important reading area of the application.

Use:

```css
.learning-content {
  font-family: var(--font-family);
  font-size: 17px;
  font-weight: 400;
  line-height: 1.7;
  letter-spacing: -0.01em;
}
```

### Paragraphs

```css
.learning-content p {
  margin: 0 0 16px;
}
```

### Learning headings

```css
.learning-content h1 {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.25;
  margin: 32px 0 16px;
}

.learning-content h2 {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.35;
  margin: 28px 0 12px;
}

.learning-content h3 {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  margin: 24px 0 10px;
}
```

Do not make lesson content unnecessarily large. The objective is comfortable long-form reading.

---

## 6. AI Tutor / Chat Typography

AI responses should use the same font family and a slightly compact UI scale.

```css
.chat-message {
  font-family: var(--font-family);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: -0.01em;
}
```

### AI response headings

```css
.chat-message h1 {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
}

.chat-message h2 {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.35;
}

.chat-message h3 {
  font-size: 17px;
  font-weight: 600;
  line-height: 1.4;
}
```

### Chat paragraph spacing

```css
.chat-message p {
  margin: 0 0 16px;
}
```

---

## 7. Course Titles

Course titles should be visually prominent but not oversized.

```css
.course-title {
  font-size: 32px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.02em;
}
```

Mobile:

```css
@media (max-width: 768px) {
  .course-title {
    font-size: 28px;
  }
}
```

---

## 8. Lesson Titles

```css
.lesson-title {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.02em;
}
```

Mobile:

```css
@media (max-width: 768px) {
  .lesson-title {
    font-size: 24px;
  }
}
```

---

## 9. Quiz Typography

### Question

```css
.quiz-question {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.5;
}
```

### Answer

```css
.quiz-option {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
}
```

### Explanation

```css
.quiz-explanation {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
}
```

---

## 10. Buttons

Buttons should be readable but compact.

```css
.button {
  font-family: var(--font-family);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}
```

Do not use 16–18px text for every button. Reserve larger button typography for prominent primary actions when necessary.

---

## 11. Navigation

```css
.navigation {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}
```

Navigation labels should remain short and easy to scan.

---

## 12. Forms

### Label

```css
.form-label {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}
```

### Input

```css
.form-input {
  font-family: var(--font-family);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
}
```

Use 16px input text on mobile to avoid an unnecessarily small form experience.

### Helper text

```css
.form-helper {
  font-size: 13px;
  font-weight: 400;
  line-height: 1.4;
}
```

---

## 13. Code

Use a monospace font for code.

```css
.code {
  font-family:
    "SFMono-Regular",
    Consolas,
    "Liberation Mono",
    monospace;

  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
}
```

For mobile:

```css
@media (max-width: 768px) {
  .code {
    font-size: 13px;
  }
}
```

---

## 14. Letter Spacing

Use subtle negative letter spacing for large text.

| Text | Letter Spacing |
|---|---:|
| Display / Hero | -0.02em |
| H1 | -0.02em |
| H2 | -0.015em |
| H3 | -0.01em |
| Body | -0.01em |
| Buttons | 0 |
| Navigation | 0 |
| Small text | 0 |

Do not use excessive letter spacing.

---

## 15. Spacing System

Use an 8px spacing system throughout the application.

| Token | Value | Usage |
|---|---:|---|
| XS | 4px | Very small gaps |
| SM | 8px | Small gaps |
| MD | 12px | Compact spacing |
| LG | 16px | Standard spacing |
| XL | 24px | Section spacing |
| 2XL | 32px | Large spacing |
| 3XL | 48px | Major sections |
| 4XL | 64px | Page-level sections |

Example:

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
}
```

---

## 16. Text Spacing Rules

### General

- Paragraph to paragraph: 16px
- Heading to paragraph: 12–16px
- Section to section: 24–32px
- List item spacing: 6–8px
- Code block to surrounding text: 16px
- Image to caption: 8px
- Label to input: 6–8px

Avoid excessive empty space between closely related content.

---

## 17. Lists

```css
.learning-content ul,
.learning-content ol {
  padding-left: 24px;
  margin: 0 0 16px;
}

.learning-content li {
  margin-bottom: 8px;
}
```

Lists should remain easy to scan.

---

## 18. Links

Links should use the application's primary brand colour.

```css
a {
  font-weight: 500;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
```

Do not underline every navigation link by default.

---

## 19. Text Alignment

### Default

Use left alignment for:

- Lessons
- AI responses
- Course descriptions
- Articles
- Forms
- Tables
- Dashboards

Avoid justified text for learning content because uneven word spacing can reduce readability.

### Center alignment

Use primarily for:

- Empty states
- Hero sections
- Authentication screens
- Short promotional messages
- Completion states

---

## 20. Responsive Typography

Typography should scale down moderately on mobile.

Do not aggressively reduce body text.

Recommended mobile minimums:

```text
Body content:       16px
Learning content:   17px
Form input:         16px
Quiz options:       16px
Navigation:         14px
Small text:         13–14px
Caption:            12px
```

Avoid using 12px or 13px for important information on mobile.

---

## 21. Accessibility Rules

Typography must remain readable and accessible.

### Rules

1. Body text should normally be at least 16px.
2. Learning content should preferably be 17px.
3. Avoid using font weight 300 for important content.
4. Do not communicate meaning through font weight alone.
5. Maintain sufficient colour contrast.
6. Do not use uppercase text for long paragraphs.
7. Keep paragraphs reasonably short.
8. Use headings in logical order.
9. Maintain comfortable line height.
10. Allow browser/user text scaling without breaking the layout.

---

## 22. Recommended Content Width

Long-form learning content should not span the entire desktop screen.

Recommended maximum width:

```css
.learning-content {
  max-width: 720px;
}
```

For wider lesson layouts:

```css
.learning-content-wide {
  max-width: 800px;
}
```

This keeps line length comfortable for reading.

---

## 23. Typography Tokens

A central token system should be used so typography can be changed globally.

```css
:root {
  --font-family-primary:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 30px;
  --font-size-4xl: 36px;
  --font-size-5xl: 48px;

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.2;
  --line-height-heading: 1.3;
  --line-height-body: 1.6;
  --line-height-reading: 1.7;
}
```

---

## 24. Design Principle

The learning application should follow this hierarchy:

**Typography hierarchy > spacing > colour > decoration**

Do not try to create hierarchy by adding excessive colours, borders, shadows, or font weights.

A clean hierarchy should be immediately understandable:

```text
Page
 └── Course
      └── Lesson
           ├── Section
           │    ├── Paragraph
           │    ├── List
           │    ├── Example
           │    └── Code
           └── Quiz
```

---

## 25. Final Standard

The application should use:

```text
Primary Font:       Inter
Body:               16px
Learning Content:   17px
Body Weight:        400
Heading Weight:     600
Button Weight:      500
Base Line Height:   1.6
Reading Line Height:1.7
Spacing System:     8px
Content Width:      720–800px
Mobile Body:        16px minimum
```

**One font family. Consistent hierarchy. Comfortable reading. Minimal unnecessary variation.**

This typography system should be treated as the standard for both the web application's UI and learning content.
