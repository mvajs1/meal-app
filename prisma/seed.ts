import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { parseIngredients } from '../lib/utils/ingredients';
import { toDateOnlyUTC } from '../lib/utils/date';

const prisma = new PrismaClient();

type SeedFood = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber: number;
  ingredients: string;
  allergens: string[];
  category: string;
};

const foods: SeedFood[] = [
  // ===== PROTEINS =====
  { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, sugar: 0, fiber: 0, ingredients: 'chicken breast', allergens: [], category: 'protein' },
  { name: 'Salmon Fillet', calories: 208, protein: 20, carbs: 0, fat: 13, sugar: 0, fiber: 0, ingredients: 'atlantic salmon', allergens: ['fish'], category: 'protein' },
  { name: 'Eggs', calories: 155, protein: 13, carbs: 1.1, fat: 11, sugar: 1.1, fiber: 0, ingredients: 'whole eggs', allergens: ['eggs'], category: 'protein' },
  { name: 'Tofu', calories: 76, protein: 8, carbs: 1.9, fat: 4.8, sugar: 0.7, fiber: 0.3, ingredients: 'soybeans, water, coagulant', allergens: ['soy'], category: 'protein' },
  { name: 'Ground Beef (85/15)', calories: 250, protein: 26, carbs: 0, fat: 17, sugar: 0, fiber: 0, ingredients: 'ground beef', allergens: [], category: 'protein' },
  { name: 'Turkey Breast', calories: 135, protein: 30, carbs: 0, fat: 1, sugar: 0, fiber: 0, ingredients: 'turkey breast', allergens: [], category: 'protein' },
  { name: 'Shrimp', calories: 99, protein: 24, carbs: 0.2, fat: 0.3, sugar: 0, fiber: 0, ingredients: 'shrimp', allergens: ['shellfish'], category: 'protein' },
  { name: 'Black Beans', calories: 132, protein: 8.9, carbs: 23.7, fat: 0.5, sugar: 0.3, fiber: 8.7, ingredients: 'black beans', allergens: [], category: 'protein' },
  { name: 'Tuna (Canned)', calories: 116, protein: 25.5, carbs: 0, fat: 0.8, sugar: 0, fiber: 0, ingredients: 'tuna, water, salt', allergens: ['fish'], category: 'protein' },

  // ===== GRAINS =====
  { name: 'Brown Rice', calories: 112, protein: 2.6, carbs: 23.5, fat: 0.9, sugar: 0.4, fiber: 1.8, ingredients: 'brown rice', allergens: [], category: 'grain' },
  { name: 'Oatmeal', calories: 68, protein: 2.4, carbs: 12, fat: 1.4, sugar: 0.5, fiber: 1.7, ingredients: 'rolled oats', allergens: ['gluten'], category: 'grain' },
  { name: 'Whole Wheat Bread', calories: 247, protein: 13, carbs: 41, fat: 3.4, sugar: 5, fiber: 6, ingredients: 'whole wheat flour, water, yeast, salt, sugar', allergens: ['gluten'], category: 'grain' },
  { name: 'Quinoa', calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9, sugar: 0.9, fiber: 2.8, ingredients: 'quinoa', allergens: [], category: 'grain' },
  { name: 'White Rice', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, sugar: 0, fiber: 0.4, ingredients: 'white rice', allergens: [], category: 'grain' },
  { name: 'Pasta', calories: 131, protein: 5, carbs: 25, fat: 1.1, sugar: 0.6, fiber: 1.8, ingredients: 'durum wheat semolina, water', allergens: ['gluten'], category: 'grain' },
  { name: 'Corn Tortilla', calories: 218, protein: 5.7, carbs: 44.6, fat: 2.8, sugar: 1.1, fiber: 5.3, ingredients: 'corn flour, water, lime', allergens: [], category: 'grain' },

  // ===== VEGETABLES =====
  { name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, sugar: 1.7, fiber: 2.6, ingredients: 'broccoli', allergens: [], category: 'vegetable' },
  { name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, sugar: 0.4, fiber: 2.2, ingredients: 'spinach', allergens: [], category: 'vegetable' },
  { name: 'Sweet Potato', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, sugar: 4.2, fiber: 3, ingredients: 'sweet potato', allergens: [], category: 'vegetable' },
  { name: 'Carrot', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, sugar: 4.7, fiber: 2.8, ingredients: 'carrot', allergens: [], category: 'vegetable' },
  { name: 'Bell Pepper', calories: 31, protein: 1, carbs: 6, fat: 0.3, sugar: 4.2, fiber: 2.1, ingredients: 'bell pepper', allergens: [], category: 'vegetable' },
  { name: 'Kale', calories: 49, protein: 4.3, carbs: 8.8, fat: 0.9, sugar: 2.3, fiber: 3.6, ingredients: 'kale', allergens: [], category: 'vegetable' },
  { name: 'Avocado', calories: 160, protein: 2, carbs: 8.5, fat: 14.7, sugar: 0.7, fiber: 6.7, ingredients: 'avocado', allergens: [], category: 'vegetable' },
  { name: 'Tomato', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, sugar: 2.6, fiber: 1.2, ingredients: 'tomato', allergens: [], category: 'vegetable' },
  { name: 'Green Peas', calories: 81, protein: 5.4, carbs: 14.5, fat: 0.4, sugar: 5.7, fiber: 5.1, ingredients: 'green peas', allergens: [], category: 'vegetable' },

  // ===== FRUITS =====
  { name: 'Banana', calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, sugar: 12.2, fiber: 2.6, ingredients: 'banana', allergens: [], category: 'fruit' },
  { name: 'Apple', calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, sugar: 10.4, fiber: 2.4, ingredients: 'apple', allergens: [], category: 'fruit' },
  { name: 'Blueberries', calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3, sugar: 10, fiber: 2.4, ingredients: 'blueberries', allergens: [], category: 'fruit' },
  { name: 'Strawberries', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, sugar: 4.9, fiber: 2, ingredients: 'strawberries', allergens: [], category: 'fruit' },
  { name: 'Orange', calories: 47, protein: 0.9, carbs: 11.8, fat: 0.1, sugar: 9.4, fiber: 2.4, ingredients: 'orange', allergens: [], category: 'fruit' },

  // ===== DAIRY =====
  { name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, sugar: 3.2, fiber: 0, ingredients: 'milk, live cultures', allergens: ['dairy'], category: 'dairy' },
  { name: 'Whole Milk', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, sugar: 5.1, fiber: 0, ingredients: 'whole milk', allergens: ['dairy'], category: 'dairy' },
  { name: 'Cheddar Cheese', calories: 403, protein: 25, carbs: 1.3, fat: 33, sugar: 0.5, fiber: 0, ingredients: 'milk, salt, enzymes, annatto color', allergens: ['dairy'], category: 'dairy' },
  { name: 'Cottage Cheese', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, sugar: 2.7, fiber: 0, ingredients: 'milk, cream, salt, cultures', allergens: ['dairy'], category: 'dairy' },

  // ===== FATS & OILS =====
  { name: 'Olive Oil', calories: 884, protein: 0, carbs: 0, fat: 100, sugar: 0, fiber: 0, ingredients: 'extra virgin olive oil', allergens: [], category: 'other' },
  { name: 'Peanut Butter', calories: 588, protein: 25, carbs: 20, fat: 50, sugar: 9, fiber: 6, ingredients: 'peanuts, salt', allergens: ['nuts'], category: 'other' },
  { name: 'Butter', calories: 717, protein: 0.9, carbs: 0.1, fat: 81, sugar: 0.1, fiber: 0, ingredients: 'cream, salt', allergens: ['dairy'], category: 'dairy' },
  { name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 49, sugar: 4.4, fiber: 12.5, ingredients: 'almonds', allergens: ['nuts'], category: 'other' },

  // ===== PROCESSED / SNACKS (edge cases for teaching) =====
  { name: 'Protein Bar', calories: 250, protein: 20, carbs: 30, fat: 8, sugar: 15, fiber: 3,
    ingredients: 'whey protein, soy lecithin, chocolate, sugar, palm oil',
    allergens: ['dairy'], // FLAW 4: Missing "soy" — ingredients mention soy lecithin
    category: 'snack' },
  { name: 'Granola Bar', calories: 471, protein: 7, carbs: 64, fat: 20, sugar: 28, fiber: 4,
    ingredients: 'oats, milk powder, wheat flour, honey, nuts, palm oil',
    allergens: ['nuts'], // FLAW 4: Missing "dairy" and "gluten" — ingredients mention milk powder and wheat flour
    category: 'snack' },
  { name: 'Chocolate Chip Cookies', calories: 488, protein: 5.4, carbs: 64, fat: 23, sugar: 35, fiber: 2.4,
    ingredients: 'butter, wheat flour, eggs, sugar, chocolate chips, vanilla',
    allergens: ['gluten'], // FLAW 4: Missing "dairy" and "eggs"
    category: 'snack' },
  { name: 'Gummy Bears', calories: 343, protein: 6.9, carbs: 77, fat: 0, sugar: 46, fiber: 0, ingredients: 'sugar, glucose syrup, gelatin, citric acid, flavoring', allergens: [], category: 'snack' },
  { name: 'Potato Chips', calories: 536, protein: 7, carbs: 53, fat: 35, sugar: 0.3, fiber: 4.4, ingredients: 'potatoes, vegetable oil, salt', allergens: [], category: 'snack' },
  { name: 'Dark Chocolate', calories: 546, protein: 5, carbs: 60, fat: 31, sugar: 48, fiber: 7, ingredients: 'cocoa mass, sugar, cocoa butter, soy lecithin', allergens: ['soy'], category: 'snack' },
  { name: 'White Chocolate', calories: 539, protein: 5.9, carbs: 59, fat: 32, sugar: 59, fiber: 0, ingredients: 'sugar, cocoa butter, milk powder, soy lecithin', allergens: ['dairy', 'soy'], category: 'snack' },
  { name: 'Ice Cream (Vanilla)', calories: 207, protein: 3.5, carbs: 24, fat: 11, sugar: 21, fiber: 0, ingredients: 'cream, milk, sugar, vanilla, egg yolks', allergens: ['dairy', 'eggs'], category: 'snack' },
  { name: 'Energy Bar', calories: 200, protein: 10, carbs: 28, fat: 6, sugar: 18, fiber: 2, ingredients: 'oats, honey, whey protein, chocolate, nuts', allergens: ['gluten', 'dairy', 'nuts'], category: 'snack' },

  // ===== BEVERAGES (near-zero calorie edge cases) =====
  { name: 'Black Coffee', calories: 2, protein: 0.3, carbs: 0, fat: 0, sugar: 0, fiber: 0, ingredients: 'coffee', allergens: [], category: 'beverage' },
  { name: 'Diet Soda', calories: 0.4, protein: 0, carbs: 0.1, fat: 0, sugar: 0, fiber: 0, ingredients: 'carbonated water, aspartame, caramel color, phosphoric acid', allergens: [], category: 'beverage' },
  { name: 'Cola Soda', calories: 42, protein: 0, carbs: 10.6, fat: 0, sugar: 10.6, fiber: 0, ingredients: 'carbonated water, high fructose corn syrup, caramel color, phosphoric acid, caffeine', allergens: [], category: 'beverage' },
  { name: 'Orange Juice', calories: 45, protein: 0.7, carbs: 10.4, fat: 0.2, sugar: 8.4, fiber: 0.2, ingredients: '100% orange juice', allergens: [], category: 'beverage' },
  { name: 'Sports Drink', calories: 26, protein: 0, carbs: 6.5, fat: 0, sugar: 6, fiber: 0, ingredients: 'water, sugar, citric acid, sodium chloride, flavoring', allergens: [], category: 'beverage' },

  // ===== CONDIMENTS / SAUCES =====
  { name: 'Caesar Dressing', calories: 325, protein: 2.5, carbs: 3, fat: 33, sugar: 2, fiber: 0,
    ingredients: 'soybean oil, parmesan cheese, egg yolk, anchovies, garlic, lemon juice',
    allergens: ['dairy'], // FLAW 4: Missing "fish" and "eggs" — ingredients mention anchovies and egg yolk
    category: 'other' },
  { name: 'Honey', calories: 304, protein: 0.3, carbs: 82, fat: 0, sugar: 82, fiber: 0, ingredients: 'honey', allergens: [], category: 'other' },
  { name: 'Ketchup', calories: 112, protein: 1.7, carbs: 26, fat: 0.1, sugar: 22, fiber: 0.3, ingredients: 'tomato concentrate, sugar, vinegar, salt, spices', allergens: [], category: 'other' },
  { name: 'Soy Sauce', calories: 53, protein: 8.1, carbs: 4.9, fat: 0, sugar: 0.4, fiber: 0.8, ingredients: 'water, soybeans, wheat, salt', allergens: ['soy', 'gluten'], category: 'other' },

  // ===== CANDY (pure sugar carbs for teaching) =====
  { name: 'Hard Candy', calories: 394, protein: 0, carbs: 98, fat: 0.5, sugar: 63, fiber: 0, ingredients: 'sugar, corn syrup, citric acid, artificial flavor, artificial color', allergens: [], category: 'snack' },
  { name: 'Protein Shake (Powder)', calories: 120, protein: 24, carbs: 3, fat: 1, sugar: 1, fiber: 0.5, ingredients: 'whey protein isolate, cocoa, sucralose, soy lecithin', allergens: ['dairy', 'soy'], category: 'protein' },
];

