# Ready-to-Use Prompts for Coding Agents

Copy-paste these prompts to build each phase. Each prompt is self-contained and includes all necessary context.

---

## Phase 0: Project Setup

```
I need to set up a new React + TypeScript + Vite project for a food introduction calendar app.

Please:
1. Initialize a new Vite project with React and TypeScript
2. Install and configure Tailwind CSS
3. Install these dependencies: date-fns, zustand
4. Create this folder structure:
   - src/components/
   - src/data/
   - src/utils/
   - src/types/
   - src/validators/
   - src/store/
5. Create a basic App.tsx with a header that says "BabyBite Calendar"
6. Style the header with Tailwind (centered, nice padding, professional look)
7. Verify the dev server runs with `npm run dev`

The app should load in the browser with a styled header.
```

---

## Phase 1: Food Data Model & Catalog

```
I need to create the food catalog and type definitions for a food introduction calendar app.

Context:
- This app helps parents plan baby food introductions
- There are 5 categories: Fruit, Vegetables, Starches, Proteins, Allergens
- Some foods are allergens (eggs, dairy, nuts, fish, etc.)

Please:

1. Create src/types/Food.ts with these types:
   - FoodCategory (union type: "fruit" | "vegetable" | "starch" | "protein" | "allergen")
   - Food interface with: id (string), name (string), category (FoodCategory), isAllergen (boolean)

2. Create src/data/foods.ts with the complete food list from this document:
   [paste the foods list from original-plan.md here]

3. Mark these foods as allergens (isAllergen: true):
   Peanut, Egg, Cottage cheese, Ricotta, Yogurt, Salmon, Sardines, Tuna, White fish, 
   Clams, Crab, Lobster, Shrimp, Cashew, Almond, Tahini

4. Create src/components/FoodLibraryPanel.tsx that:
   - Displays all foods
   - Groups them by category
   - Shows allergen badge for allergens
   - Has filter buttons for each category

5. Import and display FoodLibraryPanel in App.tsx

The result should show all 80+ foods organized by category with visual distinction for allergens.
```

---

## Phase 2: Date Range & Calendar Structure

```
I need to create the calendar data structure for a food introduction calendar app.

Context:
- Calendar runs from March 28, 2026 to September 19, 2026 (175 days)
- Each day can have multiple food items
- Each item can be a first introduction or a repeat

Please:

1. Create src/types/Calendar.ts with these interfaces:
   - PlannedItem: { foodId?: string, type: "single" | "combination", label: string, 
     isFirstIntroduction: boolean, ingredientFoodIds?: string[] }
   - ValidationResult: { valid: boolean, errors: string[], warnings: string[] }
   - DayEntry: { date: string (YYYY-MM-DD), items: PlannedItem[], notes?: string, 
     validation: ValidationResult }

2. Create src/utils/dateUtils.ts with:
   - generateDateRange(startDate: string, endDate: string): string[]
   - This should generate all dates from 2026-03-28 to 2026-09-19
   - Use date-fns for date manipulation

3. Create src/store/plannerStore.ts with Zustand:
   - State: { days: DayEntry[], foods: Food[] }
   - Actions: initializeDays(), setFoods(foods)
   - initializeDays should create a DayEntry for each date with empty items

4. Create src/components/CalendarView.tsx that:
   - Displays all 175 days
   - Shows them grouped by month
   - Each day shows the date
   - Simple card layout with Tailwind

5. Update App.tsx to initialize the store and display CalendarView

Verify that 175 days are displayed (March 28 through September 19, 2026).
```

---

## Phase 3: Basic Planning Engine - Manual Food Placement

```
I need to add the ability to manually assign foods to calendar days.

Current state:
- I have a calendar with 175 empty days
- I have a food library with 80+ foods
- I need to let users add foods to specific days

Please:

1. Add these actions to plannerStore.ts:
   - addFoodToDay(date: string, foodId: string)
   - removeFoodFromDay(date: string, foodId: string)
   - clearAllDays()
   - Load/save state from localStorage

2. Update DayEntry to track which foods have been introduced by that date

3. Create src/components/DayCard.tsx that shows:
   - The date
   - All foods assigned to that day
   - A "+" button to add foods
   - Remove button for each food

4. Create a simple modal or dropdown to select a food when clicking "+"

5. Update CalendarView to use DayCard components

6. Add "Clear All" button to header

Test:
- Add "Apple" to March 28
- Refresh the page
- "Apple" should still be on March 28 (localStorage persistence)
```

