import { db } from './src/db.js';
import { users, clubs, clubMembers, challenges, challengeEntries } from './src/schema.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test users table
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users:`);
    console.log(JSON.stringify(allUsers, null, 2));
    
    // Test clubs table
    const allClubs = await db.select().from(clubs);
    console.log(`\nFound ${allClubs.length} clubs:`);
    console.log(JSON.stringify(allClubs, null, 2));
    
    // Test club members table
    const allClubMembers = await db.select().from(clubMembers);
    console.log(`\nFound ${allClubMembers.length} club members:`);
    console.log(JSON.stringify(allClubMembers, null, 2));
    
    console.log('\nDatabase connection test completed successfully!');
  } catch (error) {
    console.error('Error testing database connection:', error);
  }
}

// Run the test
testDatabaseConnection().catch(console.error);
