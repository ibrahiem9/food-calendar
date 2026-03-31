# BabyBite SPA Shell Redesign To Match Mockups

## Summary
Replace the current "all panels stacked in one page" shell with a mockup-driven multi-view application layout that keeps one primary workspace visible at a time. The new structure should mirror the root mockups: persistent left sidebar on desktop, compact top navigation, contextual right-side inspector when relevant, and a burger/off-canvas navigation pattern on mobile.

Add stylized food imagery throughout the experience so the Food Library and Recipe Planner feel editorial and visual rather than data-only. Imagery should be local app assets, not remote URLs, so the app remains fully static and Netlify-safe.

## Key Changes
- Introduce an app-shell state model for `calendar`, `library`, `rules`, and `recipes` views.
  Public interface change:
  Add a shared `AppView` type and shell state/handlers that determine the active workspace, mobile nav state, and contextual panel visibility.
- Refactor [`src/App.tsx`](/home/ubuntu/workspace/personal/food-calendar/src/App.tsx) into a shell-first layout:
  desktop left sidebar with profile block, nav items, context CTA, settings/support footer;
  top bar with brand, secondary nav, primary actions;
  central content area that renders only the active workspace;
  optional right inspector rail for calendar-focused flows.
- Re-map existing components into view-specific screens instead of rendering them all sequentially:
  `CalendarView` becomes the main calendar workspace with the inspector panel docked right.
  `FoodLibraryPanel` becomes a dedicated library screen with search/filter header and featured cards.
  `CombinationPlannerPanel` becomes a dedicated recipe-builder screen with left ingredient column and large hero composer.
  `RuleStatusPanel` and `ValidationPanel` become the "Rules Checklist" workspace plus smaller status modules in sidebar/top banners where appropriate.
- Add a responsive navigation system:
  desktop persistent sidebar and top nav;
  tablet collapsible sidebar;
  mobile burger button opening a glassmorphism drawer with the same destinations and primary actions.
- Rework `CalendarView` from a long list of month sections into a focused calendar canvas:
  default to one month at a time with month/week toggle styling matching the mockup;
  keep month jump/navigation controls;
  move detailed day actions and explanations out of every day card and into the right inspector;
  keep drag/drop and editing behavior, but surface add/remove/move actions through selected-day UI instead of repeating controls in every cell.
- Add a small visual asset system for food imagery.
  Public interface change:
  Add a `FoodVisual` mapping keyed by food id or category with image path, alt text, and presentation mode.
- Use imagery in three places:
  featured cards in Food Library;
  smaller thumbnail/icon chips across food cards and inspector surfaces;
  decorative recipe-planner hero art and saved recipe cards.
- Preserve the design-system rules from [`DESIGN.md`](/home/ubuntu/workspace/personal/food-calendar/DESIGN.md):
  no hard divider-heavy layout;
  sage/amber/blue tonal layering;
  Manrope + Inter hierarchy;
  rounded cards and gradient CTAs;
  glass treatment only for overlays/mobile drawers.

## Implementation Changes
- Create shell-level components for `SidebarNav`, `TopBar`, `MobileNavDrawer`, and `WorkspaceFrame`.
- Add one screen component per major destination so the app structure matches the mockups instead of mounting raw panels directly.
- Split "selected day / selected food" state from the current page flow into shell-aware state so both calendar and library views can drive the same inspector/selection model.
- Simplify over-dense card content in existing panels. The rule is:
  cards show summary only;
  details move to side panels, drawers, or dedicated subpanels.
- Add local image assets under a dedicated app path and normalize usage through one data module so components do not hardcode image paths.
- Ensure mobile layouts do not fall back to giant vertical stacks:
  only one major workspace visible;
  secondary panels become drawers, tabs, or accordions;
  actions stay pinned in the shell header/footer where appropriate.

## Test Plan
- Build verification: `npm run build` succeeds after the shell refactor.
- Desktop acceptance:
  sidebar remains persistent;
  switching nav items swaps the central workspace without rendering all sections in sequence;
  calendar view shows main canvas plus right inspector;
  food library and recipe planner visually resemble `main.png` and `recipe-planner.png` structure.
- Mobile acceptance:
  burger menu opens/closes correctly;
  only one workspace is visible at a time;
  inspector and secondary controls move into drawers/sheets instead of causing runaway page height.
- Interaction regression checks:
  generate/save/export actions still work from the new shell;
  selecting a day updates the inspector;
  dragging from food library to calendar still works or is replaced with an explicitly planned equivalent in mobile;
  validation and conflict flows still surface correctly.
- Visual acceptance:
  food imagery appears on featured library cards, recipe surfaces, and small food representations without breaking accessibility or causing layout shift.

## Assumptions
- Use a single SPA shell with internal view switching, not full router-based page architecture.
- Use stylized local illustrations/assets rather than remote photography.
- Existing planner logic, Zustand store behavior, and validation rules stay intact; this is an IA/layout and presentation refactor, not a rule-engine rewrite.
- If time forces prioritization, match the desktop mockups first, then adapt the same shell patterns to mobile with drawers and collapsible panels.
