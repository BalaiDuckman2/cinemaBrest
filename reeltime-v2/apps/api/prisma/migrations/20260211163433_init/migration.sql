-- CreateTable
CREATE TABLE "cinemas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "allocine_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "films" (
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
    "raw_data" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "showtimes" (
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
);

-- CreateIndex
CREATE UNIQUE INDEX "cinemas_allocine_id_key" ON "cinemas"("allocine_id");

-- CreateIndex
CREATE UNIQUE INDEX "films_allocine_id_key" ON "films"("allocine_id");

-- CreateIndex
CREATE INDEX "showtimes_cinema_id_date_idx" ON "showtimes"("cinema_id", "date");

-- CreateIndex
CREATE INDEX "showtimes_date_idx" ON "showtimes"("date");

-- CreateIndex
CREATE INDEX "showtimes_film_id_date_idx" ON "showtimes"("film_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "showtimes_cinema_id_film_id_starts_at_key" ON "showtimes"("cinema_id", "film_id", "starts_at");
