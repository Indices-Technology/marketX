-- Enforce unique usernames at the database level.
-- Data verified clean beforehand (0 duplicate usernames, 0 nulls). Postgres unique
-- indexes permit multiple NULLs, so the nullable column is unaffected.
CREATE UNIQUE INDEX "Profile_username_key" ON "Profile"("username");
