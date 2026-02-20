// ─── Topics Route ── GET/POST /api/topics ───
import { Router } from "express";
import knowledgeBase from "../knowledgeBase.js";

const router = Router();

// GET /api/topics — Return all topics
router.get("/", (req, res) => {
    res.json({ topics: knowledgeBase.getAllTopics() });
});

// POST /api/topics — Add a new topic
router.post("/", (req, res) => {
    const { name, description, subtopics } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "Topic name is required" });
    }

    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    if (knowledgeBase.getTopicById(id)) {
        return res.status(409).json({ error: "Topic already exists" });
    }

    const topic = knowledgeBase.addTopic(
        id,
        name.trim(),
        description?.trim() || `${name.trim()} — placement preparation topic`,
        Array.isArray(subtopics) ? subtopics : []
    );

    res.status(201).json({ topic: { id, ...topic } });
});

// POST /api/topics/:id/subtopic — Add a subtopic
router.post("/:id/subtopic", (req, res) => {
    const { subtopic } = req.body;
    const { id } = req.params;

    if (!subtopic || typeof subtopic !== "string") {
        return res.status(400).json({ error: "Subtopic name is required" });
    }

    const success = knowledgeBase.addSubtopic(id, subtopic.trim());
    if (!success) {
        return res.status(404).json({ error: "Topic not found" });
    }

    res.json({ message: "Subtopic added", topic: knowledgeBase.getTopicById(id) });
});

export default router;
