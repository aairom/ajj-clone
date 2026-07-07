const express = require('express');
const Database = require('better-sqlite3');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const DB_PATH = process.env.DB_PATH || './data/admin.db';

// GET /api/gallery/albums — public, list public albums
router.get('/albums', (req, res) => {
    const db = new Database(DB_PATH);
    try {
        const albums = db.prepare(`
            SELECT ga.id, ga.title, ga.description, ga.display_order, ga.created_at,
                   i.path AS cover_image_path, i.thumbnail_path AS cover_thumbnail,
                   (SELECT COUNT(*) FROM album_images ai WHERE ai.album_id = ga.id) AS image_count
            FROM gallery_albums ga
            LEFT JOIN images i ON ga.cover_image_id = i.id
            WHERE ga.is_public = 1
            ORDER BY ga.display_order ASC, ga.created_at DESC
        `).all();
        res.json({ success: true, data: albums });
    } catch (error) {
        console.error('Get albums error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// GET /api/gallery/albums/:id — public, single album + images
router.get('/albums/:id', (req, res) => {
    const db = new Database(DB_PATH);
    try {
        const album = db.prepare(`
            SELECT ga.*, i.path AS cover_image_path
            FROM gallery_albums ga
            LEFT JOIN images i ON ga.cover_image_id = i.id
            WHERE ga.id = ? AND ga.is_public = 1
        `).get(req.params.id);
        if (!album) return res.status(404).json({ error: 'Album introuvable' });

        const images = db.prepare(`
            SELECT ai.id AS album_image_id, ai.caption, ai.display_order,
                   img.id, img.path, img.thumbnail_path, img.alt_text, img.original_name
            FROM album_images ai
            JOIN images img ON ai.image_id = img.id
            WHERE ai.album_id = ?
            ORDER BY ai.display_order ASC
        `).all(req.params.id);

        res.json({ success: true, data: { ...album, images } });
    } catch (error) {
        console.error('Get album error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// POST /api/gallery/albums — admin
router.post('/albums', authenticateToken, requireAdmin, (req, res) => {
    const { title, description, cover_image_id, is_public, display_order } = req.body;
    if (!title) return res.status(400).json({ error: 'Titre requis' });

    const db = new Database(DB_PATH);
    try {
        const result = db.prepare(`
            INSERT INTO gallery_albums (title, description, cover_image_id, is_public, display_order, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(title, description || null, cover_image_id || null, is_public !== false ? 1 : 0, display_order || 0, req.user.id);
        const album = db.prepare('SELECT * FROM gallery_albums WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json({ success: true, data: album });
    } catch (error) {
        console.error('Create album error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// PUT /api/gallery/albums/:id — admin
router.put('/albums/:id', authenticateToken, requireAdmin, (req, res) => {
    const { title, description, cover_image_id, is_public, display_order } = req.body;
    if (!title) return res.status(400).json({ error: 'Titre requis' });

    const db = new Database(DB_PATH);
    try {
        const result = db.prepare(`
            UPDATE gallery_albums
            SET title = ?, description = ?, cover_image_id = ?, is_public = ?, display_order = ?
            WHERE id = ?
        `).run(title, description || null, cover_image_id || null, is_public !== false ? 1 : 0, display_order || 0, req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Album introuvable' });
        const album = db.prepare('SELECT * FROM gallery_albums WHERE id = ?').get(req.params.id);
        res.json({ success: true, data: album });
    } catch (error) {
        console.error('Update album error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// DELETE /api/gallery/albums/:id — admin
router.delete('/albums/:id', authenticateToken, requireAdmin, (req, res) => {
    const db = new Database(DB_PATH);
    try {
        const result = db.prepare('DELETE FROM gallery_albums WHERE id = ?').run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Album introuvable' });
        res.json({ success: true, message: 'Album supprimé' });
    } catch (error) {
        console.error('Delete album error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// POST /api/gallery/albums/:id/images — admin, add images to album
router.post('/albums/:id/images', authenticateToken, requireAdmin, (req, res) => {
    const { image_ids } = req.body; // array of image IDs
    if (!Array.isArray(image_ids) || image_ids.length === 0) {
        return res.status(400).json({ error: 'image_ids requis (tableau)' });
    }

    const db = new Database(DB_PATH);
    try {
        const album = db.prepare('SELECT id FROM gallery_albums WHERE id = ?').get(req.params.id);
        if (!album) return res.status(404).json({ error: 'Album introuvable' });

        // Get current max display_order
        const maxOrder = db.prepare('SELECT MAX(display_order) AS m FROM album_images WHERE album_id = ?').get(req.params.id);
        let order = (maxOrder.m || 0) + 1;

        const insert = db.prepare('INSERT OR IGNORE INTO album_images (album_id, image_id, display_order) VALUES (?, ?, ?)');
        const insertMany = db.transaction((ids) => {
            for (const imgId of ids) {
                insert.run(req.params.id, imgId, order++);
            }
        });
        insertMany(image_ids);

        res.json({ success: true, message: `${image_ids.length} image(s) ajoutée(s)` });
    } catch (error) {
        console.error('Add images to album error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// DELETE /api/gallery/albums/:albumId/images/:imageId — admin
router.delete('/albums/:albumId/images/:imageId', authenticateToken, requireAdmin, (req, res) => {
    const db = new Database(DB_PATH);
    try {
        const result = db.prepare('DELETE FROM album_images WHERE album_id = ? AND image_id = ?')
            .run(req.params.albumId, req.params.imageId);
        if (result.changes === 0) return res.status(404).json({ error: 'Image non trouvée dans cet album' });
        res.json({ success: true, message: 'Image retirée de l\'album' });
    } catch (error) {
        console.error('Remove image from album error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// GET /api/gallery/albums-admin — admin, list ALL albums (incl. private)
router.get('/albums-admin', authenticateToken, requireAdmin, (req, res) => {
    const db = new Database(DB_PATH);
    try {
        const albums = db.prepare(`
            SELECT ga.*, i.path AS cover_image_path, i.thumbnail_path AS cover_thumbnail,
                   (SELECT COUNT(*) FROM album_images ai WHERE ai.album_id = ga.id) AS image_count
            FROM gallery_albums ga
            LEFT JOIN images i ON ga.cover_image_id = i.id
            ORDER BY ga.display_order ASC, ga.created_at DESC
        `).all();
        res.json({ success: true, data: albums });
    } catch (error) {
        console.error('Get albums admin error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

module.exports = router;

// Made with Bob
