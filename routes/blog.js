const express = require('express');
const Database = require('better-sqlite3');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const DB_PATH = process.env.DB_PATH || './data/admin.db';

function slugify(str) {
    return str
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// GET /api/blog/posts — public
router.get('/posts', (req, res) => {
    const { category, limit = 20, offset = 0 } = req.query;
    const db = new Database(DB_PATH);
    try {
        let query = `
            SELECT bp.id, bp.title, bp.slug, bp.excerpt, bp.featured_image,
                   bp.published_at, bp.views, bp.created_at, u.full_name AS author_name
            FROM blog_posts bp
            LEFT JOIN users u ON bp.author_id = u.id
            WHERE bp.status = 'published'
        `;
        const params = [];

        if (category) {
            query += ` AND bp.id IN (
                SELECT pc.post_id FROM post_categories pc
                JOIN blog_categories bc ON pc.category_id = bc.id
                WHERE bc.slug = ?
            )`;
            params.push(category);
        }

        query += ' ORDER BY bp.published_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const posts = db.prepare(query).all(...params);
        const total = db.prepare("SELECT COUNT(*) AS cnt FROM blog_posts WHERE status = 'published'").get();
        res.json({ success: true, data: posts, total: total.cnt });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// GET /api/blog/posts/:slug — public, single post + increment views
router.get('/posts/:slug', (req, res) => {
    const db = new Database(DB_PATH);
    try {
        const post = db.prepare(`
            SELECT bp.*, u.full_name AS author_name
            FROM blog_posts bp
            LEFT JOIN users u ON bp.author_id = u.id
            WHERE bp.slug = ? AND bp.status = 'published'
        `).get(req.params.slug);
        if (!post) return res.status(404).json({ error: 'Article introuvable' });

        // Increment view count
        db.prepare('UPDATE blog_posts SET views = views + 1 WHERE id = ?').run(post.id);

        // Get categories
        const categories = db.prepare(`
            SELECT bc.id, bc.name, bc.slug FROM blog_categories bc
            JOIN post_categories pc ON bc.id = pc.category_id
            WHERE pc.post_id = ?
        `).all(post.id);

        // Get approved comments
        const comments = db.prepare(`
            SELECT id, author_name, content, created_at FROM blog_comments
            WHERE post_id = ? AND status = 'approved'
            ORDER BY created_at ASC
        `).all(post.id);

        res.json({ success: true, data: { ...post, categories, comments } });
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// GET /api/blog/categories — public
router.get('/categories', (req, res) => {
    const db = new Database(DB_PATH);
    try {
        const categories = db.prepare('SELECT * FROM blog_categories ORDER BY name ASC').all();
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// POST /api/blog/posts/:slug/comments — public
router.post('/posts/:slug/comments', (req, res) => {
    const { author_name, author_email, content } = req.body;
    if (!author_name || !author_email || !content) {
        return res.status(400).json({ error: 'Nom, email et commentaire requis' });
    }

    const db = new Database(DB_PATH);
    try {
        const post = db.prepare("SELECT id FROM blog_posts WHERE slug = ? AND status = 'published'").get(req.params.slug);
        if (!post) return res.status(404).json({ error: 'Article introuvable' });

        db.prepare(`
            INSERT INTO blog_comments (post_id, author_name, author_email, content)
            VALUES (?, ?, ?, ?)
        `).run(post.id, author_name, author_email, content);

        res.status(201).json({ success: true, message: 'Commentaire soumis pour modération' });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// POST /api/blog/posts — admin
router.post('/posts', authenticateToken, requireAdmin, (req, res) => {
    const { title, excerpt, content, featured_image, status, category_ids } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Titre et contenu requis' });

    const db = new Database(DB_PATH);
    try {
        let slug = slugify(title);
        // Ensure unique slug
        let existing = db.prepare('SELECT id FROM blog_posts WHERE slug = ?').get(slug);
        if (existing) slug = `${slug}-${Date.now()}`;

        const published_at = status === 'published' ? new Date().toISOString() : null;

        const result = db.prepare(`
            INSERT INTO blog_posts (title, slug, excerpt, content, featured_image, author_id, status, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(title, slug, excerpt || null, content, featured_image || null, req.user.id, status || 'draft', published_at);

        const postId = result.lastInsertRowid;

        // Link categories
        if (Array.isArray(category_ids) && category_ids.length > 0) {
            const insertCat = db.prepare('INSERT OR IGNORE INTO post_categories (post_id, category_id) VALUES (?, ?)');
            const tx = db.transaction((ids) => ids.forEach(cid => insertCat.run(postId, cid)));
            tx(category_ids);
        }

        const post = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(postId);
        res.status(201).json({ success: true, data: post });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// PUT /api/blog/posts/:id — admin
router.put('/posts/:id', authenticateToken, requireAdmin, (req, res) => {
    const { title, excerpt, content, featured_image, status, category_ids } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Titre et contenu requis' });

    const db = new Database(DB_PATH);
    try {
        const existing = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Article introuvable' });

        const published_at = status === 'published' && !existing.published_at
            ? new Date().toISOString()
            : existing.published_at;

        db.prepare(`
            UPDATE blog_posts SET title = ?, excerpt = ?, content = ?, featured_image = ?,
                status = ?, published_at = ?, updated_at = datetime('now')
            WHERE id = ?
        `).run(title, excerpt || null, content, featured_image || null, status || 'draft', published_at, req.params.id);

        // Sync categories
        if (Array.isArray(category_ids)) {
            db.prepare('DELETE FROM post_categories WHERE post_id = ?').run(req.params.id);
            const insertCat = db.prepare('INSERT OR IGNORE INTO post_categories (post_id, category_id) VALUES (?, ?)');
            const tx = db.transaction((ids) => ids.forEach(cid => insertCat.run(req.params.id, cid)));
            tx(category_ids);
        }

        const post = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.id);
        res.json({ success: true, data: post });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// DELETE /api/blog/posts/:id — admin
router.delete('/posts/:id', authenticateToken, requireAdmin, (req, res) => {
    const db = new Database(DB_PATH);
    try {
        const result = db.prepare('DELETE FROM blog_posts WHERE id = ?').run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Article introuvable' });
        res.json({ success: true, message: 'Article supprimé' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// GET /api/blog/comments — admin, list pending comments
router.get('/comments', authenticateToken, requireAdmin, (req, res) => {
    const db = new Database(DB_PATH);
    try {
        const comments = db.prepare(`
            SELECT bc.*, bp.title AS post_title, bp.slug AS post_slug
            FROM blog_comments bc
            JOIN blog_posts bp ON bc.post_id = bp.id
            ORDER BY bc.created_at DESC
        `).all();
        res.json({ success: true, data: comments });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// PUT /api/blog/comments/:id/approve — admin
router.put('/comments/:id/approve', authenticateToken, requireAdmin, (req, res) => {
    const db = new Database(DB_PATH);
    try {
        const result = db.prepare("UPDATE blog_comments SET status = 'approved' WHERE id = ?").run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Commentaire introuvable' });
        res.json({ success: true, message: 'Commentaire approuvé' });
    } catch (error) {
        console.error('Approve comment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// DELETE /api/blog/comments/:id — admin
router.delete('/comments/:id', authenticateToken, requireAdmin, (req, res) => {
    const db = new Database(DB_PATH);
    try {
        const result = db.prepare('DELETE FROM blog_comments WHERE id = ?').run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Commentaire introuvable' });
        res.json({ success: true, message: 'Commentaire supprimé' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// POST /api/blog/categories — admin
router.post('/categories', authenticateToken, requireAdmin, (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nom requis' });

    const db = new Database(DB_PATH);
    try {
        const slug = slugify(name);
        const result = db.prepare('INSERT INTO blog_categories (name, slug) VALUES (?, ?)').run(name, slug);
        const cat = db.prepare('SELECT * FROM blog_categories WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json({ success: true, data: cat });
    } catch (error) {
        if (error.message.includes('UNIQUE')) return res.status(409).json({ error: 'Catégorie déjà existante' });
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

// DELETE /api/blog/categories/:id — admin
router.delete('/categories/:id', authenticateToken, requireAdmin, (req, res) => {
    const db = new Database(DB_PATH);
    try {
        const result = db.prepare('DELETE FROM blog_categories WHERE id = ?').run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Catégorie introuvable' });
        res.json({ success: true, message: 'Catégorie supprimée' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        db.close();
    }
});

module.exports = router;

// Made with Bob
