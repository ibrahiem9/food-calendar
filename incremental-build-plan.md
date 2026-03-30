# Incremental Build Plan: Food Calendar App

This document breaks down the full design plan into bite-sized, buildable phases. Each phase is self-contained, testable, and builds on the previous work.

---

## Phase 0: Project Setup & Foundation
**Goal:** Get a working development environment with core infrastructure

**Tasks:**
- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure Tailwind CSS
- [ ] Set up basic folder structure (`src/components`, `src/data`, `src/utils`, `src/types`)
- [ ] Install core dependencies: `date-fns`, `zustand` (or React Context)
- [ ] Create basic app shell with header

**Deliverables:**
- Running dev server
- Basic styled page with header
- TypeScript compiling without errors

**Test:**
- `npm run dev` works
- Page loads in browser

---

## Phase 1: Food Data Model & Catalog
**Goal:** Create the food catalog and TypeScript types

**Tasks:**
- [ ] Define TypeScript types (`Food`, `FoodCategory`)
- [ ] Create `src/data/foods.ts` with hardcoded food list from original-plan.md
- [ ] Mark which foods are allergens
- [ ] Create a simple `FoodLibraryPanel` component that displays all foods
- [ ] Add basic filtering by category (Fruit, Vegetables, Starches, Proteins, Allergens)

**Deliverables:**
- `types/Food.ts` with proper interfaces
- `data/foods.ts` with complete food catalog (80+ foods)
- UI that displays all foods organized by category

**Test:**
- All foods from original-plan.md are present
- Can filter by category
- Allergens are marked correctly

---

## Phase 2: Date Range & Calendar Structure
**Goal:** Build the calendar data structure without rules

**Tasks:**
- [ ] Define TypeScript types for `DayEntry`, `PlannedItem`, `ValidationResult`
- [ ] Create utility function to generate all dates from 2026-03-28 to 2026-09-19
- [ ] Create basic state management (Zustand store or Context)
- [ ] Build simple `CalendarView` component showing all dates
- [ ] Display dates in a readable format (month view or list)

**Deliverables:**
- `types/Calendar.ts` with all calendar interfaces
- `utils/dateUtils.ts` with date generation
- Basic calendar UI showing 175 days (Mar 28 - Sep 19)
- State management set up

**Test:**
- Correct number of days generated
- Dates are in correct order
- Can navigate between months/weeks

---

## Phase 3: Basic Planning Engine - Single Food Placement
**Goal:** Allow manual assignment of foods to days (no rules yet)

**Tasks:**
- [ ] Create `addFoodToDay(date, foodId)` function
- [ ] Create `removeFoodFromDay(date, foodId)` function
- [ ] Update calendar view to show assigned foods
- [ ] Add simple UI to select a day and add/remove foods
- [ ] Persist state to localStorage
- [ ] Add "Clear All" and "Save" buttons

**Deliverables:**
- Can click a day and add foods to it
- Foods display on calendar
- State persists across page refreshes

**Test:**
- Add food to March 28
- Refresh page
- Food still appears on March 28

---

## Phase 4: Rule Engine - Validation Only (Read-Only)
**Goal:** Implement all validation rules but don't enforce them yet

**Tasks:**
- [ ] Create `validators/` folder
- [ ] Implement each validator as separate function:
  - `validateDailyMinimum(day)` - at least one food per day
  - `validateNoConsecutiveNewFoods(days, index)` - new foods not consecutive
  - `validateAllergenSpacing(days, index)` - 3 day gap for allergen first intros
  - `validateCombinationStartDate(day)` - no combos before May 1
  - `validateCombinationIngredients(day, introMap)` - ingredients introduced first
- [ ] Create `runAllValidations(days)` function
- [ ] Add validation status display to each day (✓ valid, ⚠ warning, ✗ invalid)
- [ ] Create `ValidationPanel` showing all errors/warnings

**Deliverables:**
- All validation functions working
- Visual indicators on calendar for valid/invalid days
- Panel showing what rules are violated

**Test:**
- Manually place peanut on March 28 and egg on March 29
- Should show error: "New allergens must be 3 days apart"
- Remove egg, error disappears

---

## Phase 5: Auto-Generate - First Introduction Scheduling
**Goal:** Generate first introductions automatically following spacing rules

**Tasks:**
- [ ] Create `planFirstIntroductions()` algorithm
- [ ] Prioritize allergens first (they have repeat requirements)
- [ ] Implement consecutive day check for new foods
- [ ] Implement 3-day spacing for allergen first introductions
- [ ] Add "Generate Calendar" button
- [ ] Show which foods are new vs repeat with badges

**Deliverables:**
- Button that generates first introductions for all foods
- All foods get scheduled at least once
- No validation errors for spacing rules

**Test:**
- Click "Generate Calendar"
- Verify no allergens are introduced within 3 days of each other
- Verify no new foods are on consecutive days
- Every food appears at least once

