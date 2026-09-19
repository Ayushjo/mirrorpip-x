-- At most one OPEN session per (user, tab): concurrent first-beats can't
-- create duplicates (e.g. React StrictMode double-mount in dev).
-- NULL clientId rows are unaffected (Postgres treats NULLs as distinct).
CREATE UNIQUE INDEX "usage_session_open_per_client" ON "usage_session"("userId", "clientId") WHERE "endedAt" IS NULL;
