import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { 
  users, 
  clubs, 
  clubMembers, 
  challenges, 
  challengeEntries,
  challengeStatusEnum,
  challengeDurationEnum
} from './schema';
import type { InferInsertModel } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a Drizzle instance
const db = drizzle(pool);

// Define types for our insert models
type User = InferInsertModel<typeof users>;
type Club = InferInsertModel<typeof clubs>;
type ClubMember = InferInsertModel<typeof clubMembers>;
type Challenge = InferInsertModel<typeof challenges>;
type ChallengeEntry = InferInsertModel<typeof challengeEntries>;

async function seedDatabase() {
  try {
    console.log('🗑️  Deleting all existing data...');
    
    // Delete all data in reverse order of dependencies
    await db.delete(challengeEntries);
    await db.delete(challenges);
    await db.delete(clubMembers);
    await db.delete(clubs);
    await db.delete(users);
    
    console.log('✅ All data deleted successfully');
    
    console.log('🌱 Inserting demo data...');
    
    // Hash password for all users
    const saltRounds = 10;
    const plainPassword = 'password123';
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    
    // Insert demo users with hashed passwords
    const demoUsers: User[] = [
      {
        email: 'john@example.com',
        password: hashedPassword, // Now properly hashed
        firstName: 'John',
        lastName: 'Doe',
        profilePictureUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
      },
      {
        email: 'jane@example.com',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Smith',
        profilePictureUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
      },
      {
        email: 'mike@example.com',
        password: hashedPassword,
        firstName: 'Mike',
        lastName: 'Johnson',
        profilePictureUrl: 'https://randomuser.me/api/portraits/men/3.jpg',
      },
      {
        email: 'sarah@example.com',
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Williams',
        profilePictureUrl: 'https://randomuser.me/api/portraits/women/4.jpg',
      },
    ];
    
    const insertedUsers = await db.insert(users).values(demoUsers).returning();
    console.log(`✅ Inserted ${insertedUsers.length} users with hashed passwords`);
    
    // Insert demo clubs
    const demoClubs: Club[] = [
      {
        name: 'Running Club',
        description: 'A club for running enthusiasts of all levels',
        logoUrl: 'https://placehold.co/400x400?text=Running+Club',
        coverImageUrl: 'https://placehold.co/1200x400?text=Running+Club+Cover',
      },
      {
        name: 'Weightlifting Club',
        description: 'For those who love lifting weights and getting stronger',
        logoUrl: 'https://placehold.co/400x400?text=Weightlifting+Club',
        coverImageUrl: 'https://placehold.co/1200x400?text=Weightlifting+Club+Cover',
      },
      {
        name: 'Yoga Club',
        description: 'Find your inner peace and flexibility',
        logoUrl: 'https://placehold.co/400x400?text=Yoga+Club',
        coverImageUrl: 'https://placehold.co/1200x400?text=Yoga+Club+Cover',
      },
    ];
    
    const insertedClubs = await db.insert(clubs).values(demoClubs).returning();
    console.log(`✅ Inserted ${insertedClubs.length} clubs`);
    
    // Insert club members
    const demoClubMembers: ClubMember[] = [
      // Running Club
      {
        clubId: insertedClubs[0].id,
        userId: insertedUsers[0].id,
        isAdmin: true,
      },
      {
        clubId: insertedClubs[0].id,
        userId: insertedUsers[1].id,
        isAdmin: false,
      },
      {
        clubId: insertedClubs[0].id,
        userId: insertedUsers[2].id,
        isAdmin: false,
      },
      
      // Weightlifting Club
      {
        clubId: insertedClubs[1].id,
        userId: insertedUsers[1].id,
        isAdmin: true,
      },
      {
        clubId: insertedClubs[1].id,
        userId: insertedUsers[2].id,
        isAdmin: false,
      },
      {
        clubId: insertedClubs[1].id,
        userId: insertedUsers[3].id,
        isAdmin: false,
      },
      
      // Yoga Club
      {
        clubId: insertedClubs[2].id,
        userId: insertedUsers[3].id,
        isAdmin: true,
      },
      {
        clubId: insertedClubs[2].id,
        userId: insertedUsers[0].id,
        isAdmin: false,
      },
    ];
    
    const insertedClubMembers = await db.insert(clubMembers).values(demoClubMembers).returning();
    console.log(`✅ Inserted ${insertedClubMembers.length} club members`);
    
    // Get current date for challenge dates
    const today = new Date();
    const oneWeekFromNow = new Date(today);
    oneWeekFromNow.setDate(today.getDate() + 7);
    
    const oneMonthFromNow = new Date(today);
    oneMonthFromNow.setMonth(today.getMonth() + 1);
    
    // Insert demo challenges
    const demoChallenges: Challenge[] = [
      {
        clubId: insertedClubs[0].id, // Running Club
        title: '5K Challenge',
        description: 'Run 5K in the fastest time possible',
        duration: 'weekly',
        status: 'active',
        startDate: today.toISOString().split('T')[0],
        endDate: oneWeekFromNow.toISOString().split('T')[0],
        createdById: insertedUsers[0].id,
        scoreType: 'time',
        scoreUnit: 'minutes',
        isHigherBetter: false,
        topScores: [],
      },
      {
        clubId: insertedClubs[1].id, // Weightlifting Club
        title: 'Bench Press Challenge',
        description: 'Max bench press weight for 5 reps',
        duration: 'weekly',
        status: 'active',
        startDate: today.toISOString().split('T')[0],
        endDate: oneWeekFromNow.toISOString().split('T')[0],
        createdById: insertedUsers[1].id,
        scoreType: 'weight',
        scoreUnit: 'kg',
        isHigherBetter: true,
        topScores: [],
      },
      {
        clubId: insertedClubs[2].id, // Yoga Club
        title: 'Daily Yoga Challenge',
        description: 'Complete a 30-minute yoga session every day for a month',
        duration: 'monthly',
        status: 'active',
        startDate: today.toISOString().split('T')[0],
        endDate: oneMonthFromNow.toISOString().split('T')[0],
        createdById: insertedUsers[3].id,
        scoreType: 'days',
        scoreUnit: 'days',
        isHigherBetter: true,
        topScores: [],
      },
    ];
    
    const insertedChallenges = await db.insert(challenges).values(demoChallenges).returning();
    console.log(`✅ Inserted ${insertedChallenges.length} challenges`);
    
    // Insert demo challenge entries
    const demoChallengeEntries: ChallengeEntry[] = [
      {
        challengeId: insertedChallenges[0].id, // 5K Challenge
        userId: insertedUsers[0].id,
        score: '23.5', // 23.5 minutes
        notes: 'Felt good today, could have pushed harder',
      },
      {
        challengeId: insertedChallenges[0].id, // 5K Challenge
        userId: insertedUsers[1].id,
        score: '22.1', // 22.1 minutes
        notes: 'New personal best!',
      },
      {
        challengeId: insertedChallenges[1].id, // Bench Press Challenge
        userId: insertedUsers[1].id,
        score: '80', // 80 kg
        notes: 'Working on form',
      },
      {
        challengeId: insertedChallenges[1].id, // Bench Press Challenge
        userId: insertedUsers[2].id,
        score: '95', // 95 kg
        notes: 'Feeling strong today',
      },
      {
        challengeId: insertedChallenges[2].id, // Daily Yoga Challenge
        userId: insertedUsers[3].id,
        score: '5', // 5 days completed
        notes: 'Loving the morning routine',
      },
    ];
    
    const insertedChallengeEntries = await db.insert(challengeEntries).values(demoChallengeEntries).returning();
    console.log(`✅ Inserted ${insertedChallengeEntries.length} challenge entries`);
    
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the seed function
seedDatabase();
