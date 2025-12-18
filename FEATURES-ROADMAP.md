# 🗺️ Features Implementation Roadmap

Comprehensive plan for implementing new features for Asnières Jujitsu website.

## 📋 Overview

This document outlines the implementation plan for 6 major features:

1. 📸 **Image Upload System** - Direct image uploads from admin
2. 📅 **Course Reservation System** - Online booking for classes
3. 📧 **Newsletter System** - Email subscriptions and campaigns
4. 🖼️ **Photo Gallery** - Public photo gallery
5. 🔔 **Push Notifications** - Real-time notifications
6. 📝 **Blog System** - News and articles blog

---

## 🎯 Phase 1: Foundation & Image Upload (Week 1-2)

### ✅ Status: IN PROGRESS

### Database Schema Extensions

```sql
-- Images table
CREATE TABLE images (
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
);

-- Update news table to reference images
ALTER TABLE news ADD COLUMN image_id INTEGER REFERENCES images(id);
```

### Backend Implementation

**Dependencies:**
- `multer` - File upload handling
- `sharp` - Image processing and thumbnails
- `uuid` - Unique filenames

**New Routes:**
- `POST /api/images/upload` - Upload single/multiple images
- `GET /api/images` - List all images
- `GET /api/images/:id` - Get image details
- `DELETE /api/images/:id` - Delete image
- `GET /uploads/:filename` - Serve uploaded images

**Features:**
- ✅ File validation (type, size)
- ✅ Automatic thumbnail generation
- ✅ Secure filename generation
- ✅ Image optimization
- ✅ Multiple upload support

### Frontend Implementation

**Admin Dashboard Updates:**
- Image upload component with drag & drop
- Image library browser
- Image selection for news/blog posts
- Thumbnail preview
- Delete functionality

---

## 📅 Phase 2: Course Reservation System (Week 3-4)

### Database Schema

```sql
-- Courses table
CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    instructor TEXT,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_participants INTEGER DEFAULT 20,
    level TEXT, -- beginner, intermediate, advanced
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Reservations table
CREATE TABLE reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_phone TEXT,
    reservation_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Course sessions (for specific dates)
CREATE TABLE course_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    session_date DATE NOT NULL,
    is_cancelled INTEGER DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);
```

### Features

**Admin:**
- Manage courses (CRUD)
- View reservations
- Confirm/cancel reservations
- Set max participants
- Mark sessions as cancelled

**Public:**
- View available courses
- Book a course
- Receive confirmation email
- Cancel reservation

---

## 📧 Phase 3: Newsletter System (Week 5-6)

### Database Schema

```sql
-- Newsletter subscribers
CREATE TABLE newsletter_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    status TEXT DEFAULT 'active', -- active, unsubscribed
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at DATETIME,
    verification_token TEXT,
    is_verified INTEGER DEFAULT 0
);

-- Newsletter campaigns
CREATE TABLE newsletter_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    html_content TEXT,
    status TEXT DEFAULT 'draft', -- draft, scheduled, sent
    scheduled_at DATETIME,
    sent_at DATETIME,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Campaign sends (tracking)
CREATE TABLE newsletter_sends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    subscriber_id INTEGER NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    opened_at DATETIME,
    clicked_at DATETIME,
    FOREIGN KEY (campaign_id) REFERENCES newsletter_campaigns(id),
    FOREIGN KEY (subscriber_id) REFERENCES newsletter_subscribers(id)
);
```

### Features

**Admin:**
- Create/edit campaigns
- Rich text editor
- Schedule campaigns
- View subscriber list
- Export subscribers
- View campaign statistics

**Public:**
- Subscribe form
- Email verification
- Unsubscribe link
- Preference center

---

## 🖼️ Phase 4: Photo Gallery (Week 7)

### Database Schema

```sql
-- Gallery albums
CREATE TABLE gallery_albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    cover_image_id INTEGER,
    is_public INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cover_image_id) REFERENCES images(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Album images (many-to-many)
CREATE TABLE album_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id INTEGER NOT NULL,
    image_id INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    caption TEXT,
    FOREIGN KEY (album_id) REFERENCES gallery_albums(id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
);
```

