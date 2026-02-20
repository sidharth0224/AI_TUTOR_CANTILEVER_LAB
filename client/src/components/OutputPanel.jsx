import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function OutputPanel({ markdown, imageUrl, audioText, mediaFailed, topic }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const utteranceRef = useRef(null);

    const handleTTS = () => {
        if (!audioText) return;

        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(audioText);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
            || voices.find(v => v.lang.startsWith('en-US'))
            || voices.find(v => v.lang.startsWith('en'));
        if (preferred) utterance.voice = preferred;

        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
    };

    return (
        <div className="output-panel">
            {/* Agent Transparency Badges */}
            <div className="agent-badges">
                <span className="agent-badge-item guardrail">🛡️ Guardrail Passed</span>
                <span className="agent-badge-item teacher">📚 Teacher Generated</span>
                {imageUrl && <span className="agent-badge-item media">🎨 Media Created</span>}
                {mediaFailed && <span className="agent-badge-item media" style={{ opacity: 0.5 }}>🎨 Media Skipped</span>}
            </div>

            {/* Markdown Content */}
            {markdown && (
                <div className="output-card">
                    <div className="output-card-header">
                        <span>📝</span> Walkthrough — {topic || 'Topic'}
                    </div>
                    <div className="output-card-body markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {markdown}
                        </ReactMarkdown>
                    </div>
                </div>
            )}

            {/* Image */}
            {imageUrl && (
                <div className="output-card">
                    <div className="output-card-header">
                        <span>🖼️</span> Visual Illustration
                    </div>
                    <div className="output-card-body">
                        <img src={imageUrl} alt={`Illustration for ${topic}`} className="output-image" />
                    </div>
                </div>
            )}

            {/* Audio / TTS */}
            {audioText && (
                <div className="output-card">
                    <div className="output-card-header">
                        <span>🔊</span> Audio Walkthrough
                    </div>
                    <div className="output-card-body audio-player-container">
                        <div className="tts-controls">
                            <button className="tts-btn" onClick={handleTTS}>
                                {isPlaying ? '⏸' : '▶'}
                            </button>
                            <div className="tts-info">
                                <span className="label">{isPlaying ? '🔊 Playing Audio...' : 'Text-to-Speech Narration'}</span>
                                <span>Click to {isPlaying ? 'pause' : 'listen to'} the walkthrough</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Media Failed Warning */}
            {mediaFailed && (
                <div className="media-failed">
                    ⚠️ Some media couldn't be generated (API limit). Text walkthrough is complete above.
                </div>
            )}
        </div>
    );
}
