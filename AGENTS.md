# AGENTS.md — How to Build This Project

You are building **BabyBite Calendar**, a client-side React app that generates and manages a baby food introduction calendar. The app enforces evidence-based spacing rules for allergens and new foods across a 175-day timeline (March 28 – September 19, 2026).

This project is designed to be built **incrementally in phases**. Do NOT attempt to build the entire app in one shot. Follow the phases below in order.

---

## Repository Layout

Familiarize yourself with these files before writing any code:

| File | Purpose |
|---|---|
| `rules.md` | **Source of truth** for all food introduction rules and the complete food list (fruits, vegetables, starches, proteins, allergens). Read this first. |
| `full-design-plan.md` | Complete technical specification: architecture, data model, rule engine algorithm, component tree, edge cases, and delivery plan. |
| `DESIGN.md` | Visual design system: colors, typography, spacing, component styling. Follow this when building any UI. |
| `incremental-build-plan.md` | The phased build plan — 18 phases with tasks, deliverables, and acceptance tests. This is your primary task tracker. |
| `phase-dependencies.md` | Dependency graph, critical path, file structure reference, validation rule signatures, date constants, and troubleshooting tips. |
| `ready-prompts.md` | Pre-written prompts for each phase (useful if you need more context on a specific phase). |
| `progress-tracker.md` | Checklist to mark phases complete. Update this after finishing each phase. |
| `next-steps.md` | Future enhancements (mobile, logging mode, onboarding). Not needed for MVP. |
| `*.html` / `*.png` | Static design mockups for reference. `main.html`/`main.png` = dashboard, `calendar.html`/`calendar.png` = calendar view, `recipe-planner.html`/`recipe-planner.png` = combination planner. Open the HTML files in a browser to see the intended visual design. |

---

## Tech Stack

- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (follow the design tokens in `DESIGN.md`)
- **State Management:** Zustand
- **Date Library:** date-fns
- **Hosting:** Netlify (static, no backend)
- **No server, no database.** All logic runs client-side. Persistence via localStorage.

---

## Build Order

Follow these phases sequentially. Each phase builds on the previous one. Do not skip ahead unless all prerequisite phases are complete.

### Phase 0 — Project Scaffold
Set up the Vite + React + TypeScript project. Install Tailwind CSS, date-fns, and Zustand. Create the folder structure:

```
src/
  components/
  data/
  types/
  utils/
  validators/
  store/
```

Create a minimal `App.tsx` with a header. Verify `npm run dev` serves the app.

**Done when:** Dev server runs, page renders with a styled header, TypeScript compiles cleanly.

---

### Phase 1 — Food Data & Types
Read `rules.md` and extract the complete food list into `src/data/foods.ts`. Define TypeScript types in `src/types/`:

- `FoodCategory`: `"fruit" | "vegetable" | "starch" | "protein" | "allergen"`
- `Food`: `{ id, name, category, isAllergen }`

The allergens are explicitly listed in `rules.md` under "### Allergens": Peanut, Egg, Cottage cheese, Ricotta, Yogurt, Salmon, Sardines, Tuna, White fish, Clams, Crab, Lobster, Shrimp, Cashew, Almond, Tahini.

Build a `FoodLibraryPanel` component that displays all foods grouped by category with a visual badge for allergens.

**Done when:** All 80+ foods render on screen, grouped by category. Allergens are visually distinguished.

---

### Phase 2 — Calendar Data Structure
Define calendar types in `src/types/`:

- `PlannedItem`: `{ foodId, type: "single" | "combination", label, isFirstIntroduction, ingredientFoodIds? }`
- `ValidationResult`: `{ valid, errors[], warnings[] }`
- `DayEntry`: `{ date (YYYY-MM-DD), items: PlannedItem[], notes?, validation }`

Create `src/utils/dateUtils.ts` to generate all dates from `2026-03-28` to `2026-09-19` (175 days). Use date-fns.

Set up the Zustand store in `src/store/plannerStore.ts` with state for `days: DayEntry[]` and `foods: Food[]`, and an `initializeDays()` action.

Build a `CalendarView` component that displays all 175 days grouped by month.

**Done when:** 175 days render on screen in chronological order. Store initializes correctly.

---

### Phase 3 — Manual Food Placement
Add store actions: `addFoodToDay(date, foodId)`, `removeFoodFromDay(date, foodId)`, `clearAllDays()`. Persist state to localStorage (load on init, save on change).

