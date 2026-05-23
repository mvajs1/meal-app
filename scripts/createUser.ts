import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log('Usage: npx tsx scripts/createUser.ts <email> <password> <name>');
    console.log('Example: npx tsx scripts/createUser.ts john@example.com mypassword John');
    process.exit(1);
  }

  const [email, password, name] = args;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });
    console.log(`Created user: ${user.email} (id: ${user.id})`);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('Unique constraint')) {
      console.error(`Error: User with email "${email}" already exists`);
    } else {
      throw e;
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
