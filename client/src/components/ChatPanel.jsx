import { useState, useRef, useEffect } from 'react';
import OutputPanel from './OutputPanel.jsx';

export default function ChatPanel({ messages, loading, loadingStep, onSend, user, onSignIn, onSignUp, onSignOut, onGoHome, backendOnline = true }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const input = e.target.elements.query;
        if (input.value.trim()) {
            onSend(input.value.trim());
            input.value = '';
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.target.form.requestSubmit();
        }
    };

    const suggestions = [
        "Explain REST APIs in MERN Stack",
        "What is CAP theorem?",
        "Binary Search Trees walkthrough",
        "Deadlocks in Operating Systems",
        "SOLID principles in OOP",
        "TCP vs UDP explained",
    ];

    return (
        <main className="main-content">
            {/* Header */}
            <div className="chat-header">
                <div className="chat-header-left">
                    <h2 onClick={onGoHome} style={{ cursor: 'pointer' }}>💬 Cantilever AI Tutor</h2>
                    <span className="header-agent-badge">Multi-Agent System</span>
                </div>
                <div className="chat-header-right">
                    <span className={`status-dot ${!backendOnline ? 'offline' : ''}`}></span>
                    <span className={`status-label ${!backendOnline ? 'offline' : ''}`}>{backendOnline ? 'Online' : 'Frontend Only'}</span>

                    {/* User avatar or sign in button */}
                    {user ? (
                        <div className="user-avatar-badge" title={user.name}>
                            {user.avatar}
                        </div>
                    ) : null}

                    {/* Hamburger Menu */}
                    <div className="hamburger-wrapper" ref={menuRef}>
                        <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)} title="Menu">
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                        {menuOpen && (
                            <div className="hamburger-dropdown">
                                <button className="dropdown-item" onClick={() => { onGoHome(); setMenuOpen(false); }}>
                                    <span className="dropdown-icon">🏠</span> Home
                                </button>
                                <div className="dropdown-divider"></div>
                                {user ? (
                                    <>
                                        <div className="dropdown-user-info">
                                            <div className="dropdown-user-avatar">{user.avatar}</div>
                                            <div>
                                                <div className="dropdown-user-name">{user.name}</div>
                                                <div className="dropdown-user-email">{user.email}</div>
                                            </div>
                                        </div>
                                        <div className="dropdown-divider"></div>
                                        <button className="dropdown-item signout" onClick={() => { onSignOut(); setMenuOpen(false); }}>
                                            <span className="dropdown-icon">🚪</span> Sign Out
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button className="dropdown-item" onClick={() => { onSignIn(); setMenuOpen(false); }}>
                                            <span className="dropdown-icon">🔑</span> Sign In
                                        </button>
                                        <button className="dropdown-item" onClick={() => { onSignUp(); setMenuOpen(false); }}>
                                            <span className="dropdown-icon">✨</span> Sign Up
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="messages-area" id="messages-area">
                {messages.length === 0 && !loading ? (
                    <WelcomeState onSend={onSend} suggestions={suggestions} user={user} />
                ) : (
                    <>
                        {messages.map((msg, idx) => (
                            <div key={idx}>
                                {msg.role === 'user' ? (
                                    <UserMessage content={msg.content} time={msg.time} user={user} />
                                ) : msg.rejected ? (
                                    <AssistantRejection reason={msg.rejectionReason} />
                                ) : (
                                    <AssistantMessage msg={msg} />
                                )}
                            </div>
                        ))}
                        {loading && <AgentProgress step={loadingStep} />}
                    </>
                )}
            </div>

            {/* Input */}
            <div className="chat-input-area">
                <form className="chat-input-wrapper" onSubmit={handleSubmit}>
                    <textarea
                        name="query"
                        className="chat-input"
                        placeholder="Ask about any placement topic..."
                        rows={1}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />
                    <button type="submit" className="send-btn" disabled={loading} title="Send">
                        ➤
                    </button>
                </form>
            </div>
        </main>
    );
}

/* ─── Welcome State ─── */
function WelcomeState({ onSend, suggestions, user }) {
    return (
        <div className="welcome-state">
            <div className="welcome-hero">
                <div className="welcome-avatar">🎓</div>
                <h2>{user ? `Hey ${user.name}! Ready to Learn?` : 'Welcome to Cantilever AI Tutor'}</h2>
                <p>Your multi-agent assistant for placement preparation — bridging colleges to corporates. Ask conceptual questions, request coding walkthroughs, or explore topics.</p>
            </div>

            {/* Tip Cards */}
            <div className="tips-row">
                <div className="tip-card">
                    <span className="tip-card-icon">🧠</span>
                    <h4>Conceptual Questions</h4>
                    <p>Ask about CS fundamentals, system design, or aptitude</p>
                </div>
                <div className="tip-card">
                    <span className="tip-card-icon">💻</span>
                    <h4>Coding Interviews</h4>
                    <p>Get step-by-step walkthroughs for DSA & algorithms</p>
                </div>
                <div className="tip-card">
                    <span className="tip-card-icon">⏱️</span>
                    <h4>Adjust Duration</h4>
                    <p>Use the slider to control explanation depth (2–5 min)</p>
                </div>
            </div>

            {/* Example Conversation Preview */}
            <div className="example-conversation">
                <div className="example-label">💡 Example Conversation</div>
                <div className="example-msg">
                    <div className="example-msg-avatar user">👤</div>
                    <div className="example-msg-content">
                        <div className="example-msg-name">You</div>
                        <div className="example-msg-text">Explain REST APIs in MERN Stack</div>
                    </div>
                </div>
                <div className="example-msg">
                    <div className="example-msg-avatar ai">🤖</div>
                    <div className="example-msg-content">
                        <div className="example-msg-name">Cantilever AI</div>
                        <div className="example-msg-text">
                            REST (Representational State Transfer) is an architectural style for building web APIs. In a MERN stack, Express.js handles the REST endpoints...<span className="typing-cursor"></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Suggestion Chips */}
            <div className="suggestions-section">
                <div className="suggestions-label">⚡ Try asking</div>
                <div className="suggestion-chips">
                    {suggestions.map((s, i) => (
                        <button key={i} className="suggestion-chip" onClick={() => onSend(s)}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─── User Message Bubble ─── */
function UserMessage({ content, time, user }) {
    return (
        <div className="message message-user">
            <div>
                <div className="message-user-bubble">{content}</div>
                <div className="message-user-meta">{user ? user.name : 'You'} · {time}</div>
            </div>
        </div>
    );
}

/* ─── Assistant Rejection ─── */
function AssistantRejection({ reason }) {
    return (
        <div className="message message-assistant">
            <div className="ai-avatar">🛡️</div>
            <div className="message-assistant-content">
                <div className="ai-name-row">
                    <span className="ai-name">Guardrail Agent</span>
                    <span className="ai-badge model">Protected</span>
                </div>
                <div className="rejection-banner">
                    <span className="rejection-banner-icon">⚠️</span>
                    <p>{reason}</p>
                </div>
            </div>
        </div>
    );
}

/* ─── Assistant Full Response ─── */
function AssistantMessage({ msg }) {
    return (
        <div className="message message-assistant">
            <div className="ai-avatar">🤖</div>
            <div className="message-assistant-content">
                <div className="ai-name-row">
                    <span className="ai-name">AI Tutor</span>
                    <span className="ai-badge model">Llama 3.3 · Groq</span>
                </div>
                <OutputPanel
                    markdown={msg.markdown}
                    imageUrl={msg.imageUrl}
                    audioText={msg.audioText}
                    mediaFailed={msg.mediaFailed}
                    topic={msg.topic}
                />
            </div>
        </div>
    );
}

/* ─── Agent Progress ─── */
function AgentProgress({ step }) {
    const steps = [
        { key: 'guardrail', icon: '🛡️', label: 'Guardrail Agent — Validating query...', statusClass: 'checking', statusLabel: 'Checking' },
        { key: 'teacher', icon: '📚', label: 'Teacher Agent — Generating walkthrough...', statusClass: 'generating', statusLabel: 'Generating' },
        { key: 'media', icon: '🎨', label: 'Media Engine — Creating visuals & audio...', statusClass: 'creating', statusLabel: 'Creating' },
    ];

    const stepIndex = { guardrail: 0, teacher: 1, media: 2 }[step] ?? 0;

    return (
        <div className="agent-progress">
            <div className="ai-avatar">🤖</div>
            <div className="agent-progress-content">
                <div className="agent-progress-title">Cantilever AI is processing your query...</div>
                <div className="agent-steps">
                    {steps.map((s, i) => {
                        const isActive = i === stepIndex;
                        const isDone = i < stepIndex;
                        return (
                            <div key={s.key} className={`agent-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                                <span className="agent-step-icon">{s.icon}</span>
                                <span className="agent-step-label">{s.label}</span>
                                {isDone ? (
                                    <span className="agent-step-status done">✓ Done</span>
                                ) : isActive ? (
                                    <>
                                        <div className="spinner"></div>
                                        <span className={`agent-step-status ${s.statusClass}`}>{s.statusLabel}</span>
                                    </>
                                ) : (
                                    <span className="agent-step-status waiting">Waiting</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
