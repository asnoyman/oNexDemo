import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.js",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://adam_snoyman@localhost:5432/oNex"
  }
});
