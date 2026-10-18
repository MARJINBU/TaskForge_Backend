const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

let db;
let databaseFile;

async function initDatabase() {
  const wasm = await initSqlJs();
  databaseFile = path.resolve(process.cwd(), process.env.DATABASE_FILE || './data/taskforge.sqlite');
  fs.mkdirSync(path.dirname(databaseFile), { recursive: true });

  if (fs.existsSync(databaseFile)) {
    db = new wasm.Database(new Uint8Array(fs.readFileSync(databaseFile)));
  } else {
    db = new wasm.Database();
  }

  db.run('PRAGMA foreign_keys = ON;');
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','member')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      owner_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS project_members (
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      PRIMARY KEY(project_id, user_id),
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      project_id INTEGER NOT NULL,
      assigned_to INTEGER,
      status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','completed')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
      due_date TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY(assigned_to) REFERENCES users(id) ON DELETE SET NULL
    );
  `);
  saveDatabase();
}

function getDb() {
  if (!db) throw new Error('Database has not been initialized');
  return db;
}

function saveDatabase() {
  if (!db || !databaseFile) return;
  fs.writeFileSync(databaseFile, Buffer.from(db.export()));
}

function all(sql, params = []) {
  const stmt = getDb().prepare(sql);
  try {
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    return rows;
  } finally { stmt.free(); }
}

function get(sql, params = []) {
  return all(sql, params)[0] || null;
}

function run(sql, params = []) {
  getDb().run(sql, params);
  const result = getDb().exec('SELECT last_insert_rowid() AS id');
  saveDatabase();
  return { id: result.length ? result[0].values[0][0] : null, changes: getDb().getRowsModified() };
}

module.exports = { initDatabase, getDb, saveDatabase, all, get, run };
