// ─── Researcher Agent (Node B) ── Teacher / Content Generator ───
// Generates pedagogically structured Markdown content for a placement topic.
// Respects the duration parameter: ~150 words per minute.

import { ChatGroq } from "@langchain/groq";
import knowledgeBase from "../knowledgeBase.js";

const model = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.7,
});

const DURATION_MAP = {
    2: { words: 300, label: "concise" },
    3: { words: 450, label: "moderate" },
    4: { words: 600, label: "detailed" },
    5: { words: 750, label: "comprehensive" }
};

const SYSTEM_PROMPT = `You are an expert AI Tutor specializing in placement preparation. You create clear, structured, pedagogically sound walkthroughs for students.

AVAILABLE TOPICS FOR CONTEXT:
{TOPICS}

INSTRUCTIONS:
- Generate a step-by-step walkthrough in well-formatted Markdown.
- Target approximately {WORD_COUNT} words ({DURATION} minutes of reading at ~150 words/min).
- Structure the response as a {LABEL} explanation.
- Use headers (##, ###), bullet points, code blocks (if relevant), and bold for key terms.
- Make it coherent and pedagogically sound — start from fundamentals and build up.
- Include practical examples where relevant.
- End with 2–3 key takeaways.

Do NOT include introductory phrases like "Sure!" or "Here's your explanation". Jump straight into the content.`;

export async function runResearcher(state) {
    // If rejected by supervisor, skip
    if (state.rejected) return state;

    try {
        const duration = state.duration || 3;
        const config = DURATION_MAP[duration] || DURATION_MAP[3];
        const topicsContext = knowledgeBase.toContextString();

        const prompt = SYSTEM_PROMPT
            .replace("{TOPICS}", topicsContext)
            .replace("{WORD_COUNT}", config.words)
            .replace("{DURATION}", duration)
            .replace("{LABEL}", config.label);

        const response = await model.invoke([
            { role: "system", content: prompt },
            { role: "user", content: `Create a walkthrough on: ${state.topic || state.query}` }
        ]);

        return {
            ...state,
            markdown: response.content.trim()
        };
    } catch (error) {
        console.error("Researcher agent error:", error);
        return {
            ...state,
            markdown: `## ⚠️ Content Generation Error\n\nWe encountered an issue generating content for "${state.topic}". Please try again.\n\n*Error: ${error.message}*`
        };
    }
}
