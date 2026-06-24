// ============================================
// FIREBASE CLOUD FUNCTIONS
// ============================================

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

// ============================================
// CREATE TOKEN - Cloud Function
// ============================================
exports.createMyToken = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        return {
            success: false,
            error: 'You must be logged in to generate a token.'
        };
    }
    
    const { username, userId, email } = data;
    
    if (!username || username.trim() === '') {
        return {
            success: false,
            error: 'Username is required.'
        };
    }
    
    try {
        // Generate unique token
        const token = generateSecureToken();
        
        // Save to Firestore
        const tokenData = {
            token: token,
            owner: username.trim(),
            userId: userId,
            email: email || 'unknown',
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: null, // Set expiry if needed
            requests: 0,
            limit: 1000
        };
        
        // Save to api_keys collection
        await db.collection('api_keys').doc(token).set(tokenData);
        
        // Also save to user's profile
        await db.collection('users').doc(userId).set({
            token: token,
            username: username.trim(),
            tokenCreatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        return {
            success: true,
            token: token,
            username: username.trim(),
            message: 'Token generated successfully!'
        };
        
    } catch (error) {
        console.error('Error creating token:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

// ============================================
// GENERATE SECURE TOKEN
// ============================================
function generateSecureToken() {
    const prefix = 'sk_live_';
    const length = 32;
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let token = prefix;
    
    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, chars.length);
        token += chars[randomIndex];
    }
    
    return token;
}

// ============================================
// VERIFY TOKEN - For API endpoints
// ============================================
exports.verifyToken = functions.https.onCall(async (data, context) => {
    const { token } = data;
    
    if (!token) {
        return {
            success: false,
            error: 'Token is required'
        };
    }
    
    try {
        const doc = await db.collection('api_keys').doc(token).get();
        
        if (!doc.exists) {
            return {
                success: false,
                error: 'Invalid token'
            };
        }
        
        const tokenData = doc.data();
        
        if (tokenData.status !== 'active') {
            return {
                success: false,
                error: 'Token is inactive'
            };
        }
        
        return {
            success: true,
            data: tokenData
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
});

// ============================================
// REVOKE TOKEN - For admin
// ============================================
exports.revokeToken = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        return {
            success: false,
            error: 'You must be logged in.'
        };
    }
    
    const { token } = data;
    
    if (!token) {
        return {
            success: false,
            error: 'Token is required'
        };
    }
    
    try {
        await db.collection('api_keys').doc(token).update({
            status: 'revoked',
            revokedAt: admin.firestore.FieldValue.serverTimestamp(),
            revokedBy: context.auth.uid
        });
        
        return {
            success: true,
            message: 'Token revoked successfully'
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
});
