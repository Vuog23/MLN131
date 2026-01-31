module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Log request method
  console.log('Request method:', req.method);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages } = req.body;
  console.log('Messages received:', messages);

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  // Check if API key is configured
  console.log('Checking API key...');
  console.log('API key exists:', !!process.env.GROQ_API_KEY);
  console.log('API key length:', process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0);
  
  if (!process.env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not configured!');
    return res.status(500).json({ 
      error: "Server configuration error", 
      detail: "GROQ_API_KEY is not configured. Please add it to Vercel Environment Variables." 
    });
  }

  try {
    console.log('Calling Groq API...');
    const requestBody = {
      model: "llama3-70b-8192",
      messages: messages,
      temperature: 0.7,
      max_tokens: 2048
    };
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Groq API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API Error Response:', errorData);
      return res.status(response.status).json({ 
        error: "Groq API error", 
        detail: errorData,
        status: response.status
      });
    }

    const data = await response.json();
    console.log('Groq API success! Response received.');
    return res.status(200).json(data);

  } catch (err) {
    console.error('Server error:', err);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ 
      error: "Server error", 
      detail: err.message,
      stack: err.stack
    });
  }
};