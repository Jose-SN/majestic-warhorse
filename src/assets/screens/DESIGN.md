---
name: Majestic Cyber
colors:
  surface: '#131316'
  surface-dim: '#131316'
  surface-bright: '#39393c'
  surface-container-lowest: '#0e0e11'
  surface-container-low: '#1b1b1e'
  surface-container: '#1f1f22'
  surface-container-high: '#2a2a2d'
  surface-container-highest: '#353438'
  on-surface: '#e4e1e6'
  on-surface-variant: '#e2bfb3'
  inverse-surface: '#e4e1e6'
  inverse-on-surface: '#303033'
  outline: '#a98a7f'
  outline-variant: '#594139'
  surface-tint: '#ffb59a'
  primary: '#ffb59a'
  on-primary: '#5b1b00'
  primary-container: '#ff6b2c'
  on-primary-container: '#5c1c00'
  inverse-primary: '#a83900'
  secondary: '#ffb0cc'
  on-secondary: '#640038'
  secondary-container: '#ab0063'
  on-secondary-container: '#ffbad2'
  tertiary: '#dcb8ff'
  on-tertiary: '#480081'
  tertiary-container: '#bb7bff'
  on-tertiary-container: '#4a0084'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcf'
  primary-fixed-dim: '#ffb59a'
  on-primary-fixed: '#380d00'
  on-primary-fixed-variant: '#802900'
  secondary-fixed: '#ffd9e4'
  secondary-fixed-dim: '#ffb0cc'
  on-secondary-fixed: '#3e0020'
  on-secondary-fixed-variant: '#8d0051'
  tertiary-fixed: '#efdbff'
  tertiary-fixed-dim: '#dcb8ff'
  on-tertiary-fixed: '#2c0051'
  on-tertiary-fixed-variant: '#6700b5'
  background: '#131316'
  on-background: '#e4e1e6'
  surface-variant: '#353438'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  container-max: 1440px
---

## Brand & Style

The design system evolves into a high-energy, technical aesthetic that bridges the gap between raw power and digital precision. Inspired by the "Majestic Warhorse," the brand personality is aggressive yet controlled, combining the kinetic energy of fire and motion with the disciplined structure of high-end software.

The visual style is **Cyber-Minimalism with Glassmorphism**. We utilize a deep, near-black foundation to allow the vibrant gradients of the brand to act as light sources within the UI. Elements feel like illuminated glass panels floating in a digital void. The emotional response is one of "High-Octane Professionalism"—it feels fast, sophisticated, and technologically superior.

Key stylistic pillars include:
- **Luminescent Accents:** Using the primary orange-to-purple gradient for interactive borders and state changes.
- **Translucent Depth:** Layered surfaces with subtle backdrop blurs to maintain context in complex data environments.
- **Technical Precision:** Sharp typography and high-contrast labels that provide a "heads-up display" (HUD) feel.

## Colors

The palette is extracted directly from the "Majestic Warhorse" spectrum. We transition from the cool cyans of previous iterations to a "Heat-Map" logic where warmth indicates activity and importance.

- **Primary (Vivid Orange):** Used for primary actions, critical alerts, and active indicators. It represents the "Fire" of the horse.
- **Secondary (Deep Pink):** Used for secondary interactions, iconography, and mid-level accents.
- **Tertiary (Purple):** Used for deep background glows, decorative elements, and subtle brand reinforcement.
- **Neutral:** A curated set of deep charcoals and "Obsidian" blacks (e.g., `#0F0F12`) form the background, ensuring the vibrant brand colors achieve maximum luminous impact.

Surface colors use high-opacity neutrals with subtle 1px borders in the primary gradient to simulate glowing edges.

## Typography

The typography strategy focuses on "Technical Sharpness." 

**Space Grotesk** is used for headlines to provide a futuristic, geometric edge that mirrors the "Cyber" theme. Its wide stance and unique apertures give the UI a distinctive, modern character.

**Geist** serves as the body face, providing exceptional legibility in dark mode. Its neutral, clean design ensures that dense information remains accessible.

**JetBrains Mono** is utilized for labels, metadata, and status indicators. This monospaced choice reinforces the "Developer/Tech" origin of the design system, making every piece of data feel like part of a sophisticated system.

## Layout & Spacing

This design system utilizes a **Rigid Fluid Grid**. While the layout adapts to the screen size, it maintains a strict 4px baseline grid to ensure mathematical harmony across all components.

- **Desktop:** A 12-column grid with 24px gutters. Use large margins (64px) to create a "contained HUD" feel, centering the focus on the content.
- **Mobile:** A 4-column grid with 16px gutters and 20px side margins. 
- **Reflow Rules:** Components should prioritize vertical stacking on mobile, with complex data tables transforming into card-based lists to preserve readability.

Padding within components (like cards and buttons) should follow a progressive scale (8px, 16px, 24px, 40px) to maintain a sense of spaciousness within the dark interface.

## Elevation & Depth

In a dark cybernetic environment, depth is created through **Light and Opacity**, not traditional shadows.

1.  **Level 0 (Base):** Deep neutral `#0F0F12`.
2.  **Level 1 (Surface):** A slightly lighter neutral with 5% opacity primary color tint.
3.  **Level 2 (Floating):** Glassmorphism panels. Use a background blur of 12px-20px and a 1px "inner-glow" border (white at 10% opacity) to define the edge against the dark background.
4.  **Interactions:** Hovering over an element should trigger a "Backglow." This is a soft, diffused radial gradient behind the element using the primary Orange or Secondary Pink at 20% opacity. This creates a tactile, responsive feel.

## Shapes

To maintain the "Sharp and Professional" requirement, the shape language is intentionally restrained. 

We use **Soft (0.25rem)** roundedness for most standard components (inputs, buttons, cards). This provides enough curvature to feel modern and premium without leaning into the playfulness of fully rounded systems. 

**Angle-Cuts:** For high-impact display elements or primary buttons, use a "clipped corner" or 45-degree chamfer on one edge to lean into the "Warhorse" martial/technical aesthetic.

## Components

### Buttons
- **Primary:** Full gradient background (`gradient_brand`) with white text. No shadow, but a subtle outer glow on hover.
- **Secondary:** Ghost style. 1px gradient border with high-contrast text. Background fills with 10% primary color on hover.

### Cards
- Use "Level 2" elevation (Glassmorphism). 
- Headers should have a subtle 1px bottom divider in a muted secondary color.

### Input Fields
- Dark backgrounds (darker than the card surface). 
- Bottom-border-only focus state using the primary orange to simulate an active data port.
- Monospaced labels using JetBrains Mono for a "terminal" feel.

### Chips & Status Indicators
- Use high-saturation versions of the palette. 
- Success = Orange (Active/Hot), Neutral = Purple (System), Info = Pink (Alert).
- All chips should use 1px solid borders for maximum sharpness.

### Lists
- Interactive list items should feature a "Left-Edge Accent"—a 2px vertical line that glows when the item is selected or hovered.