---

## Phase 4: Rule Engine - Validation Only

```
I need to implement validation rules for the food introduction calendar.

Rules to implement:
1. Each day must have at least one food
2. No brand new foods on consecutive days
3. Allergen first introductions must be at least 3 days apart
4. No combination foods before May 1, 2026
5. Combination ingredients must be introduced separately first

Please:

1. Create src/validators/validateDailyMinimum.ts
   - Check if day has at least one item
   - Return ValidationResult

2. Create src/validators/validateNoConsecutiveNewFoods.ts
   - Check if a new food is being introduced the day after another new food
   - Return ValidationResult with error message

3. Create src/validators/validateAllergenSpacing.ts
   - Check if allergen first intro is at least 3 days after previous allergen first intro
   - Return ValidationResult

4. Create src/validators/validateCombinationStartDate.ts
   - Check if date is on or after May 1, 2026
   - Return ValidationResult

5. Create src/validators/validateCombinationIngredients.ts
   - Check if all ingredients were introduced before this date
   - Return ValidationResult

6. Create src/validators/index.ts that exports:
   - runAllValidations(days: DayEntry[]): void
   - This should run all validators and update each day's validation field

7. Create src/components/ValidationPanel.tsx that:
   - Shows all validation errors across the calendar
   - Links to the specific day with the error
   - Uses red/yellow/green color coding

8. Update the store to run validations after every state change

9. Add visual indicators to DayCard (✓ valid, ⚠ warning, ✗ invalid)

Test:
- Add "Peanut" (allergen) to March 28 (first intro)
- Add "Egg" (allergen) to March 29 (first intro)
- Should show error: "Allergens must be 3 days apart"
```

---

## Phase 5: Auto-Generate - First Introduction Scheduling

```
I need to implement the auto-generation algorithm that schedules first introductions.

Context:
- We have 175 days and 80+ foods to introduce
- Allergens must be spaced 3 days apart for first introductions
- No new foods on consecutive days
- Prioritize allergens early (they have weekly repeat requirements)

Please:

1. Create src/utils/plannerEngine.ts

2. Implement planFirstIntroductions():
   - Sort foods: allergens first, then others
   - Track the last day a new food was introduced
   - Track the last day an allergen was first introduced
   - For each food:
     * Find the earliest valid day to introduce it
     * Valid = respects the spacing rules
     * Add it as a first introduction
   - Return updated days array

3. Add "Generate Calendar" button to header

4. Connect button to run planFirstIntroductions()

5. Update DayCard to show "NEW" badge for first introductions

6. Add visual distinction between new and repeat items

Algorithm hints:
- Start from March 28, 2026
- For allergens: check that it's been 3+ days since last allergen first intro
- For any new food: check that yesterday didn't have a new food
- If a day is invalid, try the next day
- Use a greedy algorithm (not perfect, but good enough)

Test:
- Click "Generate Calendar"
- Verify all foods appear at least once
- Verify no allergen first intros are within 3 days of each other
- Verify no consecutive days have new foods
```

---

## Phase 6: Fill Empty Days & Food Repetition

```
I need to ensure every day has at least one food by repeating previously introduced foods.

Current state:
- First introductions are scheduled
- Many days are still empty
- Need to fill gaps with repeat foods

Please:

1. Update src/utils/plannerEngine.ts with fillEmptyDays():
   - For each empty day:
     * Get list of foods already introduced by that date
     * Randomly pick 1-2 of those foods to repeat
     * Add them to the day (NOT as first introduction)

2. Call fillEmptyDays() after planFirstIntroductions()

3. Update validation to distinguish between:
   - First introduction of a food (triggers spacing rules)
   - Repeat of an already-introduced food (no spacing rules)

4. Add "REPEAT" badge to DayCard for repeat items

Test:
- Generate calendar
- Every day from March 28 to Sept 19 should have at least one food
- Days should show a mix of "NEW" and "REPEAT" items
- No validation errors for daily minimum
```

---

## Phase 7: Allergen Weekly Repetition

