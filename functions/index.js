const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();

// Function 1: Inatengeneza token mpya kwa mteja anayesajili jina lake
exports.registerUser = functions.https.onRequest(async (req, res) => {
    const name = req.body.name;
    
    if (!name) {
        return res.status(400).send({ error: "Tafadhali weka jina lako (name)." });
    }

    // Kutengeneza token ndefu na salama
    const newToken = 'dvary_' + crypto.randomBytes(32).toString('hex');

    try {
        // Hifadhi token kwenye Firestore
        await admin.firestore().collection('api_keys').add({
            token: newToken,
            owner: name,
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).send({ message: "Token imetengenezwa!", token: newToken });
    } catch (error) {
        res.status(500).send({ error: "Imeshindwa kuhifadhi token." });
    }
});

// Function 2: Inakagua kama token ya mteja ni sahihi na bado 'active'
exports.checkToken = functions.https.onRequest(async (req, res) => {
    const userToken = req.headers.authorization;

    if (!userToken) {
        return res.status(401).send({ error: "Token inahitajika!" });
    }

    // Kagua kwenye Firestore
    const snapshot = await admin.firestore().collection('api_keys')
        .where('token', '==', userToken)
        .where('status', '==', 'active')
        .get();

    if (snapshot.empty) {
        return res.status(403).send({ error: "Token siyo sahihi au imefungiwa!" });
    }

    res.status(200).send({ status: "Success", message: "Token ni sahihi, karibu!" });
});

