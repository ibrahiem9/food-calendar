# Design System Document: High-End Editorial Parenting & Health



## 1. Overview & Creative North Star: "The Digital Sanctuary"

This design system moves away from the clinical, rigid grids typical of health applications. Instead, it adopts the North Star of **"The Digital Sanctuary"**—an editorial-inspired, high-end experience that feels like a premium lifestyle journal rather than a medical database.



To break the "template" look, we utilize **intentional asymmetry** and **tonal layering**. We reject the standard "box-and-border" layout in favor of breathing room and sophisticated typography. The interface should feel like a series of soft, overlapping sheets of fine paper, reducing the cognitive load for parents and providing a sense of calm authority.



## 2. Colors & Surface Philosophy

The palette is rooted in nature (Sage, Amber, Deep Sea) to lower cortisol levels. However, its application must remain premium through a **No-Line Rule**.



### The "No-Line" Rule

Traditional 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined solely through:

- **Background Color Shifts:** Placing a `surface-container-low` card on a `surface` background.

- **Tonal Transitions:** Using the `surface-variant` to subtly distinguish headers.



### Surface Hierarchy & Nesting

Treat the UI as a physical stack of materials.

- **Base Layer:** `surface` (#f8faf7) or `background`.

- **Primary Content Areas:** `surface-container-low` (#f1f4f1).

- **Floating Interactive Elements:** `surface-container-lowest` (#ffffff) to create a "lifted" feel.

- **Nesting:** An inner module (like a calendar event) should sit on a `surface-container-high` (#e4e9e5) to distinguish it from the main view without adding visual noise.



### The "Glass & Gradient" Rule

To add visual "soul," primary CTAs and hero headers should use a subtle linear gradient from `primary` (#1a61a4) to `primary-container` (#98c4ff) at a 135-degree angle. For floating overlays (e.g., mobile navigation or quick-add menus), apply **Glassmorphism**: use `surface` at 80% opacity with a `20px` backdrop-blur.



## 3. Typography: Editorial Authority

We pair the geometric precision of **Manrope** for display elements with the utilitarian clarity of **Inter** for data-heavy scheduling.



* **Display & Headlines (Manrope):** These are the "Editorial Voice." Use `display-lg` and `headline-md` with generous tracking (-0.02em) to create a high-end feel.

* **Body & Labels (Inter):** These are the "Information Layer." `body-md` is the workhorse. For dense calendar views, use `label-md` or `label-sm` to ensure allergen warnings and timestamps remain legible at small scales.

* **Hierarchy Tip:** Contrast a `display-sm` (Manrope) header with a `label-md` (Inter, All-Caps, 0.05em letter spacing) subheader for an authoritative, "designed" look.



## 4. Elevation & Depth

Depth is achieved through **Tonal Layering** rather than structural lines.



* **The Layering Principle:** Avoid shadows for static content. Instead, use the `surface-container` tiers. A `surface-container-lowest` card sitting on a `surface-container-low` background creates a natural, soft lift.

* **Ambient Shadows:** For "Active" states or floating modals, use an extra-diffused shadow: `offset: 0 8px, blur: 32px, color: rgba(45, 52, 49, 0.06)` (a tinted version of `on-surface`).

* **The "Ghost Border" Fallback:** If a border is required for accessibility in input fields, use `outline-variant` at **20% opacity**. Never use a 100% opaque border.

* **Glassmorphism:** Use semi-transparent `surface-container-lowest` (85% alpha) for tooltips to allow the underlying calendar colors to bleed through, maintaining context.



## 5. Components & Primitive Styling



### Buttons

* **Primary:** Gradient from `primary` to `primary-dim`. `rounded-full` (9999px) for a soft, approachable feel.

* **Secondary:** `secondary-container` background with `on-secondary-container` text. No border.

* **Tertiary:** No background. Text in `primary`. Use for low-emphasis actions like "Cancel."



### Input Fields & Search

* **Style:** `surface-container-highest` background with a `sm` (0.25rem) or `md` (0.75rem) corner radius.

* **Ghost Border:** Use a 1px border of `outline-variant` at 15% opacity only on focus.



### Cards & Calendar Cells

* **Strict Rule:** No divider lines. Use `spacing-4` (0.9rem) or `spacing-5` (1.1rem) of vertical white space to separate entries.

* **Desktop Calendar View:** Use `surface-container-low` for weekend cells and `surface` for weekdays to create a subtle rhythm.



### Status Indicators (Badges)

Use the `tertiary` (Amber) and `error` (Red) tokens for high-priority alerts:

* **Allergen/Warning:** `error_container` background with `on_error_container` text.

* **New/Valid:** `secondary_container` (Sage) background with `on_secondary_container` text.

* **Shape:** `rounded-sm` (0.25rem) to differentiate them from the `rounded-full` buttons.



### Specialized Component: The "Growth Timeline"

A custom component for parenting health. Use a vertical `surface-variant` track (2px width, 30% opacity) with `primary` circular nodes to indicate milestones.



## 6. Do’s and Don’ts



### Do:

* **DO** use whitespace as a functional tool. If elements feel cluttered, increase spacing to `spacing-8` (1.75rem) before adding a divider.

* **DO** use `surface-bright` for the most important data points in a dense view.

* **DO** ensure that the `on-background` text (#2d3431) is used for all long-form reading to maintain high legibility against the sage-tinted surfaces.



### Don’t:

* **DON’T** use pure black (#000000) for shadows or text. It breaks the organic, natural feel of the system.

* **DON’T** use high-contrast "Warning" reds. Use the `error_container` (#f56965) which is calibrated to be visible but not anxiety-inducing.

* **DON’T** use sharp 90-degree corners. Everything must have at least a `sm` (0.25rem) radius to maintain the "Sanctuary" vibe.