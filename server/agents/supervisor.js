// ─── Supervisor Agent (Node A) ── Guardrail & Classification ───
// Classifies user queries into: placement_topic | irrelevant | harmful
// Only allows placement_topic through to the next agent.

import { ChatGroq } from "@langchain/groq";
import knowledgeBase from "../knowledgeBase.js";

const model = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0,
});

const SYSTEM_PROMPT = `You are a strict classification agent for an AI Tutor focused on placement preparation.

Your ONLY job is to classify the user's query into one of three categories:
1. "placement_topic" — The query is related to placement preparation, technical interviews, coding, computer science, aptitude, or any of the topics below.
2. "irrelevant" — The query is off-topic (e.g., recipes, weather, personal questions, entertainment).
3. "harmful" — The query contains harmful, offensive, or inappropriate content.

AVAILABLE PLACEMENT TOPICS:
{TOPICS}

RULES:
- If the query relates to ANY of the topics above or their subtopics, classify as "placement_topic".
- If the query is about adding a new topic to the knowledge base, classify as "placement_topic".
- If the query asks for general tech/CS knowledge useful for placements, classify as "placement_topic".
- Be generous — if there's any reasonable placement connection, allow it.
- ONLY reject if clearly irrelevant or harmful.

Respond with ONLY a JSON object (no markdown, no code fences):
{"classification": "placement_topic" | "irrelevant" | "harmful", "reason": "brief reason", "detectedTopic": "topic name or null"}`;

export async function runSupervisor(state) {
    try {
        const topicsContext = knowledgeBase.toContextString();
        const prompt = SYSTEM_PROMPT.replace("{TOPICS}", topicsContext);

        const response = await model.invoke([
            { role: "system", content: prompt },
            { role: "user", content: state.query }
        ]);

        let text = response.content.trim();
        // Strip markdown code fences if present
        text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

        const result = JSON.parse(text);

        if (result.classification !== "placement_topic") {
            return {
                ...state,
                rejected: true,
                rejectionReason: result.classification === "harmful"
                    ? `⚠️ This query was flagged as harmful: ${result.reason}`
                    : `🚫 This query is not related to placement preparation: ${result.reason}`,
                classification: result.classification
            };
        }

        return {
            ...state,
            rejected: false,
            topic: state.query,
            classification: result.classification
        };
    } catch (error) {
        console.error("Supervisor agent error:", error);
        return {
            ...state,
            rejected: false,
            topic: state.query,
            classification: "placement_topic"
        };
    }
}
