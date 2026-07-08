import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import * as prettier from 'prettier';

// Load environment variables from server/.env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Initialize the Google Gen AI SDK
const apiKey = process.env.GEMINI_API_KEY;
let ai;
if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.warn('WARNING: GEMINI_API_KEY environment variable is not configured.');
}

// Transform Route
app.post('/api/transform', async (req, res) => {
  const { text, mode } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).send('No text provided for transformation.');
  }

  // Validate API key config
  if (!ai) {
    return res.status(500).send(
      'Gemini API key is not configured. Please edit the server/.env file, set your GEMINI_API_KEY, and restart the server.'
    );
  }

  try {
    let textToProcess = text;

    // 1. Original Mode Hybrid Pre-Processing
    if (mode === 'original') {
      try {
        // Format raw markdown structures, spacing, and tables first
        textToProcess = await prettier.format(text, { parser: 'markdown' });
      } catch (prettierErr) {
        console.warn('Prettier formatting failed, using raw input: ', prettierErr);
      }
    }

    // Determine system instructions based on mode
    let systemInstruction = '';
    if (mode === 'original') {
      systemInstruction = 
        "Role: Markdown Smoothing Engine\n" +
        "Task: Smooth the grammar, sentence structure, and flow of the input Markdown text. " +
        "CRITICAL: Maintain all original formatting, structures, tables, lists, and spacing exactly. " +
        "Do not alter headers or list bullet prefixes. Return ONLY the smoothed markdown. " +
        "Do not wrap the output in markdown blockquotes, and do not include any introductory conversational text.";
    } else if (mode === 'summarize') {
      systemInstruction = 
        "Role: Markdown Summarization Engine\n" +
        "Task: Condense the prose sections of the input text into highly structured, scannable bullet points. " +
        "CRITICAL: Maintain the overall document structure, including primary headers (#, ##, etc.), lists, and tables exactly. " +
        "Do NOT convert titles, main headings, or table cells into bullet lists. Only summarize the descriptive narrative prose " +
        "under their existing headings. Return ONLY the final formatted Markdown. " +
        "Do not wrap the output in markdown blockquotes, and do not include any introductory conversational text.";
    } else if (mode === 'expand') {
      systemInstruction = 
        "Role: Markdown Expansion Engine\n" +
        "Task: Logically elaborate on the input text, filling in context, details, and completing partial thoughts. " +
        "CRITICAL: Maintain the original formatting, structures, headers, lists, and tables exactly as is. " +
        "Do not alter the structural hierarchy of the document; only expand the content within each section to make it " +
        "well-structured, detailed, and clear. Return ONLY the expanded Markdown. " +
        "Do not wrap the output in markdown blockquotes, and do not include any introductory conversational text.";
    } else {
      return res.status(400).send(`Unsupported transformation mode: ${mode}`);
    }

    // Set headers for Server-Sent Events (SSE) streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Call streaming Gemini API
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: textToProcess,
      config: {
        systemInstruction
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Transformation Error: ', err);
    if (!res.headersSent) {
      res.status(500).send(err.message || 'An error occurred during Gemini API generation.');
    } else {
      res.write(`data: [ERROR] ${err.message}\n\n`);
      res.end();
    }
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`MarkUpdraft secure API gateway running on http://localhost:${PORT}`);
});
