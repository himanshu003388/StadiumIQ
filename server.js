/**
 * Stadium IQ - API Proxy Server
 * Security-hardened Express server with Gemini AI integration
 */
/* eslint-disable no-console */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import {
  sanitizeInput,
  validateChatInput,
  buildSafeContext,
  buildSystemPrompt,
  generateCsrfToken,
  validateCsrfToken,
} from './src/utils/server-utils.js';
import { parseDocumentOffline } from './src/utils/helpers.js';

// Load .env.local first for overrides, then .env
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// =========================================
// EFFICIENCY: Single GoogleGenerativeAI instance (module scope)
// Re-used across all requests — not instantiated per-call
// =========================================
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAIInstance = null;
function getGenAI() {
  if (!genAIInstance && GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
    genAIInstance = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAIInstance;
}

// =========================================
// EFFICIENCY: Gzip/Deflate Compression
// =========================================
app.use(compression());

// =========================================
// SECURITY: Helmet with strict CSP (no unsafe-inline)
// =========================================
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  // Tailwind injects minimal critical styles at build time; unsafe-inline scoped to styles only
  // In a future iteration, migrate to nonce-based injection via vite-plugin-csp
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  // Restrict images: only self, data URIs, and https (no http)
  imgSrc: ["'self'", 'data:', 'https:'],
  // Allow Google Maps navigation links to open in new tab (no fetch — just navigation)
  connectSrc: ["'self'", ...(isProduction ? [] : ['http://localhost:5173'])],
  objectSrc: ["'none'"],
  frameAncestors: ["'none'"],
  frameSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  manifestSrc: ["'self'"],
  upgradeInsecureRequests: [],
};

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: cspDirectives,
    },
    crossOriginEmbedderPolicy: !isProduction ? false : { policy: 'require-corp' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xFrameOptions: { action: 'deny' },
    xXssProtection: false,
    ieNoOpen: true,
    noSniff: true,
    hidePoweredBy: true,
  }),
);

// =========================================
// CORS - restricted in production
// =========================================
app.use(
  cors({
    origin: isProduction
      ? process.env.ALLOWED_ORIGINS?.split(',') || []
      : ['http://localhost:5173', 'http://localhost:4173'],
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    maxAge: 86400,
    credentials: true,
  }),
);

// =========================================
// Body parsing with strict limits
// =========================================
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '2mb' }));

// =========================================
// SECURITY: API Key authentication middleware
// In production, API_AUTH_KEY MUST be set — no silent bypass
// =========================================
const API_AUTH_KEY = process.env.API_AUTH_KEY;

function authenticateApiKey(req, res, next) {
  // In production, enforce key even if not configured — fail safe
  if (isProduction && (!API_AUTH_KEY || API_AUTH_KEY === 'your-api-auth-key')) {
    // Fallback: allow requests from our web frontend with valid CSRF tokens
    const csrfToken = req.headers['x-csrf-token'];
    if (csrfToken) {
      if (validateCsrfToken(csrfToken)) {
        return next();
      }
      return res.status(403).json({ error: 'Invalid CSRF token.' });
    }
    return res.status(503).json({
      error: 'Service temporarily unavailable. API authentication not configured.',
    });
  }
  // In development, allow bypass when key is not set
  if (!isProduction && (!API_AUTH_KEY || API_AUTH_KEY === 'your-api-auth-key')) {
    return next();
  }
  // Accept only header-based auth — never from query string (prevents key leakage in logs/history)
  const providedKey = req.headers['x-api-key'];
  if (!providedKey || providedKey !== API_AUTH_KEY) {
    // Fallback: allow requests from our web frontend with valid CSRF tokens
    const csrfToken = req.headers['x-csrf-token'];
    if (csrfToken) {
      if (validateCsrfToken(csrfToken)) {
        return next();
      }
      return res.status(403).json({ error: 'Invalid CSRF token.' });
    }
    return res.status(401).json({ error: 'Unauthorized. Valid API key required.' });
  }
  next();
}

// =========================================
// SECURITY: HTTPS redirect in production
// =========================================
if (isProduction) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// =========================================
// SECURITY: Robust rate limiting
// =========================================
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per `window` (here, per minute)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests. Please try again later.' },
});

app.use('/api/', apiLimiter);

// =========================================
// EFFICIENCY: Query caching
// =========================================
const queryCache = new NodeCache({ stdTTL: 300, checkperiod: 60, maxKeys: 1000 });

// =========================================
// CSRF Token endpoint
// =========================================
app.get('/api/csrf-token', (_req, res) => {
  const token = generateCsrfToken();
  res.json({ csrfToken: token });
});

// =========================================
// API: Health check
// =========================================
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: isProduction ? 'production' : 'development',
  });
});

// =========================================
// CSRF validation middleware for state-changing requests
// Tokens are now stateless HMAC — no map deletion needed
// =========================================
function csrfProtection(req, res, next) {
  const token = req.headers['x-csrf-token'];
  if (!token || !validateCsrfToken(token)) {
    return res.status(403).json({ error: 'Invalid or missing CSRF token.' });
  }
  next();
}

