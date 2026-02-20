// ─── LangGraph Orchestration ── StateGraph Wiring ───
// Defines the shared state and wires Supervisor → Researcher → Media Engine
// with conditional edges based on guardrail classification.

import { StateGraph, END } from "@langchain/langgraph";
import { runSupervisor } from "./supervisor.js";
import { runResearcher } from "./researcher.js";
import { runMediaEngine } from "./mediaEngine.js";

// ─── Shared State Schema ───
// {
//   query: string,        — user's raw input
//   duration: number,     — 2–5 minutes
//   topic: string | null, — detected topic from supervisor
//   rejected: boolean,    — whether the query was rejected
//   rejectionReason: string | null,
//   classification: string, — placement_topic | irrelevant | harmful
//   markdown: string | null,  — generated content
//   imageUrl: string | null,  — generated image path
//   audioText: string | null, — clean text for TTS
//   mediaFailed: boolean      — whether media generation failed
// }

function createInitialState(query, duration) {
    return {
        query,
        duration: Math.min(5, Math.max(2, duration || 3)),
        topic: null,
        rejected: false,
        rejectionReason: null,
        classification: null,
        markdown: null,
        imageUrl: null,
        audioText: null,
        mediaFailed: false
    };
}

// ─── Route function: after supervisor, decide next node ───
function routeAfterSupervisor(state) {
    if (state.rejected) {
        return "end";
    }
    return "researcher";
}

// ─── Build the graph ───
export function buildAgentGraph() {
    const graph = new StateGraph({
        channels: {
            query: { value: (a, b) => b ?? a, default: () => "" },
            duration: { value: (a, b) => b ?? a, default: () => 3 },
            topic: { value: (a, b) => b ?? a, default: () => null },
            rejected: { value: (a, b) => b ?? a, default: () => false },
            rejectionReason: { value: (a, b) => b ?? a, default: () => null },
            classification: { value: (a, b) => b ?? a, default: () => null },
            markdown: { value: (a, b) => b ?? a, default: () => null },
            imageUrl: { value: (a, b) => b ?? a, default: () => null },
            audioText: { value: (a, b) => b ?? a, default: () => null },
            mediaFailed: { value: (a, b) => b ?? a, default: () => false },
        }
    });

    // Add nodes
    graph.addNode("supervisor", runSupervisor);
    graph.addNode("researcher", runResearcher);
    graph.addNode("mediaEngine", runMediaEngine);

    // Set entry point
    graph.setEntryPoint("supervisor");

    // Conditional edge after supervisor
    graph.addConditionalEdges("supervisor", routeAfterSupervisor, {
        researcher: "researcher",
        end: END
    });

    // Linear edges for the rest
    graph.addEdge("researcher", "mediaEngine");
    graph.addEdge("mediaEngine", END);

    return graph.compile();
}

export { createInitialState };
