#!/usr/bin/env node

/**
 * Startup script for the oNex platform
 * This script starts all necessary services for the platform
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create log files
const serverLogStream = fs.createWriteStream(join(logsDir, 'server.log'), { flags: 'a' });
const errorLogStream = fs.createWriteStream(join(logsDir, 'error.log'), { flags: 'a' });

// Log timestamp
const timestamp = new Date().toISOString();
serverLogStream.write(`\n\n--- Server started at ${timestamp} ---\n`);
errorLogStream.write(`\n\n--- Server started at ${timestamp} ---\n`);

// Start the GraphQL server
console.log('Starting oNex GraphQL server...');
const server = spawn('node', ['src/index.js'], {
  cwd: __dirname,
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe']
});

// Handle server output
server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  serverLogStream.write(output);
});

server.stderr.on('data', (data) => {
  const error = data.toString();
  console.error('Server error:', error);
  errorLogStream.write(error);
});

// Handle server exit
server.on('exit', (code) => {
  const exitMessage = `Server process exited with code ${code}`;
  console.log(exitMessage);
  serverLogStream.write(`${exitMessage}\n`);
  
  // Close log streams
  serverLogStream.end();
  errorLogStream.end();
});

// Save the process ID to a file for the shutdown script
fs.writeFileSync(join(__dirname, '.server.pid'), server.pid.toString());

console.log(`oNex server started with PID: ${server.pid}`);
console.log('Server is running at http://localhost:4000/graphql');
console.log('Press Ctrl+C to stop the server or run "node shutdown.js"');