```
I need to implement the allergen weekly repetition rule.

Rule: After first introduction, each allergen must appear 1-2 times per week.

Please:

1. Define week boundaries as Sunday-Saturday

2. Create src/validators/validateWeeklyAllergenCadence.ts:
   - For each allergen
   - For each week after its first introduction
   - Count how many times it appears that week
   - Return error if count < 1 or > 2

3. Create src/utils/allergenScheduler.ts with scheduleAllergenRepetitions():
   - After first introductions are placed
   - For each allergen:
     * Find its first introduction date
     * For each week after that:
       - If allergen appears 0 times, add it once
       - If allergen appears > 2 times, remove extras
   - Return updated days

4. Update plannerEngine to call scheduleAllergenRepetitions()

5. Add allergen status to DayCard:
   - Show "🥜" or similar icon for allergen items
   - Show count: "Allergen 1/2 this week"

6. Update ValidationPanel to show allergen weekly status

Test:
- Generate calendar
- Find when "Egg" is first introduced
- Check that every week after that has Egg appearing 1-2 times
- Should have no validation errors
```

---

## Phase 8: Combination Foods - Data Model

```
I need to add support for combination foods (recipes).

Context:
- Combinations are foods made from multiple ingredients (e.g., pancakes = egg + wheat + dairy)
- Can only use combinations after all ingredients are introduced separately
- Can only add combinations on or after May 1, 2026
- Must track prohibited additives (sodium, sugar, hot spices)

Please:

1. Create src/types/Recipe.ts:
   - Recipe interface: { id: string, name: string, ingredientFoodIds: string[], 
     category: string, forbiddenFlags: { addedSodium: boolean, addedSugar: boolean, 
     hotSpices: boolean } }

2. Create src/data/recipes.ts with 5-10 simple recipes:
   - Scrambled eggs (egg)
   - Yogurt parfait (yogurt, banana, blueberries)
   - Fish cakes (white fish, potato, egg)
   - Nut butter toast (wheat bread, peanut butter)
   - Oatmeal (oatmeal, banana, almond butter)
   - Pancakes (egg, wheat flour, milk/yogurt, banana)
   - Vegetable rice (rice, carrot, peas, broccoli)
   - Egg fried rice (rice, egg, peas)

3. All recipes should have all forbidden flags set to false

4. Update PlannedItem type to support:
   - type: "single" | "combination"
   - recipeId?: string

Test:
- Recipes data structure loads without errors
- Can import and use Recipe type
```

---

## Phase 9: Combination Foods - Validation & Scheduling

```
I need to add combination food validation and UI.

Rules:
- No combinations before May 1, 2026
- All ingredients must be introduced separately before the combination
- Recipes must not contain prohibited additives

Please:

1. Update src/validators/validateCombinationIngredients.ts:
   - Create an "introduction map" that tracks when each food was first introduced
   - For combination items, check that all ingredients were introduced before this date
   - Return error with list of missing ingredients

2. Create src/components/CombinationPlannerPanel.tsx:
   - Show list of all recipes
   - For each recipe:
     * Show ingredient list
     * Show eligibility status (Ready / Blocked / Coming Soon)
     * If blocked, explain why (date or missing ingredients)
   - Add button to add recipe to a specific date

3. Update addFoodToDay to support adding combinations:
   - Validate date >= May 1, 2026
   - Validate all ingredients introduced
   - Create PlannedItem with type: "combination"

4. Update DayCard to show combination items differently:
   - Show recipe name
   - Show ingredient list
   - Different badge color

5. Add CombinationPlannerPanel to App.tsx

Test:
- Try to add "Pancakes" recipe on April 30 → blocked (before May 1)
- Try to add "Pancakes" on May 1 before egg is introduced → blocked (missing ingredients)
- Introduce egg, wheat, yogurt, banana
- Add "Pancakes" on May 2 → success
```

---

## Phase 10: Manual Editing & Conflict Resolution

```
I need to add manual editing with real-time validation and warnings.

Please:

1. Add drag-and-drop support to calendar:
   - Use react-beautiful-dnd or basic drag events
   - Allow dragging foods between days
   - Re-validate after each move

2. Create src/components/ConflictResolutionModal.tsx:
   - Appears when user creates a validation error
   - Shows the specific rule that was violated
   - Suggests alternative dates
   - Allows user to override or cancel

3. Add "Save with Warnings" option:
   - Allow user to proceed even with validation errors
   - Show warning banner at top of page

4. Add bulk edit features:
   - Select multiple days
   - Add the same food to all selected days
   - Remove a food from all days

5. Add undo/redo:
   - Track state history
   - Ctrl+Z to undo
   - Ctrl+Shift+Z to redo

Test:
- Drag "Egg" from May 1 to March 29 (day after "Peanut" first intro)
- Modal appears: "Allergens must be 3 days apart"
- Modal suggests: "Try March 31 or later"
- User can cancel or override
```

