# 📸 Image Upload System - User Guide

Complete guide for using the image upload system in the Asnières Jujitsu admin panel.

## 🎯 Overview

The image upload system allows administrators to:
- Upload single or multiple images
- Automatic thumbnail generation
- Image library management
- Use images in news articles and blog posts
- Organize images by category

## 🚀 Features

### ✅ Implemented Features

- **Single & Multiple Upload** - Upload one or many images at once
- **Automatic Thumbnails** - 300x300px thumbnails generated automatically
- **Image Optimization** - Images processed with Sharp for optimal size
- **Secure Storage** - Unique filenames prevent conflicts
- **File Validation** - Only JPEG, PNG, GIF, WebP allowed
- **Size Limits** - Maximum 10MB per file
- **Metadata** - Alt text and categories for organization
- **Delete Functionality** - Remove images and associated files

## 📋 API Endpoints

### Upload Single Image

**Endpoint:** `POST /api/images/upload`

**Authentication:** Required (JWT token)

**Content-Type:** `multipart/form-data`

**Parameters:**
- `image` (file, required) - The image file
- `alt_text` (string, optional) - Alternative text for accessibility
- `category` (string, optional) - Category (default: 'general')

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/images/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "alt_text=Description of image" \
  -F "category=news"
```

**Response:**
```json
{
  "success": true,
  "message": "Image téléchargée avec succès",
  "image": {
    "id": 1,
    "filename": "uuid-generated-name.jpg",
    "original_name": "my-image.jpg",
    "path": "/uploads/uuid-generated-name.jpg",
    "thumbnail_path": "/uploads/thumbnails/thumb_uuid-generated-name.jpg",
    "size": 245678,
    "mime_type": "image/jpeg"
  }
}
```

### Upload Multiple Images

**Endpoint:** `POST /api/images/upload-multiple`

**Authentication:** Required (JWT token)

**Content-Type:** `multipart/form-data`

**Parameters:**
- `images` (files, required) - Array of image files (max 10)
- `category` (string, optional) - Category for all images

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/images/upload-multiple \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "category=gallery"
```

**Response:**
```json
{
  "success": true,
  "message": "2 image(s) téléchargée(s) avec succès",
  "images": [
    {
      "id": 1,
      "filename": "uuid1.jpg",
      "original_name": "image1.jpg",
      "path": "/uploads/uuid1.jpg",
      "thumbnail_path": "/uploads/thumbnails/thumb_uuid1.jpg"
    },
    {
      "id": 2,
      "filename": "uuid2.jpg",
      "original_name": "image2.jpg",
      "path": "/uploads/uuid2.jpg",
      "thumbnail_path": "/uploads/thumbnails/thumb_uuid2.jpg"
    }
  ]
}
```

### Get All Images

**Endpoint:** `GET /api/images`

**Authentication:** Required (JWT token)

**Query Parameters:**
- `category` (string, optional) - Filter by category
- `limit` (number, optional) - Number of results (default: 50)
- `offset` (number, optional) - Pagination offset (default: 0)

**Example:**
```bash
curl -X GET "http://localhost:3000/api/images?category=news&limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "id": 1,
      "filename": "uuid.jpg",
      "original_name": "photo.jpg",
      "mime_type": "image/jpeg",
      "size": 245678,
      "path": "/uploads/uuid.jpg",
      "thumbnail_path": "/uploads/thumbnails/thumb_uuid.jpg",
      "alt_text": "Description",
      "category": "news",
      "uploaded_by": 1,
      "created_at": "2024-12-18 20:00:00"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Get Single Image

**Endpoint:** `GET /api/images/:id`

**Authentication:** Required (JWT token)

**Example:**
```bash
curl -X GET http://localhost:3000/api/images/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Image Metadata

**Endpoint:** `PUT /api/images/:id`

**Authentication:** Required (JWT token)

**Body:**
```json
{
  "alt_text": "Updated description",
  "category": "gallery"
}
```

**Example:**
```bash
curl -X PUT http://localhost:3000/api/images/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"alt_text":"New description","category":"gallery"}'
```

