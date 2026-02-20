// ─── AI Tutor Server ── Express Entry Point ───
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import chatRouter from "./routes/chat.js";
import topicsRouter from "./routes/topics.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───
app.use(cors());
app.use(express.json());

// Serve static files (generated images, audio)
app.use("/public", express.static(path.join(__dirname, "public")));

// ─── API Routes ───
app.use("/api/chat", chatRouter);
app.use("/api/topics", topicsRouter);

// ─── Health Check ───
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Start Server ───
app.listen(PORT, () => {
    console.log(`\n🚀 AI Tutor Server running on http://localhost:${PORT}`);
    console.log(`📚 Topics API:  http://localhost:${PORT}/api/topics`);
    console.log(`💬 Chat API:    http://localhost:${PORT}/api/chat`);
    console.log(`❤️  Health:      http://localhost:${PORT}/api/health\n`);
});
