import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import * as schema from "./schema.js";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgres://${process.env.USER}@localhost:5432/oNex`,
});

export const db = drizzle(pool, { schema });