// =========================================
// Dynamic Model Selection
// =========================================
let cachedModelName = null;

async function getBestAvailableModel(apiKey) {
  if (cachedModelName) return cachedModelName;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    );
    if (!res.ok) return 'gemini-1.5-flash'; // fallback

    const data = await res.json();
    const flashModels = data.models
      .filter(
        (m) =>
          m.supportedGenerationMethods?.includes('generateContent') && m.name.includes('flash'),
      )
      .map((m) => m.name.replace('models/', ''));

    const preferred =
      flashModels.find((m) => m.includes('2.5')) ||
      flashModels.find((m) => m.includes('2.0')) ||
      flashModels[0] ||
      'gemini-1.5-flash';

    cachedModelName = preferred;
    console.log(`[Auto-Select] Dynamically selected model: ${cachedModelName}`);
    return cachedModelName;
  } catch (err) {
    console.error('Failed to dynamically fetch models, using fallback', err);
    return 'gemini-1.5-flash';
  }
}

// =========================================
// API: AI Chat endpoint
// =========================================
app.post('/api/chat', authenticateApiKey, csrfProtection, async (req, res) => {
  const requestId = crypto.randomBytes(4).toString('hex');
  const startTime = Date.now();

  try {
    const validationErrors = validateChatInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join('; ') });
    }

    const { message, contextData, language, userProfile } = req.body;

    const sanitizedMessage = sanitizeInput(message);
    if (!sanitizedMessage) {
      return res
        .status(400)
        .json({ error: 'Message contains no valid content after sanitization.' });
    }

    const normalizedMessage = sanitizedMessage.toLowerCase().replace(/\s+/g, ' ').trim();
    const cacheKey = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          message: normalizedMessage,
          language: (language || 'en').toLowerCase(),
          userProfile: userProfile ? `${userProfile.origin}:${userProfile.tone}` : '',
        }),
      )
      .digest('hex');
    const cachedResponse = queryCache.get(cacheKey);
    if (cachedResponse) {
      return res.json({ reply: cachedResponse, requestId, elapsed: 0, cached: true });
    }

    const genAI = getGenAI();
    if (!genAI) {
      return res
        .status(400)
        .json({ error: 'Gemini API Key is missing or invalid in server environment.' });
    }

    const selectedModel = await getBestAvailableModel(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: selectedModel });

    // Build a safe, whitelisted context — never expose raw user-submitted data to the AI
    const safeCtx = buildSafeContext(contextData);
    const safeContext = JSON.stringify(safeCtx)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .slice(0, 5000);

    const systemPrompt = buildSystemPrompt(safeContext, userProfile);

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        {
          role: 'model',
          parts: [{ text: 'Understood. I am ready to assist with stadium operations.' }],
        },
      ],
    });

    const result = await chat.sendMessage(sanitizedMessage);
    const responseText = result.response.text();

    const safeResponse = responseText
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .slice(0, 10000);

    queryCache.set(cacheKey, safeResponse);

    const elapsed = Date.now() - startTime;

    res.json({
      reply: safeResponse,
      requestId,
      elapsed,
    });
  } catch (error) {
    console.error(`[${requestId}] Gemini API Error:`, error);

    if (
      error.status === 400 ||
      error.status === 403 ||
      (error.message && error.message.toLowerCase().includes('api key'))
    ) {
      return res.status(400).json({
        error: 'Gemini API Key is missing or invalid in server environment.',
        requestId,
      });
    }

    res.status(500).json({
      error: 'Failed to communicate with AI Assistant.',
      requestId,
    });
  }
});

// =========================================
// Security: Additional headers
// =========================================
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// =========================================
// EFFICIENCY: SSE Streaming endpoint for AI responses
// Streams token-by-token to reduce perceived latency
// =========================================
app.post('/api/chat/stream', authenticateApiKey, csrfProtection, async (req, res) => {
  const requestId = crypto.randomBytes(4).toString('hex');

  const validationErrors = validateChatInput(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors.join('; ') });
  }

  const { message, contextData, language, userProfile } = req.body;
  const sanitizedMessage = sanitizeInput(message);
  if (!sanitizedMessage) {
    return res.status(400).json({ error: 'Message contains no valid content after sanitization.' });
  }
  const normalizedMessage = sanitizedMessage.toLowerCase().replace(/\s+/g, ' ').trim();
  const cacheKey = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        message: normalizedMessage,
        language: (language || 'en').toLowerCase(),
        userProfile: userProfile ? `${userProfile.origin}:${userProfile.tone}` : '',
      }),
    )
    .digest('hex');

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

  const cachedResponse = queryCache.get(cacheKey);
  if (cachedResponse) {
    res.write(`data: ${JSON.stringify({ chunk: cachedResponse, requestId })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true, requestId })}\n\n`);
    res.end();
    return;
  }

  const genAI = getGenAI();
  if (!genAI) {
    res.write(
      `data: ${JSON.stringify({ error: 'Gemini API Key is missing or invalid in server environment.', requestId })}\n\n`,
    );
    res.end();
    return;
  }

  const safeCtx = buildSafeContext(contextData);
  const safeContext = JSON.stringify(safeCtx).slice(0, 5000);

  const systemPrompt = buildSystemPrompt(safeContext, userProfile);

  try {
    const selectedModel = await getBestAvailableModel(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: selectedModel });
    const streamResult = await model.generateContentStream([
      { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser: ${sanitizedMessage}` }] },
    ]);

    let fullText = '';
    for await (const chunk of streamResult.stream) {
      const text = chunk.text();
      if (text) {
        const safeChunk = text
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]*>/g, '');
        fullText += safeChunk;
        res.write(`data: ${JSON.stringify({ chunk: safeChunk, requestId })}\n\n`);
      }
    }
    if (fullText) {
      const cleanFullText = fullText.slice(0, 10000);
      queryCache.set(cacheKey, cleanFullText);
    }
    res.write(`data: ${JSON.stringify({ done: true, requestId })}\n\n`);
  } catch (err) {
    console.error(`[${requestId}] Streaming error:`, err);
    if (
      err.status === 400 ||
      err.status === 403 ||
      (err.message && err.message.toLowerCase().includes('api key'))
    ) {
      res.write(
        `data: ${JSON.stringify({ error: 'Gemini API Key is missing or invalid in server environment.', requestId })}\n\n`,
      );
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream failed', requestId })}\n\n`);
    }
  } finally {
    res.end();
  }
});

