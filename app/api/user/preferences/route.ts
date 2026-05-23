import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({
      preferences: {
        calorieTarget: user.calorieTarget,
        goal: user.goal,
        allergies: user.allergies,
        unitSystem: user.unitSystem,
        locale: user.locale,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { calorieTarget, goal, allergies, unitSystem, locale } = body;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          ...(calorieTarget !== undefined && { calorieTarget }),
          ...(goal !== undefined && { goal }),
          ...(unitSystem !== undefined && { unitSystem }),
          ...(locale !== undefined && { locale }),
        },
      });

      if (Array.isArray(allergies)) {
        const names = [
          ...new Set(
            allergies
              .filter((v): v is string => typeof v === 'string')
              .map((n) => n.trim().toLowerCase())
              .filter(Boolean)
          ),
        ];

        await Promise.all(
          names.map((name) =>
            tx.allergen.upsert({ where: { name }, create: { name }, update: {} })
          )
        );
        const rows = await tx.allergen.findMany({
          where: { name: { in: names } },
        });

        await tx.userAllergen.deleteMany({ where: { userId: user.id } });
        if (rows.length > 0) {
          await tx.userAllergen.createMany({
            data: rows.map((a) => ({ userId: user.id, allergenId: a.id })),
          });
        }
      }
    });

    const updated = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        calorieTarget: true,
        goal: true,
        unitSystem: true,
        locale: true,
        allergies: { select: { allergen: { select: { name: true } } } },
      },
    });

    return NextResponse.json({
      preferences: {
        calorieTarget: updated.calorieTarget,
        goal: updated.goal,
        unitSystem: updated.unitSystem,
        locale: updated.locale,
        allergies: updated.allergies.map((ua) => ua.allergen.name),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