---

## Phase 11: Food Library Panel - Advanced Features

```
I need to enhance the food library with live status tracking.

Please:

1. Update FoodLibraryPanel to show for each food:
   - Introduction status: Not introduced | Introduced on [date] | Coming up on [date]
   - Color coding: gray (not introduced), green (introduced), blue (scheduled)

2. Add search bar:
   - Filter foods by name
   - Highlight matching text

3. For allergens, show additional info:
   - Weekly status: "2/2 this week" or "0/2 this week - DUE"
   - Next occurrence date

4. Add "View Usage" button for each food:
   - Shows all dates where this food appears
   - Jump to those dates in calendar

5. Add drag support:
   - Drag food from library to calendar
   - Automatically add to that day

Test:
- Generate calendar
- Food library shows which foods are introduced and when
- Search for "egg" - only egg-related foods show
- Drag "Apple" from library to May 5 - it gets added
```

---

## Phase 12: Inspector & Explanation Panel

```
I need to add an explanation panel that helps users understand the planning decisions.

Please:

1. Create src/components/InspectorPanel.tsx:
   - Shows detailed info when a day or food is clicked
   - For a day:
     * Why each food was chosen
     * What rules were considered
     * What foods are blocked today and why
   - For a food:
     * When it was/will be first introduced
     * How many times it appears
     * Upcoming scheduled dates

2. Add "Why?" button to each DayCard item:
   - Clicks opens inspector focused on that food/day

3. Create explanation generator:
   - For allergen: "Egg introduced today as first allergen. Next allergen can be introduced on April 1 or later (3-day spacing)."
   - For repeat: "Apple repeated from previous introduction on March 28."
   - For blocked: "Peanut cannot be added today because Egg was first introduced 2 days ago. Need 3-day gap. Try April 1 or later."

4. Add helpful tips and examples:
   - Tooltips explaining each rule
   - Links to learn more

Test:
- Click on a day with an allergen
- Inspector shows: "This day is valid. Egg is being introduced for the first time. 
  All allergen spacing rules are satisfied."
- Click "Why?" on the Egg item
- Shows: "Egg is being introduced today. It will need to be repeated 1-2 times per week 
  starting next week."
```

---

## Phase 13: CSV Export

```
I need to add CSV export functionality.

CSV columns:
- Date
- Foods (comma-separated)
- New Introductions (comma-separated)
- Allergens (comma-separated)
- Combination (yes/no)
- Validation Status

Please:

1. Create src/utils/exportUtils.ts:
   - Function: exportToCSV(days: DayEntry[], foods: Food[]): string
   - Generate CSV content with proper formatting
   - Escape quotes and commas in food names

2. Create download trigger:
   - Convert CSV string to Blob
   - Create download link
   - Trigger download with filename: "baby-food-calendar-YYYY-MM-DD.csv"

3. Add "Export CSV" button to header or export panel

4. Format dates nicely: "March 28, 2026" not "2026-03-28"

Test:
- Generate calendar
- Click "Export CSV"
- File downloads
- Open in Excel/Google Sheets
- Verify all 175 days are present
- Verify food names are correctly formatted
```

---

## Phase 14: Print Layout & PDF Support

```
I need to create a print-friendly view.

Please:

1. Create src/print.css:
   - Hide navigation, buttons, and interactive elements
   - High contrast, black and white friendly
   - One month per page
   - Clear date headers
   - Readable font sizes

2. Add print styles to components:
   - Large, readable calendar layout
   - Food names in clear list format
   - Page breaks between months

3. Add "Print" button to header:
   - Triggers window.print()
   - Applies print stylesheet

4. Create month-view optimized for printing:
   - Traditional calendar grid layout
   - Each day shows date and full food list
   - Legend for badges (NEW, REPEAT, ALLERGEN)

5. Test page breaks:
   - Each month starts on a new page
   - No awkward cuts mid-week

Test:
- Generate calendar
- Click "Print"
- Print preview looks clean and readable
- Try "Save as PDF" from print dialog
- PDF is well-formatted
```