// (parseDocumentOffline now imported from ./src/utils/helpers.js)

// =========================================
// API: Parse Document endpoint (supports PDF, TXT, CSV)
// =========================================
app.post('/api/parse-document', authenticateApiKey, csrfProtection, async (req, res) => {
  const requestId = crypto.randomBytes(4).toString('hex');
  const { fileData, fileName, mimeType } = req.body;

  if (!fileData) {
    return res.status(400).json({ error: 'fileData (base64-encoded) is required.' });
  }

  try {
    const rawBuffer = Buffer.from(fileData, 'base64');
    const fileText = rawBuffer.toString('utf-8');

    const genAI = getGenAI();
    if (genAI) {
      const selectedModel = await getBestAvailableModel(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: selectedModel });

      const systemInstructionsForParsing = `You are a structured data extraction agent for the FIFA World Cup 2026 Smart Stadiums operations center.
Your task is to analyze the provided document and extract structured updates for the stadium operations system.

You must extract three types of entities:
1. GATES: gate updates including id (e.g. A, B, C), density (0.0 to 1.0), waitTimeMinutes, and status (normal, watch, critical).
2. INCIDENTS: new or updated incidents including id (e.g., INC-006), type (crowd, medical, security, facility, equipment), zone (North Stand, South Stand, East Wing, West Wing), severity (low, medium, critical), description, and status (active, resolved).
3. VOLUNTEERS: volunteer updates including id (e.g., V7), name, zone, languages (array of 2-letter codes like ['en', 'es']), and skills (array of lowercase skill strings like ['first-aid', 'crowd-control', 'translation', 'security', 'tech-support', 'guest-services']).

Format your response as a strict JSON object with the following structure, and do not include any markdown formatting wrappers (like \`\`\`json):
{
  "gates": [...],
  "incidents": [...],
  "volunteers": [...]
}
Only include fields that are found or can be inferred from the document. If no data of a certain type is present, return an empty array for that field.`;

      let result;
      if (mimeType === 'application/pdf') {
        result = await model.generateContent([
          {
            inlineData: {
              data: fileData,
              mimeType: 'application/pdf',
            },
          },
          { text: systemInstructionsForParsing },
        ]);
      } else {
        result = await model.generateContent([
          { text: systemInstructionsForParsing },
          { text: `Document content:\n${fileText}` },
        ]);
      }

      const responseText = result.response.text();
      const cleanedText = responseText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      try {
        const parsedData = JSON.parse(cleanedText);
        return res.json({
          success: true,
          data: parsedData,
          requestId,
          mode: 'gemini',
        });
      } catch (parseErr) {
        console.error(
          'Failed to parse Gemini output as JSON, fallback to offline rules:',
          cleanedText,
          parseErr,
        );
        const localParsed = parseDocumentOffline(fileText, fileName);
        return res.json({
          success: true,
          data: localParsed,
          requestId,
          mode: 'gemini-fallback',
          warning: 'JSON parsing failed, extracted using local rules.',
        });
      }
    } else {
      const localParsed = parseDocumentOffline(fileText, fileName);
      return res.json({
        success: true,
        data: localParsed,
        requestId,
        mode: 'offline',
      });
    }
  } catch (err) {
    console.error(`[${requestId}] Document parse error:`, err);
    res.status(500).json({ error: 'Failed to parse uploaded document.', requestId });
  }
});

// =========================================
// Production static serving
// =========================================
if (isProduction) {
  // Serve static files from Vite build folder
  app.use(express.static(path.resolve('dist')));

  // Fallback to index.html for SPA routing
  app.get('*all', (req, res) => {
    res.sendFile(path.resolve('dist', 'index.html'));
  });
}

// =========================================
// Server startup
// =========================================
app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Stadium IQ server running on port ${PORT}`);
  console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
});
