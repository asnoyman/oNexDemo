import { db } from './src/db.js';
import { users, clubs, clubMembers, challenges, challengeEntries, challengeStatusEnum, challengeDurationEnum } from './src/schema.js';
import pkg from 'pg';
import { sql } from 'drizzle-orm';
// Simple password hashing function for demo purposes
const hashPassword = async (password) => {
  // In a real application, you would use a proper hashing library
  // This is just a placeholder since we removed bcryptjs
  return `hashed_${password}`;
};
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Client } = pkg;

// Function to create database if it doesn't exist
async function createDatabaseIfNotExists() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: process.env.USER,    
    password: '',             
    database: 'postgres'      
  });

  try {
    await client.connect();
    
    // Check if our database exists
    const result = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = 'oNex'
    `);
    
    // If database doesn't exist, create it
    if (result.rows.length === 0) {
      console.log('Creating database "oNex"...');
      await client.query('CREATE DATABASE "oNex"');
      console.log('Database created successfully!');
    } else {
      console.log('Database "oNex" already exists.');
    }
  } catch (error) {
    console.error('Error creating database:', error);
  } finally {
    await client.end();
  }
}

// Main function to initialize database and tables
async function initDb() {
  try {
    // First create the database if it doesn't exist
    await createDatabaseIfNotExists();
    
    console.log('Initializing database schema...');
    
    // Create dummy data for all tables if they're empty
    // 1. Create users if none exist
    let testUsers = [];
    if ((await db.select().from(users)).length === 0) {
      console.log('Creating test users...');
      
      // Hash passwords for security
      const hashedPassword1 = await hashPassword('password123');
      const hashedPassword2 = await hashPassword('admin123');
      
      testUsers = await db.insert(users).values([
        {
          email: 'john@example.com',
          password: hashedPassword1,
          firstName: 'John',
          lastName: 'Doe',
          profilePictureUrl: 'https://randomuser.me/api/portraits/men/1.jpg'
        },
        {
          email: 'jane@example.com',
          password: hashedPassword1,
          firstName: 'Jane',
          lastName: 'Smith',
          profilePictureUrl: 'https://randomuser.me/api/portraits/women/1.jpg'
        },
        {
          email: 'admin@example.com',
          password: hashedPassword2,
          firstName: 'Admin',
          lastName: 'User',
          profilePictureUrl: 'https://randomuser.me/api/portraits/men/2.jpg'
        }
      ]).returning();
      console.log(`Created ${testUsers.length} test users with hashed passwords`);
    } else {
      testUsers = await db.select().from(users);
      console.log(`Found ${testUsers.length} existing users`);
    }
    
    // 2. Create clubs if none exist
    let testClubs = [];
    if ((await db.select().from(clubs)).length === 0) {
      console.log('Creating test clubs...');
      testClubs = await db.insert(clubs).values([
        {
          name: 'Fitness First',
          description: 'A premier fitness club with state-of-the-art equipment',
          logoUrl: 'https://placehold.co/400x400?text=Fitness+First',
          coverImageUrl: 'https://placehold.co/1200x400?text=Fitness+First+Cover'
        },
        {
          name: 'CrossFit Heroes',
          description: 'Intense workouts for serious fitness enthusiasts',
          logoUrl: 'https://placehold.co/400x400?text=CrossFit+Heroes',
          coverImageUrl: 'https://placehold.co/1200x400?text=CrossFit+Heroes+Cover'
        },
        {
          name: 'Yoga Zen',
          description: 'Find your inner peace through yoga and meditation',
          logoUrl: 'https://placehold.co/400x400?text=Yoga+Zen',
          coverImageUrl: 'https://placehold.co/1200x400?text=Yoga+Zen+Cover'
        }
      ]).returning();
      console.log(`Created ${testClubs.length} test clubs`);
    } else {
      testClubs = await db.select().from(clubs);
      console.log(`Found ${testClubs.length} existing clubs`);
    }
    
    // 3. Create club members if none exist
    if ((await db.select().from(clubMembers)).length === 0 && testUsers.length > 0 && testClubs.length > 0) {
      console.log('Creating test club memberships...');
      // Make the first user an admin of the first club
      const memberships = await db.insert(clubMembers).values([
        {
          clubId: testClubs[0].id,
          userId: testUsers[0].id,
          isAdmin: true
        },
        {
          clubId: testClubs[0].id,
          userId: testUsers[1].id,
          isAdmin: false
        },
        {
          clubId: testClubs[1].id,
          userId: testUsers[0].id,
          isAdmin: false
        },
        {
          clubId: testClubs[1].id,
          userId: testUsers[2].id,
          isAdmin: true
        },
        {
          clubId: testClubs[2].id,
          userId: testUsers[1].id,
          isAdmin: true
        }
      ]).returning();
      console.log(`Created ${memberships.length} club memberships`);
    }
    
    // 4. Create challenges if none exist
    let testChallenges = [];
    if ((await db.select().from(challenges)).length === 0 && testUsers.length > 0 && testClubs.length > 0) {
      console.log('Creating test challenges...');
      // Get admin users for each club
      const admins = await db.select().from(clubMembers).where(sql`is_admin = true`);
      
      if (admins.length > 0) {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const nextMonth = new Date(today);
        nextMonth.setDate(today.getDate() + 30);
        
        testChallenges = await db.insert(challenges).values([
          {
            clubId: testClubs[0].id,
            title: 'Max Push-ups in 1 Minute',
            description: 'Do as many push-ups as you can in 60 seconds!',
            duration: 'daily',
            status: 'active',
            startDate: today,
            endDate: nextWeek,
            createdById: admins[0].userId,
            scoreType: 'reps',
            scoreUnit: 'count',
            isHigherBetter: true,
            topScores: JSON.stringify([])
          },
          {
            clubId: testClubs[0].id,
            title: '5K Run Challenge',
            description: 'Complete a 5K run in the shortest time possible',
            duration: 'weekly',
            status: 'active',
            startDate: today,
            endDate: nextMonth,
            createdById: admins[0].userId,
            scoreType: 'time',
            scoreUnit: 'minutes',
            isHigherBetter: false,
            topScores: JSON.stringify([])
          },
          {
            clubId: testClubs[1].id,
            title: 'CrossFit WOD',
            description: 'Complete the workout of the day as fast as possible',
            duration: 'daily',
            status: 'active',
            startDate: today,
            endDate: nextWeek,
            createdById: admins[1].userId,
            scoreType: 'time',
            scoreUnit: 'minutes',
            isHigherBetter: false,
            topScores: JSON.stringify([])
          }
        ]).returning();
        console.log(`Created ${testChallenges.length} test challenges`);
      }
    } else {
      testChallenges = await db.select().from(challenges);
      console.log(`Found ${testChallenges.length} existing challenges`);
    }
    
    // 5. Create challenge entries if none exist
    if ((await db.select().from(challengeEntries)).length === 0 && testChallenges.length > 0 && testUsers.length > 0) {
      console.log('Creating test challenge entries...');
      
      const entries = await db.insert(challengeEntries).values([
        {
          challengeId: testChallenges[0].id,
          userId: testUsers[0].id,
          score: '42',
          notes: 'Personal best!'
        },
        {
          challengeId: testChallenges[0].id,
          userId: testUsers[1].id,
          score: '35',
          notes: 'Getting better!'
        },
        {
          challengeId: testChallenges[1].id,
          userId: testUsers[0].id,
          score: '23.5',
          notes: 'Tough run today'
        },
        {
          challengeId: testChallenges[2].id,
          userId: testUsers[2].id,
          score: '15.2',
          notes: 'Crushed it!'
        }
      ]).returning();
      console.log(`Created ${entries.length} challenge entries`);
      
      // Update top scores for each challenge
      for (const challenge of testChallenges) {
        const entries = await db.select().from(challengeEntries).where(sql`challenge_id = ${challenge.id}`);
        
        if (entries.length > 0) {
          // Sort entries by score (considering if higher is better)
          const sortedEntries = [...entries].sort((a, b) => {
            const scoreA = parseFloat(a.score);
            const scoreB = parseFloat(b.score);
            return challenge.isHigherBetter ? scoreB - scoreA : scoreA - scoreB;
          });
          
          // Take top 3 entries
          const topEntries = sortedEntries.slice(0, 3);
          
          // Get user details for each entry
          const topScores = await Promise.all(topEntries.map(async (entry) => {
            const user = await db.select().from(users).where(sql`id = ${entry.userId}`).limit(1);
            return {
              userId: entry.userId,
              userName: `${user[0].firstName} ${user[0].lastName}`,
              score: entry.score,
              date: entry.createdAt
            };
          }));
          
          // Update challenge with top scores
          await db.update(challenges)
            .set({ topScores: JSON.stringify(topScores) })
            .where(sql`id = ${challenge.id}`);
          
          console.log(`Updated top scores for challenge: ${challenge.title}`);
        }
      }
    }
    
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Run the initialization
initDb().catch(console.error);
