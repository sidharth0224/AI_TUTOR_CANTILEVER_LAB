// Vercel Serverless Function: POST /api/chat
// Runs the 3-agent pipeline directly (no LangGraph dependency for serverless compatibility)
// Pipeline: Supervisor → Researcher → Media Engine

import { ChatGroq } from "@langchain/groq";
import Groq from "groq-sdk";
import knowledgeBase from "../server/knowledgeBase.js";

// ─── Supervisor Agent ───
async function runSupervisor(query) {
    const model = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        maxTokens: 200,
    });

    const topicsContext = knowledgeBase.toContextString();

    const systemPrompt = `You are a strict classification agent for an AI Tutor focused on placement preparation.
Your ONLY job is to classify the user's query into one of three categories:
1. "placement_topic" — The query is related to placement preparation, technical interviews, coding, computer science, aptitude, or any of the topics below.
2. "irrelevant" — The query is off-topic (e.g., recipes, weather, personal questions, entertainment).
3. "harmful" — The query contains harmful, offensive, or inappropriate content.

AVAILABLE PLACEMENT TOPICS:
${topicsContext}

IMPORTANT RULES:
- If a query is even loosely related to CS, programming, interviews, or career prep, classify it as "placement_topic".
- Be lenient with placement_topic — when in doubt, classify as placement_topic.
- Only use "irrelevant" for clearly off-topic queries.
- Only use "harmful" for genuinely harmful content.

Respond with ONLY a JSON object (no markdown, no code fences):
{"classification": "placement_topic" | "irrelevant" | "harmful", "reason": "brief reason", "detectedTopic": "topic name or null"}`;

    const response = await model.invoke([
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
    ]);

    const text = response.content.trim();
    const result = JSON.parse(text);

    if (result.classification !== "placement_topic") {
        return {
            rejected: true,
            rejectionReason: result.classification === "harmful"
                ? `⚠️ This query was flagged as harmful: ${result.reason}`
                : `🚫 This query is not related to placement preparation: ${result.reason}`,
            classification: result.classification,
            topic: null,
        };
    }

    return {
        rejected: false,
        topic: result.detectedTopic || query,
        classification: result.classification,
    };
}

// ─── Researcher Agent ───
async function runResearcher(topic, duration) {
    const DURATION_MAP = {
        2: { words: 300, label: "concise" },
        3: { words: 450, label: "moderate" },
        4: { words: 600, label: "detailed" },
        5: { words: 750, label: "comprehensive" },
    };

    const config = DURATION_MAP[duration] || DURATION_MAP[3];
    const topicsContext = knowledgeBase.toContextString();

    const model = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        maxTokens: 4096,
    });

    const systemPrompt = `You are an expert AI Tutor for placement preparation. Generate a ${config.label}, well-structured Markdown explanation.

AVAILABLE TOPICS FOR CONTEXT:
${topicsContext}

REQUIREMENTS:
- Target approximately ${config.words} words (~${duration} minute read)
- Use clear headings (##, ###), bullet points, and code examples where relevant
- Include practical interview tips
- Make it engaging and easy to understand
- Structure: Introduction → Core Concepts → Examples → Key Takeaways`;

    const response = await model.invoke([
        { role: "system", content: systemPrompt },
        { role: "user", content: `Explain: ${topic}` },
    ]);

    return response.content.trim();
}

// ─── Media Engine Agent ───
async function runMediaEngine(topic, markdown, duration) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    let imageUrl = null;
    let audioText = null;
    let mediaFailed = false;

    // Generate SVG description
    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{
                role: "user",
                content: `Create a brief, descriptive prompt (1-2 sentences) for an educational diagram about: "${topic}". Return ONLY the description.`
            }],
            max_tokens: 150,
            temperature: 0.7,
        });

        const desc = completion.choices[0]?.message?.content?.trim() || topic;
        const svgContent = generateTopicSVG(topic, desc);
        imageUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
    } catch (e) {
        console.error("Image error:", e.message);
        mediaFailed = true;
    }

    // Generate TTS script
    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{
                role: "user",
                content: `Convert this markdown into a clean, natural TTS script (~${(duration || 3) * 150} words). Remove all formatting:\n\n${markdown.substring(0, 3000)}`
            }],
            max_tokens: 1500,
            temperature: 0.5,
        });
        audioText = completion.choices[0]?.message?.content?.trim() || null;
    } catch (e) {
        console.error("Audio error:", e.message);
        mediaFailed = true;
    }

    return { imageUrl, audioText, mediaFailed };
}

// ─── SVG Generator ───
function generateTopicSVG(topic, description) {
    const safeTitle = escapeXml(topic || "Topic");
    const safeDesc = escapeXml((description || "").substring(0, 120));
    const words = safeDesc.split(" ");
    let lines = [], currentLine = "";
    for (const word of words) {
        if ((currentLine + " " + word).length > 45) {
            lines.push(currentLine.trim());
            currentLine = word;
        } else {
            currentLine += " " + word;
        }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());
    lines = lines.slice(0, 4);
    const descTspans = lines.map((line, i) => `<tspan x="250" dy="${i === 0 ? 0 : 22}">${line}</tspan>`).join("\n      ");

    return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300" viewBox="0 0 500 300">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="500" height="300" rx="16" fill="url(#bg)" />
  <rect x="24" y="24" width="452" height="252" rx="12" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
  <text x="250" y="80" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="28" font-weight="700" fill="white">📚 ${safeTitle}</text>
  <line x1="100" y1="105" x2="400" y2="105" stroke="rgba(255,255,255,0.3)" stroke-width="1" />
  <text x="250" y="145" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="14" fill="rgba(255,255,255,0.85)">
      ${descTspans}
  </text>
  <text x="250" y="260" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="11" fill="rgba(255,255,255,0.5)">Cantilever AI Tutor • Placement Preparation</text>
</svg>`;
}

function escapeXml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

// ─── Main Handler ───
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { query, duration = 3 } = req.body;
        if (!query?.trim()) return res.status(400).json({ error: 'Query is required' });

        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({
                error: 'GROQ_API_KEY is missing in Vercel. Please add it in project settings and redeploy.'
            });
        }

        // Step 1: Supervisor (guardrail)
        const supervisorResult = await runSupervisor(query.trim());

        if (supervisorResult.rejected) {
            return res.status(200).json({
                query: query.trim(),
                topic: null,
                duration,
                rejected: true,
                rejectionReason: supervisorResult.rejectionReason,
                classification: supervisorResult.classification,
                markdown: null,
                imageUrl: null,
                audioText: null,
                mediaFailed: false,
            });
        }

        // Step 2: Researcher (content generation)
        const markdown = await runResearcher(supervisorResult.topic, duration);

        // Step 3: Media Engine (image + audio)
        const media = await runMediaEngine(supervisorResult.topic, markdown, duration);

        return res.status(200).json({
            query: query.trim(),
            topic: supervisorResult.topic,
            duration,
            rejected: false,
            rejectionReason: null,
            classification: supervisorResult.classification,
            markdown,
            imageUrl: media.imageUrl,
            audioText: media.audioText,
            mediaFailed: media.mediaFailed,
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return res.status(500).json({
            error: `AI processing failed: ${error.message}`,
        });
    }
}

export const config = {
    maxDuration: 60,
};
