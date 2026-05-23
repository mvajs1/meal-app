# Meal Tracker — Product Requirements Document

**Version:** 2.0
**Author:** Product Team
**Date:** April 2026
**Status:** Approved for Development

---

## 1. Product Overview

Meal Tracker is a web-based application that helps users log daily food intake, track nutritional macros and calories, and receive personalized feedback on their eating habits. The app targets health-conscious individuals who want to monitor their diet and maintain nutrition goals.

## 2. Goals & Success Metrics

- Users can log a food entry in under 30 seconds
- Users receive clear, personalized feedback on whether their daily nutrition is balanced
- Users with food allergies can safely browse foods without encountering allergens
- Users can review their eating history and track progress over time

## 3. User Personas

| Persona | Goal | Allergies | Daily Calorie Target |
|---------|------|-----------|---------------------|
| Alice | Maintain weight | None | 2,000 kcal |
| Bob | Lose weight | Gluten, Dairy | 1,800 kcal |
| Carol | Gain muscle | Nuts | 2,500 kcal |

## 4. Core Features

### 4.1 User Account
- Email + password authentication
- Profile with: name, calorie target, goal (lose/maintain/gain), allergy list
- Editable preferences

### 4.2 Food Database
- Pre-seeded with 50+ common foods
- Each food stores: name, calories, protein, carbs, fat, sugar, fiber (all per 100g)
- Each food has optional ingredients list and allergen flags
- Users can view all foods, add new foods, and edit existing entries
- Click any food row to expand and see full nutritional details

### 4.3 Allergen Reference
- Dedicated page listing all allergen categories
- Shows which foods contain each allergen
- Helps users understand what the system filters

### 4.4 Daily Food Logging
- Users log food entries by selecting a food, specifying grams, and choosing a meal type (breakfast, lunch, dinner, snack)
- Each entry is associated with a date
- Nutritional values calculated proportionally based on grams entered
- Users can delete individual entries or clear all entries for a day

### 4.5 Dashboard (Today View)
- Shows today's food log grouped by meal type
- Real-time calorie progress bar (consumed vs target)
- Macro breakdown (protein, carbs, fat) shown as progress bars
- Personalized daily feedback message based on nutritional balance
- Quick-add buttons per meal type

### 4.6 Balanced Day Feedback
A day receives positive feedback when the macro split falls within:
- Protein: 20–35% of calories
- Carbs: 40–60% of calories
- Fat: 20–35% of calories

Feedback messages are color-coded:
- Green: balanced macros AND within calorie target
- Amber: one of the two is on track
- Gray: both need improvement

### 4.7 Daily Calorie Check
- System checks if the day's total calories are within ±10% of the user's target
- Visual indicator on the calorie progress bar

### 4.8 History
- Shows daily summaries for the last 30 days
- Each day displays: total calories, macro summary, feedback message, entry count
- Color-coded status indicators (green/amber/gray)

## 5. Business Rules

| Rule | Description |
|------|-------------|
| BR-1 | Nutritional values are calculated proportionally: `(grams / 100) × value_per_100g` |
| BR-2 | Balanced feedback awarded when protein, carbs, and fat percentages fall within specified ranges |
| BR-3 | Daily calories must be within ±10% of user's target for positive calorie feedback |
| BR-4 | Foods matching user's allergy list must be excluded from available foods |
| BR-5 | Macro percentages calculated from grams using: protein=4 kcal/g, carbs=4 kcal/g, fat=9 kcal/g |

## 6. Food Database Requirements

- Minimum 50 foods across categories: proteins, grains, vegetables, fruits, dairy, snacks, beverages, processed foods
- All nutritional values must be realistic (approximate real-world data)
- Each food must have allergen flags where applicable
- Categories of allergens: gluten, dairy, nuts, soy, eggs, shellfish, fish

## 7. UI/UX Requirements

- Mobile-first responsive design
- Clean, modern interface
- Brand colors: slate, amber, stone tones
- Key screens: Login, Dashboard, Log Food, Foods, History
- Bottom navigation bar with links to all main sections

## 8. Data Model (High Level)

- **User**: id, email, password, name, calorieTarget, goal, unitSystem, locale
- **Allergen**: id, name — canonical allergen list (`gluten`, `dairy`, `nuts`, `soy`, `eggs`, `shellfish`, `fish`, …)
- **Ingredient**: id, name — canonical ingredient list, shared across foods
- **Food**: id, name, calories, protein, carbs, fat, sugar, fiber, category, isSystem, createdBy
- **FoodLog**: id, user, food, grams, mealType, date *(calendar day, stored as UTC-midnight DateTime)*
- **UserAllergen** (join): user ↔ allergen
- **FoodAllergen** (join): food ↔ allergen
- **FoodIngredient** (join): food ↔ ingredient, with `position` to preserve recipe ordering

Allergens and ingredients are normalized into their own tables (not JSON/CSV columns on User/Food), so a user's allergy profile and a food's allergen/ingredient composition are first-class relational data and can be queried directly (e.g. "list foods containing any of this user's allergens" is a join, not a JSON scan).

## 9. Out of Scope (v1)

- Micronutrient tracking (vitamins, minerals)
- Recipe instructions
- Social features (sharing logs)
- Barcode scanning
- Restaurant/eating-out meals
- Budget tracking
- Weekly meal planning
- Shopping list generation

## 10. Accessibility Requirements

- All interactive elements must be keyboard accessible
- Images and icons must have alt text
- Color must not be the only indicator of status
- Form inputs must have associated labels
- Target WCAG 2.1 Level AA

## 11. Localization Requirements

- Support metric (grams, kg) and imperial (oz, lbs) units
- Dates display in MM/DD/YYYY format across the app
- Number formatting must respect locale (1,000.5 vs 1.000,5)
- User can set preferred unit system in preferences
- All user-facing text should be externalizable (i18n-ready structure)

## 12. Open Questions

*None — approved for development.*
