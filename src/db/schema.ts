import {
  pgTable,
  text,
  integer,
  bigserial,
  boolean,
  timestamp,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import type { Clue } from "../lib/engine";

/* ---------------------------------------------------------------------------
 * better-auth core tables (must match better-auth's expected field names).
 * JS property keys are the field names better-auth looks for; DB column names
 * are snake_case.
 * ------------------------------------------------------------------------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------------------------------------------------------------------------
 * Nuance game tables
 * ------------------------------------------------------------------------- */

// Server-authoritative game state — one row per subject (signed-in user or
// anonymous cookie) per puzzle day. The secret recipe never lives here; only
// the player's own guesses and the clues the server graded them with.
export const playSession = pgTable(
  "play_session",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    subjectType: text("subject_type").notNull(), // 'user' | 'anon'
    subjectId: text("subject_id").notNull(),
    day: integer("day").notNull(),
    guesses: jsonb("guesses").$type<string[][]>().notNull().default([]),
    clues: jsonb("clues").$type<Clue[][]>().notNull().default([]),
    matchPercents: jsonb("match_percents").$type<number[]>().notNull().default([]),
    status: text("status").notNull().default("composing"), // 'composing' | 'won' | 'lost'
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [unique().on(t.subjectType, t.subjectId, t.day)],
);

// Aggregate competitive stats per signed-in user, updated transactionally when
// today's puzzle is completed. avg score = totalScore / gamesPlayed (lower is
// better; a loss contributes 7, one worse than the 6-guess max).
export const userStats = pgTable("user_stats", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  gamesPlayed: integer("games_played").notNull().default(0),
  gamesWon: integer("games_won").notNull().default(0),
  totalScore: integer("total_score").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  maxStreak: integer("max_streak").notNull().default(0),
  lastPlayDay: integer("last_play_day"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PlaySession = typeof playSession.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;
