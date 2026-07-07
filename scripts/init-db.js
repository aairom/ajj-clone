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

// Prices table
db.exec(`
    CREATE TABLE IF NOT EXISTS prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT UNIQUE NOT NULL,
        price TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);
console.log('✓ Created prices table');

// Seed default prices if table is empty
const priceCount = db.prepare('SELECT COUNT(*) as cnt FROM prices').get();
if (priceCount.cnt === 0) {
    const insertPrice = db.prepare('INSERT INTO prices (type, price) VALUES (?, ?)');
    const seedPrices = db.transaction(() => {
        insertPrice.run('Adulte', '320€');
        insertPrice.run('Mineur', '270€');
        insertPrice.run('Ceinture Noire', '210€');
        insertPrice.run('Remise en forme', '190€');
    });
    seedPrices();
    console.log('✓ Seeded default prices');
}

// Newsletter tables
db.exec(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        status TEXT DEFAULT 'active',
        token TEXT UNIQUE NOT NULL,
        verified INTEGER DEFAULT 0,
        subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);
console.log('✓ Created newsletter_subscribers table');

db.exec(`
    CREATE TABLE IF NOT EXISTS newsletter_campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT NOT NULL,
        html_content TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        sent_at DATETIME,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
    )
`);
console.log('✓ Created newsletter_campaigns table');

// Gallery tables
db.exec(`
    CREATE TABLE IF NOT EXISTS gallery_albums (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        cover_image_id INTEGER,
        is_public INTEGER DEFAULT 1,
        display_order INTEGER DEFAULT 0,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cover_image_id) REFERENCES images(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id)
    )
`);
console.log('✓ Created gallery_albums table');

db.exec(`
    CREATE TABLE IF NOT EXISTS album_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        album_id INTEGER NOT NULL,
        image_id INTEGER NOT NULL,
        display_order INTEGER DEFAULT 0,
        caption TEXT,
        FOREIGN KEY (album_id) REFERENCES gallery_albums(id) ON DELETE CASCADE,
        FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
        UNIQUE(album_id, image_id)
    )
`);
console.log('✓ Created album_images table');

// Push notification tables
db.exec(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);
console.log('✓ Created push_subscriptions table');

db.exec(`
    CREATE TABLE IF NOT EXISTS push_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        url TEXT,
        icon TEXT,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sent_by INTEGER,
        recipient_count INTEGER DEFAULT 0,
        FOREIGN KEY (sent_by) REFERENCES users(id)
    )
`);
console.log('✓ Created push_notifications table');

// Blog tables
db.exec(`
    CREATE TABLE IF NOT EXISTS blog_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        excerpt TEXT,
        content TEXT NOT NULL,
        featured_image TEXT,
        author_id INTEGER,
        status TEXT DEFAULT 'draft',
        published_at DATETIME,
        views INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id)
    )
`);
console.log('✓ Created blog_posts table');

db.exec(`
    CREATE TABLE IF NOT EXISTS blog_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL
    )
`);
console.log('✓ Created blog_categories table');

db.exec(`
    CREATE TABLE IF NOT EXISTS post_categories (
        post_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        PRIMARY KEY (post_id, category_id),
        FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE CASCADE
    )
`);
console.log('✓ Created post_categories table');

db.exec(`
    CREATE TABLE IF NOT EXISTS blog_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        author_name TEXT NOT NULL,
        author_email TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
    )
`);
console.log('✓ Created blog_comments table');

// Create indexes for better performance
db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_news_date ON news(date);
    CREATE INDEX IF NOT EXISTS idx_calendar_date ON calendar_events(date);
    CREATE INDEX IF NOT EXISTS idx_images_category ON images(category);
    CREATE INDEX IF NOT EXISTS idx_images_uploaded_by ON images(uploaded_by);
    CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
    CREATE INDEX IF NOT EXISTS idx_newsletter_token ON newsletter_subscribers(token);
    CREATE INDEX IF NOT EXISTS idx_gallery_albums_public ON gallery_albums(is_public);
    CREATE INDEX IF NOT EXISTS idx_album_images_album ON album_images(album_id);
    CREATE INDEX IF NOT EXISTS idx_push_endpoint ON push_subscriptions(endpoint);
    CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
    CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
    CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_blog_comments_status ON blog_comments(status);
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
