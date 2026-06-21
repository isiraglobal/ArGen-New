const express = require('express');
const router = express.Router();

const AI_SYSTEM_PROMPT = `You are the ArGen Intelligence Agent. You are the digital interface for ArGen's proprietary evaluation engine.
Answer concisely and with executive professionalism.
ArGen evaluates real-world AI competency across teams via a 48-hour challenge workflow.
Our engine analyzes outputs across 4 key dimensions: Clarity, Constraint Application, Critical Thinking, and Communication.
Pricing: Professional Pilot ($0 for 5 people), Enterprise Snapshot ($1,500 for up to 25 people), Intelligence SaaS ($199/mo).
Always refer to the analysis as "ArGen Intelligence" or "Proprietary ArGen Analysis". Never mention 3rd party model names like Claude or GPT unless specifically asked about integrations.`;

// @route   GET api/ai/health
// @desc    Check AI provider availability and health
// @access  Public
router.get('/health', async (req, res) => {
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

// @route   POST api/ai/ask
// @desc    Public AI chat endpoint (used by homepage floating AI bar)
// @access  Public — rate limited
router.post('/ask', async (req, res) => {
    try {
        let { messages } = req.body;
        if (!Array.isArray(messages)) {
          return res.status(400).json({ message: 'messages must be an array' });
        }
        // Strip any system-role messages from client — only allow user/assistant
        const userMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant');
        if (userMessages.length === 0) {
          return res.status(400).json({ message: 'No valid messages provided' });
        }
        // Inject system prompt server-side (never trust client-supplied system messages)
        const fullMessages = [
          { role: 'system', content: AI_SYSTEM_PROMPT },
          ...userMessages
        ];

        // Resolve the best available API key
        const nvidiaKey = process.env.META_LLAMA_3_3_70B_INSTRUCT_API_KEY || process.env.NVIDIA_API_KEY;
        const openaiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;

        let response;
        if (nvidiaKey) {
            response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${nvidiaKey}`
                },
                body: JSON.stringify({
                    model: 'meta/llama-3.3-70b-instruct',
                    messages: fullMessages,
                    max_tokens: 500,
                    temperature: 0.3
                })
            });
        } else if (openaiKey) {
            response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: fullMessages,
                    max_tokens: 500,
                    temperature: 0.3
                })
            });
        } else if (geminiKey) {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
            const geminiBody = {
                contents: userMessages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
                systemInstruction: { parts: [{ text: AI_SYSTEM_PROMPT }] }
            };
            response = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(geminiBody)
            });
            if (!response.ok) {
                const errText = await response.text();
                return res.status(response.status).json({ message: 'AI Service Error' });
            }
            const data = await response.json();
            return res.json({ reply: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response' });
        } else {
            // No AI keys configured — return a helpful fallback response
            return res.json({ reply: `I'm the ArGen Intelligence Agent. I'm currently in offline mode — no AI providers are configured on this server. To enable AI responses, add one of the following environment variables in Vercel: NVIDIA_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY.\n\nMeanwhile, explore ArGen's features using the navigation above, or visit our pricing page at /pricing to learn more.` });
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
