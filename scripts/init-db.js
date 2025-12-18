const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './data/admin.db';
const DB_DIR = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    console.log(`✓ Created directory: ${DB_DIR}`);
}

// Initialize database
const db = new Database(DB_PATH);
console.log(`✓ Connected to database: ${DB_PATH}`);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
console.log('\n📋 Creating database schema...');

// Users table
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT,
        full_name TEXT,
        role TEXT DEFAULT 'admin',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
    )
`);
console.log('✓ Created users table');

// Sessions table (for token blacklisting)
db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
`);
console.log('✓ Created sessions table');

// News table
db.exec(`
    CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        date DATE NOT NULL,
        image TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
    )
`);
console.log('✓ Created news table');

// Calendar events table
db.exec(`
    CREATE TABLE IF NOT EXISTS calendar_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        date DATE NOT NULL,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
    )
`);
console.log('✓ Created calendar_events table');

// Images table
db.exec(`
    CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        path TEXT NOT NULL,
        thumbnail_path TEXT,
        alt_text TEXT,
        category TEXT DEFAULT 'general',
        uploaded_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
`);
console.log('✓ Created images table');

// Create indexes for better performance
db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_news_date ON news(date);
    CREATE INDEX IF NOT EXISTS idx_calendar_date ON calendar_events(date);
    CREATE INDEX IF NOT EXISTS idx_images_category ON images(category);
    CREATE INDEX IF NOT EXISTS idx_images_uploaded_by ON images(uploaded_by);
`);
console.log('✓ Created indexes');

// Create default admin user
console.log('\n👤 Creating default admin user...');

const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

// Check if admin user already exists
const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(defaultUsername);

if (existingUser) {
    console.log(`⚠️  User '${defaultUsername}' already exists. Skipping creation.`);
} else {
    const passwordHash = bcrypt.hashSync(defaultPassword, 10);
    
    const stmt = db.prepare(`
        INSERT INTO users (username, password_hash, full_name, role)
        VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(defaultUsername, passwordHash, 'Administrator', 'admin');
    console.log(`✓ Created admin user: ${defaultUsername}`);
    console.log(`  Password: ${defaultPassword}`);
    console.log(`  ⚠️  IMPORTANT: Change this password in production!`);
}

// Migrate existing localStorage data if needed
console.log('\n📦 Checking for existing data migration...');

// This is a placeholder - in a real scenario, you'd need to run this from the browser
// or provide a way to export localStorage data
console.log('ℹ️  To migrate existing news and calendar data:');
console.log('   1. Export data from browser localStorage');
console.log('   2. Use the migration endpoint in the API');

db.close();
console.log('\n✅ Database initialization complete!\n');

// Made with Bob
