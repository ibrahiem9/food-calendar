# Phase Dependencies & Quick Reference

This document shows which phases depend on others and provides quick-start instructions for coding agents.

---

## Dependency Graph

```
Phase 0 (Setup)
    ↓
Phase 1 (Food Data) ─────────────────┐
    ↓                                │
Phase 2 (Calendar Structure)         │
    ↓                                │
Phase 3 (Manual Placement)           │
    ↓                                │
Phase 4 (Validation)                 │
    ↓                                │
Phase 5 (Auto-Gen First Intro) ←─────┤
    ↓                                │
Phase 6 (Fill Empty Days)            │
    ↓                                │
Phase 7 (Allergen Repetition)        │
    ↓                                │
Phase 8 (Combo Data Model) ←─────────┘
    ↓
Phase 9 (Combo Logic)
    ↓
Phase 10 (Manual Editing)

Phases 11-15 can be built in parallel once Phase 7 is complete:
- Phase 11 (Food Library UI)
- Phase 12 (Inspector Panel)
- Phase 13 (CSV Export)
- Phase 14 (Print Layout)
- Phase 15 (Rules Panel)

Phase 16 (Polish) requires all above
    ↓
Phase 17 (Deployment)
    ↓
Phase 18 (Advanced) - optional
```

---

## Critical Path

The minimum viable product requires completing Phases 0-7, 13-14, and 17:

1. **Setup** (Phase 0)
2. **Core Data** (Phases 1-2)
3. **Basic Functionality** (Phases 3-4)
4. **Auto-Generation** (Phases 5-7)
5. **Export** (Phase 13)
6. **Deploy** (Phase 17)

This gets you a working calendar generator with CSV export.

---

## Phase Grouping for Coding Agents

### Week 1: Foundation
- **Day 1-2:** Phases 0-2 (Setup, Data, Calendar)
- **Day 3:** Phase 3 (Manual Placement)
- **Day 4-5:** Phase 4 (Validation)

### Week 2: Core Intelligence
- **Day 1-2:** Phase 5 (Auto-Generate First Intros)
- **Day 3:** Phase 6 (Fill Empty Days)
- **Day 4-5:** Phase 7 (Allergen Repetition)

### Week 3: Advanced Features
- **Day 1:** Phase 8 (Combo Data)
- **Day 2-3:** Phase 9 (Combo Logic)
- **Day 4-5:** Phase 10 (Manual Editing)

### Week 4: UI & Export
- **Day 1:** Phase 11 (Food Library)
- **Day 2:** Phase 12 (Inspector)
- **Day 3:** Phases 13-14 (Export & Print)
- **Day 4:** Phase 15 (Rules Panel)
- **Day 5:** Phase 16 (Polish)

### Week 5: Ship It
- **Day 1:** Phase 17 (Deploy)
- **Day 2-5:** Phase 18 (Advanced) or bug fixes

---

## Quick Prompt Templates for Coding Agents

### Template 1: Starting a New Phase
```
I'm building a food introduction calendar app. I've completed phases [X, Y, Z].

Now I need to implement Phase [N]: [Phase Name]

Tasks:
- [list tasks from incremental-build-plan.md]

Deliverables:
- [list deliverables]

Acceptance criteria:
- [list tests]

Please implement this phase. The full context is in full-design-plan.md and original-plan.md.
```

### Template 2: Debugging a Phase
```
I've implemented Phase [N] but [describe issue].

The phase should:
- [list key requirements]

Current behavior:
- [describe what's happening]

Expected behavior:
- [describe what should happen]

Please debug and fix.
```

### Template 3: Skipping to a Specific Phase
```
I want to implement Phase [N]: [Phase Name].

I understand this requires Phases [dependencies] to be complete first.

Please implement all prerequisite phases first, then Phase [N].

Focus on minimal implementations for the prerequisites - we can polish later.
```

---

## Common Validation Rules Reference

For quick copy-paste into validator implementations:

### Rule 1: Daily Minimum
- **Requirement:** Every day must have at least one food item
- **Validator:** `validateDailyMinimum(day: DayEntry): ValidationResult`
- **Error:** "Day must have at least one food item"

### Rule 2: No Consecutive New Foods
- **Requirement:** No brand new foods on consecutive days
- **Validator:** `validateNoConsecutiveNewFoods(days: DayEntry[], index: number): ValidationResult`
- **Error:** "Cannot introduce new foods on consecutive days. [Food X] was newly introduced yesterday."

### Rule 3: Allergen Spacing
- **Requirement:** At least 3 days between first-time allergen introductions
- **Validator:** `validateAllergenSpacing(days: DayEntry[], index: number): ValidationResult`
- **Error:** "Allergen first introductions must be at least 3 days apart. [Allergen X] was first introduced [N] days ago."

### Rule 4: Combination Start Date
- **Requirement:** No combinations before May 1, 2026
- **Validator:** `validateCombinationStartDate(day: DayEntry): ValidationResult`
- **Error:** "Combination foods cannot be added before May 1, 2026"

### Rule 5: Combination Ingredients
- **Requirement:** All ingredients must be introduced separately before combination
- **Validator:** `validateCombinationIngredients(day: DayEntry, introMap: Map<string, string>): ValidationResult`
- **Error:** "Cannot add combination [Recipe X]. The following ingredients have not been introduced: [Food A, Food B]"

