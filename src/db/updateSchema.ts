import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './db';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Function to run a command and log output
async function runCommand(command: string) {
  console.log(`Running: ${command}`);
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error: any) {
    console.error(`Error executing command: ${error.message}`);
    throw error;
  }
}

async function updateSchema() {
  try {
    // Step 1: Generate migration
    console.log('Generating migration...');
    await runCommand('npx drizzle-kit generate --config=./drizzle.config.ts');
    
    // Step 2: Apply migration
    await runCommand('npx drizzle-kit up --config=./drizzle.config.ts');

    // Step 3: Push schema
    console.log('Pushing schema...');
    await runCommand('npx drizzle-kit push --config=./drizzle.config.ts --force');
    
    // Step 4: Launch Drizzle Studio
    console.log('\nTo view your updated schema in Drizzle Studio, run:');
    console.log('npx drizzle-kit studio');
    
    console.log('\nSchema update completed successfully!');
  } catch (error) {
    console.error('Schema update failed:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the update process
updateSchema();
