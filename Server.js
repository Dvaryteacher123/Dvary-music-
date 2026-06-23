// ============================================
// DVARY MUSIC API - Backend Server
// ============================================

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ============================================
// FIREBASE CONFIG (Inasoma kutoka .env)
// ============================================
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// ============================================
// API ENDPOINTS
// ============================================

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'DVARY MUSIC API is running!',
        timestamp: new Date().toISOString()
    });
});

// Search Music - iTunes API (Bure, haihitaji API key)
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    const limit = req.query.limit || 25;
    
    if (!query) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'Missing search query. Use ?q=artist+song' 
        });
    }
    
    try {
        const response = await axios.get(
            `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=${limit}`
        );
        
        const results = response.data.results || [];
        
        // Format response
        const formatted = results.map(song => ({
            id: song.trackId,
            title: song.trackName || 'Unknown',
            artist: song.artistName || 'Unknown Artist',
            album: song.collectionName || 'Unknown Album',
            preview_url: song.previewUrl || '',
            artwork: song.artworkUrl100 || '',
            duration: song.trackTimeMillis || 0,
            genre: song.primaryGenreName || 'Unknown'
        }));
        
        res.json({
            status: 'success',
            count: formatted.length,
            data: formatted
        });
        
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to search music'
        });
    }
});

// Get Song Details
app.get('/api/song/:id', async (req, res) => {
    const id = req.params.id;
    
    if (!id) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'Missing song ID' 
        });
    }
    
    try {
        // Lookup by ID
        const response = await axios.get(
            `https://itunes.apple.com/lookup?id=${id}&entity=song`
        );
        
        const result = response.data.results?.[0];
        
        if (!result) {
            return res.status(404).json({
                status: 'error',
                message: 'Song not found'
            });
        }
        
        res.json({
            status: 'success',
            data: {
                id: result.trackId,
                title: result.trackName || 'Unknown',
                artist: result.artistName || 'Unknown Artist',
                album: result.collectionName || 'Unknown Album',
                preview_url: result.previewUrl || '',
                artwork: result.artworkUrl100 || '',
                duration: result.trackTimeMillis || 0,
                genre: result.primaryGenreName || 'Unknown',
                releaseDate: result.releaseDate || ''
            }
        });
        
    } catch (error) {
        console.error('Song lookup error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get song details'
        });
    }
});

// ============================================
// SERVE FRONTEND
// ============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log('🚀 DVARY MUSIC API is running!');
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🔑 Firebase API Key: ${process.env.FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
