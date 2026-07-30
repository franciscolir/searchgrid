const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'data.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function addColumn(table, column, def) {
  try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`); } catch (e) {}
}
addColumn('missions', 'keyword', 'TEXT');
addColumn('missions', 'require_keyword', 'INTEGER NOT NULL DEFAULT 0');
addColumn('missions', 'mode', 'TEXT NOT NULL DEFAULT \'bosque\'');
addColumn('missions', 'sub_zones', 'TEXT');
addColumn('sectors', 'sector_type', 'TEXT NOT NULL DEFAULT \'grid\'');
addColumn('sectors', 'nodes', 'TEXT');
addColumn('searchers', 'lat', 'REAL');
addColumn('searchers', 'lng', 'REAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS missions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    polygon TEXT NOT NULL,
    cell_size REAL NOT NULL DEFAULT 0.001,
    status TEXT NOT NULL DEFAULT 'active',
    keyword TEXT,
    require_keyword INTEGER NOT NULL DEFAULT 0,
    mode TEXT NOT NULL DEFAULT 'bosque',
    sub_zones TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS searchers (
    id TEXT PRIMARY KEY,
    mission_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    joined_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (mission_id) REFERENCES missions(id)
  );

  CREATE TABLE IF NOT EXISTS sectors (
    id TEXT NOT NULL,
    mission_id TEXT NOT NULL,
    bounds TEXT NOT NULL,
    center TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendiente',
    sector_type TEXT NOT NULL DEFAULT 'grid',
    nodes TEXT,
    searched_by TEXT,
    timestamp TEXT,
    PRIMARY KEY (id, mission_id),
    FOREIGN KEY (mission_id) REFERENCES missions(id)
  );

  CREATE TABLE IF NOT EXISTS location_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    searcher_id TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (searcher_id) REFERENCES searchers(id)
  );

  CREATE TABLE IF NOT EXISTS searched_zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    searcher_id TEXT NOT NULL,
    mission_id TEXT NOT NULL,
    sector_id TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (searcher_id) REFERENCES searchers(id),
    FOREIGN KEY (mission_id) REFERENCES missions(id)
  );

`);

module.exports = db;
