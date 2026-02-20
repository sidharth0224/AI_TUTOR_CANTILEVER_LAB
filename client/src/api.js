import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 120000, // 2 min timeout
});

export async function sendMessage(query, duration) {
    const response = await api.post('/chat', { query, duration });
    return response.data;
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
