CREATE TABLE IF NOT EXISTS votes (
  visitor_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (visitor_id, game_id)
);
CREATE INDEX IF NOT EXISTS votes_by_game ON votes(game_id);
CREATE TABLE IF NOT EXISTS vote_rate_limits (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  expires_at INTEGER NOT NULL
);
