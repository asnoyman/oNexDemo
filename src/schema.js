import { pgTable, serial, varchar, text, integer, timestamp, boolean, pgEnum, date, json, unique } from "drizzle-orm/pg-core";

// Enums
export const challengeStatusEnum = pgEnum('challenge_status', ['active', 'completed', 'archived']);
export const challengeDurationEnum = pgEnum('challenge_duration', ['daily', 'weekly', 'monthly']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  password: varchar("password", { length: 256 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  profilePictureUrl: varchar("profile_picture_url", { length: 512 }),  // URL to image stored elsewhere
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clubs = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  logoUrl: varchar("logo_url", { length: 512 }),  // URL to image stored elsewhere
  coverImageUrl: varchar("cover_image_url", { length: 512 }),  // URL to image stored elsewhere
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clubMembers = pgTable("club_members", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").references(() => clubs.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  isAdmin: boolean("is_admin").default(false),  // Club admins can create challenges
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => {
  return {
    unq: unique().on(table.clubId, table.userId),
  };
});

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").references(() => clubs.id).notNull(),  // Challenge belongs to a club
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description").notNull(),
  duration: challengeDurationEnum("duration").notNull(),  // daily, weekly, monthly
  status: challengeStatusEnum("status").default('active'),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  createdById: integer("created_by_id").references(() => users.id).notNull(),  // Admin who created it
  scoreType: varchar("score_type", { length: 50 }).notNull(),  // e.g., "time", "reps", "weight", "distance"
  scoreUnit: varchar("score_unit", { length: 20 }),  // e.g., "seconds", "kg", "km"
  isHigherBetter: boolean("is_higher_better").default(true),  // True if higher score is better (e.g., reps), false if lower is better (e.g., time)
  topScores: json("top_scores").default([]),  // Store top 3 scores as JSON array
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const challengeEntries = pgTable("challenge_entries", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").references(() => challenges.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  score: varchar("score", { length: 100 }).notNull(),  // Could be time, reps, weight, etc.
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
