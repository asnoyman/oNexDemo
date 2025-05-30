import { pgTable, serial, varchar, text, integer, timestamp, boolean, pgEnum, date, json, unique } from "drizzle-orm/pg-core";

// Enums
export const challengeStatusEnum = pgEnum('challengeStatus', ['active', 'completed', 'archived']);
export const challengeDurationEnum = pgEnum('challengeDuration', ['daily', 'weekly', 'monthly']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  password: varchar("password", { length: 256 }).notNull(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  profilePictureUrl: varchar("profilePictureUrl", { length: 512 }),  // External image URL
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const clubs = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  isPrivate: boolean("isPrivate").default(false),
  logoUrl: varchar("logoUrl", { length: 512 }),  // External logo image URL
  coverImageUrl: varchar("coverImageUrl", { length: 512 }),  // External cover image URL
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const clubMembers = pgTable("clubMembers", {
  id: serial("id").primaryKey(),
  clubId: integer("clubId").references(() => clubs.id).notNull(),
  userId: integer("userId").references(() => users.id).notNull(),
  isAdmin: boolean("isAdmin").default(false),  // Admin privileges for the club
  joinedAt: timestamp("joinedAt").defaultNow(),
}, (table) => {
  return {
    unq: unique().on(table.clubId, table.userId),
  };
});

export const clubInvitations = pgTable("clubInvitations", {
  id: serial("id").primaryKey(),
  clubId: integer("clubId").references(() => clubs.id).notNull(),
  userId: integer("userId").references(() => users.id).notNull(),
  invitedBy: integer("invitedBy").references(() => users.id).notNull(), // User ID who sent the invitation
  invitedAt: timestamp("invitedAt").defaultNow(),
  accepted: boolean("accepted").default(false),
  acceptedAt: timestamp("acceptedAt"),
}, (table) => {
  return {
    unq: unique().on(table.clubId, table.userId),
  };
});

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  clubId: integer("clubId").references(() => clubs.id).notNull(),  // Parent club ID
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description").notNull(),
  duration: challengeDurationEnum("duration").notNull(),  // Challenge timeframe
  status: challengeStatusEnum("status").default('active'),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  createdById: integer("createdById").references(() => users.id).notNull(),
  scoreType: varchar("scoreType", { length: 50 }).notNull(),  // Type of measurement (time, reps, weight, etc.)
  scoreUnit: varchar("scoreUnit", { length: 20 }),  // Unit of measurement (seconds, kg, km, etc.)
  isHigherBetter: boolean("isHigherBetter").default(true),  // Whether higher scores are better
  topScores: json("topScores").default([]),  // Top scores stored as JSON array
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const challengeEntries = pgTable("challengeEntries", {
  id: serial("id").primaryKey(),
  challengeId: integer("challengeId").references(() => challenges.id).notNull(),
  userId: integer("userId").references(() => users.id).notNull(),
  score: varchar("score", { length: 100 }).notNull(),  // Could be time, reps, weight, etc.
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});
