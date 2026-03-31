# BabyBite Calendar - Food Introduction Planner

A React-based web app to help parents plan baby food introductions following evidence-based spacing rules for allergens and new foods.

## 🎯 Quick Start for Coding Agents

This project is designed to be built incrementally in small, manageable phases.

### Start Here:
1. **[incremental-build-plan.md](incremental-build-plan.md)** - 18 bite-sized phases with clear deliverables
2. **[ready-prompts.md](ready-prompts.md)** - Copy-paste prompts for each phase
3. **[phase-dependencies.md](phase-dependencies.md)** - Dependencies, tips, and troubleshooting

### Supporting Documents:
- **[full-design-plan.md](full-design-plan.md)** - Complete technical specification
- **[original-plan.md](original-plan.md)** - Original requirements and food list
- **[next-steps.md](next-steps.md)** - Future enhancements

## 🏗️ Build Approach

Instead of building the whole app at once, we break it into 18 phases:

| Phase | Focus | Time |
|-------|-------|------|
| 0-2 | Foundation (Setup, Data, Calendar) | 2-3 hours |
| 3-7 | Core Logic (Manual, Validation, Auto-Gen) | 10-15 hours |
| 8-10 | Combinations & Editing | 5-8 hours |
| 11-15 | UI Polish (Library, Inspector, Export) | 6-9 hours |
| 16-17 | Production Ready (Polish, Deploy) | 2-4 hours |
| 18 | Optional Advanced Features | Variable |

**Total: ~30-40 hours to MVP**

## 🎨 Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **State:** Zustand (or React Context)
- **Dates:** date-fns
- **Hosting:** Netlify (static)
- **No Backend Required**

## 📋 Core Rules

The app enforces evidence-based food introduction guidelines:

- ✅ At least one food per day
- ✅ No brand new foods on consecutive days  
- ✅ 3-day minimum gap between allergen first introductions
- ✅ Allergens repeat 1-2x per week after introduction
- ✅ No combinations until May 1, 2026
- ✅ All combo ingredients introduced separately first
- ✅ No added sodium, sugar, or hot spices

**Timeline:** March 28, 2026 → September 19, 2026 (175 days)

## 🚀 Getting Started with a Coding Agent

### Option 1: Start from Phase 0
```bash
# Copy this prompt to your coding agent:
"Please implement Phase 0 from incremental-build-plan.md. 
The prompt is available in ready-prompts.md."
```

### Option 2: Build MVP Only (4 hours)
If you want something working fast, follow the "Minimal First Working Version" in [phase-dependencies.md](phase-dependencies.md).

### Option 3: Jump to Specific Phase
```bash
"I want to implement Phase 7 (Allergen Repetition). 
Please implement prerequisites first (Phases 0-6), 
then Phase 7. Use minimal implementations for prerequisites."
```

## 📁 Project Structure (After Phase 17)

```
food-calendar/
├── src/
│   ├── components/       # React components
│   ├── data/            # Food catalog & recipes
│   ├── types/           # TypeScript interfaces
│   ├── utils/           # Date utils, planner engine
│   ├── validators/      # Rule validators
│   ├── store/           # State management
│   └── App.tsx
├── public/
├── full-design-plan.md
├── incremental-build-plan.md
├── ready-prompts.md
├── phase-dependencies.md
└── README.md
```

## 💡 Key Features (When Complete)

- 🗓️ **Auto-Generate** compliant 6-month calendar
- 🔍 **Smart Validation** with explanations
- 🍎 **Food Library** with live status tracking
- 🧁 **Combination Planner** for recipes (after May 1)
- ✏️ **Manual Editing** with conflict resolution
- 📊 **Export** to CSV and PDF/Print
- 💾 **Auto-Save** to localStorage
- 📱 **Mobile Responsive**

## 🎓 For Developers

If you're a human developer (not a coding agent):

1. Read [full-design-plan.md](full-design-plan.md) for complete context
2. Follow [incremental-build-plan.md](incremental-build-plan.md) sequentially
3. Test after each phase before moving on
4. Reference [phase-dependencies.md](phase-dependencies.md) when stuck

## Netlify Deployment

This app is configured for static deployment on Netlify.

### Build Settings

- Build command: `npm run build`
- Publish directory: `dist`

The repo includes:

- [`netlify.toml`](/home/ubuntu/workspace/personal/food-calendar/netlify.toml) for build and SPA redirect configuration
- [`public/_redirects`](/home/ubuntu/workspace/personal/food-calendar/public/_redirects) so deep links route back to `index.html`

### Deploy Steps

1. Push the repository to GitHub.
2. In Netlify, create a new site from that repository.
3. Confirm the build command is `npm run build`.
4. Confirm the publish directory is `dist`.
5. Deploy the site.

### Local Production Verification

```bash
npm run build
npm run preview
```

Then open the preview URL and verify:

- the dashboard loads without console errors
- calendar routes and refreshes work
- CSV export, print, generation, and editing still work in production mode

## 📞 Philosophy

This project demonstrates **incremental development** - building complex apps in small, testable chunks. Each phase:
- ✅ Is self-contained
- ✅ Has clear acceptance criteria  
- ✅ Builds on previous work
- ✅ Can be built by a coding agent
- ✅ Can be tested immediately

## 🤝 Contributing

This is a personal project, but the incremental build approach can be adapted for other projects.

## 📄 License

MIT License - use this structure for your own projects!