### Features

**Admin:**
- Create/manage albums
- Add images to albums
- Reorder images
- Set cover image
- Bulk upload

**Public:**
- Browse albums
- View photos in lightbox
- Share albums
- Download photos (optional)

---

## 🔔 Phase 5: Push Notifications (Week 8)

### Database Schema

```sql
-- Push subscriptions
CREATE TABLE push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT,
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notification history
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    icon TEXT,
    url TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_by INTEGER,
    FOREIGN KEY (sent_by) REFERENCES users(id)
);
```

### Features

**Technology:**
- Web Push API
- Service Worker
- VAPID keys

**Admin:**
- Send notifications
- Schedule notifications
- View notification history
- Subscriber management

**Public:**
- Subscribe to notifications
- Receive real-time updates
- Notification preferences

---

## 📝 Phase 6: Blog System (Week 9-10)

### Database Schema

```sql
-- Blog posts
CREATE TABLE blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image_id INTEGER,
    author_id INTEGER,
    status TEXT DEFAULT 'draft', -- draft, published
    published_at DATETIME,
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (featured_image_id) REFERENCES images(id),
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Blog categories
CREATE TABLE blog_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT
);

-- Post categories (many-to-many)
CREATE TABLE post_categories (
    post_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (post_id, category_id),
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE CASCADE
);

-- Blog comments
CREATE TABLE blog_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, approved, spam
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
);
```

### Features

**Admin:**
- Create/edit posts
- Rich text editor
- Categories management
- Comments moderation
- SEO settings (meta tags)
- Schedule posts

**Public:**
- Browse posts
- Filter by category
- Search posts
- Comment on posts
- Share posts
- RSS feed

---

## 📊 Implementation Timeline

| Phase | Feature | Duration | Status |
|-------|---------|----------|--------|
| 1 | Image Upload | 2 weeks | 🟡 In Progress |
| 2 | Course Reservation | 2 weeks | ⚪ Pending |
| 3 | Newsletter | 2 weeks | ⚪ Pending |
| 4 | Photo Gallery | 1 week | ⚪ Pending |
| 5 | Push Notifications | 1 week | ⚪ Pending |
| 6 | Blog System | 2 weeks | ⚪ Pending |

**Total Estimated Time:** 10 weeks

---

## 🛠️ Technical Stack Updates

### New Dependencies

```json
{
  "dependencies": {
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.0",
    "uuid": "^9.0.1",
    "web-push": "^3.6.6",
    "marked": "^11.0.0",
    "dompurify": "^3.0.6",
    "slugify": "^1.6.6"
  }
}
```

### Infrastructure Requirements

- **Storage:** Minimum 10GB for images
- **Memory:** Increase to 1GB RAM for image processing
- **Backup:** Daily backups of uploads directory
- **CDN:** Consider CDN for image delivery (optional)

---

## 🔒 Security Considerations

1. **File Upload:**
   - Validate file types (whitelist)
   - Limit file sizes
   - Scan for malware
   - Generate unique filenames
   - Store outside web root

2. **User Data:**
   - GDPR compliance for newsletter
   - Email verification
   - Unsubscribe mechanism
   - Data export capability

3. **Comments:**
   - Spam protection (reCAPTCHA)
   - Content moderation
   - Rate limiting

---

## 📈 Success Metrics

- **Image Upload:** < 5s upload time for 5MB image
- **Reservations:** 95% booking success rate
- **Newsletter:** < 5% bounce rate
- **Gallery:** < 2s page load time
- **Notifications:** 90% delivery rate
- **Blog:** < 3s page load time

---

## 🚀 Next Steps

1. ✅ Review and approve roadmap
2. 🟡 Complete Phase 1 (Image Upload)
3. ⚪ Begin Phase 2 (Course Reservation)
4. ⚪ Iterate based on feedback

---

**Roadmap created by Bob**
**Last updated:** December 18, 2024