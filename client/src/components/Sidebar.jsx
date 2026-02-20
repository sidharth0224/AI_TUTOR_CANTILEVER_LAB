import { useState } from 'react';

const DURATION_LEVELS = {
    2: { label: 'Short Overview', className: 'short', emoji: '🟢' },
    3: { label: 'Moderate Explanation', className: 'moderate', emoji: '🔵' },
    4: { label: 'Detailed Walkthrough', className: 'detailed', emoji: '🟡' },
    5: { label: 'Deep Dive', className: 'deep', emoji: '🟣' },
};

export default function Sidebar({ topics, duration, onDurationChange, onTopicClick, onAddTopic, activeTopic, onGoHome }) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTopicName, setNewTopicName] = useState('');
    const [newTopicDesc, setNewTopicDesc] = useState('');

    const level = DURATION_LEVELS[duration] || DURATION_LEVELS[3];

    const handleAddTopic = () => {
        if (newTopicName.trim()) {
            onAddTopic(newTopicName.trim(), newTopicDesc.trim());
            setNewTopicName('');
            setNewTopicDesc('');
            setShowAddForm(false);
        }
    };

    return (
        <aside className="sidebar">
            {/* Cantilever Labs Logo — click to go home */}
            <div className="sidebar-header">
                <div className="sidebar-logo" onClick={onGoHome} style={{ cursor: 'pointer' }} title="Go to Home">
                    <img src="/cantilever-logo.svg" alt="Cantilever Labs" className="cantilever-logo-img" />
                </div>
                <div className="powered-badge">
                    <span className="dot"></span>
                    Powered by LangGraph Agents
                </div>
            </div>

            {/* Duration Control */}
            <div className="duration-control">
                <div className="duration-header">
                    <span className="label">⏱ Explanation Length</span>
                    <span className={`duration-level-badge ${level.className}`}>
                        {level.emoji} {level.label}
                    </span>
                </div>
                <div className="duration-slider-row">
                    <div className="duration-value">
                        {duration}<small> min</small>
                    </div>
                    <input
                        type="range"
                        min="2"
                        max="5"
                        step="1"
                        value={duration}
                        onChange={(e) => onDurationChange(parseInt(e.target.value))}
                        className="duration-slider"
                    />
                </div>
                <div className="duration-words">~{duration * 150} words · {duration} min read</div>
            </div>

            {/* Topics */}
            <div className="topics-section">
                <div className="topics-section-title">📚 Knowledge Base</div>
                {topics.map((topic) => (
                    <div
                        key={topic.id}
                        className={`topic-item ${activeTopic === topic.id ? 'active' : ''}`}
                        onClick={() => onTopicClick(topic)}
                    >
                        <div className="topic-item-name">{topic.name}</div>
                        <div className="topic-item-count">{topic.subtopics?.length || 0} subtopics</div>
                    </div>
                ))}
            </div>

            {/* Add Topic */}
            <div className="add-topic-section">
                {!showAddForm ? (
                    <button className="add-topic-btn" onClick={() => setShowAddForm(true)}>
                        + Add New Topic
                    </button>
                ) : (
                    <div className="add-topic-form">
                        <input
                            className="add-topic-input"
                            placeholder="Topic name..."
                            value={newTopicName}
                            onChange={(e) => setNewTopicName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                            autoFocus
                        />
                        <input
                            className="add-topic-input"
                            placeholder="Description (optional)"
                            value={newTopicDesc}
                            onChange={(e) => setNewTopicDesc(e.target.value)}
                        />
                        <div className="add-topic-actions">
                            <button className="btn-sm primary" onClick={handleAddTopic}>Add</button>
                            <button className="btn-sm secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
