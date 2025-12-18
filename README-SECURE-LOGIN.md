# 🔐 Secure Local Login System - Implementation Complete

## Overview

A complete secure authentication system has been implemented for the Asnières Jujitsu admin panel with the following features:

### ✅ Implemented Features

1. **Backend Server (Node.js + Express)**
   - RESTful API architecture
   - Rate limiting for security
   - CORS support
   - Error handling middleware

2. **SQLite Database**
   - Local database stored in `data/admin.db`
   - Tables: users, sessions, news, calendar_events
   - Foreign key constraints
   - Indexed for performance

3. **Secure Authentication**
   - Password hashing with bcrypt (10 rounds)
   - JWT token-based authentication
   - Session management with token tracking
   - Token expiration (24 hours default)
   - Logout functionality (token invalidation)

4. **Protected API Endpoints**
   - Authentication: login, logout, verify, change-password
   - News CRUD operations (protected)
   - Calendar CRUD operations (protected)
   - Bearer token authentication required

5. **Frontend Integration**
   - Updated login.js to use backend API
   - Updated dashboard.js to use backend API
   - Token storage in localStorage
   - Automatic authentication verification
   - Error handling and user feedback

6. **Security Features**
   - Rate limiting (5 login attempts per 15 min)
   - SQL injection prevention (prepared statements)
   - XSS protection
   - Secure password storage (never plain text)
   - Environment variable configuration
   - Database file excluded from git

## 📁 New Files Created

```
├── package.json                 # Node.js dependencies
├── server.js                    # Express server
├── .env.example                 # Environment template
├── .env                         # Environment config (created)
├── SETUP.md                     # Detailed setup guide
├── START.sh                     # Quick start script
├── README-SECURE-LOGIN.md       # This file
├── middleware/
│   └── auth.js                  # JWT authentication middleware
├── routes/
│   ├── auth.js                  # Authentication endpoints
│   ├── news.js                  # News CRUD endpoints
│   └── calendar.js              # Calendar CRUD endpoints
├── scripts/
│   └── init-db.js               # Database initialization
└── data/
    └── admin.db                 # SQLite database (created on init)
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database
```bash
npm run init-db
```

### 3. Start Server
```bash
npm start
```

### 4. Access Admin Panel
Open browser: `http://localhost:3000/admin/login.html`

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Change these credentials after first login!**

## 🔒 Security Best Practices

### For Production:

1. **Change JWT Secret**
   ```bash
   # Generate a secure secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Update `.env` file with the generated secret.

2. **Change Default Password**
   - Login immediately after setup
   - Use the change-password endpoint
   - Or update `DEFAULT_ADMIN_PASSWORD` in `.env` before init

3. **Set Production Environment**
   ```env
   NODE_ENV=production
   ```

4. **Use HTTPS**
   - Configure SSL/TLS certificates
   - Use reverse proxy (nginx/Apache)

5. **Secure Database File**
   ```bash
   chmod 600 data/admin.db
   ```

6. **Regular Backups**
   ```bash
   cp data/admin.db data/admin.db.backup
   ```

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
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
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### News Table
```sql
CREATE TABLE news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date DATE NOT NULL,
    image TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### Calendar Events Table
```sql
CREATE TABLE calendar_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

## 🔌 API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Login with username and password.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": null,
    "full_name": "Administrator",
    "role": "admin"
  }
}
```

#### POST /api/auth/logout
Logout and invalidate token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /api/auth/verify
Verify token validity.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

#### POST /api/auth/change-password
Change user password.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "currentPassword": "admin123",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully. Please login again."
}
```

### News Endpoints

All news modification endpoints require authentication.

- `GET /api/news` - Get all news (public)
- `GET /api/news/:id` - Get single news item (public)
- `POST /api/news` - Create news (protected)
- `PUT /api/news/:id` - Update news (protected)
- `DELETE /api/news/:id` - Delete news (protected)

### Calendar Endpoints

All calendar modification endpoints require authentication.

- `GET /api/calendar` - Get all events (public)
- `GET /api/calendar/:id` - Get single event (public)
- `POST /api/calendar` - Create event (protected)
- `PUT /api/calendar/:id` - Update event (protected)
- `DELETE /api/calendar/:id` - Delete event (protected)

## 🛠️ Development

### View Database
```bash
sqlite3 data/admin.db
```

### SQLite Commands
```sql
.tables                          -- List tables
.schema users                    -- Show table structure
SELECT * FROM users;             -- View users
SELECT * FROM sessions;          -- View active sessions
SELECT * FROM news;              -- View news
SELECT * FROM calendar_events;   -- View events
```

### Reset Database
```bash
rm data/admin.db
npm run init-db
```

### Add New User (via SQL)
```bash
sqlite3 data/admin.db
```

```sql
-- First, hash the password using bcrypt
-- Then insert:
INSERT INTO users (username, password_hash, full_name, role)
VALUES ('newuser', '$2b$10$...hashed_password...', 'New User', 'admin');
```

## 🐛 Troubleshooting

### Server won't start
- Check if port 3000 is in use: `lsof -i :3000`
- Kill process: `kill -9 <PID>`
- Try different port in `.env`: `PORT=3001`

### Database errors
- Ensure `data/` directory exists
- Check file permissions: `ls -la data/`
- Reinitialize: `rm data/admin.db && npm run init-db`

### Login fails
- Verify server is running
- Check browser console (F12)
- Verify API_URL in `admin/login.js` matches server
- Check `.env` file exists

### CORS errors
- Ensure server is running on correct port
- Check CORS configuration in `server.js`
- Verify API_URL in frontend files

## 📝 Migration from localStorage

The old system used localStorage. To migrate existing data:

1. Export data from browser console:
```javascript
// In browser console on old admin page
const news = JSON.parse(localStorage.getItem('news') || '[]');
const calendar = JSON.parse(localStorage.getItem('calendar') || '[]');
console.log(JSON.stringify({news, calendar}));
```

2. Use the API to import data (create a migration script if needed)

## 🔄 Updates Made to Existing Files

### admin/login.js
- Changed from localStorage authentication to API-based
- Added async/await for API calls
- Added loading states
- Improved error handling

### admin/dashboard.js
- Replaced localStorage with API calls
- Added JWT token authentication
- Implemented proper logout
- Added loading states for all operations

### .gitignore
- Added database files (*.db)
- Added .env file
- Added node_modules

## 🎯 Next Steps

1. **Test the system thoroughly**
2. **Change default credentials**
3. **Configure production settings**
4. **Set up HTTPS**
5. **Implement backup strategy**
6. **Add user management UI** (optional)
7. **Add password reset functionality** (optional)
8. **Add email notifications** (optional)

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [JWT.io](https://jwt.io/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)

## ⚠️ Important Notes

- The database file (`admin.db`) contains sensitive data - keep it secure
- Never commit `.env` file to version control
- Change default credentials immediately
- Use HTTPS in production
- Regular backups are essential
- Monitor failed login attempts
- Keep dependencies updated: `npm audit`

---

**Implementation completed by Bob**
**Date: 2025-12-18**