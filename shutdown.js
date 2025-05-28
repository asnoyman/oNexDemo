#!/usr/bin/env node

/**
 * Shutdown script for the oNex platform
 * This script stops all running services for the platform
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Log timestamp
const timestamp = new Date().toISOString();
console.log(`\n--- Shutting down oNex platform at ${timestamp} ---\n`);

// Function to check if a process is running
function isProcessRunning(pid) {
  try {
    // The 'ps -p' command will throw an error if the process doesn't exist
    execSync(`ps -p ${pid}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to kill a process
function killProcess(pid) {
  try {
    console.log(`Stopping process with PID: ${pid}`);
    process.kill(pid, 'SIGTERM');
    
    // Give the process a moment to terminate gracefully
    setTimeout(() => {
      if (isProcessRunning(pid)) {
        console.log(`Process ${pid} did not terminate gracefully, forcing...`);
        process.kill(pid, 'SIGKILL');
      }
    }, 3000);
    
    return true;
  } catch (error) {
    console.error(`Failed to kill process ${pid}:`, error.message);
    return false;
  }
}

// Check for server PID file
const serverPidPath = join(__dirname, '.server.pid');
if (fs.existsSync(serverPidPath)) {
  const serverPid = parseInt(fs.readFileSync(serverPidPath, 'utf8').trim());
  
  if (isProcessRunning(serverPid)) {
    if (killProcess(serverPid)) {
      console.log(`GraphQL server (PID: ${serverPid}) stopped successfully.`);
    }
  } else {
    console.log(`GraphQL server (PID: ${serverPid}) is not running.`);
  }
  
  // Remove the PID file
  fs.unlinkSync(serverPidPath);
} else {
  console.log('No server PID file found. Server may not be running.');
}

// Also check for any other Node.js processes running on port 4000
try {
  const output = execSync('lsof -i :4000 | grep LISTEN').toString();
  const matches = output.match(/node\s+(\d+)/g);
  
  if (matches && matches.length > 0) {
    matches.forEach(match => {
      const pid = match.split(/\s+/)[1];
      if (pid) {
        console.log(`Found additional server process on port 4000 with PID: ${pid}`);
        if (killProcess(parseInt(pid))) {
          console.log(`Additional server process (PID: ${pid}) stopped successfully.`);
        }
      }
    });
  }
} catch (error) {
  // No processes found on port 4000, which is fine
}

console.log('\n--- Shutdown complete ---');
