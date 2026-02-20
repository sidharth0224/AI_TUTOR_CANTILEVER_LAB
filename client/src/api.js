import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 120000, // 2 min timeout
});

/**
 * Send a chat message using streaming (JSON lines).
 * Each line is a JSON object: { step: "supervisor"|"researcher"|"media"|"done"|"error", data: {...} }
 * @param {string} query
 * @param {number} duration
 * @param {function} onProgress - callback(step, data) called for each intermediate step
 * @returns {Promise<object>} - the final assembled result
 */
export async function sendMessage(query, duration, onProgress) {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, duration }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        let errorMsg = `HTTP ${response.status}`;
        try { errorMsg = JSON.parse(errorBody).error || errorMsg; } catch { }
        throw new Error(errorMsg);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult = null;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete last line in buffer

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
                const parsed = JSON.parse(trimmed);

                if (onProgress) {
                    onProgress(parsed.step, parsed.data);
                }

                if (parsed.step === 'done') {
                    finalResult = parsed.data;
                } else if (parsed.step === 'error') {
                    throw new Error(parsed.data?.error || 'AI processing failed');
                }
            } catch (e) {
                if (e.message && !e.message.includes('JSON')) throw e;
                // Skip malformed lines
            }
        }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
        try {
            const parsed = JSON.parse(buffer.trim());
            if (parsed.step === 'done') finalResult = parsed.data;
            if (parsed.step === 'error') throw new Error(parsed.data?.error || 'AI processing failed');
        } catch { }
    }

    if (!finalResult) throw new Error('No response received from server');
    return finalResult;
}

export async function getTopics() {
    const response = await api.get('/topics');
    return response.data.topics;
}

export async function addTopic(name, description, subtopics) {
    const response = await api.post('/topics', { name, description, subtopics });
    return response.data.topic;
}

export default api;