const STANDARD_ALLERGENS = ['gluten', 'dairy', 'nuts', 'soy', 'eggs', 'shellfish', 'fish'];

async function main() {
  console.log('Seeding database...');

  // Clear existing data — cascades handle join tables via onDelete: Cascade
  await prisma.foodLog.deleteMany();
  await prisma.foodIngredient.deleteMany();
  await prisma.foodAllergen.deleteMany();
  await prisma.userAllergen.deleteMany();
  await prisma.food.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.allergen.deleteMany();
  await prisma.user.deleteMany();

  // ── Allergens ────────────────────────────────────────────────────────────
  // Seed the canonical list plus anything referenced in food data.
  const allergenNames = new Set<string>(STANDARD_ALLERGENS);
  for (const f of foods) for (const a of f.allergens) allergenNames.add(a);

  await prisma.allergen.createMany({
    data: [...allergenNames].map((name) => ({ name })),
  });
  const allergenByName = new Map(
    (await prisma.allergen.findMany()).map((a) => [a.name, a.id])
  );

  // ── Ingredients ──────────────────────────────────────────────────────────
  const ingredientNames = new Set<string>();
  for (const f of foods) for (const i of parseIngredients(f.ingredients)) ingredientNames.add(i);

  await prisma.ingredient.createMany({
    data: [...ingredientNames].map((name) => ({ name })),
  });
  const ingredientByName = new Map(
    (await prisma.ingredient.findMany()).map((i) => [i.name, i.id])
  );

  // ── Users ────────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.create({
    data: {
      email: 'alice@carvedrock.com',
      passwordHash: hash,
      name: 'Alice',
      calorieTarget: 2000,
      goal: 'maintain',
      unitSystem: 'metric',
      locale: 'en-US',
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@carvedrock.com',
      passwordHash: hash,
      name: 'Bob',
      calorieTarget: 1800,
      goal: 'lose',
      unitSystem: 'imperial',
      locale: 'en-US',
      allergies: {
        create: [
          { allergenId: allergenByName.get('gluten')! },
          { allergenId: allergenByName.get('dairy')! },
        ],
      },
    },
  });

  const carol = await prisma.user.create({
    data: {
      email: 'carol@carvedrock.com',
      passwordHash: hash,
      name: 'Carol',
      calorieTarget: 2500,
      goal: 'gain',
      unitSystem: 'metric',
      locale: 'de-DE',
      allergies: {
        create: [{ allergenId: allergenByName.get('nuts')! }],
      },
    },
  });

  console.log(`Created users: Alice (${alice.id}), Bob (${bob.id}), Carol (${carol.id})`);

  // ── Foods ────────────────────────────────────────────────────────────────
  for (const f of foods) {
    const ingredients = parseIngredients(f.ingredients);
    await prisma.food.create({
      data: {
        name: f.name,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        sugar: f.sugar,
        fiber: f.fiber,
        category: f.category,
        isSystem: true,
        createdById: null,
        allergens: {
          create: f.allergens.map((name) => ({
            allergenId: allergenByName.get(name)!,
          })),
        },
        ingredients: {
          create: ingredients.map((name, position) => ({
            ingredientId: ingredientByName.get(name)!,
            position,
          })),
        },
      },
    });
  }
  console.log(`Created ${foods.length} foods`);

  // ── Sample food logs for Alice (today) ───────────────────────────────────
  const today = toDateOnlyUTC(new Date().toISOString().split('T')[0]);

  const [chicken, rice, broccoli, eggs, oatmeal, banana] = await Promise.all([
    prisma.food.findUnique({ where: { name: 'Chicken Breast' } }),
    prisma.food.findUnique({ where: { name: 'Brown Rice' } }),
    prisma.food.findUnique({ where: { name: 'Broccoli' } }),
    prisma.food.findUnique({ where: { name: 'Eggs' } }),
    prisma.food.findUnique({ where: { name: 'Oatmeal' } }),
    prisma.food.findUnique({ where: { name: 'Banana' } }),
  ]);

  if (chicken && rice && broccoli && eggs && oatmeal && banana) {
    await prisma.foodLog.createMany({
      data: [
        { userId: alice.id, foodId: oatmeal.id, grams: 200, mealType: 'breakfast', date: today },
        { userId: alice.id, foodId: banana.id, grams: 120, mealType: 'breakfast', date: today },
        { userId: alice.id, foodId: eggs.id, grams: 100, mealType: 'breakfast', date: today },
        { userId: alice.id, foodId: chicken.id, grams: 200, mealType: 'lunch', date: today },
        { userId: alice.id, foodId: rice.id, grams: 150, mealType: 'lunch', date: today },
        { userId: alice.id, foodId: broccoli.id, grams: 100, mealType: 'lunch', date: today },
      ],
    });
    console.log('Created sample food logs for Alice');
  }

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
