import { GoogleGenAI } from '@google/genai';
import { CATEGORIES } from './constants.js';

// Gemini runs ONLY on the backend. The API key lives in server/.env
// and is never sent to the browser.
const KEY = process.env.GEMINI_API_KEY || '';
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
export const aiEnabled = Boolean(KEY);
const client = KEY ? new GoogleGenAI({ apiKey: KEY }) : null;

const SYSTEM_PROMPT = `You are the AI assistant inside CIVICCARE, an Indian civic problem reporting app.
A citizen reported a public problem (a photo and/or a short note).
Decide the best category, write a short title and a clear 1-2 sentence description that a municipal authority can act on, and estimate severity.
Return ONLY valid JSON with exactly these fields:
category: one of ${JSON.stringify(CATEGORIES)}
title: a short title, maximum 8 words
description: 1-2 neutral, factual sentences in English
severity: "low" | "medium" | "high"
confidence: an integer from 0 to 100`;

function parseJson(text) {
  let t = String(text || '').trim();
  t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) throw new Error('No JSON found in AI response');
  return JSON.parse(t.slice(start, end + 1));
}

// Simple keyword fallback used only in demo mode (no API key).
function guessCategory(text = '') {
  const t = String(text).toLowerCase();
  const rules = [
    [/pothole|potholes|road\s*(damage|crack|broken)|crack/, 'Pothole'],
    [/garbage|dustbin|dust\s?bin|trash|junk|waste|dump/, 'Garbage'],
    [/street\s?light|streetlight|lamp|light\s*(off|broken|not working)/, 'Streetlight'],
    [/water\s*leak|leak|pipe|sewage|overflow/, 'Water Leak'],
    [/drain|drainage|stagnant/, 'Drainage'],
    [/footpath|pavement|sidewalk|walkway/, 'Footpath'],
    [/road/, 'Road Damage'],
  ];
  for (const [re, cat] of rules) {
    if (re.test(t)) return cat;
  }
  return 'Other';
}

// Analyze a photo (data URL) and/or text → suggested category, title, description
export async function analyzeImage({ image, text } = {}) {
  if (!client) {
    return {
      demo: true,
      category: guessCategory(text),
      title: String(text || '').trim().slice(0, 60) || 'Public problem reported',
      description: 'Demo mode: add GEMINI_API_KEY to server/.env so AI can write the description for you.',
      severity: 'medium',
      confidence: 50,
    };
  }

  const parts = [{ text: SYSTEM_PROMPT }];
  if (text && String(text).trim()) {
    parts[0].text += `\n\nCitizen's note: ${String(text).trim().slice(0, 500)}`;
  }
  if (image && typeof image === 'string' && image.startsWith('data:image/')) {
    const [meta, data] = image.split(',');
    const mime = (meta.match(/data:(image\/[a-zA-Z0-9.+-]+)/) || [])[1] || 'image/jpeg';
    parts.push({ inlineData: { mimeType: mime, data } });
  }

  const res = await client.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts }],
    config: { responseMimeType: 'application/json' },
  });
  const out = parseJson(res.text);
  return {
    demo: false,
    category: CATEGORIES.includes(out.category) ? out.category : 'Other',
    title: String(out.title || '').slice(0, 80) || 'Public problem reported',
    description: String(out.description || '').slice(0, 500),
    severity: ['low', 'medium', 'high'].includes(out.severity) ? out.severity : 'medium',
    confidence: Math.min(100, Math.max(0, Number(out.confidence) || 70)),
  };
}

// Rewrite the user's note into a clear, formal complaint sentence
export async function improveText({ text } = {}) {
  const t = String(text || '').trim();
  if (!t) throw new Error('Empty text');
  if (!client) {
    return { demo: true, description: t.slice(0, 500) };
  }
  const res = await client.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Rewrite this citizen's note about a public problem into ONE clear, polite, formal sentence (max 40 words) suitable for an official civic complaint. Return ONLY JSON: {"description": "..."}.

Note: ${t.slice(0, 500)}`,
          },
        ],
      },
    ],
    config: { responseMimeType: 'application/json' },
  });
  const out = parseJson(res.text);
  return { demo: false, description: String(out.description || t).slice(0, 500) };
}
