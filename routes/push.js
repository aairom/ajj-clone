const express = require('express');
const Database = require('better-sqlite3');
const webpush = require('web-push');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const DB_PATH = process.env.DB_PATH || './data/admin.db';

// Configure VAPID — keys are read from env (generated on first use by a helper script)
function configureVapid() {
    const publicKey  = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject    = process.env.VAPID_SUBJECT || 'mailto:asnieresjujitsu@gmail.com';
    if (publicKey && privateKey) {
        webpush.setVapidDetails(subject, publicKey, privateKey);
        return true;
    }
    return false;
}

const vapidReady = configureVapid();

// GET /api/push/vapid-public-key — public
router.get('/vapid-public-key', (req, res) => {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) return res.status(503).json({ error: 'VAPID non configuré' });
    res.json({ success: true, publicKey: key });
});

// POST /api/push/subscribe — public, save push subscription
router.post('/subscribe', (req, res) => {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        return res.status(400).json({ error: 'Subscription invalide' });
    }

    const db = new Database(DB_PATH);
    try {
        db.prepare(`
            INSERT OR REPLACE INTO push_subscriptions (endpoint, p256dh, auth, user_agent)
            VALUES (?, ?, ?, ?)
        `).run(endpoint, keys.p256dh, keys.auth, req.headers['user-agent'] || '');
        res.status(201).json({ success: true, message: 'Abonnement enregistré' });
    } catch (error) {
        console.error('Push subscribe error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// DELETE /api/push/unsubscribe — public, remove subscription by endpoint
router.delete('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'Endpoint requis' });

    const db = new Database(DB_PATH);
    try {
        db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
        res.json({ success: true, message: 'Désabonnement effectué' });
    } catch (error) {
        console.error('Push unsubscribe error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// POST /api/push/send — admin, send to all subscribers
router.post('/send', authenticateToken, requireAdmin, async (req, res) => {
    if (!vapidReady && !configureVapid()) {
        return res.status(503).json({ error: 'VAPID non configuré (ajoutez VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY dans .env)' });
    }

    const { title, body, url, icon } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Titre et corps requis' });

    const db = new Database(DB_PATH);
    try {
        const subscriptions = db.prepare('SELECT * FROM push_subscriptions').all();
        if (subscriptions.length === 0) {
            return res.json({ success: true, message: 'Aucun abonné push', sent: 0 });
        }

        const payload = JSON.stringify({ title, body, url: url || '/', icon: icon || '/favicon.ico' });
        let sent = 0;
        const toRemove = [];

        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    payload
                );
                sent++;
            } catch (err) {
                // 410 Gone = subscription expired; remove it
                if (err.statusCode === 410 || err.statusCode === 404) {
                    toRemove.push(sub.endpoint);
                } else {
                    console.error(`Push to ${sub.endpoint} failed:`, err.message);
                }
            }
        }

        // Remove expired subscriptions
        if (toRemove.length > 0) {
            const del = db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?');
            const delMany = db.transaction((eps) => eps.forEach(ep => del.run(ep)));
            delMany(toRemove);
        }

        // Log the notification
        db.prepare(`
            INSERT INTO push_notifications (title, body, url, icon, sent_by, recipient_count)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(title, body, url || null, icon || null, req.user.id, sent);

        res.json({ success: true, message: `Notification envoyée à ${sent} abonné(s)`, sent });
    } catch (error) {
        console.error('Push send error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// GET /api/push/notifications — admin, history
router.get('/notifications', authenticateToken, requireAdmin, (req, res) => {
    const db = new Database(DB_PATH);
    try {
        const notifications = db.prepare('SELECT * FROM push_notifications ORDER BY sent_at DESC LIMIT 50').all();
        res.json({ success: true, data: notifications });
    } catch (error) {
        console.error('Get push notifications error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

module.exports = router;

// Made with Bob
