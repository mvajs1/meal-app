import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { addFoodLog, getDailySummary, clearLogsForDate } from '@/lib/services/foodLogService';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const date = request.nextUrl.searchParams.get('date');
    if (!date) {
      return NextResponse.json({ error: 'date parameter required' }, { status: 400 });
    }

    const summary = await getDailySummary(user.id, date, user.calorieTarget);
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { foodId, grams, mealType, date } = body;

    if (!foodId || !grams || !mealType || !date) {
      return NextResponse.json({ error: 'foodId, grams, mealType, and date are required' }, { status: 400 });
    }

    const log = await addFoodLog(user.id, foodId, grams, mealType, date);
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const date = request.nextUrl.searchParams.get('date');
    if (!date) {
      return NextResponse.json({ error: 'date parameter required' }, { status: 400 });
    }

    const count = await clearLogsForDate(user.id, date);
    return NextResponse.json({ deleted: count });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
