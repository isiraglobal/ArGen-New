const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @route   GET api/ai/health
// @desc    Check AI provider availability and health
// @access  Private
router.get('/health', protect, async (req, res) => {
  const providers = [
    { name: 'NVIDIA NIM (Llama 3.3 70B)', key: process.env.META_LLAMA_3_3_70B_INSTRUCT_API_KEY || process.env.NVIDIA_API_KEY },
    { name: 'OpenAI', key: process.env.AI_API_KEY || process.env.OPENAI_API_KEY },
    { name: 'Anthropic Claude', key: process.env.ANTHROPIC_API_KEY },
    { name: 'Google Gemini', key: process.env.GEMINI_API_KEY },
  ];
  const statuses = providers.map(p => ({
    name: p.name,
    configured: Boolean(p.key),
    status: p.key ? 'available' : 'unconfigured'
  }));
  res.json({
    status: statuses.some(p => p.configured) ? 'healthy' : 'degraded',
    providers: statuses,
    timestamp: new Date().toISOString()
  });
});

router.post('/ask', protect, async (req, res) => {
    try {
        let { messages } = req.body;
        if (!Array.isArray(messages)) {
          return res.status(400).json({ message: 'messages must be an array' });
        }
        // Strip any system-role messages from client — only allow user/assistant
        messages = messages.filter(m => m.role === 'user' || m.role === 'assistant');
        if (messages.length === 0) {
          return res.status(400).json({ message: 'No valid messages provided' });
        }
        
        // Resolve the best available API key
        const nvidiaKey = process.env.META_LLAMA_3_3_70B_INSTRUCT_API_KEY || process.env.NVIDIA_API_KEY;
        const openaiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;

        let response;
        if (nvidiaKey) {
            // Priority 1: Use NVIDIA NIM model (meta/llama-3.3-70b-instruct)
            console.log('[AI Chat Proxy] Routing query to NVIDIA NIM (meta/llama-3.3-70b-instruct)');
            response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${nvidiaKey}`
                },
                body: JSON.stringify({
                    model: 'meta/llama-3.3-70b-instruct',
                    messages: messages,
                    max_tokens: 500,
                    temperature: 0.3
                })
            });
        } else if (openaiKey) {
            // Priority 2: Use OpenAI as fallback (gpt-4o-mini)
            console.log('[AI Chat Proxy] Routing query to OpenAI (gpt-4o-mini)');
            response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: messages,
                    max_tokens: 500,
                    temperature: 0.3
                })
            });
        } else {
            console.warn('[AI Chat Proxy] No AI keys configured. Fallback to mock.');
            return res.status(500).json({ message: 'AI Chat Service not configured on server' });
        }

        if (!response.ok) {
            const errText = await response.text();
            console.error('[AI Chat Proxy] Provider API Error:', errText);
            return res.status(response.status).json({ message: 'AI Service Error' });
        }

        const data = await response.json();
        res.json({ reply: data.choices[0].message.content });

    } catch (err) {
        console.error('[AI Chat Proxy] Server Error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