---

## Phase 6: Fill Empty Days & Food Repetition
**Goal:** Ensure every day has at least one food

**Tasks:**
- [ ] Create `fillEmptyDays()` function
- [ ] Repeat previously introduced foods to fill gaps
- [ ] Update planner to track first introduction dates
- [ ] Mark items as "New" or "Repeat" in the UI

**Deliverables:**
- No empty days in calendar
- Clear visual distinction between new and repeat foods

**Test:**
- Generate calendar
- Every day from March 28 to September 19 has at least one food
- Can identify which foods are being introduced for first time

---

## Phase 7: Allergen Weekly Repetition
**Goal:** Ensure allergens appear 1-2 times per week after first intro

**Tasks:**
- [ ] Create `validateWeeklyAllergenCadence(days, allergenId)` 
- [ ] Define week boundaries (e.g., Sunday-Saturday)
- [ ] Create `scheduleAllergenRepetitions()` function
- [ ] Add UI indicator showing allergen weekly status
- [ ] Update auto-generate to include allergen maintenance

**Deliverables:**
- Each allergen appears 1-2x per week after first introduction
- Validation shows which weeks are missing allergen repetitions
- Status indicator shows "Allergen due this week" vs "Allergen satisfied"

**Test:**
- Introduce egg on week 1
- Weeks 2-22 should each have egg appearing 1-2 times
- Validation passes for all allergen repetition rules

---

## Phase 8: Combination Foods - Data Model
**Goal:** Add support for combination foods (data structure only)

**Tasks:**
- [ ] Create `Recipe` type
- [ ] Create `CombinationFood` type extending `PlannedItem`
- [ ] Add small curated recipe set (5-10 simple recipes)
- [ ] Track recipe ingredients
- [ ] Track prohibited additives (sodium, sugar, hot spices)

**Deliverables:**
- Type definitions for recipes
- Sample recipes stored in `data/recipes.ts`
- Each recipe has ingredient list and restriction flags

**Test:**
- Recipe data loads without errors
- Can access recipe ingredients programmatically

---

## Phase 9: Combination Foods - Validation & Scheduling
**Goal:** Allow combinations after May 1 if ingredients are introduced

**Tasks:**
- [ ] Block combinations before May 1, 2026
- [ ] Check that all ingredients were introduced separately before combo
- [ ] Create `CombinationPlannerPanel` UI component
- [ ] Allow user to add combination foods to calendar
- [ ] Validate recipe restrictions (no added sodium/sugar/spices)
- [ ] Show eligibility status for each recipe

**Deliverables:**
- Combinations cannot be added before May 1
- Cannot add combination unless all ingredients introduced
- UI shows eligible vs blocked recipes

**Test:**
- Try adding pancake (egg + wheat + dairy) on April 30 → blocked
- Try adding pancake on May 1 before egg is introduced → blocked
- Introduce egg, wheat, dairy, then add pancake on May 2 → success

---

## Phase 10: Manual Editing & Conflict Resolution
**Goal:** Allow manual override with clear warnings

**Tasks:**
- [ ] Add drag-and-drop or click-to-add interface
- [ ] Real-time validation on manual edits
- [ ] Show warning banner for invalid edits
- [ ] Allow save with override option
- [ ] Create `ConflictResolutionModal` component
- [ ] Suggest alternative dates when conflicts occur

**Deliverables:**
- Can manually add/remove/move foods
- Validation runs automatically after edits
- Clear warnings when rules are violated
- Suggestions for fixing conflicts

**Test:**
- Manually place egg on day after peanut was first introduced
- See warning: "Allergens must be 3 days apart"
- Modal suggests alternative dates
- Can override and save anyway

---

## Phase 11: Food Library Panel - Advanced Features
**Goal:** Enhanced food library with status tracking

**Tasks:**
- [ ] Show introduction status for each food
- [ ] Display first introduction date
- [ ] Show weekly repeat status for allergens
- [ ] Add search/filter functionality
- [ ] Color-code foods by status (not introduced, introduced, due, satisfied)

**Deliverables:**
- Interactive food library
- Real-time status updates
- Search and filter working

**Test:**
- Generate calendar
- Food library shows which foods are introduced
- Allergen status reflects current week

---

## Phase 12: Inspector & Explanation Panel
**Goal:** Help users understand why foods are placed where they are

**Tasks:**
- [ ] Create `InspectorPanel` component
- [ ] Show explanation when day is clicked
- [ ] Display which rules constrained the selection
- [ ] Show why a food is blocked on a given day
- [ ] Add helpful examples and tips

**Deliverables:**
- Click any day to see why foods were chosen
- Click any food to see when it can be introduced
- Clear explanations of rule violations

**Test:**
- Click day with allergen
- See: "Egg introduced today. Next allergen can be introduced on [date]"
- Try to add peanut before that date
- See: "Blocked: Egg was introduced 2 days ago. Need 3-day gap."

