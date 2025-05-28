# oNex

A fitness challenge platform for clubs and communities.

## Database Setup and Management

This project uses PostgreSQL with Drizzle ORM for database management. Follow these steps to set up and manage your database.

### Prerequisites

- [PostgreSQL](https://www.postgresql.org/download/) installed on your machine
- Node.js and npm installed

### Setting Up PostgreSQL

1. **Start PostgreSQL Service**

   On macOS:
   ```bash
   brew services start postgresql
   ```

2. **Configure Database Connection**

   The database connection is configured in the `.env` file. Make sure it contains:
   ```
   DATABASE_URL=postgres://username@localhost:5432/oNex
   JWT_SECRET=your_jwt_secret_key
   ```
   
   Replace `username` with your PostgreSQL username and set a secure JWT secret for authentication.


### Updating the Database Schema

Whenever changes are made to the database schema in `src/db/schema.ts`, you need to update the database:

1. **Run the Update Schema Script**

   ```bash
   npm run db:update
   ```

   This script:
   - Generates a migration for your schema changes
   - Applies the migration to your database
   - Pushes the schema to ensure synchronization

### Seeding the Database

To populate the database with demo data:

1. **Run the Seed Script**

   ```bash
   npm run db:seed
   ```

   This script:
   - Deletes all existing data from the database
   - Inserts demo users, clubs, challenges, and entries
   - Establishes relationships between these entities

## Running the GraphQL Server

The project includes a GraphQL API built with Apollo Server and Express.

### Starting the Server

1. **Development Mode**

   Run the server with hot-reloading:
   ```bash
   npm run dev
   ```

2. **Production Mode**

   Run the server in production mode:
   ```bash
   npm start
   ```

3. **Accessing GraphQL Playground**

   Once the server is running, you can access the GraphQL Playground at:
   ```
   http://localhost:4000/graphql
   ```
   
   This interactive environment allows you to explore and test the API.

### Available GraphQL Operations

- **Queries**:
  - `users`: Get all users
  - `user(id: Int!)`: Get user by ID
  - `userByEmail(email: String!)`: Get user by email
  - `me`: Get the currently authenticated user

- **Mutations**:
  - `createUser`: Register a new user
  - `login`: Authenticate a user
  - `logout`: Log out the current user
  - `updateUser`: Update user information
  - `deleteUser`: Delete a user

### Stopping PostgreSQL

When you're done working with the database:

```bash
brew services stop postgresql
```

## Project Structure

- `src/db/schema.ts` - Database schema definition
- `src/db/seed-db.ts` - Script to seed the database with demo data
- `src/graphql/types/` - GraphQL type definitions
- `src/graphql/resolvers/` - GraphQL resolvers
- `src/middleware/` - Express middleware including authentication
- `src/server.ts` - Main server entry point
- `drizzle/` - Contains generated SQL migration files
- `drizzle.config.ts` - Drizzle configuration
- `.env` - Environment variables including database connection string
