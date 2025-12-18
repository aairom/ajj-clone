const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { upload, uploadsDir, thumbnailsDir } = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');

const db = new Database(process.env.DB_PATH || './data/admin.db');

// Upload single image
router.post('/upload', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Aucun fichier fourni'
            });
        }

        const { alt_text, category } = req.body;
        const file = req.file;

        // Generate thumbnail
        const thumbnailFilename = `thumb_${file.filename}`;
        const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

        await sharp(file.path)
            .resize(300, 300, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .toFile(thumbnailPath);

        // Save to database
        const stmt = db.prepare(`
            INSERT INTO images (filename, original_name, mime_type, size, path, thumbnail_path, alt_text, category, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            file.filename,
            file.originalname,
            file.mimetype,
            file.size,
            `/uploads/${file.filename}`,
            `/uploads/thumbnails/${thumbnailFilename}`,
            alt_text || '',
            category || 'general',
            req.user.id
        );

        res.json({
            success: true,
            message: 'Image téléchargée avec succès',
            image: {
                id: result.lastInsertRowid,
                filename: file.filename,
                original_name: file.originalname,
                path: `/uploads/${file.filename}`,
                thumbnail_path: `/uploads/thumbnails/${thumbnailFilename}`,
                size: file.size,
                mime_type: file.mimetype
            }
        });

    } catch (error) {
        console.error('Error uploading image:', error);
        
        // Clean up uploaded file if database insert fails
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
                const thumbnailPath = path.join(thumbnailsDir, `thumb_${req.file.filename}`);
                if (fs.existsSync(thumbnailPath)) {
                    fs.unlinkSync(thumbnailPath);
                }
            } catch (cleanupError) {
                console.error('Error cleaning up files:', cleanupError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Erreur lors du téléchargement de l\'image'
        });
    }
});

// Upload multiple images
router.post('/upload-multiple', authenticateToken, upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Aucun fichier fourni'
            });
        }

        const { category } = req.body;
        const uploadedImages = [];

        for (const file of req.files) {
            try {
                // Generate thumbnail
                const thumbnailFilename = `thumb_${file.filename}`;
                const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

                await sharp(file.path)
                    .resize(300, 300, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .toFile(thumbnailPath);

                // Save to database
                const stmt = db.prepare(`
                    INSERT INTO images (filename, original_name, mime_type, size, path, thumbnail_path, category, uploaded_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `);

                const result = stmt.run(
                    file.filename,
                    file.originalname,
                    file.mimetype,
                    file.size,
                    `/uploads/${file.filename}`,
                    `/uploads/thumbnails/${thumbnailFilename}`,
                    category || 'general',
                    req.user.id
                );

                uploadedImages.push({
                    id: result.lastInsertRowid,
                    filename: file.filename,
                    original_name: file.originalname,
                    path: `/uploads/${file.filename}`,
                    thumbnail_path: `/uploads/thumbnails/${thumbnailFilename}`
                });

            } catch (error) {
                console.error(`Error processing file ${file.originalname}:`, error);
                // Continue with other files
            }
        }

        res.json({
            success: true,
            message: `${uploadedImages.length} image(s) téléchargée(s) avec succès`,
            images: uploadedImages
        });

    } catch (error) {
        console.error('Error uploading multiple images:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du téléchargement des images'
        });
    }
});

// Get all images
router.get('/', authenticateToken, (req, res) => {
    try {
        const { category, limit = 50, offset = 0 } = req.query;

        let query = 'SELECT * FROM images';
        const params = [];

        if (category) {
            query += ' WHERE category = ?';
            params.push(category);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const images = db.prepare(query).all(...params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM images';
        if (category) {
            countQuery += ' WHERE category = ?';
        }
        const { total } = db.prepare(countQuery).get(category ? category : undefined);

        res.json({
            success: true,
            images,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + parseInt(limit)) < total
            }
        });

    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des images'
        });
    }
});

// Get single image
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const image = db.prepare('SELECT * FROM images WHERE id = ?').get(req.params.id);

        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image non trouvée'
            });
        }

        res.json({
            success: true,
            image
        });

    } catch (error) {
        console.error('Error fetching image:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'image'
        });
    }
});

// Update image metadata
router.put('/:id', authenticateToken, (req, res) => {
    try {
        const { alt_text, category } = req.body;

        const stmt = db.prepare(`
            UPDATE images 
            SET alt_text = ?, category = ?
            WHERE id = ?
        `);

        const result = stmt.run(alt_text, category, req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Image non trouvée'
            });
        }

        res.json({
            success: true,
            message: 'Image mise à jour avec succès'
        });

    } catch (error) {
        console.error('Error updating image:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'image'
        });
    }
});

// Delete image
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        // Get image info
        const image = db.prepare('SELECT * FROM images WHERE id = ?').get(req.params.id);

        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image non trouvée'
            });
        }

        // Delete from database
        db.prepare('DELETE FROM images WHERE id = ?').run(req.params.id);

        // Delete files
        try {
            const imagePath = path.join(uploadsDir, image.filename);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }

            if (image.thumbnail_path) {
                const thumbnailFilename = path.basename(image.thumbnail_path);
                const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
                if (fs.existsSync(thumbnailPath)) {
                    fs.unlinkSync(thumbnailPath);
                }
            }
        } catch (fileError) {
            console.error('Error deleting files:', fileError);
            // Continue even if file deletion fails
        }

        res.json({
            success: true,
            message: 'Image supprimée avec succès'
        });

    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'image'
        });
    }
});

module.exports = router;

// Made with Bob
