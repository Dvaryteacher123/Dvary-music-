const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Kutoa index.html

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Chatbot endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // System prompt - kumjulisha AI kuhusu app yako
        const prompt = `
        Wewe ni msaidizi wa Dvary Music Hub. Unajua kuwa:
        - Hii ni app ya muziki ambapo watu wanaweza kutafuta nyimbo
        - Wanaweza kucheza, kupakua, na kuhifadhi nyimbo kwenye favorites
        - Ina channel ya WhatsApp: https://whatsapp.com/channel/0029VbCRC9b5fM5cruU8PF2M
        - Inatengenezwa na Dvary Hub, wanaotengeneza apps kwa bei nafuu
        
        Jibu swali hili kwa Kiswahili au Kiingereza kulingana na lugha ya swali:
        "${message}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
