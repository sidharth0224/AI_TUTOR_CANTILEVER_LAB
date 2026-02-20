// ─── Media Engine Agent (Node C) ── Image & Audio Generator ───
// Generates an illustrative SVG image and prepares a clean TTS script
// using Groq for text processing. Handles failures gracefully.

import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");

// Ensure public directory exists (skip on serverless — read-only filesystem)
try {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
} catch (e) {
  // Serverless environment — filesystem is read-only, SVGs will use data URLs
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function runMediaEngine(state) {
  // If rejected or no markdown content, skip media generation
  if (state.rejected || !state.markdown) return state;

  let imageUrl = null;
  let audioText = null;
  let mediaFailed = false;

  // ─── Image Generation: Create a topic SVG ───
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `You are generating metadata for a CSE placement preparation infographic about: "${state.topic}".

Return a JSON object with these fields (no markdown, ONLY raw JSON):
{
  "title": "Short title (max 5 words)",
  "subtitle": "One-line description (max 15 words)",
  "keyConcepts": ["concept1", "concept2", "concept3", "concept4"],
  "category": "one of: dsa, web, system-design, database, os, networking, oop, general",
  "codeSnippet": "A 5-8 line code example showing a practical implementation. IMPORTANT: You MUST use literal backslash-n (\\n) to separate lines. Each line must be under 50 chars. Example: 'class Node {\\n  constructor(val) {\\n    this.val = val;\\n    this.left = null;\\n    this.right = null;\\n  }\\n}\\n// Usage:\\nlet root = new Node(10);'. Always provide meaningful multi-line code.",
  "interviewTip": "One short placement interview tip (max 20 words)"
}`
        }
      ],
      max_tokens: 500,
      temperature: 0.5,
    });

    let imageMetadata;
    try {
      const raw = completion.choices[0]?.message?.content?.trim() || "{}";
      // Extract JSON from possible markdown code block
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      imageMetadata = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      imageMetadata = {
        title: state.topic,
        subtitle: "CSE Placement Preparation",
        keyConcepts: ["Concept 1", "Concept 2", "Concept 3", "Concept 4"],
        category: "general",
        codeSnippet: "",
        interviewTip: "Understand the fundamentals thoroughly."
      };
    }

    // Generate rich topic SVG with the structured metadata
    const svgContent = generateTopicSVG(imageMetadata);

    if (process.env.VERCEL) {
      // Serverless: return SVG as data URL (no filesystem writes)
      imageUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
    } else {
      // Local dev: write to public folder
      const imageFileName = `topic-${Date.now()}.svg`;
      const imagePath = path.join(publicDir, imageFileName);
      fs.writeFileSync(imagePath, svgContent);
      imageUrl = `/public/${imageFileName}`;
    }

  } catch (error) {
    console.error("Image generation error:", error.message);
    mediaFailed = true;
  }

  // ─── Audio: Prepare text for browser-side TTS ───
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Convert the following markdown content into a clean, natural-sounding script for text-to-speech narration. 
Remove all markdown formatting, code blocks, and special characters. 
Keep it conversational and clear. Limit to ${state.duration || 3} minutes of speech (~${(state.duration || 3) * 150} words).

Content:
${state.markdown.substring(0, 3000)}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.5,
    });

    audioText = completion.choices[0]?.message?.content?.trim() || null;

  } catch (error) {
    console.error("Audio script generation error:", error.message);
    mediaFailed = true;
  }

  return {
    ...state,
    imageUrl,
    audioText,
    mediaFailed
  };
}

