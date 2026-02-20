// ─── Chat Route ── POST /api/chat ───
import { Router } from "express";
import { buildAgentGraph, createInitialState } from "../agents/graph.js";

const router = Router();

// Build the compiled graph once
let compiledGraph = null;

function getGraph() {
    if (!compiledGraph) {
        compiledGraph = buildAgentGraph();
    }
    return compiledGraph;
}

router.post("/", async (req, res) => {
    try {
        const { query, duration } = req.body;

        if (!query || typeof query !== "string" || query.trim().length === 0) {
            return res.status(400).json({ error: "Query is required" });
        }

        const durationVal = parseInt(duration) || 3;
        const initialState = createInitialState(query.trim(), durationVal);

        console.log(`\n📨 Query: "${query}" | Duration: ${durationVal} min`);

        const graph = getGraph();
        const result = await graph.invoke(initialState);

        console.log(`✅ Result: rejected=${result.rejected}, topic=${result.topic}, mediaFailed=${result.mediaFailed}`);

        res.json({
            query: result.query,
            topic: result.topic,
            duration: result.duration,
            rejected: result.rejected,
            rejectionReason: result.rejectionReason,
            classification: result.classification,
            markdown: result.markdown,
            imageUrl: result.imageUrl,
            audioText: result.audioText,
            mediaFailed: result.mediaFailed
        });

    } catch (error) {
        console.error("Chat route error:", error);
        res.status(500).json({
            error: "An error occurred while processing your query",
            details: error.message
        });
    }
});

export default router;
