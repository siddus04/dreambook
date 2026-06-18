---
name: Living Canvas
colors:
  surface: '#faf8ff'
  surface-dim: '#dad9e1'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3fa'
  surface-container: '#eeedf4'
  surface-container-high: '#e9e7ef'
  surface-container-highest: '#e3e1e9'
  on-surface: '#1a1b21'
  on-surface-variant: '#444651'
  inverse-surface: '#2f3036'
  inverse-on-surface: '#f1f0f7'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe932c'
  on-secondary-container: '#663500'
  tertiary: '#1b2b3f'
  on-tertiary: '#ffffff'
  tertiary-container: '#314156'
  on-tertiary-container: '#9dadc6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#faf8ff'
  on-background: '#1a1b21'
  surface-variant: '#e3e1e9'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
  body-reading:
    fontFamily: Source Serif 4
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 30px
  ui-label:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  ui-button:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
  caption:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  margin-page: 64px
  margin-mobile: 24px
  gutter: 32px
  reading-width-max: 720px
  sidebar-width: 280px
---

## Brand & Style
The design system is built upon the "Living Canvas" philosophy—a high-performance workspace that balances the weight of academic tradition with the fluidity of modern digital publishing. It is tailored for elite researchers, publishers, and scholars who require long-form legibility and precise organizational tools.

The aesthetic leans into **Modern Academic Minimalism** with a **Tactile** twist. It mimics the sensation of high-quality physical media through subtle texture and thoughtful layering, ensuring the interface feels like an extension of the user's intellectual process rather than a digital distraction. The emotional goal is one of "focused prestige"—the interface should feel authoritative, calm, and highly responsive.

## Colors
The palette is rooted in the "Academic Blue," used sparingly for structural highlights and primary actions to maintain a dignified tone. 

- **Primary (Academic Blue):** Used for navigation headers, active states, and brand-identifying markers.
- **Secondary (Heritage Gold):** Reserved for "Anchor Analogy" elements—interactive nodes that ground complex ideas, highlights, and critical CTA accents.
- **Surface Strategy:** This design system utilizes a dual-pane background logic. The primary reading area (Pane 1) uses a warm, low-strain cream to optimize for deep work. The functional utility area (Pane 2) uses a cooler, neutral gray to distinguish tools from content.
- **Sepia Mode:** A dedicated reading mode using `#F4ECD8` for the background and `#433422` for text, designed for low-light research sessions.

## Typography
Typography is the cornerstone of this design system. We use **Source Serif 4** for all long-form content and headlines to evoke the authority of printed journals. Its high x-height and optimized legibility make it ideal for dense technical prose.

For the "Functional Layer"—buttons, sidebars, metadata, and labels—we use **Hanken Grotesk**. This sans-serif provides a sharp, contemporary contrast that signals interactivity and system utility. Line heights are intentionally generous (1.6x for body text) to allow the eye to track comfortably across wide technical margins.

## Layout & Spacing
The layout follows a **Hybrid Modular Grid**. While the UI utilizes a standard 12-column system for dashboard views, the reading environment prioritizes a fixed-width central column (720px) to maintain the "Golden Line Length" for scholarly reading.

- **Desktop:** A three-pane architecture: Navigation (left, slim), Reading Canvas (center, expansive), and Contextual Tools (right, medium).
- **Rhythm:** We use an 8px baseline grid. Padding within cards and containers should scale in increments of 8px (16, 24, 32, 48) to maintain a rigorous, structured feel.
- **Negative Space:** Generous margins (64px+) are mandated around the primary reading canvas to reduce cognitive load and visual noise.

## Elevation & Depth
In this design system, depth is communicated through **Tonal Layering** and **Soft Insets** rather than aggressive shadows.

- **Low Elevation:** Primary content cards use a 1px border in `#E2E8F0` with no shadow, creating a "pressed" look against the cream background.
- **Focused Elevation:** When an element is active (e.g., a selected research note), it gains a subtle, tinted shadow (`Academic Blue` at 5% opacity, 12px blur) to appear as if it is floating slightly above the canvas.
- **The "Anchor" Effect:** Interactive highlighted text uses a solid amber bottom-border (2px) which, when hovered, expands into a soft gold glow, simulating the "Living Canvas" concept.

## Shapes
The design system employs a **Structured Roundness** strategy. 
- **8px (Rounded):** Standard for buttons, input fields, and content cards. This provides a professional but approachable feel.
- **2px (Sharp):** Used for structural separators, vertical tabs, and "Anchor" markers to maintain an architectural, precise look.
- **Circular:** Reserved exclusively for user avatars and status indicators to provide a distinct visual break from the otherwise rectangular environment.

## Components
- **Buttons:** Primary buttons are solid Academic Blue with Hanken Grotesk Bold uppercase type. Secondary buttons use a ghost style with a 1px border.
- **Reading Cards:** These feature a 48px top padding to give headers room to breathe. They use Pane 1's cream background to differentiate from the app's frame.
- **Anchor Analogy Elements:** Specialized chips used for cross-referencing. They feature a light gold background and a 1px amber stroke, utilizing a "pin" icon to indicate their grounding function.
- **Inputs:** High-contrast borders (1px) that thicken to 2px in Academic Blue on focus. Labels are always positioned above the input in Hanken Grotesk Medium.
- **Lists:** Research citations and bibliographies use hanging indents and a slightly smaller serif font-size (16px) with increased letter spacing for clarity.
- **The Progress Rail:** A slim, vertical indicator on the far left that tracks reading progress through a chapter using a subtle Academic Blue fill.