import prisma from '@/lib/db';
import {
  calculateMacros,
  checkBalanced,
  checkCalorieTarget,
  FoodWithGrams,
} from '@/lib/utils/calculations';
import { filterAllergens, FoodWithAllergens } from '@/lib/utils/validators';
import { parseIngredients } from '@/lib/utils/ingredients';

export interface FoodDTO {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber: number;
  category: string;
  isSystem: boolean;
  createdById: number | null;
  allergens: string[];
  ingredients: string[];
}

const foodInclude = {
  allergens: { include: { allergen: true } },
  ingredients: {
    include: { ingredient: true },
    orderBy: { position: 'asc' as const },
  },
} as const;

type FoodWithRelations = Awaited<ReturnType<typeof prisma.food.findFirstOrThrow>> & {
  allergens: { allergen: { name: string } }[];
  ingredients: { ingredient: { name: string } }[];
};

function toDTO(food: FoodWithRelations): FoodDTO {
  return {
    id: food.id,
    name: food.name,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    sugar: food.sugar,
    fiber: food.fiber,
    category: food.category,
    isSystem: food.isSystem,
    createdById: food.createdById,
    allergens: food.allergens.map((fa) => fa.allergen.name),
    ingredients: food.ingredients.map((fi) => fi.ingredient.name),
  };
}

export async function getAllFoods(): Promise<FoodDTO[]> {
  const foods = await prisma.food.findMany({
    include: foodInclude,
    orderBy: { name: 'asc' },
  });
  return foods.map(toDTO);
}

export async function getAvailableFoods(
  userAllergies: string[] = []
): Promise<FoodWithAllergens[]> {
  const foods = await getAllFoods();
  const mapped: FoodWithAllergens[] = foods.map((f) => ({
    ...f,
    grams: 100,
  }));
  return filterAllergens(mapped, userAllergies);
}

export async function searchFoods(query: string): Promise<FoodDTO[]> {
  const foods = await prisma.food.findMany({
    where: { name: { contains: query } },
    include: foodInclude,
    orderBy: { name: 'asc' },
  });
  return foods.map(toDTO);
}

export async function getFoodById(id: number): Promise<FoodDTO | null> {
  const food = await prisma.food.findUnique({
    where: { id },
    include: foodInclude,
  });
  return food ? toDTO(food) : null;
}

// Internal lookup that returns the raw row + system/createdBy fields used for
// authorization checks in route handlers.
export async function getFoodAuthFields(id: number) {
  return prisma.food.findUnique({
    where: { id },
    select: { id: true, isSystem: true, createdById: true },
  });
}

async function upsertAllergensByName(names: string[]): Promise<number[]> {
  if (names.length === 0) return [];
  const unique = [...new Set(names.map((n) => n.trim().toLowerCase()).filter(Boolean))];
  await Promise.all(
    unique.map((name) =>
      prisma.allergen.upsert({
        where: { name },
        create: { name },
        update: {},
      })
    )
  );
  const rows = await prisma.allergen.findMany({ where: { name: { in: unique } } });
  return rows.map((r) => r.id);
}

async function upsertIngredientsByName(names: string[]): Promise<number[]> {
  if (names.length === 0) return [];
  await Promise.all(
    names.map((name) =>
      prisma.ingredient.upsert({
        where: { name },
        create: { name },
        update: {},
      })
    )
  );
  const rows = await prisma.ingredient.findMany({ where: { name: { in: names } } });
  // Preserve caller order (upsert input order == recipe order).
  const byName = new Map(rows.map((r) => [r.name, r.id]));
  return names.map((n) => byName.get(n)!).filter((v): v is number => v != null);
}

export interface CreateFoodInput {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
  fiber?: number;
  ingredients?: string | string[];
  allergens?: string[];
  category?: string;
  createdById: number;
}

