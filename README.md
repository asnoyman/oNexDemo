# Drizzle PostgreSQL Database Example

This is a skeleton project for using Drizzle ORM with PostgreSQL.

## Quick Start

```bash
# 1. Start PostgreSQL service (if not already running)
brew services start postgresql@16

# 2. Install dependencies
npm install

# 3. Initialize the database (creates the oNex database and tables)
npm run init-db

# 4. Open Drizzle Studio to manage your database
npm run db:studio
```

## Detailed Setup Instructions

1. Install PostgreSQL (if not already installed)
   ```bash
   brew install postgresql@16
   ```

2. Start PostgreSQL service
   ```bash
   brew services start postgresql@16
   ```

3. Install dependencies
   ```bash
   npm install
   ```

4. The project is configured to use your system username to connect to PostgreSQL without a password. If you need to use different credentials, update the `.env` file:
   ```
   DATABASE_URL=postgres://your_username:your_password@localhost:5432/oNex
   ```

5. Initialize the database (this creates the oNex database and tables)
   ```bash
   npm run init-db
   ```

6. After making schema changes, you can generate migrations
   ```bash
   npm run db:generate
   ```

7. Push schema changes to the database
   ```bash
   npm run db:push
   ```

8. Open Drizzle Studio to manage your database
   ```bash
   npm run db:studio
   ```

## Project Structure

- `src/schema.js` - Database schema definition
- `src/db.js` - Database connection setup
- `init-db.js` - Database initialization script
- `drizzle.config.js` - Drizzle configuration
- `drizzle/migrations/` - Generated migrations

## Modifying the Schema

1. Edit the schema in `src/schema.js`
2. Push changes to the database:
   ```bash
   npm run db:push
   ```
3. Generate migrations (optional):
   ```bash
   npm run db:generate
   ```

## Troubleshooting

- **Connection Issues**: Make sure PostgreSQL is running (`brew services list`)
- **Role Errors**: Ensure your PostgreSQL username matches your system username or update the `.env` file
- **Database Not Found**: Run `npm run init-db` to create the database

## Notes

This project uses PostgreSQL as the database. Make sure to update the credentials in the .env file to match your PostgreSQL setup.