Build `DayCard` component with an "add food" interaction and remove buttons. Users should be able to click a day, pick a food, and see it appear.

**Done when:** Can add/remove foods from days. State survives page refresh.

---

### Phase 4 — Validation Engine
This is the most critical phase. Create individual validator functions in `src/validators/`. Reference `phase-dependencies.md` for exact function signatures.

Validators to implement:
1. `validateDailyMinimum(day)` — at least 1 food per day
2. `validateNoConsecutiveNewFoods(days, index)` — no back-to-back first introductions
3. `validateAllergenSpacing(days, index)` — ≥3 days between allergen first intros
4. `validateCombinationStartDate(day)` — no combos before 2026-05-01
5. `validateCombinationIngredients(day, introMap)` — all ingredients introduced first
6. `validateWeeklyAllergenCadence(days, allergenId)` — 1–2× per week after intro
7. `validateRecipeRestrictions(recipe)` — no added sodium, sugar, or hot spices

Create `src/validators/index.ts` with `runAllValidations(days)` that runs all validators and updates each day's `validation` field.

Add visual indicators to `DayCard` (valid ✓ / warning ⚠ / invalid ✗). Create a `ValidationPanel` that lists all current errors.

Wire validation to run after every store mutation.

**Done when:** Manually placing foods triggers correct validation errors. Violations display in the UI.

---

### Phase 5 — Auto-Generate First Introductions
Create `src/utils/plannerEngine.ts` with a `planFirstIntroductions()` function. Use the constraint-aware greedy algorithm described in `full-design-plan.md` (Pass 2):

1. Sort foods: allergens first (they create weekly repeat obligations), then non-allergens
2. Iterate through foods, finding the earliest valid day for each first introduction
3. Respect: no consecutive new foods, 3-day allergen spacing

Add a "Generate Calendar" button. Show "NEW" badges on first introductions.

**Done when:** Clicking generate schedules all 80+ foods. No spacing violations.

---

### Phase 6 — Fill Empty Days
Implement `fillEmptyDays()` (Pass 3 from `full-design-plan.md`). For each empty day, pick 1–2 previously introduced foods as repeats. Mark these as `isFirstIntroduction: false`.

**Done when:** Every day has ≥1 food. "REPEAT" badges distinguish repeats from new introductions.

---

### Phase 7 — Allergen Weekly Repetition
Implement `scheduleAllergenRepetitions()` (Pass 4 from `full-design-plan.md`). After each allergen's first introduction, ensure it appears 1–2 times every calendar week (define weeks as Sunday–Saturday).

Strategy: scan each week, count allergen appearances, insert repeats where needed.

**Done when:** `validateWeeklyAllergenCadence` passes for all 16 allergens across all weeks. Zero validation errors after full generation.

---

### Phase 8 — Combination Data Model
Define `Recipe` type: `{ id, name, ingredientFoodIds[], forbiddenFlags: { addedSodium, addedSugar, hotSpices } }`. Create `src/data/recipes.ts` with 5–10 curated baby-friendly recipes. All must have forbidden flags set to false. Examples: scrambled eggs, yogurt parfait, fish cakes, oatmeal banana, vegetable rice.

**Done when:** Recipe data loads. Types compile cleanly.

---

### Phase 9 — Combination Validation & UI
Block combinations before May 1. Validate all recipe ingredients were introduced before the combo date. Build `CombinationPlannerPanel` showing eligible/blocked status for each recipe with explanations.

**Done when:** Cannot add a combo before May 1 or before all ingredients are introduced. UI explains why a recipe is blocked.

---

### Phase 10 — Manual Editing & Conflict Resolution
Add the ability to manually add/remove/move foods between days. Run validation in real-time. Show a `ConflictResolutionModal` when edits create violations — explain the rule, suggest an alternative date, and offer an override option. Implement undo/redo.

**Done when:** Manual edits trigger live validation. Conflicts show modal with suggestions. Undo works.

---

### Phases 11–15 — UI Enhancement (parallelizable)
These phases are independent of each other. Build in any order after Phase 10:

- **Phase 11 — Food Library Advanced:** Status tracking (introduced/pending/due), search, drag-to-calendar
- **Phase 12 — Inspector Panel:** Click a day or food to see explanations ("Why was this food placed here?", "Why is this food blocked?")
- **Phase 13 — CSV Export:** Export to CSV with columns: date, foods, new intros, allergens, combo flag, validation status. Use `papaparse` or custom export.
- **Phase 14 — Print Layout:** Print stylesheet, one month per page, high contrast, `window.print()` trigger
- **Phase 15 — Rules Summary Panel:** Live dashboard showing compliance for each rule with clickable violations

