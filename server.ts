import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load environment variables if available
dotenv.config();

const app = express();
app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set. Please add it in the Settings > Secrets panel of AI Studio.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Ensure the process listens to SIGTERM and exits gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: {
      hasApiKey: !!process.env.GEMINI_API_KEY,
      nodeEnv: process.env.NODE_ENV || 'development',
    },
  });
});

app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { prompt, systemInstruction, model = 'gemini-3.5-flash', history = [] } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const ai = getGeminiClient();

    // Map history and append the current prompt into contents structure
    const contents: any[] = [];
    
    // Process input history if any
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content || msg.text || '' }]
        });
      });
    }

    // Append current prompt as the last user turn
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const response = await ai.models.generateContent({
      model,
      contents,
      config: systemInstruction ? { systemInstruction } : undefined,
    });

    res.json({
      text: response.text,
      model,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/generate:', error);
    res.status(500).json({
      error: error.message || 'An error occurred while generating content',
      hasApiKey: !!process.env.GEMINI_API_KEY,
    });
  }
});

// Initialize Vite server or static serving
async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    console.log('Starting server in development mode with Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Use Vite as middleware
    app.use(vite.middlewares);
  } else {
    console.log('Starting server in production mode...');
    const distPath = path.resolve('dist');
    if (!fs.existsSync(distPath)) {
      console.warn('Warning: dist directory does not exist. Please run npm run build first.');
    }
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening at http://0.0.0.0:${port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
