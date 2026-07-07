const express = require('express');
const Database = require('better-sqlite3');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const DB_PATH = process.env.DB_PATH || './data/admin.db';

function getTransporter() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return null;
    return nodemailer.createTransporter({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
    });
}

// POST /api/newsletter/subscribe — public
router.post('/subscribe', (req, res) => {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis' });

    const db = new Database(DB_PATH);
    try {
        const token = uuidv4();
        const existing = db.prepare('SELECT id, status FROM newsletter_subscribers WHERE email = ?').get(email);
        if (existing) {
            if (existing.status === 'active') {
                return res.json({ success: true, message: 'Vous êtes déjà inscrit(e).' });
            }
            // Reactivate
            db.prepare('UPDATE newsletter_subscribers SET status = ?, name = ?, token = ? WHERE email = ?')
              .run('active', name || null, token, email);
        } else {
            db.prepare('INSERT INTO newsletter_subscribers (email, name, token) VALUES (?, ?, ?)')
              .run(email, name || null, token);
        }

        // Optionally send verification email
        const transporter = getTransporter();
        if (transporter) {
            const unsubUrl = `${process.env.SITE_URL || 'http://localhost:3000'}/api/newsletter/unsubscribe?token=${token}`;
            transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Confirmation d\'inscription à la newsletter - Asnières Jujitsu',
                html: `<p>Bonjour ${name || ''},</p><p>Votre inscription est confirmée.</p><p><a href="${unsubUrl}">Se désinscrire</a></p>`
            }).catch(err => console.error('Email send error:', err));
        }

        res.status(201).json({ success: true, message: 'Inscription réussie !' });
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// GET /api/newsletter/unsubscribe?token=xxx — public
router.get('/unsubscribe', (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token requis' });

    const db = new Database(DB_PATH);
    try {
        const result = db.prepare('UPDATE newsletter_subscribers SET status = ? WHERE token = ?')
            .run('unsubscribed', token);
        if (result.changes === 0) return res.status(404).json({ error: 'Abonné introuvable' });
        res.json({ success: true, message: 'Vous avez été désinscrit(e).' });
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// GET /api/newsletter/subscribers — admin
router.get('/subscribers', authenticateToken, requireAdmin, (req, res) => {
    const db = new Database(DB_PATH);
    try {
        const subscribers = db.prepare(
            'SELECT id, email, name, status, subscribed_at FROM newsletter_subscribers ORDER BY subscribed_at DESC'
        ).all();
        res.json({ success: true, data: subscribers });
    } catch (error) {
        console.error('Get subscribers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// DELETE /api/newsletter/subscribers/:id — admin
router.delete('/subscribers/:id', authenticateToken, requireAdmin, (req, res) => {
    const db = new Database(DB_PATH);
    try {
        const result = db.prepare('DELETE FROM newsletter_subscribers WHERE id = ?').run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Abonné introuvable' });
        res.json({ success: true, message: 'Abonné supprimé' });
    } catch (error) {
        console.error('Delete subscriber error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// POST /api/newsletter/campaigns — admin
router.post('/campaigns', authenticateToken, requireAdmin, (req, res) => {
    const { subject, html_content } = req.body;
    if (!subject || !html_content) return res.status(400).json({ error: 'Sujet et contenu requis' });

    const db = new Database(DB_PATH);
    try {
        const result = db.prepare(
            'INSERT INTO newsletter_campaigns (subject, html_content, created_by) VALUES (?, ?, ?)'
        ).run(subject, html_content, req.user.id);
        const campaign = db.prepare('SELECT * FROM newsletter_campaigns WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json({ success: true, data: campaign });
    } catch (error) {
        console.error('Create campaign error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// GET /api/newsletter/campaigns — admin
router.get('/campaigns', authenticateToken, requireAdmin, (req, res) => {
    const db = new Database(DB_PATH);
    try {
        const campaigns = db.prepare('SELECT * FROM newsletter_campaigns ORDER BY created_at DESC').all();
        res.json({ success: true, data: campaigns });
    } catch (error) {
        console.error('Get campaigns error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// POST /api/newsletter/campaigns/:id/send — admin
router.post('/campaigns/:id/send', authenticateToken, requireAdmin, async (req, res) => {
    const db = new Database(DB_PATH);
    try {
        const campaign = db.prepare('SELECT * FROM newsletter_campaigns WHERE id = ?').get(req.params.id);
        if (!campaign) return res.status(404).json({ error: 'Campagne introuvable' });

        const subscribers = db.prepare(
            "SELECT email, name FROM newsletter_subscribers WHERE status = 'active'"
        ).all();

        if (subscribers.length === 0) {
            return res.json({ success: true, message: 'Aucun abonné actif', sent: 0 });
        }

        const transporter = getTransporter();
        if (!transporter) {
            return res.status(503).json({ error: 'Email non configuré (EMAIL_USER / EMAIL_PASSWORD manquant)' });
        }

        let sent = 0;
        for (const sub of subscribers) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: sub.email,
                    subject: campaign.subject,
                    html: campaign.html_content
                });
                sent++;
            } catch (e) {
                console.error(`Email to ${sub.email} failed:`, e.message);
            }
        }

        db.prepare('UPDATE newsletter_campaigns SET status = ?, sent_at = datetime(\'now\') WHERE id = ?')
          .run('sent', req.params.id);

        res.json({ success: true, message: `Campagne envoyée à ${sent} abonné(s)`, sent });
    } catch (error) {
        console.error('Send campaign error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

module.exports = router;

// Made with Bob