### Delete Image

**Endpoint:** `DELETE /api/images/:id`

**Authentication:** Required (JWT token)

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/images/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Image supprimée avec succès"
}
```

## 🗂️ File Structure

```
ajj-clone/
├── uploads/
│   ├── .gitkeep
│   ├── uuid-image1.jpg
│   ├── uuid-image2.png
│   └── thumbnails/
│       ├── thumb_uuid-image1.jpg
│       └── thumb_uuid-image2.png
├── middleware/
│   └── upload.js          # Multer configuration
└── routes/
    └── images.js          # Image API routes
```

## 🔒 Security Features

### File Validation

- **Allowed Types:** JPEG, JPG, PNG, GIF, WebP only
- **Max Size:** 10MB per file
- **Filename Security:** UUID-based names prevent conflicts and path traversal
- **MIME Type Check:** Validates both extension and MIME type

### Access Control

- All endpoints require JWT authentication
- Only authenticated admins can upload/delete images
- Images are associated with the uploading user

### Storage Security

- Files stored outside web root (in `/uploads`)
- Served through Express static middleware
- No direct file system access from web

## 📊 Database Schema

```sql
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

-- Indexes for performance
CREATE INDEX idx_images_category ON images(category);
CREATE INDEX idx_images_uploaded_by ON images(uploaded_by);
```

## 🎨 Categories

Suggested categories for organization:

- `general` - Default category
- `news` - News article images
- `gallery` - Photo gallery
- `blog` - Blog post images
- `events` - Event photos
- `team` - Team member photos
- `training` - Training session photos

## 💡 Usage Examples

### JavaScript/Fetch API

```javascript
// Upload single image
async function uploadImage(file, altText, category) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('alt_text', altText);
    formData.append('category', category);

    const response = await fetch('/api/images/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
    });

    return await response.json();
}

// Upload multiple images
async function uploadMultipleImages(files, category) {
    const formData = new FormData();
    files.forEach(file => {
        formData.append('images', file);
    });
    formData.append('category', category);

    const response = await fetch('/api/images/upload-multiple', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
    });

    return await response.json();
}

// Get images
async function getImages(category = null, limit = 50, offset = 0) {
    const params = new URLSearchParams({
        limit,
        offset,
        ...(category && { category })
    });

    const response = await fetch(`/api/images?${params}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    return await response.json();
}

// Delete image
async function deleteImage(imageId) {
    const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    return await response.json();
}
```

## 🐛 Troubleshooting

### Upload Fails

**Error:** "Seuls les fichiers image sont autorisés"
- **Solution:** Ensure file is JPEG, PNG, GIF, or WebP

**Error:** "File too large"
- **Solution:** Reduce file size to under 10MB

**Error:** "Unauthorized"
- **Solution:** Check JWT token is valid and included in Authorization header

### Thumbnails Not Generated

- Check Sharp is installed: `npm list sharp`
- Verify write permissions on `uploads/thumbnails/` directory
- Check server logs for Sharp errors

### Images Not Displaying

- Verify `/uploads` route is configured in server.js
- Check file exists in `uploads/` directory
- Ensure correct path in database

## 📈 Performance Tips

1. **Optimize Before Upload** - Compress images before uploading
2. **Use Thumbnails** - Display thumbnails in lists, full images on click
3. **Lazy Loading** - Implement lazy loading for image galleries
4. **CDN** - Consider CDN for production (CloudFlare, AWS CloudFront)
5. **Caching** - Set appropriate cache headers for uploaded images

## 🔄 Backup Strategy

```bash
# Backup uploads directory
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Backup database (includes image metadata)
cp data/admin.db data/admin-backup-$(date +%Y%m%d).db
```

## 🚀 Next Steps

- [ ] Add image cropping functionality
- [ ] Implement drag & drop upload UI
- [ ] Add image search by filename/alt text
- [ ] Create image picker component for news/blog
- [ ] Add bulk delete functionality
- [ ] Implement image compression settings

---

**Image Upload System implemented by Bob**
**Last updated:** December 18, 2024