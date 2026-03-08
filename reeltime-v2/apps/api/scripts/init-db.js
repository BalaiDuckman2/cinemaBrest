#!/usr/bin/env node
// Initialize SQLite database by executing Prisma schema.
// Uses the Prisma internals to push schema without requiring the CLI.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dbUrl = process.env.DATABASE_URL || 'file:/app/data/reeltime.db';
const dbPath = dbUrl.replace('file:', '');

// Ensure the directory exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// If db file doesn't exist, create it
if (!fs.existsSync(dbPath)) {
  console.log(`Creating new database at ${dbPath}`);
  fs.writeFileSync(dbPath, '');
}

// Create tables using raw SQL (generated from Prisma schema)
const Database = (() => {
  try { return require('better-sqlite3'); } catch { return null; }
})();

if (Database) {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  const tables = [
    `CREATE TABLE IF NOT EXISTS "cinemas" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "allocine_id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "address" TEXT,
      "city" TEXT NOT NULL,
      "latitude" REAL,
      "longitude" REAL,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "cinemas_allocine_id_key" ON "cinemas"("allocine_id")`,

    `CREATE TABLE IF NOT EXISTS "films" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "allocine_id" INTEGER NOT NULL,
      "title" TEXT NOT NULL,
      "year" INTEGER,
      "poster_url" TEXT,
      "synopsis" TEXT,
      "cast" TEXT NOT NULL DEFAULT '[]',
      "director" TEXT,
      "rating" REAL,
      "production_year" INTEGER,
      "release_date" DATETIME,
      "runtime" INTEGER,
      "genres" TEXT NOT NULL DEFAULT '[]',
      "film_age" INTEGER,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "films_allocine_id_key" ON "films"("allocine_id")`,

    `CREATE TABLE IF NOT EXISTS "showtimes" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "film_id" INTEGER NOT NULL,
      "cinema_id" INTEGER NOT NULL,
      "date" TEXT NOT NULL,
      "starts_at" DATETIME NOT NULL,
      "version" TEXT NOT NULL DEFAULT 'OTHER',
      "booking_url" TEXT,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "showtimes_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "films" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "showtimes_cinema_id_fkey" FOREIGN KEY ("cinema_id") REFERENCES "cinemas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "showtimes_cinema_id_film_id_starts_at_key" ON "showtimes"("cinema_id", "film_id", "starts_at")`,
    `CREATE INDEX IF NOT EXISTS "showtimes_cinema_id_date_idx" ON "showtimes"("cinema_id", "date")`,
    `CREATE INDEX IF NOT EXISTS "showtimes_date_idx" ON "showtimes"("date")`,
    `CREATE INDEX IF NOT EXISTS "showtimes_film_id_date_idx" ON "showtimes"("film_id", "date")`,

    `CREATE TABLE IF NOT EXISTS "cache_metadata" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "cache_key" TEXT NOT NULL,
      "fetched_at" DATETIME NOT NULL,
      "expires_at" DATETIME NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "cache_metadata_cache_key_key" ON "cache_metadata"("cache_key")`,

    `CREATE TABLE IF NOT EXISTS "users" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "password_hash" TEXT NOT NULL,
      "name" TEXT,
      "is_admin" BOOLEAN NOT NULL DEFAULT false,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email")`,
    `CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email")`,

    `CREATE TABLE IF NOT EXISTS "watchlist" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "user_id" TEXT NOT NULL,
      "film_title" TEXT NOT NULL,
      "cinema_name" TEXT NOT NULL,
      "date" TEXT NOT NULL,
      "time" TEXT NOT NULL,
      "version" TEXT NOT NULL,
      "booking_url" TEXT,
      "poster_url" TEXT,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "watchlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "watchlist_user_id_film_title_cinema_name_date_time_key" ON "watchlist"("user_id", "film_title", "cinema_name", "date", "time")`,

    `CREATE TABLE IF NOT EXISTS "alerts" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "user_id" TEXT NOT NULL,
      "film_title" TEXT NOT NULL,
      "criteria" TEXT NOT NULL DEFAULT '{}',
      "is_active" BOOLEAN NOT NULL DEFAULT true,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "triggered_at" DATETIME,
      CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS "device_tokens" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "user_id" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "platform" TEXT NOT NULL,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL,
      CONSTRAINT "device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "device_tokens_token_key" ON "device_tokens"("token")`,
  ];

  for (const sql of tables) {
    try { db.exec(sql); } catch (e) { /* table/index already exists */ }
  }

  db.close();
  console.log('Database schema initialized');
} else {
  console.log('better-sqlite3 not available, Prisma will handle schema on first connect');
}
