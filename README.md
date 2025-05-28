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

### Stopping PostgreSQL

When you're done working with the database:

```bash
brew services stop postgresql
```

## Running Tests

The project includes comprehensive tests for all functionality. Tests are written using Jest and are located in the `src/tests` directory.

### Running All Tests

To run all tests in the project:

```bash
npm test
```

### Running Specific Test Files

To run tests for a specific component or feature:

```bash
npm test <test-file-or-directory>
```

Examples:

```bash
# Run all club-related tests
npm test club_test

# Run only club member tests
npm test club_test/club-member.test.ts
```

### Test Coverage

To generate a basic test coverage report:

```bash
npm test -- --coverage
```

This will create a report showing which parts of your code are covered by tests.

### Detailed Coverage Reports

For a more detailed coverage report with HTML output that you can view in a browser:

```bash
npm test -- --coverage --coverageReporters="html"
```

This will generate an HTML report in the `coverage/lcov-report` directory. Open `index.html` in this directory to view a detailed breakdown of coverage by file, including line-by-line highlighting of covered and uncovered code.

You can also specify multiple reporter formats:

```bash
npm test -- --coverage --coverageReporters="text" --coverageReporters="html" --coverageReporters="lcov"
```

### Focusing Coverage on Specific Directories

To focus coverage analysis on specific parts of your codebase:

```bash
npm test -- --coverage --collectCoverageFrom="src/graphql/resolvers/**/*.ts"
```

This example will only collect coverage information for TypeScript files in the resolvers directory.