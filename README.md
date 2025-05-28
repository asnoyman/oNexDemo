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
   ```

2. **Configure Database Connection**

   The database connection is configured in the `.env` file. Make sure it contains:
   ```
   DATABASE_URL=postgres://username@localhost:5432/oNex
   ```
   
   Replace `username` with your PostgreSQL username.


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

### Stopping PostgreSQL

When you're done working with the database:

```bash
brew services stop postgresql
```


## Project Structure

- `src/db/schema.ts` - Database schema definition
- `src/db/seed-db.ts` - Script to seed the database with demo data
- `drizzle/` - Contains generated SQL migration files
- `drizzle.config.ts` - Drizzle configuration
- `.env` - Environment variables including database connection string
