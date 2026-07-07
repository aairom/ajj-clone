# 📸 Image Upload System — Guide

Complete guide for the image upload system in the Asnières Jujitsu admin panel.

---

## Overview

Images can be attached to **Actualités** and **Calendrier** entries, or managed independently in the **Images** tab. Two methods are available in every image field:

| Method | How |
|--------|-----|
| **URL externe** | Paste any public image URL into the URL field |
| **Téléverser** | Click the "Téléverser" button, pick a local file — uploaded instantly to `/uploads/` |

An inline preview appears as soon as a file is chosen or a URL is typed. The ✕ button clears the selection.

---

## Admin UI — Image fields in Actualités & Calendrier

Each form contains an image widget:

```
[ URL field _________________________ ]  ou  [ 📤 Téléverser ]
[ Preview thumbnail  ✕ ]
```

- Choosing a file clears the URL field (and vice-versa).
- On **save**, if a file is selected it is uploaded first via `POST /api/images/upload`; the returned `/uploads/<uuid>.ext` path is stored in the record.
- On **edit**, the current image is pre-loaded in the preview.
- On **cancel**, the preview is cleared.

---

## Images Tab — Standalone gallery

The **Images** tab allows uploading images independently of any news or event:

- Select one or more files (up to 10 at once via `POST /api/images/upload-multiple`)
- Choose a category: Général, Actualités, Événements, Entraînements, Galerie
- A progress bar tracks the upload
- The gallery below refreshes automatically after upload
- Each image card has: copy-URL button, view button, delete button

---

## API Endpoints

All endpoints require a valid JWT Bearer token except where noted.

### `POST /api/images/upload` — Upload single image

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | file | ✅ | Image file |
| `alt_text` | string | — | Alt text |
| `category` | string | — | Default: `general` |

**Response:**
```json
{
  "success": true,
  "message": "Image téléchargée avec succès",
  "image": {
    "id": 4,
    "filename": "uuid.jpg",
    "original_name": "photo.jpg",
    "path": "/uploads/uuid.jpg",
    "thumbnail_path": "/uploads/thumbnails/thumb_uuid.jpg",
    "size": 245678,
    "mime_type": "image/jpeg"
  }
}
```

### `POST /api/images/upload-multiple` — Upload up to 10 images

| Field | Type | Required |
|-------|------|----------|
| `images` | files (array) | ✅ |
| `category` | string | — |

### `GET /api/images` — List images

| Query param | Default | Description |
|-------------|---------|-------------|
| `category` | — | Filter by category |
| `limit` | 50 | Page size |
| `offset` | 0 | Pagination offset |

### `GET /api/images/:id` — Single image

### `PUT /api/images/:id` — Update metadata

Body: `{ "alt_text": "...", "category": "..." }`

### `DELETE /api/images/:id` — Delete image + files

---

## Storage

```
uploads/
├── <uuid>.jpg              ← original file
└── thumbnails/
    └── thumb_<uuid>.jpg    ← 300×300 px (Sharp, fit: inside)
```

Files are served at `/uploads/<filename>` by Express static middleware.

---

## Constraints

| Rule | Value |
|------|-------|
| Max file size | 10 MB |
| Max files per multi-upload | 10 |
| Allowed types | JPEG, PNG, GIF, WebP |
| Thumbnail size | 300 × 300 px (aspect-ratio preserved) |
| Filename | UUID v4 — prevents conflicts and path traversal |

---

## Database schema

```sql
CREATE TABLE images (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    filename      TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type     TEXT NOT NULL,
    size          INTEGER NOT NULL,
    path          TEXT NOT NULL,
    thumbnail_path TEXT,
    alt_text      TEXT,
    category      TEXT DEFAULT 'general',
    uploaded_by   INTEGER REFERENCES users(id),
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

The `image` field in **news** and **calendar_events** stores the public path (e.g. `/uploads/uuid.jpg` or an external URL string).

---

## Public page rendering

**Actualités cards** — if `item.image` is set, an `<img>` is rendered at the top of each card (`height: 200px; object-fit: cover`).

**Calendrier cards** — if `event.image` is set, an `<img class="event-image">` is rendered at the top of each card (`height: 160px; object-fit: cover`). Text content is padded below.

Cards with no image display a placeholder SVG.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Upload fails with "Seuls les fichiers image sont autorisés" | Wrong file type | Use JPEG, PNG, GIF or WebP |
| Upload fails with 413 | File > 10 MB | Compress or resize first |
| Galerie shows "Erreur de chargement" | Server not running or rate limit hit | Restart server; check `logs/server.log` |
| Image not showing on public page | Path mismatch | Verify `path` in DB starts with `/uploads/` |
| Thumbnail missing | Sharp error during upload | Check `logs/server.log`; verify `uploads/thumbnails/` is writable |

---

## Backup

```bash
# Backup uploaded files
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Backup database (includes all image metadata)
cp data/admin.db data/admin-backup-$(date +%Y%m%d).db
```

---

*Made with ❤️ by Bob — last updated Juillet 2026 (v3.0)*
