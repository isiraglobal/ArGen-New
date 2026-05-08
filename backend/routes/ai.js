const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

router.post('/ask', async (req, res) => {
    try {
        const { messages } = req.body;
        
        if (!process.env.AI_API_KEY) {
            return res.status(500).json({ message: 'AI Service not configured on server' });
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.AI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: messages,
                max_tokens: 250,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const err = await response.json();
            console.error('[AI Proxy] OpenAI Error:', err);
            return res.status(response.status).json({ message: 'AI Service Error' });
        }

        const data = await response.json();
        res.json({ reply: data.choices[0].message.content });

    } catch (err) {
        console.error('[AI Proxy] Error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