---

## Phase 13: CSV Export
**Goal:** Export calendar to CSV for spreadsheet editing

**Tasks:**
- [ ] Install `papaparse` or create custom CSV export
- [ ] Define CSV columns (date, foods, new introductions, allergens, validation)
- [ ] Create `exportToCSV()` function
- [ ] Add "Export CSV" button
- [ ] Format dates and food lists properly

**Deliverables:**
- Button that downloads CSV file
- CSV opens correctly in Excel/Google Sheets
- All relevant data included

**Test:**
- Generate calendar
- Click "Export CSV"
- Open file in Excel
- Verify all days and foods are present

---

## Phase 14: Print Layout & PDF Support
**Goal:** Create printer-friendly view

**Tasks:**
- [ ] Create print stylesheet
- [ ] Design high-contrast, ink-friendly layout
- [ ] One-page-per-month or weekly view
- [ ] Remove interactive elements in print mode
- [ ] Add "Print" button that triggers window.print()

**Deliverables:**
- Clean print layout
- Can print or save as PDF from browser
- Looks good in black & white

**Test:**
- Click "Print"
- Preview looks clean and readable
- Print to PDF successfully

---

## Phase 15: Rules Summary Panel
**Goal:** Create live status dashboard for all rules

**Tasks:**
- [ ] Create `RuleStatusPanel` component
- [ ] Show checklist of all active rules
- [ ] Real-time status updates (✓ passing, ✗ failing)
- [ ] Link to specific violations
- [ ] Summary stats (e.g., "165/175 days valid")

**Deliverables:**
- Panel showing all rule compliance
- Clickable links to violations
- Overall compliance score

**Test:**
- Generate calendar
- All rules show green checkmarks
- Manually break a rule
- That rule shows red X with link to problem

---

## Phase 16: Polish & Refinement
**Goal:** Improve UX with finishing touches

**Tasks:**
- [ ] Add loading states during generation
- [ ] Improve mobile responsiveness
- [ ] Add helpful tooltips and onboarding hints
- [ ] Improve error messages
- [ ] Add keyboard shortcuts
- [ ] Performance optimization for large calendar
- [ ] Add "About" or "Help" section explaining rules

**Deliverables:**
- Smooth, polished user experience
- Works well on mobile
- No obvious UI bugs

**Test:**
- Test on mobile device
- Generate calendar multiple times
- All interactions feel smooth

---

## Phase 17: Netlify Deployment
**Goal:** Deploy to Netlify as static site

**Tasks:**
- [ ] Create `netlify.toml` config
- [ ] Set up build command and publish directory
- [ ] Add `_redirects` file for SPA routing
- [ ] Test production build locally
- [ ] Deploy to Netlify
- [ ] Test deployed site

**Deliverables:**
- Live URL on Netlify
- All features work in production
- Fast load times

**Test:**
- Visit deployed URL
- Generate calendar
- Export CSV
- Print to PDF
- All features work

---

## Phase 18: Advanced Features (Optional)
**Goal:** Nice-to-have enhancements

**Tasks:**
- [ ] Import/Export JSON backups
- [ ] IndexedDB for more robust persistence
- [ ] Custom recipe builder
- [ ] Recipe recommendations based on introduced foods
- [ ] Visual calendar themes
- [ ] Share calendar via URL
- [ ] Pre-built template calendars

**Deliverables:**
- One or more advanced features implemented

---

## Summary

This plan breaks the full app into 18 incremental phases:

| Phase | Focus | Complexity | Estimated Effort |
|-------|-------|------------|------------------|
| 0 | Setup | Low | 30 min |
| 1 | Data Model | Low | 1 hour |
| 2 | Calendar Structure | Low | 1 hour |
| 3 | Manual Placement | Medium | 2 hours |
| 4 | Validation Rules | Medium | 2-3 hours |
| 5 | Auto-Generate Intro | High | 3-4 hours |
| 6 | Fill Empty Days | Medium | 1-2 hours |
| 7 | Allergen Repetition | High | 3-4 hours |
| 8 | Combo Data Model | Low | 1 hour |
| 9 | Combo Logic | Medium | 2-3 hours |
| 10 | Manual Editing | Medium | 2-3 hours |
| 11 | Food Library UI | Medium | 2 hours |
| 12 | Inspector Panel | Medium | 2 hours |
| 13 | CSV Export | Low | 1 hour |
| 14 | Print Layout | Low | 1-2 hours |
| 15 | Rules Panel | Medium | 1-2 hours |
| 16 | Polish | Medium | 2-3 hours |
| 17 | Deployment | Low | 1 hour |
| 18 | Advanced | Variable | Variable |

**Total Core Build Time: ~30-40 hours**

Each phase can be given to a coding agent as a discrete task with clear acceptance criteria.
