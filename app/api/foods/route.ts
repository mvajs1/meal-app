import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getAvailableFoods,
  searchFoods,
  createFood,
} from '@/lib/services/nutritionService';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (query) {
      const foods = await searchFoods(query);
      return NextResponse.json(foods);
    }

    const userAllergies = user.allergies;
    const foods = await getAvailableFoods(userAllergies);
    return NextResponse.json(foods);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const food = await createFood({
      name: body.name,
      calories: body.calories,
      protein: body.protein,
      carbs: body.carbs,
      fat: body.fat,
      sugar: body.sugar,
      fiber: body.fiber,
      ingredients: body.ingredients,
      allergens: body.allergens,
      category: body.category,
      createdById: user.id,
    });

    return NextResponse.json(food, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