### Rule 6: Weekly Allergen Cadence
- **Requirement:** After first introduction, each allergen must appear 1-2 times per week
- **Validator:** `validateWeeklyAllergenCadence(days: DayEntry[], allergenId: string): ValidationResult`
- **Error:** "Allergen [X] must appear 1-2 times in week of [date]. Currently appears [N] times."

### Rule 7: Recipe Restrictions
- **Requirement:** No added sodium, sugar, or hot spices in recipes
- **Validator:** `validateRecipeRestrictions(recipe: Recipe): ValidationResult`
- **Error:** "Recipe [X] contains prohibited ingredients: [sodium/sugar/hot spices]"

---

## Key Date Constants

```typescript
const PLAN_START_DATE = "2026-03-28";
const PLAN_END_DATE = "2026-09-19";
const COMBINATION_START_DATE = "2026-05-01";
const TOTAL_DAYS = 175; // March 28 to Sept 19
const ALLERGEN_SPACING_DAYS = 3; // minimum gap between allergen first intros
const MIN_ALLERGEN_WEEKLY = 1;
const MAX_ALLERGEN_WEEKLY = 2;
```

---

## Testing Checkpoints

After completing each phase, verify these checkpoints:

### After Phase 1
- [ ] Can import and use food types
- [ ] All 80+ foods are defined
- [ ] Allergens are marked correctly

### After Phase 4
- [ ] All validators return proper error objects
- [ ] Can detect rule violations
- [ ] Validation panel shows errors

### After Phase 7
- [ ] Generate produces a complete calendar
- [ ] No validation errors
- [ ] All foods introduced
- [ ] All allergens repeat 1-2x per week

### After Phase 10
- [ ] Can manually add/remove foods
- [ ] Validation updates in real-time
- [ ] State persists to localStorage

### After Phase 17
- [ ] Site loads on Netlify
- [ ] All features work in production
- [ ] No console errors

---

## File Structure Reference

```
food-calendar/
├── src/
│   ├── components/
│   │   ├── HeaderBar.tsx
│   │   ├── FoodLibraryPanel.tsx
│   │   ├── CalendarView.tsx
│   │   ├── DayCard.tsx
│   │   ├── ValidationPanel.tsx
│   │   ├── CombinationPlanner.tsx
│   │   ├── InspectorPanel.tsx
│   │   ├── ExportPanel.tsx
│   │   └── RuleStatusPanel.tsx
│   ├── data/
│   │   ├── foods.ts           # Food catalog
│   │   └── recipes.ts         # Recipe definitions
│   ├── types/
│   │   ├── Food.ts
│   │   ├── Calendar.ts
│   │   └── Recipe.ts
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   ├── plannerEngine.ts
│   │   └── exportUtils.ts
│   ├── validators/
│   │   ├── validateDailyMinimum.ts
│   │   ├── validateNoConsecutiveNewFoods.ts
│   │   ├── validateAllergenSpacing.ts
│   │   ├── validateCombinationStartDate.ts
│   │   ├── validateCombinationIngredients.ts
│   │   ├── validateWeeklyAllergenCadence.ts
│   │   ├── validateRecipeRestrictions.ts
│   │   └── index.ts           # Run all validations
│   ├── store/
│   │   └── plannerStore.ts    # Zustand store or Context
│   ├── App.tsx
│   └── main.tsx
├── public/
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── netlify.toml
├── _redirects
└── README.md
```

---

## Pro Tips for Coding Agents

1. **Start with types first** - Define TypeScript interfaces before implementing logic
2. **Make validators pure functions** - Easy to test, easy to debug
3. **Use date-fns consistently** - Don't mix date libraries
4. **Keep state flat** - Avoid nested state updates
5. **Validate early, validate often** - Run validators after every state change
6. **Mock data for testing** - Create a small test calendar (7 days) for quick iteration
7. **Console.log the plan** - Log the full plan after generation to inspect the algorithm
8. **Use TypeScript strict mode** - Catch errors early
9. **Comment the tricky parts** - Especially the allergen weekly logic
10. **Test edge cases** - First day, last day, May 1 boundary

---

## Minimal First Working Version

If you only have 4 hours and need something working:

1. **Phase 0** - Setup (30 min)
2. **Phase 1** - Food data (30 min)
3. **Phase 2** - Calendar structure (30 min)
4. **Simplified Phase 5** - Random food placement (1 hour)
   - Ignore all rules except "one food per day"
   - Just randomly assign foods
5. **Phase 13** - CSV export (30 min)
6. **Phase 17** - Deploy (30 min)

This gives you a deployed calendar that has foods on every day but doesn't follow the rules yet. You can then incrementally add the rules in later phases.

---

## When Things Go Wrong

### Problem: Validation is too slow
- **Solution:** Memoize validation results, only revalidate changed days

### Problem: Can't satisfy allergen weekly requirements
- **Solution:** Check that you're calculating weeks correctly (use `startOfWeek` from date-fns)

### Problem: Running out of days to introduce foods
- **Solution:** Start allergen intros earlier, be more aggressive in the first month

### Problem: Combinations never become eligible
- **Solution:** Check that ingredient introduction tracking is working, log the introMap

### Problem: State updates not reflecting in UI
- **Solution:** Verify you're updating state immutably (spread operators)

### Problem: localStorage quota exceeded
- **Solution:** Store compressed state or migrate to IndexedDB
