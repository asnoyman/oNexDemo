import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import type { InferInsertModel } from 'drizzle-orm';
import { users } from './db/schema';
  
const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  const user: InferInsertModel<typeof users> = {
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'securepassword', // In a real app, this would be hashed
  };

  await db.insert(users).values(user);
  console.log('New user created!')

  const allUsers = await db.select().from(users);
  console.log('Getting all users from the database: ', allUsers)

  await db
    .update(users)
    .set({
      firstName: 'John Updated'
    })
    .where(eq(users.email, user.email));
  console.log('User info updated!')

  await db.delete(users).where(eq(users.email, user.email));
  console.log('User deleted!')
}

main();
