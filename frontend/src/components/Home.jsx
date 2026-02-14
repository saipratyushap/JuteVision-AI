import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { Link } from 'react-router-dom';
import "../home.css";

const Home = () => {
    const { isSignedIn } = useUser();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (isSignedIn) {
            navigate('/dashboard');
        }
    }, [isSignedIn, navigate]);
    return (
        <div className="home-wrapper">
            <div className="grid-overlay"></div>

            <header>
                <div className="logo" style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', paddingBottom: '5px' }}>
                    <img src="/logo_main.png" alt="JuteVision AI Logo" style={{ height: '42px', display: 'block' }} />
                    <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'baseline', margin: 0, lineHeight: '1' }}>
                        <span style={{ color: 'var(--primary-green)', fontWeight: '700' }}>JuteVision</span>
                        <span style={{ color: 'var(--accent-gold)', fontWeight: '800', marginLeft: '8px' }}>AI</span>
                    </h1>
                </div>
                <nav>
                    <ul>
                        <li><a href="#">Services</a></li>
                        <li><a href="#">Solutions</a></li>
                        <li><a href="#">Technology</a></li>
                        <li><a href="#">Case Studies</a></li>
                    </ul>
                </nav>
                <div className="header-actions">
                    <SignedOut>
                        <SignInButton mode="modal" className="btn-outline" />
                        <SignUpButton mode="modal" className="btn-primary" />
                    </SignedOut>
                    <SignedIn>
                        <Link to="/dashboard" className="btn-outline">Go to Dashboard</Link>
                        <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                </div>
            </header>

            <section className="hero">
                <h2>Optimizing Jute Operations with Value-driven AI Intelligence</h2>
                <p>Building real-world AI applications that strengthen inventory intelligence and automate warehouse workflows with precision counting.</p>

                <SignedOut>
                    <SignUpButton mode="modal">
                        <button className="cta-btn">
                            Get Started with JuteVision
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </SignUpButton>
                </SignedOut>

                <SignedIn>
                    <Link to="/dashboard" className="cta-btn">
                        Launch Dashboard
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </SignedIn>

                <div className="trust-labels">
                    <div className="trust-label">YOLOv8 POWERED</div>
                    <div className="trust-label">REAL-TIME TRACKING</div>
                    <div className="trust-label">PRECISION COUNTING</div>
                </div>
            </section>

            <div className="section-title">
                <h3>Primary Expertise | What We Do Best</h3>
            </div>
            <p className="section-subtitle">Warehouse management systems engage JuteVision Data when their AI implementation needs to move beyond experimentation and into everyday operations.</p>

            <section className="features-grid">
                <div className="feature-card">
                    <div className="feature-icon">
                        <svg viewBox="0 0 100 100" fill="none">
                            <rect x="20" y="20" width="60" height="60" rx="4" stroke="#4CAF50" stroke-width="2" />
                            <circle cx="50" cy="50" r="15" stroke="#00BCD4" stroke-width="2" />
                            <path d="M20 50H80M50 20V80" stroke="#4CAF50" stroke-width="1" stroke-dasharray="2 2" />
                        </svg>
                    </div>
                    <h4>Object Detection Solutions</h4>
                    <p>Production-grade YOLOv8 trackers designed to work inside complex warehouse environments, grounded in specialized jute bag datasets.</p>
                    <a href="#" className="learn-more">Learn more</a>
                </div>

                <div className="feature-card">
                    <div className="feature-icon">
                        <svg viewBox="0 0 100 100" fill="none">
                            <path d="M20 80L40 50L60 70L80 20" stroke="#4CAF50" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                            <circle cx="20" cy="80" r="4" fill="#00BCD4" />
                            <circle cx="40" cy="50" r="4" fill="#00BCD4" />
                            <circle cx="60" cy="70" r="4" fill="#00BCD4" />
                            <circle cx="80" cy="20" r="4" fill="#00BCD4" />
                        </svg>
                    </div>
                    <h4>AI Agents for Tracking & Count</h4>
                    <p>Intelligent AI agents that monitor, act, and coordinate across various conveyor belts to reduce manual effort while maintaining visibility.</p>
                    <a href="#" className="learn-more">Learn more</a>
                </div>

                <div className="feature-card">
                    <div className="feature-icon">
                        <svg viewBox="0 0 100 100" fill="none">
                            <path d="M20 30H80V70H20V30Z" stroke="#4CAF50" stroke-width="2" />
                            <path d="M30 45L45 55L70 35" stroke="#00BCD4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                            <rect x="40" y="70" width="20" height="10" fill="#4CAF50" />
                        </svg>
                    </div>
                    <h4>Visual Intelligence Analytics</h4>
                    <p>Applied computer vision systems that turn visual data into operational signals to support inventory audit, quality control, and situational awareness.</p>
                    <a href="#" className="learn-more">Learn more</a>
                </div>
            </section>

            <div className="section-title">
                <p style={{ color: 'var(--primary-green)', fontWeight: 600, marginBottom: '5px' }}>Industries We Serve</p>
                <h3>We Know How These Industries Function</h3>
            </div>
            <p className="section-subtitle">JuteVision brings applied AI engineering experience across industries where decisions are data-intensive and outcomes matter.</p>

            <section className="industries-section">
                <div className="industries-grid">
                    <div className="industry-card">
                        <div className="industry-icon">🏗️</div>
                        <div className="industry-info">
                            <h5>Manufacturing</h5>
                            <p>Building AI systems for production monitoring and supply forecasting across jute processing plants.</p>
                        </div>
                    </div>
                    <div className="industry-card">
                        <div className="industry-icon">📦</div>
                        <div className="industry-info">
                            <h5>Logistics & Warehousing</h5>
                            <p>Developing AI solutions for automated stock counting, load optimization, and real-time inventory tracking.</p>
                        </div>
                    </div>
                    <div className="industry-card">
                        <div className="industry-icon">🚢</div>
                        <div className="industry-info">
                            <h5>Export & Trade</h5>
                            <p>Delivering high-accuracy counting systems for export audit and large-scale shipping verification.</p>
                        </div>
                    </div>
                    <div className="industry-card">
                        <div className="industry-icon">📊</div>
                        <div className="industry-info">
                            <h5>Supply Chain Data</h5>
                            <p>Our analytics engines are designed for modern supply chain operations with persistent tracking.</p>
                        </div>
                    </div>
                    <div className="industry-card">
                        <div className="industry-icon">🏪</div>
                        <div className="industry-info">
                            <h5>Retail Inventory</h5>
                            <p>Reducing manual labor and improving stock accuracy with automated vision-based audit tools.</p>
                        </div>
                    </div>
                    <div className="industry-card">
                        <div className="industry-icon">🏢</div>
                        <div className="industry-info">
                            <h5>Enterprise Operations</h5>
                            <p>Deploying AI systems that operate reliably in complex, real-world commercial environments.</p>
                        </div>
                    </div>
                </div>
            </section>

            <footer>
                <div className="footer-content">
                    <div className="footer-col">
                        <h6>Specialized Platforms</h6>
                        <ul>
                            <li><a href="#">AI Demo Central</a></li>
                            <li><a href="#">Precision Counter</a></li>
                            <li><a href="#">Jute Analytics</a></li>
                            <li><a href="#">Vision API</a></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h6>Valuable Resources</h6>
                        <ul>
                            <li><a href="#">Technical Blog</a></li>
                            <li><a href="#">Resource Library</a></li>
                            <li><a href="#">AI Technologies</a></li>
                            <li><a href="#">Developers</a></li>
                        </ul>
                    </div>
                    <div className="footer-message">
                        <h6>Get Started Today</h6>
                        <p>Share your requirements with our AI engineers to initiate a productive discussion on automating your warehouse operations.</p>
                    </div>
                </div>
                <div className="bottom-bar">
                    <div>&copy; 2026 JuteVision AI, All rights reserved.</div>
                    <div>Company Policies | Privacy | Security</div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