---

## Phase 15: Rules Summary Panel

```
I need to create a live dashboard showing rule compliance.

Please:

1. Create src/components/RuleStatusPanel.tsx:
   - Shows all rules as a checklist
   - Green checkmark ✓ if rule is passing across all days
   - Red X ✗ if rule is failing anywhere
   - Count of violations

2. Rules to display:
   - ✓ All days have at least one food (175/175)
   - ✓ No consecutive new foods (0 violations)
   - ✓ Allergen spacing maintained (0 violations)
   - ✓ No combinations before May 1 (0 violations)
   - ✓ All combination ingredients introduced (0 violations)
   - ✓ Allergen weekly repetition (16/16 allergens compliant)

3. Make each rule clickable:
   - Clicking a failing rule shows which days have violations
   - Jump to those specific days

4. Add overall compliance score:
   - "95% compliant (5 issues found)"
   - Color-coded: green (100%), yellow (90-99%), red (<90%)

5. Position panel prominently (sidebar or top)

Test:
- Generate calendar
- All rules show green checkmarks
- Manually violate a rule (add consecutive new foods)
- That rule shows red X with count: "✗ No consecutive new foods (1 violation)"
- Click the rule
- Highlights the problem day
```

---

## Phase 16: Polish & Refinement

```
I need to polish the UX and make it production-ready.

Please implement:

1. Loading states:
   - Show spinner when generating calendar
   - Progress bar: "Scheduling allergens... 45%"

2. Mobile responsiveness:
   - Calendar works on mobile (cards stack, not grid)
   - Food library slides out on mobile
   - Touch-friendly buttons (min 44px)

3. Keyboard shortcuts:
   - G: Generate calendar
   - E: Export CSV
   - P: Print
   - Ctrl+Z: Undo
   - Ctrl+S: Save

4. Helpful onboarding:
   - First-time user tooltip tour
   - "Try clicking 'Generate Calendar' to get started!"
   - Dismiss button for hints

5. Error messages:
   - Friendly, non-technical language
   - "Oops! Allergens need more space" instead of "Validation error on line 237"

6. Performance:
   - Memoize expensive calculations
   - Virtual scrolling for calendar if needed
   - Debounce search input

7. About/Help section:
   - Explains the rules in simple terms
   - Shows examples
   - FAQ

Test:
- Test on iPhone and Android
- Test with keyboard only (no mouse)
- Ask a non-technical person to use it
- Fix any confusion points
```

---

## Phase 17: Netlify Deployment

```
I need to deploy this app to Netlify as a static site.

Please:

1. Create netlify.toml:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. Create _redirects file in public/:
   ```
   /*    /index.html   200
   ```

3. Update package.json build script:
   - Ensure `vite build` is configured for production
   - Set base path correctly
   - Optimize bundle size

4. Test production build locally:
   ```bash
   npm run build
   npm run preview
   ```

5. Create README with deployment instructions

6. Deploy to Netlify:
   - Connect GitHub repo
   - Configure build settings
   - Deploy

7. Test deployed site:
   - All features work
   - No console errors
   - Fast load times
   - Works on mobile

Provide the deployed URL when done.
```

---

## Phase 18: Advanced Features (Optional)

```
Pick one or more advanced features to implement:

Option 1: Import/Export JSON Backups
- Export complete state as JSON
- Import previously saved state
- Version compatibility checking

Option 2: Custom Recipe Builder
- Let users create their own recipes
- Add ingredients from introduced foods
- Save custom recipes

Option 3: Recipe Recommendations
- Analyze which foods are introduced
- Suggest recipes that can now be made
- "You can now make 3 new recipes!"

Option 4: Visual Calendar Themes
- Color themes (pastel, vibrant, dark mode)
- Icon sets for foods
- Customizable styling

Option 5: Share via URL
- Encode calendar state in URL
- Share link with others
- Others can view and copy your calendar

Which feature would you like to implement?
```

---

## Tips for Using These Prompts

1. **Copy the entire prompt** including context
2. **Replace placeholders** like [paste foods list here] with actual data
3. **Adjust complexity** based on your needs - you can simplify prompts
4. **Combine phases** if your agent can handle larger tasks
5. **Test incrementally** - verify each phase before moving to the next
6. **Keep files** - save the result of each phase as a checkpoint

Happy building! 🚀
