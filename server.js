const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Angalia kama API key ipo
console.log('🔑 API Key exists:', !!process.env.GEMINI_API_KEY);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ MODEL ILIYOREKEBISHWA
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post('/api/chat', async (req, res) => {
    try {
        const { message, language } = req.body;
        console.log('📩 Message:', message);

        const prompt = `
        Wewe ni msaidizi wa Dvary Music Hub. 
        - Unajua kuwa app hii inasaidia kutafuta, kucheza, na kuhifadhi nyimbo.
        - Ina channel ya WhatsApp: https://whatsapp.com/channel/0029VbCRC9b5fM5cruU8PF2M
        - Inatengenezwa na Dvary Hub.
        
        Jibu swali kwa ${language === 'en' ? 'Kiingereza' : 'Kiswahili'}.
        Swali: ${message}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });
    } catch (error) {
        console.error('❌ Chat error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