export async function createFood(data: CreateFoodInput): Promise<FoodDTO> {
  const ingredientNames = parseIngredients(data.ingredients);
  const ingredientIds = await upsertIngredientsByName(ingredientNames);
  const allergenIds = await upsertAllergensByName(data.allergens ?? []);

  const created = await prisma.food.create({
    data: {
      name: data.name,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      sugar: data.sugar ?? 0,
      fiber: data.fiber ?? 0,
      category: data.category ?? 'other',
      isSystem: false,
      createdById: data.createdById,
      allergens: { create: allergenIds.map((allergenId) => ({ allergenId })) },
      ingredients: {
        create: ingredientIds.map((ingredientId, position) => ({
          ingredientId,
          position,
        })),
      },
    },
    include: foodInclude,
  });
  return toDTO(created);
}

export interface UpdateFoodInput {
  name?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  sugar?: number;
  fiber?: number;
  ingredients?: string | string[];
  allergens?: string[];
  category?: string;
}

export async function updateFood(id: number, data: UpdateFoodInput): Promise<FoodDTO> {
  const scalarUpdates = {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.calories !== undefined && { calories: data.calories }),
    ...(data.protein !== undefined && { protein: data.protein }),
    ...(data.carbs !== undefined && { carbs: data.carbs }),
    ...(data.fat !== undefined && { fat: data.fat }),
    ...(data.sugar !== undefined && { sugar: data.sugar }),
    ...(data.fiber !== undefined && { fiber: data.fiber }),
    ...(data.category !== undefined && { category: data.category }),
  };

  // Replace join-table rows transactionally when those fields are provided.
  await prisma.$transaction(async (tx) => {
    await tx.food.update({ where: { id }, data: scalarUpdates });

    if (data.allergens !== undefined) {
      const allergenIds = await upsertAllergensByName(data.allergens);
      await tx.foodAllergen.deleteMany({ where: { foodId: id } });
      if (allergenIds.length > 0) {
        await tx.foodAllergen.createMany({
          data: allergenIds.map((allergenId) => ({ foodId: id, allergenId })),
        });
      }
    }

    if (data.ingredients !== undefined) {
      const names = parseIngredients(data.ingredients);
      const ingredientIds = await upsertIngredientsByName(names);
      await tx.foodIngredient.deleteMany({ where: { foodId: id } });
      if (ingredientIds.length > 0) {
        await tx.foodIngredient.createMany({
          data: ingredientIds.map((ingredientId, position) => ({
            foodId: id,
            ingredientId,
            position,
          })),
        });
      }
    }
  });

  const updated = await prisma.food.findUniqueOrThrow({
    where: { id },
    include: foodInclude,
  });
  return toDTO(updated);
}

export async function deleteFood(id: number) {
  const usageCount = await prisma.foodLog.count({ where: { foodId: id } });
  if (usageCount > 0) {
    throw new Error(`Cannot delete: this food is used in ${usageCount} log(s)`);
  }
  return prisma.food.delete({ where: { id } });
}

export async function getAllergenList() {
  const allergens = await prisma.allergen.findMany({
    orderBy: { name: 'asc' },
    include: {
      foods: {
        include: { food: { select: { id: true, name: true } } },
        orderBy: { food: { name: 'asc' } },
      },
    },
  });

  return allergens
    .filter((a) => a.foods.length > 0)
    .map((a) => ({
      allergen: a.name,
      foods: a.foods.map((fa) => ({ id: fa.food.id, name: fa.food.name })),
    }));
}

export function analyzeMeal(foods: FoodWithGrams[]) {
  const macros = calculateMacros(foods);
  const balanced = checkBalanced(foods);
  return { macros, balanced };
}

export function analyzeDay(meals: FoodWithGrams[][], calorieTarget: number) {
  const allFoods = meals.flat();
  const macros = calculateMacros(allFoods);
  const balanced = checkBalanced(allFoods);
  const calorieCheck = checkCalorieTarget(macros.totalCalories, calorieTarget);
  return { macros, balanced, calorieCheck };
}
