const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const calendarRoutes = require('./routes/calendar');
const contactRoutes = require('./routes/contact');
const imagesRoutes = require('./routes/images');
const pricesRoutes = require('./routes/prices');
const newsletterRoutes = require('./routes/newsletter');
const galleryRoutes = require('./routes/gallery');
const pushRoutes = require('./routes/push');
const blogRoutes = require('./routes/blog');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting — applied to API routes only, not static files
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 API requests per 15 min per IP
    message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 login attempts per 15 min per IP
    message: 'Too many login attempts, please try again later.'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files BEFORE rate limiter so they don't consume the quota
app.use(express.static(path.join(__dirname)));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes — rate limiter applied only here
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/news', limiter, newsRoutes);
app.use('/api/calendar', limiter, calendarRoutes);
app.use('/api/contact', limiter, contactRoutes);
app.use('/api/images', limiter, imagesRoutes);
app.use('/api/prices', limiter, pricesRoutes);
app.use('/api/newsletter', limiter, newsletterRoutes);
app.use('/api/gallery', limiter, galleryRoutes);
app.use('/api/push', limiter, pushRoutes);
app.use('/api/blog', limiter, blogRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve admin pages
app.get('/admin/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.get('/admin/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

// Serve Pages/ sub-pages
const subPages = [
    'remise-en-forme',
    'comite-directeur',
    'quest-ce-que-le-ju-jitsu',
    '5-bonnes-raisons',
    'faq',
    'blog',
    'blog-post',
];
subPages.forEach(page => {
    app.get(`/Pages/${page}.html`, (req, res) => {
        res.sendFile(path.join(__dirname, 'Pages', `${page}.html`));
    });
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🥋 Asnières Jujitsu Admin System                    ║
║                                                        ║
║   Server running on: http://localhost:${PORT}         ║
║   Environment: ${process.env.NODE_ENV || 'development'}                      ║
║                                                        ║
║   Admin Login: http://localhost:${PORT}/admin/login.html  ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

// Made with Bob
