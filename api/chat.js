// api/chat.js
// Vercel Serverless Function - CommonJS format

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Check API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY not found!');
      return res.status(500).json({ 
        error: 'Server configuration error',
        detail: 'GROQ_API_KEY is not configured in Vercel Environment Variables'
      });
    }

    console.log('Calling Groq API...');
    console.log('API Key length:', apiKey.length);
    console.log('Messages:', JSON.stringify(messages, null, 2));

    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    console.log('Groq API Status:', groqResponse.status);

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API Error:', errorText);
      return res.status(groqResponse.status).json({
        error: 'Groq API error',
        detail: errorText,
        status: groqResponse.status
      });
    }

    const data = await groqResponse.json();
    console.log('Groq API Success!');

    return res.status(200).json(data);

  } catch (error) {
    console.error('Server Error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: 'Server error',
      detail: error.message,
      stack: error.stack
    });
  }
};