const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const DB_PATH = process.env.DB_PATH || './data/admin.db';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Login endpoint
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const db = new Database(DB_PATH);

    try {
        // Get user from database
        const user = db.prepare(`
            SELECT id, username, password_hash, email, full_name, role, is_active
            FROM users
            WHERE username = ?
        `).get(username);

        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is disabled' });
        }

        // Verify password
        const passwordMatch = bcrypt.compareSync(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Store session in database
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        db.prepare(`
            INSERT INTO sessions (user_id, token_hash, expires_at)
            VALUES (?, ?, ?)
        `).run(user.id, tokenHash, expiresAt.toISOString());

        // Update last login
        db.prepare(`
            UPDATE users 
            SET last_login = datetime('now')
            WHERE id = ?
        `).run(user.id);

        // Clean up expired sessions
        db.prepare(`
            DELETE FROM sessions 
            WHERE expires_at < datetime('now')
        `).run();

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// Logout endpoint
router.post('/logout', authenticateToken, (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(400).json({ error: 'Token required' });
    }

    const db = new Database(DB_PATH);

    try {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Remove session from database
        db.prepare(`
            DELETE FROM sessions 
            WHERE token_hash = ?
        `).run(tokenHash);

        res.json({ success: true, message: 'Logged out successfully' });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
    res.json({ 
        success: true, 
        user: req.user 
    });
});

// Change password endpoint
router.post('/change-password', authenticateToken, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const db = new Database(DB_PATH);

    try {
        // Get current password hash
        const user = db.prepare(`
            SELECT password_hash FROM users WHERE id = ?
        `).get(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const passwordMatch = bcrypt.compareSync(currentPassword, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const newPasswordHash = bcrypt.hashSync(newPassword, 10);

        // Update password
        db.prepare(`
            UPDATE users 
            SET password_hash = ?, updated_at = datetime('now')
            WHERE id = ?
        `).run(newPasswordHash, userId);

        // Invalidate all sessions for this user (force re-login)
        db.prepare(`
            DELETE FROM sessions WHERE user_id = ?
        `).run(userId);

        res.json({ 
            success: true, 
            message: 'Password changed successfully. Please login again.' 
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

module.exports = router;

// Made with Bob
