# 🥋 Asnières Jujitsu — Setup Guide

Full installation and configuration reference.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | v18 LTS or v20 LTS |
| npm | bundled with Node.js |

> ⚠️ Node.js v24+ is not yet compatible with `better-sqlite3`. Use v20 LTS.

---

## Installation

### 1 — Install dependencies

```bash
npm install
```

Key packages installed:
- `express` — web server
- `better-sqlite3` — SQLite database
- `bcrypt` — password hashing
- `jsonwebtoken` — JWT authentication
- `express-rate-limit` — API rate limiting
- `multer` + `sharp` + `uuid` — image upload & processing
- `nodemailer` — contact form emails + newsletter campaigns
- `web-push` — Web Push API (VAPID) for push notifications
- `dotenv` — environment variables

### 2 — Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development

# REQUIRED — generate a strong secret:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-strong-secret-here

JWT_EXPIRES_IN=24h
DB_PATH=./data/admin.db

# Default admin (used only by init-db, change immediately after first login)
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123

# Contact form email
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

### 3 — Initialise the database

```bash
npm run init-db
```

Creates `data/admin.db` with tables:

| Table | Purpose |
|-------|---------|
| `users` | Admin accounts (bcrypt passwords) |
| `sessions` | JWT session tracking |
| `news` | Actualités (title, content, date, image) |
| `calendar_events` | Événements (title, description, date, image) |
| `images` | Uploaded image metadata |
| `prices` | Tarifs (seeded with 4 default entries) |
| `newsletter_subscribers` | Email subscribers with token + status |
| `newsletter_campaigns` | Campaign subject + HTML content |
| `gallery_albums` | Photo albums (title, description, is_public) |
| `album_images` | Junction: album ↔ image with caption + order |
| `push_subscriptions` | Browser push subscription objects (VAPID) |
| `push_notifications` | Push notification history |
| `blog_posts` | Articles (title, slug, content, status, views) |
| `blog_categories` | Category name + slug |
| `post_categories` | Junction: post ↔ category |
| `blog_comments` | Comments with pending/approved moderation |

> **Existing DB from before v3.0?** The `calendar_events.image` column may be missing. Add it:
> ```bash
> node -e "const db=require('better-sqlite3')('./data/admin.db'); db.prepare('ALTER TABLE calendar_events ADD COLUMN image TEXT DEFAULT NULL').run(); db.close(); console.log('done');"
> ```

### 4 — Start

```bash
# Development (auto-reload with nodemon)
npm run dev

# Production (detached background process)
./scripts/START.sh

# Stop
./scripts/STOP.sh
```

Server URL: `http://localhost:3000`  
Admin panel: `http://localhost:3000/admin/login.html`  
Default credentials: `admin` / `admin123` — **change immediately**

---

## Rate Limiting

| Scope | Limit |
|-------|-------|
| `POST /api/auth/login` | 20 requests / 15 min / IP |
| All other `/api/*` routes | 500 requests / 15 min / IP |
| Static files (CSS, JS, images) | **Not rate-limited** |

Static files are served before the rate limiter so page loads and asset fetches do not consume the API quota.

---

## API Endpoints

### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | — | Login, returns JWT |
| POST | `/api/auth/logout` | ✅ | Invalidate session |
| GET | `/api/auth/verify` | ✅ | Check token validity |
| POST | `/api/auth/change-password` | ✅ | Change password |

### News
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/news` | — | All news (public) |
| GET | `/api/news/:id` | — | Single item (public) |
| POST | `/api/news` | ✅ admin | Create (title, content, date, image) |
| PUT | `/api/news/:id` | ✅ admin | Update |
| DELETE | `/api/news/:id` | ✅ admin | Delete |

### Calendar
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/calendar` | — | All events (public) |
| GET | `/api/calendar/:id` | — | Single event (public) |
| POST | `/api/calendar` | ✅ admin | Create (title, description, date, image) |
| PUT | `/api/calendar/:id` | ✅ admin | Update |
| DELETE | `/api/calendar/:id` | ✅ admin | Delete |

### Images
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/images/upload` | ✅ | Upload single image |
| POST | `/api/images/upload-multiple` | ✅ | Upload up to 10 images |
| GET | `/api/images` | ✅ | List with optional `?category=` filter |
| GET | `/api/images/:id` | ✅ | Single image metadata |
| PUT | `/api/images/:id` | ✅ | Update alt_text / category |
| DELETE | `/api/images/:id` | ✅ | Delete image + files |

### Prices
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/prices` | — | All prices (public) |
| PUT | `/api/prices/:id` | ✅ admin | Update price value |

---

## Security

| Mechanism | Detail |
|-----------|--------|
| Passwords | bcrypt, 10 rounds |
| JWT | 24h expiry, session tracked in `sessions` table |
| SQL injection | Prepared statements throughout |
| File uploads | MIME + extension whitelist, UUID filenames, 10 MB limit |
| Secrets | `.env` file, never committed |

### Before production

1. **Generate strong JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. **Change default admin password** (login → `/api/auth/change-password`)
3. **Set `NODE_ENV=production`**
4. **Enable HTTPS** via reverse proxy (nginx / Caddy)
5. **Secure the database:** `chmod 600 data/admin.db`
6. **Regular backups:**
   ```bash
   cp data/admin.db data/admin-$(date +%Y%m%d).db
   tar -czf uploads-$(date +%Y%m%d).tar.gz uploads/
   ```

---

## Database management

```bash
# Open SQLite shell
sqlite3 data/admin.db

# Useful queries
.tables
SELECT * FROM news;
SELECT * FROM calendar_events;
SELECT * FROM prices;
SELECT id, username, role FROM users;
SELECT id, expires_at FROM sessions;

# Reset
.quit
rm data/admin.db && npm run init-db
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | `lsof -ti:3000 \| xargs kill` |
| `better-sqlite3` build error | Use Node.js v20 LTS |
| Login fails after server restart | Token still valid — log in again |
| "Erreur de chargement" in admin | Server down, or rate limit hit — restart |
| Images tab empty (gallery) | Was a known bug (count query) — fixed in v3.0 |
| Calendar events not showing | Date filter bug — fixed in v3.0; check `event.date >= todayStr` |

Logs: `tail -f logs/server.log`

---

*Made with ❤️ by Bob — last updated Juillet 2026 (v3.0)*