// ─── Category-based theme configuration ───
const CATEGORY_THEMES = {
  dsa: {
    gradient: ["#0f0c29", "#302b63", "#24243e"],
    accent: "#7c5dfa",
    accentAlt: "#a78bfa",
    icon: "🌳",
    visualType: "tree"
  },
  web: {
    gradient: ["#0c1220", "#1a365d", "#1e3a5f"],
    accent: "#3b82f6",
    accentAlt: "#06b6d4",
    icon: "🌐",
    visualType: "stack"
  },
  "system-design": {
    gradient: ["#0c0c1d", "#1b1b4b", "#2d1b69"],
    accent: "#e879f9",
    accentAlt: "#a855f7",
    icon: "🏗️",
    visualType: "architecture"
  },
  database: {
    gradient: ["#0c1a0c", "#1a3a2a", "#0d2818"],
    accent: "#10b981",
    accentAlt: "#34d399",
    icon: "🗄️",
    visualType: "table"
  },
  os: {
    gradient: ["#1a0c0c", "#3a1a1a", "#2d1420"],
    accent: "#f59e0b",
    accentAlt: "#fbbf24",
    icon: "⚙️",
    visualType: "process"
  },
  networking: {
    gradient: ["#0c1a20", "#1a2d3d", "#0d2d3a"],
    accent: "#06b6d4",
    accentAlt: "#22d3ee",
    icon: "🔗",
    visualType: "network"
  },
  oop: {
    gradient: ["#1a0c20", "#2d1b40", "#3a1c5a"],
    accent: "#c084fc",
    accentAlt: "#e879f9",
    icon: "🔷",
    visualType: "class"
  },
  general: {
    gradient: ["#0c0c1d", "#1a1040", "#1e1050"],
    accent: "#7c5dfa",
    accentAlt: "#e879f9",
    icon: "💡",
    visualType: "general"
  }
};

