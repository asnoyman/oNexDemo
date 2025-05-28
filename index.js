import dotenv from 'dotenv';
import { db } from './src/db.js';
import * as schema from './src/schema.js';

// Load environment variables
dotenv.config();

// Simple function to test database connection
async function testDbConnection() {
  try {
    // Try to query users table
    const users = await db.select().from(schema.users);
    console.log(`Database connection successful. Found ${users.length} users.`);
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

// Main function
async function main() {
  console.log('Testing database connection...');
  const connected = await testDbConnection();
  
  if (connected) {
    console.log('Drizzle DB is working properly!');
    console.log('Available schema tables:');
    console.log('- users');
    console.log('- clubs');
    console.log('- clubMembers');
    console.log('- challenges');
    console.log('- challengeEntries');
  } else {
    console.log('Failed to connect to the database. Please check your configuration.');
  }
}

// Run the main function
main().catch(console.error);
