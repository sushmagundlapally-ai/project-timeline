/**
 * Project Timeline - Backend Server
 * 
 * Created by: Sushma Gundlapally
 * Copyright © 2025 Sushma Gundlapally. All rights reserved.
 * 
 * Enterprise-ready Node.js server with MongoDB integration
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import routes
const programRoutes = require('./routes/programs');
const workstreamRoutes = require('./routes/workstreams');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/programs', programRoutes);
app.use('/api/workstreams', workstreamRoutes);
app.use('/api/tasks', taskRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/project-timeline';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('✅ Connected to MongoDB');
    console.log(`   Database: ${mongoose.connection.name}`);
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
});

// Handle MongoDB events
mongoose.connection.on('error', err => {
    console.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║           PROJECT TIMELINE SERVER                          ║
║           Created by Sushma Gundlapally                    ║
╠═══════════════════════════════════════════════════════════╣
║  🚀 Server running on port ${PORT}                            ║
║  📊 API: http://localhost:${PORT}/api                         ║
║  🏥 Health: http://localhost:${PORT}/api/health               ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;

