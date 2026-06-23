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
// API ENDPOINTS
// ============================================

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'DVARY MUSIC API is running!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// ============================================
// SEARCH MUSIC - iTunes API (Bure)
// ============================================
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    const limit = req.query.limit || 25;
    const apiKey = req.query.api_key;
    
    if (!query) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'Missing search query. Use ?q=artist+song' 
        });
    }
    
    // Check API key (kama unataka kuweka authentication)
    // Hii ni hiari - unaweza kuiweka au la
    /*
    if (!apiKey) {
        return res.status(401).json({
            status: 'error',
            message: 'API key required'
        });
    }
    */
    
    try {
        // iTunes API - BURE KABISA! Hakuna API key inahitajika
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
            genre: song.primaryGenreName || 'Unknown',
            releaseDate: song.releaseDate || ''
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

// ============================================
// GET SONG BY ID
// ============================================
app.get('/api/song/:id', async (req, res) => {
    const id = req.params.id;
    
    if (!id) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'Missing song ID' 
        });
    }
    
    try {
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
// GET TRENDING SONGS
// ============================================
app.get('/api/trending', async (req, res) => {
    try {
        // Tumia iTunes RSS feed kwa trending
        const response = await axios.get(
            'https://itunes.apple.com/us/rss/topsongs/limit=20/json'
        );
        
        const entries = response.data.feed?.entry || [];
        
        const formatted = entries.map((song, index) => ({
            id: song.id?.attributes?.['im:id'] || index,
            title: song['im:name']?.label || 'Unknown',
            artist: song['im:artist']?.label || 'Unknown Artist',
            artwork: song['im:image']?.[2]?.label || '',
            position: index + 1
        }));
        
        res.json({
            status: 'success',
            count: formatted.length,
            data: formatted
        });
        
    } catch (error) {
        console.error('Trending error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get trending songs'
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
// 404 HANDLER
// ============================================
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Endpoint not found'
    });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log('🚀 DVARY MUSIC API is running!');
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🔑 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('🎵 iTunes API: Bure kabisa!');
});
