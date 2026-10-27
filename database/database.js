
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Create a data folder if it doesn't exist
const dbFolder = path.join(__dirname, '..', 'data');

if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
}

// Create or open the SQLite database
const dbPath = path.join(dbFolder, 'outfit_planner.db');
const db = new Database(dbPath);

// Create the users table
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// Create the clothing items table
db.exec(`
    CREATE TABLE IF NOT EXISTS clothing_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        color TEXT,
        image_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
`);

// Create the outfits table
db.exec(`
    CREATE TABLE IF NOT EXISTS outfits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        occasion TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
`);
// Add image storage columns if they do not already exist
const columns = db.prepare(
    "PRAGMA table_info(clothing_items)"
).all();

const columnNames = columns.map(column => column.name);

if (!columnNames.includes("image_data")) {
    db.exec(
        "ALTER TABLE clothing_items ADD COLUMN image_data BLOB"
    );
}

if (!columnNames.includes("image_format")) {
    db.exec(
        "ALTER TABLE clothing_items ADD COLUMN image_format TEXT"
    );
}

console.log("Image storage columns are ready.");
module.exports = db;
