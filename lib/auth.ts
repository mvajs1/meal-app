import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SESSION_COOKIE = 'session_token';
const SECRET = process.env.SESSION_SECRET || 'carvedrock-dev-secret-change-in-prod';

function createToken(userId: number): string {
  const payload = `${userId}.${Date.now()}`;
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, timestamp, sig] = parts;
  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(`${userId}.${timestamp}`)
    .digest('hex');
  if (sig !== expected) return null;
  return parseInt(userId, 10);
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  const token = createToken(user.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return { id: user.id, email: user.email, name: user.name };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export interface CurrentUser {
  id: number;
  email: string;
  name: string;
  calorieTarget: number;
  goal: string;
  allergies: string[];
  unitSystem: string;
  locale: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = verifyToken(token);
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      calorieTarget: true,
      goal: true,
      unitSystem: true,
      locale: true,
      allergies: { select: { allergen: { select: { name: true } } } },
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    calorieTarget: user.calorieTarget,
    goal: user.goal,
    unitSystem: user.unitSystem,
    locale: user.locale,
    allergies: user.allergies.map((ua) => ua.allergen.name),
  };
}
