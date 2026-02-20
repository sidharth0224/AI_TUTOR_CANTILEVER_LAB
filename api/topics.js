// Vercel Serverless Function: GET/POST /api/topics
// Returns knowledge base topics or adds new ones

import knowledgeBase from '../server/knowledgeBase.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        return res.status(200).json({ topics: knowledgeBase.getAllTopics() });
    }

    if (req.method === 'POST') {
        const { name, description, subtopics } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Topic name is required' });
        }

        const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + uuidv4().slice(0, 4);
        knowledgeBase.addTopic(id, name.trim(), description || '', subtopics || []);

        return res.status(201).json({
            topic: {
                id,
                name: name.trim(),
                description: description || '',
                subtopics: subtopics || []
            }
        });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
