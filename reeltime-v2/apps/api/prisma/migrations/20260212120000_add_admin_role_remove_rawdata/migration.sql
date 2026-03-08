-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_films" (
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
);
INSERT INTO "new_films" ("allocine_id", "cast", "created_at", "director", "film_age", "genres", "id", "poster_url", "production_year", "rating", "release_date", "runtime", "synopsis", "title", "updated_at", "year") SELECT "allocine_id", "cast", "created_at", "director", "film_age", "genres", "id", "poster_url", "production_year", "rating", "release_date", "runtime", "synopsis", "title", "updated_at", "year" FROM "films";
DROP TABLE "films";
ALTER TABLE "new_films" RENAME TO "films";
CREATE UNIQUE INDEX "films_allocine_id_key" ON "films"("allocine_id");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_users" ("created_at", "email", "id", "name", "password_hash", "updated_at") SELECT "created_at", "email", "id", "name", "password_hash", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "idx_users_email" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
