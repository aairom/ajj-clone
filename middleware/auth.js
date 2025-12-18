const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './data/admin.db';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        // Check if token is blacklisted (user logged out)
        const db = new Database(DB_PATH);
        const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
        
        const session = db.prepare(`
            SELECT id FROM sessions 
            WHERE token_hash = ? AND expires_at > datetime('now')
        `).get(tokenHash);

        db.close();

        if (!session) {
            return res.status(403).json({ error: 'Token has been revoked' });
        }

        req.user = user;
        next();
    });
}

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

module.exports = {
    authenticateToken,
    requireAdmin
};

// Made with Bob