function generateTopicSVG(meta) {
  const theme = CATEGORY_THEMES[meta.category] || CATEGORY_THEMES.general;
  const safeTitle = escapeXml(meta.title || "Topic");
  const safeSubtitle = escapeXml(meta.subtitle || "");
  const concepts = (meta.keyConcepts || []).map(c => escapeXml(c));
  const codeLine = escapeXml((meta.codeSnippet || "").substring(0, 300));
  const tip = escapeXml((meta.interviewTip || "").substring(0, 80));

  // Generate visual elements based on category
  const visualElements = generateVisualElements(theme);
  const conceptCards = generateConceptCards(concepts, theme);
  const codeBlock = codeLine ? generateCodeBlock(codeLine, theme) : "";
  const tipSection = tip ? generateTipSection(tip) : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="560" viewBox="0 0 700 560">
  <defs>
    <linearGradient id="bgMain" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${theme.gradient[0]}"/>
      <stop offset="50%" style="stop-color:${theme.gradient[1]}"/>
      <stop offset="100%" style="stop-color:${theme.gradient[2]}"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${theme.accent}"/>
      <stop offset="100%" style="stop-color:${theme.accentAlt}"/>
    </linearGradient>
    <linearGradient id="glassCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.12)"/>
      <stop offset="100%" style="stop-color:rgba(255,255,255,0.04)"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
    <clipPath id="roundClip"><rect width="700" height="560" rx="20"/></clipPath>
  </defs>

  <!-- Background -->
  <g clip-path="url(#roundClip)">
    <rect width="700" height="560" fill="url(#bgMain)"/>

    <!-- Ambient glow orbs -->
    <circle cx="100" cy="80" r="120" fill="${theme.accent}" opacity="0.06"/>
    <circle cx="600" cy="400" r="140" fill="${theme.accentAlt}" opacity="0.05"/>
    <circle cx="350" cy="240" r="200" fill="${theme.accent}" opacity="0.03"/>

    <!-- Dot grid pattern -->
    ${generateDotGrid()}

    <!-- Category-specific visual elements -->
    ${visualElements}

    <!-- Header section -->
    <g filter="url(#softShadow)">
      <rect x="24" y="20" width="652" height="90" rx="14" fill="url(#glassCard)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    </g>
    <text x="56" y="52" font-family="'Segoe UI',Inter,system-ui,sans-serif" font-size="14" fill="${theme.accent}" font-weight="600" letter-spacing="2">
      ${theme.icon} ${escapeXml((meta.category || "general").toUpperCase())} • PLACEMENT PREP
    </text>
    <text x="56" y="82" font-family="'Segoe UI',Inter,system-ui,sans-serif" font-size="26" font-weight="700" fill="white">
      ${safeTitle}
    </text>
    <text x="56" y="100" font-family="'Segoe UI',Inter,system-ui,sans-serif" font-size="13" fill="rgba(255,255,255,0.6)">
      ${safeSubtitle}
    </text>

    <!-- Accent stripe -->
    <rect x="24" y="110" width="652" height="3" rx="1.5" fill="url(#accentGrad)" opacity="0.6"/>

    <!-- Key Concepts Section -->
    <text x="40" y="140" font-family="'Segoe UI',Inter,system-ui,sans-serif" font-size="11" fill="rgba(255,255,255,0.45)" font-weight="600" letter-spacing="1.5">
      KEY CONCEPTS
    </text>
    ${conceptCards}

    <!-- Code Block -->
    ${codeBlock}

    <!-- Interview Tip -->
    ${tipSection}

    <!-- Footer -->
    <rect x="24" y="520" width="652" height="28" rx="8" fill="rgba(255,255,255,0.04)"/>
    <text x="350" y="539" text-anchor="middle" font-family="'Segoe UI',Inter,system-ui,sans-serif" font-size="10" fill="rgba(255,255,255,0.3)" letter-spacing="1">
      CANTILEVER AI TUTOR • POWERED BY LANGGRAPH + GROQ + LLAMA 3.3
    </text>
  </g>
</svg>`;
}

function generateDotGrid() {
  let dots = "";
  for (let x = 40; x < 700; x += 40) {
    for (let y = 40; y < 560; y += 40) {
      dots += `<circle cx="${x}" cy="${y}" r="0.8" fill="rgba(255,255,255,0.06)"/>`;
    }
  }
  return dots;
}

function generateVisualElements(theme) {
  switch (theme.visualType) {
    case "tree":
      return `
      <!-- Binary tree visual -->
      <g opacity="0.15" transform="translate(480, 130)">
        <circle cx="80" cy="0" r="14" stroke="${theme.accent}" stroke-width="1.5" fill="none"/>
        <line x1="70" y1="14" x2="40" y2="40" stroke="${theme.accent}" stroke-width="1"/>
        <line x1="90" y1="14" x2="120" y2="40" stroke="${theme.accent}" stroke-width="1"/>
        <circle cx="40" cy="54" r="12" stroke="${theme.accentAlt}" stroke-width="1.5" fill="none"/>
        <circle cx="120" cy="54" r="12" stroke="${theme.accentAlt}" stroke-width="1.5" fill="none"/>
        <line x1="32" y1="66" x2="16" y2="86" stroke="${theme.accentAlt}" stroke-width="1"/>
        <line x1="48" y1="66" x2="64" y2="86" stroke="${theme.accentAlt}" stroke-width="1"/>
        <line x1="112" y1="66" x2="96" y2="86" stroke="${theme.accentAlt}" stroke-width="1"/>
        <line x1="128" y1="66" x2="144" y2="86" stroke="${theme.accentAlt}" stroke-width="1"/>
        <circle cx="16" cy="98" r="10" stroke="${theme.accent}" stroke-width="1" fill="none"/>
        <circle cx="64" cy="98" r="10" stroke="${theme.accent}" stroke-width="1" fill="none"/>
        <circle cx="96" cy="98" r="10" stroke="${theme.accent}" stroke-width="1" fill="none"/>
        <circle cx="144" cy="98" r="10" stroke="${theme.accent}" stroke-width="1" fill="none"/>
      </g>`;
    case "stack":
      return `
      <!-- Web stack layers -->
      <g opacity="0.15" transform="translate(500, 150)">
        <rect x="0" y="0" width="140" height="28" rx="6" stroke="#3b82f6" stroke-width="1.5" fill="none"/>
        <text x="70" y="18" text-anchor="middle" font-size="10" fill="#3b82f6">React / Frontend</text>
        <rect x="0" y="36" width="140" height="28" rx="6" stroke="#10b981" stroke-width="1.5" fill="none"/>
        <text x="70" y="54" text-anchor="middle" font-size="10" fill="#10b981">Express / API</text>
        <rect x="0" y="72" width="140" height="28" rx="6" stroke="#f59e0b" stroke-width="1.5" fill="none"/>
        <text x="70" y="90" text-anchor="middle" font-size="10" fill="#f59e0b">Node.js / Server</text>
        <rect x="0" y="108" width="140" height="28" rx="6" stroke="#e879f9" stroke-width="1.5" fill="none"/>
        <text x="70" y="126" text-anchor="middle" font-size="10" fill="#e879f9">MongoDB / DB</text>
        <line x1="70" y1="28" x2="70" y2="36" stroke="rgba(255,255,255,0.3)" stroke-width="1" stroke-dasharray="3 2"/>
        <line x1="70" y1="64" x2="70" y2="72" stroke="rgba(255,255,255,0.3)" stroke-width="1" stroke-dasharray="3 2"/>
        <line x1="70" y1="100" x2="70" y2="108" stroke="rgba(255,255,255,0.3)" stroke-width="1" stroke-dasharray="3 2"/>
      </g>`;
    case "architecture":
      return `
      <!-- System design diagram -->
      <g opacity="0.15" transform="translate(470, 140)">
        <rect x="50" y="0" width="80" height="24" rx="4" stroke="${theme.accent}" stroke-width="1.5" fill="none"/>
        <text x="90" y="16" text-anchor="middle" font-size="9" fill="${theme.accent}">Load Balancer</text>
        <line x1="70" y1="24" x2="40" y2="44" stroke="${theme.accent}" stroke-width="1" stroke-dasharray="3 2"/>
        <line x1="110" y1="24" x2="140" y2="44" stroke="${theme.accent}" stroke-width="1" stroke-dasharray="3 2"/>
        <rect x="10" y="44" width="60" height="22" rx="4" stroke="${theme.accentAlt}" stroke-width="1" fill="none"/>
        <text x="40" y="58" text-anchor="middle" font-size="8" fill="${theme.accentAlt}">Server 1</text>
        <rect x="110" y="44" width="60" height="22" rx="4" stroke="${theme.accentAlt}" stroke-width="1" fill="none"/>
        <text x="140" y="58" text-anchor="middle" font-size="8" fill="${theme.accentAlt}">Server 2</text>
        <line x1="40" y1="66" x2="90" y2="86" stroke="${theme.accentAlt}" stroke-width="1" stroke-dasharray="3 2"/>
        <line x1="140" y1="66" x2="90" y2="86" stroke="${theme.accentAlt}" stroke-width="1" stroke-dasharray="3 2"/>
        <rect x="55" y="86" width="70" height="22" rx="4" stroke="#10b981" stroke-width="1" fill="none"/>
        <text x="90" y="100" text-anchor="middle" font-size="8" fill="#10b981">Database</text>
      </g>`;
    case "table":
      return `
      <!-- Database table visual -->
      <g opacity="0.15" transform="translate(490, 150)">
        <rect x="0" y="0" width="150" height="24" rx="4 4 0 0" stroke="${theme.accent}" stroke-width="1.5" fill="${theme.accent}" fill-opacity="0.2"/>
        <text x="75" y="16" text-anchor="middle" font-size="9" fill="${theme.accent}" font-weight="600">users_table</text>
        <rect x="0" y="24" width="150" height="80" rx="0 0 4 4" stroke="${theme.accent}" stroke-width="1" fill="none"/>
        <text x="10" y="42" font-size="8" fill="${theme.accentAlt}">id  |  name  |  email</text>
        <line x1="5" y1="48" x2="145" y2="48" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
        <text x="10" y="60" font-size="8" fill="rgba(255,255,255,0.4)">1   |  John  |  j@mail</text>
        <text x="10" y="74" font-size="8" fill="rgba(255,255,255,0.4)">2   |  Jane  |  j@mail</text>
        <text x="10" y="88" font-size="8" fill="rgba(255,255,255,0.4)">3   |  Alex  |  a@mail</text>
      </g>`;
    case "network":
      return `
      <!-- Network topology -->
      <g opacity="0.15" transform="translate(490, 150)">
        <circle cx="70" cy="30" r="16" stroke="${theme.accent}" stroke-width="1.5" fill="none"/>
        <text x="70" y="34" text-anchor="middle" font-size="8" fill="${theme.accent}">Router</text>
        <circle cx="20" cy="90" r="14" stroke="${theme.accentAlt}" stroke-width="1" fill="none"/>
        <text x="20" y="94" text-anchor="middle" font-size="7" fill="${theme.accentAlt}">PC1</text>
        <circle cx="70" cy="100" r="14" stroke="${theme.accentAlt}" stroke-width="1" fill="none"/>
        <text x="70" y="104" text-anchor="middle" font-size="7" fill="${theme.accentAlt}">PC2</text>
        <circle cx="120" cy="90" r="14" stroke="${theme.accentAlt}" stroke-width="1" fill="none"/>
        <text x="120" y="94" text-anchor="middle" font-size="7" fill="${theme.accentAlt}">PC3</text>
        <line x1="58" y1="42" x2="28" y2="78" stroke="${theme.accent}" stroke-width="1"/>
        <line x1="70" y1="46" x2="70" y2="86" stroke="${theme.accent}" stroke-width="1"/>
        <line x1="82" y1="42" x2="112" y2="78" stroke="${theme.accent}" stroke-width="1"/>
      </g>`;
    case "process":
      return `
      <!-- OS process diagram -->
      <g opacity="0.15" transform="translate(490, 145)">
        <rect x="20" y="0" width="100" height="20" rx="3" stroke="${theme.accent}" stroke-width="1" fill="none"/>
        <text x="70" y="14" text-anchor="middle" font-size="8" fill="${theme.accent}">New</text>
        <line x1="70" y1="20" x2="70" y2="30" stroke="${theme.accent}" stroke-width="1" marker-end="none"/>
        <text x="78" y="28" font-size="6" fill="${theme.accentAlt}">admit</text>
        <rect x="20" y="30" width="100" height="20" rx="3" stroke="${theme.accentAlt}" stroke-width="1.5" fill="${theme.accentAlt}" fill-opacity="0.15"/>
        <text x="70" y="44" text-anchor="middle" font-size="8" fill="${theme.accentAlt}">Ready</text>
        <line x1="70" y1="50" x2="70" y2="60" stroke="${theme.accentAlt}" stroke-width="1"/>
        <text x="82" y="58" font-size="6" fill="${theme.accent}">dispatch</text>
        <rect x="20" y="60" width="100" height="20" rx="3" stroke="#10b981" stroke-width="1.5" fill="#10b981" fill-opacity="0.15"/>
        <text x="70" y="74" text-anchor="middle" font-size="8" fill="#10b981">Running</text>
        <line x1="70" y1="80" x2="70" y2="90" stroke="#10b981" stroke-width="1"/>
        <text x="80" y="88" font-size="6" fill="#f59e0b">exit</text>
        <rect x="20" y="90" width="100" height="20" rx="3" stroke="#f59e0b" stroke-width="1" fill="none"/>
        <text x="70" y="104" text-anchor="middle" font-size="8" fill="#f59e0b">Terminated</text>
      </g>`;
    case "class":
      return `
      <!-- OOP class diagram -->
      <g opacity="0.15" transform="translate(490, 140)">
        <rect x="10" y="0" width="130" height="22" rx="4 4 0 0" stroke="${theme.accent}" stroke-width="1.5" fill="${theme.accent}" fill-opacity="0.2"/>
        <text x="75" y="15" text-anchor="middle" font-size="9" fill="${theme.accent}" font-weight="600">Animal</text>
        <rect x="10" y="22" width="130" height="44" rx="0 0 0 0" stroke="${theme.accent}" stroke-width="1" fill="none"/>
        <text x="18" y="38" font-size="8" fill="rgba(255,255,255,0.5)">- name: string</text>
        <line x1="10" y1="44" x2="140" y2="44" stroke="${theme.accent}" stroke-width="0.5" opacity="0.3"/>
        <text x="18" y="58" font-size="8" fill="rgba(255,255,255,0.5)">+ speak(): void</text>
        <rect x="10" y="66" width="130" height="2" fill="none"/>
        <line x1="75" y1="66" x2="75" y2="80" stroke="${theme.accentAlt}" stroke-width="1" stroke-dasharray="3 2"/>
        <text x="90" y="76" font-size="6" fill="${theme.accentAlt}">extends</text>
        <rect x="10" y="80" width="130" height="22" rx="4 4 0 0" stroke="${theme.accentAlt}" stroke-width="1" fill="${theme.accentAlt}" fill-opacity="0.1"/>
        <text x="75" y="95" text-anchor="middle" font-size="9" fill="${theme.accentAlt}">Dog</text>
        <rect x="10" y="102" width="130" height="22" rx="0 0 4 4" stroke="${theme.accentAlt}" stroke-width="1" fill="none"/>
        <text x="18" y="117" font-size="8" fill="rgba(255,255,255,0.4)">+ speak(): "Woof"</text>
      </g>`;
    default:
      return `
      <!-- Generic CS visual -->
      <g opacity="0.12" transform="translate(510, 155)">
        <circle cx="50" cy="30" r="20" stroke="${theme.accent}" stroke-width="1.5" fill="none"/>
        <text x="50" y="35" text-anchor="middle" font-size="16">${theme.icon}</text>
        <circle cx="0" cy="90" r="16" stroke="${theme.accentAlt}" stroke-width="1" fill="none"/>
        <circle cx="100" cy="90" r="16" stroke="${theme.accentAlt}" stroke-width="1" fill="none"/>
        <line x1="38" y1="46" x2="10" y2="76" stroke="${theme.accent}" stroke-width="1" stroke-dasharray="3 2"/>
        <line x1="62" y1="46" x2="90" y2="76" stroke="${theme.accent}" stroke-width="1" stroke-dasharray="3 2"/>
        <line x1="16" y1="90" x2="84" y2="90" stroke="${theme.accentAlt}" stroke-width="0.8" stroke-dasharray="3 2"/>
      </g>`;
  }
}

function generateConceptCards(concepts, theme) {
  const cardWidth = 145;
  const startX = 36;
  const y = 152;
  const gap = 8;

  return concepts.map((concept, i) => {
    const x = startX + i * (cardWidth + gap);
    const chipColors = [theme.accent, theme.accentAlt, "#10b981", "#f59e0b"];
    const color = chipColors[i % chipColors.length];
    return `
    <g filter="url(#softShadow)">
      <rect x="${x}" y="${y}" width="${cardWidth}" height="48" rx="8" fill="url(#glassCard)" stroke="${color}" stroke-width="0.8" stroke-opacity="0.4"/>
    </g>
    <circle cx="${x + 18}" cy="${y + 24}" r="6" fill="${color}" opacity="0.25"/>
    <text x="${x + 18}" y="${y + 27}" text-anchor="middle" font-size="8" fill="${color}">✦</text>
    <text x="${x + 32}" y="${y + 21}" font-family="'Segoe UI',Inter,system-ui,sans-serif" font-size="10" fill="white" font-weight="600">
      ${concept.substring(0, 18)}
    </text>
    <text x="${x + 32}" y="${y + 36}" font-family="'Segoe UI',Inter,system-ui,sans-serif" font-size="8" fill="rgba(255,255,255,0.4)">
      Concept ${i + 1}
    </text>`;
  }).join("\n");
}

function generateCodeBlock(codeLine, theme) {
  // Split code into multiple lines via \n delimiter
  let codeLines = codeLine.split("\\n").filter(l => l.trim().length > 0);

  // If the LLM returned everything as a single long line, auto-wrap it
  if (codeLines.length <= 1 && codeLine.length > 50) {
    const singleLine = codeLines[0] || codeLine;
    codeLines = [];
    // Split on common code boundaries: { } ;
    const parts = singleLine
      .replace(/\{/g, '{\n')
      .replace(/\}/g, '\n}\n')
      .replace(/;\s*/g, ';\n')
      .split('\n')
      .filter(p => p.trim().length > 0);
    if (parts.length > 1) {
      let indent = 0;
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.startsWith('}')) indent = Math.max(0, indent - 1);
        codeLines.push('  '.repeat(indent) + trimmed);
        if (trimmed.endsWith('{')) indent++;
      }
    } else {
      // Fallback: chunk every ~50 chars at word boundaries
      const words = singleLine.split(' ');
      let currentLine = '';
      for (const word of words) {
        if ((currentLine + ' ' + word).length > 50 && currentLine.length > 0) {
          codeLines.push(currentLine);
          currentLine = '  ' + word;
        } else {
          currentLine = currentLine ? currentLine + ' ' + word : word;
        }
      }
      if (currentLine) codeLines.push(currentLine);
    }
  }

  codeLines = codeLines.slice(0, 10);

  return `
    <!-- Code snippet block -->
    <text x="40" y="225" font-family="'Segoe UI',Inter,system-ui,sans-serif" font-size="11" fill="rgba(255,255,255,0.45)" font-weight="600" letter-spacing="1.5">
      CODE SNIPPET
    </text>
    <g filter="url(#softShadow)">
      <rect x="36" y="234" width="628" height="${24 + codeLines.length * 18}" rx="8" fill="rgba(0,0,0,0.4)" stroke="${theme.accent}" stroke-width="0.6" stroke-opacity="0.3"/>
    </g>
    <!-- Terminal dots -->
    <circle cx="50" cy="246" r="3.5" fill="#ff5f57"/>
    <circle cx="62" cy="246" r="3.5" fill="#febc2e"/>
    <circle cx="74" cy="246" r="3.5" fill="#28c840"/>
    <text x="100" y="249" font-family="'Cascadia Code',monospace" font-size="8" fill="rgba(255,255,255,0.3)">code.js</text>
    <line x1="36" y1="256" x2="664" y2="256" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
    <!-- Line numbers -->
    ${codeLines.map((_, i) => `<text x="46" y="${274 + i * 18}" font-family="'Cascadia Code',monospace" font-size="9" fill="rgba(255,255,255,0.2)">${i + 1}</text>`).join("\n    ")}
    <!-- Code content -->
    ${codeLines.map((line, i) =>
    `<text x="64" y="${274 + i * 18}" font-family="'Cascadia Code','Fira Code',monospace" font-size="11" fill="${theme.accentAlt}">${line}</text>`
  ).join("\n    ")}`;
}

function generateTipSection(tip) {
  return `
    <!-- Interview Tip -->
    <g filter="url(#softShadow)">
      <rect x="36" y="460" width="628" height="48" rx="10" fill="rgba(251,191,36,0.06)" stroke="rgba(251,191,36,0.2)" stroke-width="1"/>
    </g>
    <text x="56" y="480" font-family="'Segoe UI',Inter,system-ui,sans-serif" font-size="11" fill="#fbbf24" font-weight="700">
      💡 INTERVIEW TIP
    </text>
    <text x="56" y="498" font-family="'Segoe UI',Inter,system-ui,sans-serif" font-size="11" fill="rgba(255,255,255,0.65)">
      ${tip}
    </text>`;
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