---

### Phase 16 — Polish
Mobile responsiveness, loading states, keyboard shortcuts, onboarding tooltips, performance optimization. Reference `DESIGN.md` for all visual decisions.

---

### Phase 17 — Netlify Deployment
Create `netlify.toml`, `_redirects` for SPA routing, test production build (`npm run build && npm run preview`), deploy.

---

## Key Rules (Always Enforce)

These are the non-negotiable rules from `rules.md`. The entire app exists to enforce them:

1. **Daily minimum:** Every day must have ≥1 food item
2. **No consecutive new foods:** If a food is being introduced for the first time, the previous day cannot also have a first-time food
3. **Allergen spacing:** ≥3 full calendar days between first-time allergen introductions
4. **Allergen maintenance:** After first introduction, each allergen appears 1–2× per week
5. **Combination timing:** No combination foods before May 1, 2026
6. **Combination eligibility:** All ingredients must be introduced as singles before the combo
7. **Recipe restrictions:** No added sodium, sugar, or hot spices

## Key Date Constants

```typescript
const PLAN_START_DATE = "2026-03-28";
const PLAN_END_DATE   = "2026-09-19";
const COMBO_START     = "2026-05-01";
const TOTAL_DAYS      = 175;
const ALLERGEN_GAP    = 3;   // days between allergen first intros
const ALLERGEN_WEEKLY_MIN = 1;
const ALLERGEN_WEEKLY_MAX = 2;
```

---

## Design Guidelines

When building any UI component, follow `DESIGN.md`:

- **No 1px solid borders.** Use background color shifts and tonal layering to create visual boundaries.
- **Colors:** Sage/nature palette. `#f8faf7` base surface score. See DESIGN.md for full token list.
- **Typography:** Manrope for display/headlines, Inter for body/labels.
- **Corners:** Always rounded. Never sharp 90° corners. Minimum `0.25rem` radius.
- **Shadows:** Only on active/floating elements. Use extra-diffused shadow (`0 8px 32px rgba(45,52,49,0.06)`).
- **Status badges:** Error/allergen = amber/red container. New/valid = sage container. Use `rounded-sm`.
- **Buttons:** Primary = gradient `primary → primary-container`, `rounded-full`. Secondary = container bg, no border.
- **Glassmorphism:** For overlays — 80% opacity surface + 20px backdrop-blur.

Reference the HTML mockups (`main.html`, `calendar.html`, `recipe-planner.html`) and their screenshots (`*.png`) for visual targets.

---

## How to Track Progress

After completing each phase:
1. Update `progress-tracker.md` — check off the phase and fill in actual time
2. Run the acceptance tests listed in `incremental-build-plan.md` for that phase
3. Commit with message: `feat: complete phase N — [description]`
4. Move to the next phase

---

## Troubleshooting

See the "When Things Go Wrong" section of `phase-dependencies.md` for common issues:
- Validation too slow → memoize, only revalidate changed days
- Can't satisfy allergen weekly requirements → check week boundary calculation
- Running out of days → start allergen intros earlier
- Combinations never eligible → debug the introduction tracking map
- State not updating UI → ensure immutable updates (spread operators)

---

## What NOT to Do

- **Do not start with drag-and-drop or fancy UI.** The hard part is the rule engine. Build data → logic → validation → then UI chrome.
- **Do not use a backend.** Everything runs in-browser. localStorage for persistence.
- **Do not try to generate the perfect calendar on the first pass.** Use a greedy planner with repair passes as described in `full-design-plan.md`.
- **Do not skip validation.** Every store mutation should trigger `runAllValidations()`.
- **Do not invent food data.** Use the exact food list from `rules.md`.

---

## MVP Definition

The app is minimally viable when it can:

- [x] Generate all 175 days with no empty days
- [x] Prevent consecutive first-time introductions
- [x] Keep allergen first intros ≥3 days apart
- [x] Maintain allergen 1–2× weekly repetition
- [x] Block combinations before May 1 and before ingredients are introduced
- [x] Export the calendar to CSV
- [x] Be deployed to Netlify

This corresponds to completing **Phases 0–7, 13, and 17**.
