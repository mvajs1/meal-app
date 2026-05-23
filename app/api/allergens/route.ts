import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAllergenList } from '@/lib/services/nutritionService';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const allergens = await getAllergenList();
    return NextResponse.json({ allergens });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
