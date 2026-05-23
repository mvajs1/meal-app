import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getFoodById,
  getFoodAuthFields,
  updateFood,
  deleteFood,
} from '@/lib/services/nutritionService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const food = await getFoodById(Number(id));

    if (!food) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }

    return NextResponse.json({ food });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await getFoodAuthFields(Number(id));

    if (!existing) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }

    if (existing.isSystem) {
      return NextResponse.json(
        { error: 'System foods cannot be edited' },
        { status: 403 }
      );
    }

    if (existing.createdById !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit foods you created' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updated = await updateFood(Number(id), {
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
    });

    return NextResponse.json({ food: updated });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await getFoodAuthFields(Number(id));

    if (!existing) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }

    if (existing.isSystem) {
      return NextResponse.json(
        { error: 'System foods cannot be deleted' },
        { status: 403 }
      );
    }

    if (existing.createdById !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete foods you created' },
        { status: 403 }
      );
    }

    await deleteFood(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('Cannot delete') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
