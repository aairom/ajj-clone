const express = require('express');
const Database = require('better-sqlite3');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const DB_PATH = process.env.DB_PATH || './data/admin.db';

// GET all prices (public)
router.get('/', (req, res) => {
    const db = new Database(DB_PATH);
    try {
        const prices = db.prepare('SELECT id, type, price, updated_at FROM prices ORDER BY id ASC').all();
        res.json({ success: true, data: prices });
    } catch (error) {
        console.error('Get prices error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// PUT update a price by id (protected)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { price } = req.body;

    if (!price || !price.trim()) {
        return res.status(400).json({ error: 'Price value is required' });
    }

    const db = new Database(DB_PATH);
    try {
        const result = db.prepare(`
            UPDATE prices
            SET price = ?, updated_at = datetime('now')
            WHERE id = ?
        `).run(price.trim(), id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Price entry not found' });
        }

        const updated = db.prepare('SELECT id, type, price, updated_at FROM prices WHERE id = ?').get(id);
        res.json({ success: true, message: 'Prix mis à jour avec succès', data: updated });
    } catch (error) {
        console.error('Update price error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

module.exports = router;

// Made with Bob
