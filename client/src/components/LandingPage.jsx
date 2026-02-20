export default function LandingPage({ onSignIn, onSignUp }) {
    const features = [
        { icon: '🤖', title: 'Multi-Agent AI', desc: 'LangGraph-powered agents work together — Guardrail, Teacher, and Media Engine' },
        { icon: '📚', title: '8+ Core Topics', desc: 'MERN Stack, System Design, Data Structures, OOP, DBMS, OS & more' },
        { icon: '⏱️', title: 'Custom Duration', desc: 'Choose 2–5 minute walkthroughs with adjustable depth levels' },
        { icon: '🎨', title: 'Multi-Modal Output', desc: 'Markdown, visual illustrations, and audio narration for each topic' },
        { icon: '🛡️', title: 'Smart Guardrails', desc: '3-class classification keeps content focused on placement prep' },
        { icon: '⚡', title: 'Blazing Fast', desc: 'Powered by Groq and Llama 3.3 for near-instant responses' },
    ];

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="landing-nav-logo">
                    <img src="/cantilever-logo.svg" alt="Cantilever Labs" className="cantilever-logo-img" />
                </div>
                <div className="landing-nav-actions">
                    <button className="landing-btn-ghost" onClick={onSignIn}>Sign In</button>
                    <button className="landing-btn-primary" onClick={onSignUp}>Get Started Free</button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="landing-hero">
                <div className="landing-hero-content">
                    <div className="landing-hero-badge">✨ AI-Powered Placement Preparation</div>
                    <h1>
                        Your Personal<br />
                        <span className="gradient-text">AI Tutor</span> for<br />
                        Campus Placements
                    </h1>
                    <p className="landing-hero-subtitle">
                        Master technical interviews with our multi-agent AI system.
                        Get personalized walkthroughs, visual explanations, and audio guides
                        for every CS topic — from DSA to System Design.
                    </p>
                    <div className="landing-hero-cta">
                        <button className="landing-btn-primary large" onClick={onSignUp}>
                            Start Learning Free →
                        </button>
                        <button className="landing-btn-ghost large" onClick={onSignIn}>
                            I already have an account
                        </button>
                    </div>
                    <div className="landing-hero-stats">
                        <div className="stat">
                            <span className="stat-value">8+</span>
                            <span className="stat-label">Core Topics</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat">
                            <span className="stat-value">3</span>
                            <span className="stat-label">AI Agents</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat">
                            <span className="stat-value">∞</span>
                            <span className="stat-label">Explanations</span>
                        </div>
                    </div>
                </div>
                <div className="landing-hero-visual">
                    <img src="/hero-illustration.png" alt="AI Learning Platform" className="hero-image" />
                </div>
            </section>

            {/* Features Grid */}
            <section className="landing-features">
                <h2 className="section-title">Why Students Love <span className="gradient-text">Cantilever AI Tutor</span></h2>
                <p className="section-subtitle">Built with cutting-edge AI architecture that recruiters notice</p>
                <div className="features-grid">
                    {features.map((f, i) => (
                        <div key={i} className="feature-card">
                            <div className="feature-icon">{f.icon}</div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="landing-cta-section">
                <div className="landing-cta-card">
                    <h2>Ready to Ace Your Placement?</h2>
                    <p>Join students who are preparing smarter with AI-powered tutoring</p>
                    <button className="landing-btn-primary large" onClick={onSignUp}>
                        Get Started for Free →
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-logo">
                    <img src="/cantilever-logo.svg" alt="Cantilever Labs" className="cantilever-logo-img" />
                </div>
                <p>© 2026 Cantilever Labs — Bridging Colleges to Corporates</p>
                <div className="footer-tech">
                    Powered by LangGraph · Groq · Llama 3.3
                </div>
            </footer>
        </div>
    );
}
