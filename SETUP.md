# 🥋 Asnières Jujitsu - Secure Admin System Setup Guide

This guide will help you set up the secure local login system with SQLite database.

## 📋 Prerequisites

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

## 🚀 Installation Steps

### 1. Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This will install all required packages:
- express (web server)
- bcrypt (password hashing)
- jsonwebtoken (JWT authentication)
- better-sqlite3 (SQLite database)
- cors (cross-origin requests)
- dotenv (environment variables)
- express-rate-limit (security)

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

**IMPORTANT:** Edit the `.env` file and change the JWT_SECRET to a strong random string:

```env
JWT_SECRET=your-very-long-random-secret-key-here-change-this
```

You can generate a secure secret using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Initialize the Database

Run the database initialization script:

```bash
npm run init-db
```

This will:
- Create the `data/` directory
- Create the SQLite database (`admin.db`)
- Set up all required tables (users, sessions, news, calendar_events)
- Create the default admin user

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **IMPORTANT:** Change these credentials after first login!

### 4. Start the Server

Start the development server:

```bash
npm start
```

Or for auto-restart on file changes:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 🔐 Security Features

### Password Security
- Passwords are hashed using bcrypt (10 rounds)
- Never stored in plain text
- Secure comparison to prevent timing attacks

### JWT Authentication
- Tokens expire after 24 hours (configurable)
- Tokens are stored in localStorage (client-side)
- Token verification on every protected request
- Session tracking in database

### Rate Limiting
- Login attempts: 5 per 15 minutes per IP
- General API: 100 requests per 15 minutes per IP

### Database Security
- SQLite database stored locally in `data/` folder
- Database file excluded from git (.gitignore)
- Prepared statements prevent SQL injection
- Foreign key constraints enabled

## 📁 Project Structure

```
ajj-clone/
├── admin/
│   ├── login.html          # Login page
│   ├── login.js            # Login logic (uses API)
│   ├── dashboard.html      # Admin dashboard
│   ├── dashboard.js        # Dashboard logic (uses API)
│   └── admin-style.css     # Admin styles
├── routes/
│   ├── auth.js             # Authentication endpoints
│   ├── news.js             # News CRUD endpoints
│   └── calendar.js         # Calendar CRUD endpoints
├── middleware/
│   └── auth.js             # JWT verification middleware
├── scripts/
│   └── init-db.js          # Database initialization
├── data/
│   └── admin.db            # SQLite database (created on init)
├── server.js               # Express server
├── package.json            # Dependencies
├── .env                    # Environment variables (create this)
└── .env.example            # Environment template
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout (invalidate token)
- `GET /api/auth/verify` - Verify token validity
- `POST /api/auth/change-password` - Change password

### News (Protected)
- `GET /api/news` - Get all news
- `GET /api/news/:id` - Get single news item
- `POST /api/news` - Create news (requires auth)
- `PUT /api/news/:id` - Update news (requires auth)
- `DELETE /api/news/:id` - Delete news (requires auth)

### Calendar (Protected)
- `GET /api/calendar` - Get all events
- `GET /api/calendar/:id` - Get single event
- `POST /api/calendar` - Create event (requires auth)
- `PUT /api/calendar/:id` - Update event (requires auth)
- `DELETE /api/calendar/:id` - Delete event (requires auth)

## 🎯 Usage

### 1. Access Admin Panel

Open your browser and go to:
```
http://localhost:3000/admin/login.html
```

### 2. Login

Use the default credentials:
- Username: `admin`
- Password: `admin123`

### 3. Change Password

After first login, it's recommended to change your password:
1. Use the `/api/auth/change-password` endpoint
2. Or add a password change UI to the dashboard

### 4. Manage Content

- **News Tab**: Create, edit, and delete news articles
- **Calendar Tab**: Manage events and dates

## 🛠️ Development

### Database Management

View database contents:
```bash
sqlite3 data/admin.db
```

SQLite commands:
```sql
.tables                    -- List all tables
.schema users             -- Show table structure
SELECT * FROM users;      -- View all users
SELECT * FROM news;       -- View all news
SELECT * FROM calendar_events;  -- View all events
```

### Reset Database

To reset the database:
```bash
rm data/admin.db
npm run init-db
```

### Add New Admin User

You can add users directly via SQL:
```bash
sqlite3 data/admin.db
```

```sql
INSERT INTO users (username, password_hash, full_name, role)
VALUES ('newadmin', '$2b$10$...', 'New Admin', 'admin');
```

Or create a script to add users with hashed passwords.

## 🔒 Production Deployment

### Before deploying to production:

1. **Change JWT Secret**
   - Generate a strong random secret
   - Update `.env` file

2. **Change Default Credentials**
   - Login and change password immediately
   - Or modify `DEFAULT_ADMIN_PASSWORD` in `.env` before init

3. **Set NODE_ENV**
   ```env
   NODE_ENV=production
   ```

4. **Use HTTPS**
   - Configure SSL/TLS certificates
   - Use a reverse proxy (nginx, Apache)

5. **Secure the Database**
   - Set proper file permissions on `data/admin.db`
   - Regular backups

6. **Update CORS Settings**
   - Restrict allowed origins in `server.js`

7. **Monitor Logs**
   - Set up proper logging
   - Monitor failed login attempts

## 🐛 Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Verify Node.js is installed: `node --version`
- Check for errors in terminal

### Database errors
- Ensure `data/` directory exists
- Run `npm run init-db` again
- Check file permissions

### Login fails
- Verify server is running
- Check browser console for errors
- Ensure `.env` file exists
- Verify database has admin user

### CORS errors
- Check API_URL in `login.js` and `dashboard.js`
- Ensure server is running on correct port

## 📝 Notes

- The database file (`admin.db`) is excluded from git
- Keep your `.env` file secure and never commit it
- Regular backups of the database are recommended
- Monitor the `sessions` table and clean up expired sessions periodically

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs in terminal
3. Check browser console for frontend errors

---

Made with ❤️ by Bob