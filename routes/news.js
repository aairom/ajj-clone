const express = require('express');
const Database = require('better-sqlite3');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const DB_PATH = process.env.DB_PATH || './data/admin.db';

// Get all news (public)
router.get('/', (req, res) => {
    const db = new Database(DB_PATH);

    try {
        const news = db.prepare(`
            SELECT id, title, content, date, image, created_at, updated_at
            FROM news
            ORDER BY date DESC
        `).all();

        res.json({ success: true, data: news });

    } catch (error) {
        console.error('Get news error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// Get single news item (public)
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const db = new Database(DB_PATH);

    try {
        const newsItem = db.prepare(`
            SELECT id, title, content, date, image, created_at, updated_at
            FROM news
            WHERE id = ?
        `).get(id);

        if (!newsItem) {
            return res.status(404).json({ error: 'News item not found' });
        }

        res.json({ success: true, data: newsItem });

    } catch (error) {
        console.error('Get news item error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// Create news (protected)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
    const { title, content, date, image } = req.body;
    const userId = req.user.id;

    if (!title || !content || !date) {
        return res.status(400).json({ error: 'Title, content, and date are required' });
    }

    const db = new Database(DB_PATH);

    try {
        const result = db.prepare(`
            INSERT INTO news (title, content, date, image, created_by)
            VALUES (?, ?, ?, ?, ?)
        `).run(title, content, date, image || null, userId);

        const newsItem = db.prepare(`
            SELECT id, title, content, date, image, created_at, updated_at
            FROM news
            WHERE id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json({ 
            success: true, 
            message: 'News created successfully',
            data: newsItem 
        });

    } catch (error) {
        console.error('Create news error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// Update news (protected)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { title, content, date, image } = req.body;

    if (!title || !content || !date) {
        return res.status(400).json({ error: 'Title, content, and date are required' });
    }

    const db = new Database(DB_PATH);

    try {
        const result = db.prepare(`
            UPDATE news
            SET title = ?, content = ?, date = ?, image = ?, updated_at = datetime('now')
            WHERE id = ?
        `).run(title, content, date, image || null, id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'News item not found' });
        }

        const newsItem = db.prepare(`
            SELECT id, title, content, date, image, created_at, updated_at
            FROM news
            WHERE id = ?
        `).get(id);

        res.json({ 
            success: true, 
            message: 'News updated successfully',
            data: newsItem 
        });

    } catch (error) {
        console.error('Update news error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// Delete news (protected)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = new Database(DB_PATH);

    try {
        const result = db.prepare(`
            DELETE FROM news WHERE id = ?
        `).run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'News item not found' });
        }

        res.json({ 
            success: true, 
            message: 'News deleted successfully' 
        });

    } catch (error) {
        console.error('Delete news error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

module.exports = router;

// Made with Bob
