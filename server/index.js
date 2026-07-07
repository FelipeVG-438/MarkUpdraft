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
    if (mode === 'explain') {
      // Explain Mode (JSON Extraction - Strict Schema)
      const systemInstruction = 
        "Identify advanced technical terms, acronyms, or complex data metrics in the input text. " +
        "Return a JSON array of objects, where each object has a 'term' and an 'explanation' field. " +
        "The term must match the exact case-sensitive word/phrase present in the input. " +
        "The explanation should be a short, precise definition.";

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: text,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                term: { type: 'STRING' },
                explanation: { type: 'STRING' }
              },
              required: ['term', 'explanation']
            }
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini API returned an empty response.');
      }

      // Parse array and map it to a flat dictionary
      const parsedArray = JSON.parse(responseText);
      const dictionary = {};
      for (const item of parsedArray) {
        if (item.term && item.explanation) {
          dictionary[item.term] = item.explanation;
        }
      }

      return res.json(dictionary);

    } else {
      // Streaming Modes: Original (smoothed), Summarize, and Expand
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
          "Maintain all original formatting, structures, tables, and spacing exactly. " +
          "Return ONLY the smoothed markdown. Do not wrap the output in markdown blockquotes, " +
          "and do not include any introductory conversational text.";
      } else if (mode === 'summarize') {
        systemInstruction = 
          "Role: Markdown Transformation Engine\n" +
          "Task: Condense the input text into a highly structured, scannable, bulleted Markdown layout. " +
          "Extract core themes and action items. Return ONLY the final formatted Markdown. " +
          "Do not wrap the output in markdown blockquotes, and do not include any introductory conversational text.";
      } else if (mode === 'expand') {
        systemInstruction = 
          "Role: Markdown Transformation Engine\n" +
          "Task: Logically elaborate on the input text, filling in context while maintaining the original tone. " +
          "Return ONLY the expanded Markdown. Do not wrap the output in markdown blockquotes, " +
          "and do not include any introductory conversational text.";
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
          res.write(`data: ${chunk.text}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    }
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
