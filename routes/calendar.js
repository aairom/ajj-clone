const express = require('express');
const Database = require('better-sqlite3');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const DB_PATH = process.env.DB_PATH || './data/admin.db';

// Get all calendar events (public)
router.get('/', (req, res) => {
    const db = new Database(DB_PATH);

    try {
        const events = db.prepare(`
            SELECT id, title, description, date, created_at, updated_at
            FROM calendar_events
            ORDER BY date ASC
        `).all();

        res.json({ success: true, data: events });

    } catch (error) {
        console.error('Get calendar events error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// Get single calendar event (public)
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const db = new Database(DB_PATH);

    try {
        const event = db.prepare(`
            SELECT id, title, description, date, created_at, updated_at
            FROM calendar_events
            WHERE id = ?
        `).get(id);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ success: true, data: event });

    } catch (error) {
        console.error('Get calendar event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// Create calendar event (protected)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
    const { title, description, date } = req.body;
    const userId = req.user.id;

    if (!title || !description || !date) {
        return res.status(400).json({ error: 'Title, description, and date are required' });
    }

    const db = new Database(DB_PATH);

    try {
        const result = db.prepare(`
            INSERT INTO calendar_events (title, description, date, created_by)
            VALUES (?, ?, ?, ?)
        `).run(title, description, date, userId);

        const event = db.prepare(`
            SELECT id, title, description, date, created_at, updated_at
            FROM calendar_events
            WHERE id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json({ 
            success: true, 
            message: 'Event created successfully',
            data: event 
        });

    } catch (error) {
        console.error('Create calendar event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// Update calendar event (protected)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { title, description, date } = req.body;

    if (!title || !description || !date) {
        return res.status(400).json({ error: 'Title, description, and date are required' });
    }

    const db = new Database(DB_PATH);

    try {
        const result = db.prepare(`
            UPDATE calendar_events
            SET title = ?, description = ?, date = ?, updated_at = datetime('now')
            WHERE id = ?
        `).run(title, description, date, id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const event = db.prepare(`
            SELECT id, title, description, date, created_at, updated_at
            FROM calendar_events
            WHERE id = ?
        `).get(id);

        res.json({ 
            success: true, 
            message: 'Event updated successfully',
            data: event 
        });

    } catch (error) {
        console.error('Update calendar event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// Delete calendar event (protected)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = new Database(DB_PATH);

    try {
        const result = db.prepare(`
            DELETE FROM calendar_events WHERE id = ?
        `).run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ 
            success: true, 
            message: 'Event deleted successfully' 
        });

    } catch (error) {
        console.error('Delete calendar event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

module.exports = router;

// Made with Bob
