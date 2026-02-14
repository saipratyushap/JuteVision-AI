import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import "../home.css";

const Home = () => {
    useEffect(() => {
        const observerOptions = {
            threshold: 0.05, // More sensitive trigger
            rootMargin: "0px 0px -20px 0px"
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target); // Once visible, stay visible
                }
            });
        }, observerOptions);

        const revealElements = document.querySelectorAll('.reveal');
        revealElements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return (
        <div className="home-wrapper">

            <header>
                <div className="logo" style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                    <img src="/logo_main.png" alt="ThirdEye Sack Detection Logo" style={{ height: '44px', display: 'block' }} />
                    <span style={{ color: '#ddd', fontSize: '1.8rem', fontWeight: '200', paddingBottom: '2px', alignSelf: 'center', marginTop: '4px' }}>|</span>
                    <h1 style={{ fontSize: '1.7rem', display: 'flex', alignItems: 'baseline', margin: 0, lineHeight: '1', paddingBottom: '3px' }}>
                        <span style={{ color: 'var(--primary-green)', fontWeight: '700', letterSpacing: '-0.5px' }}>Sack Detection</span>
                    </h1>
                </div>
                <nav>
                    <ul>
                        <li><a href="#expertise">Expertise</a></li>
                        <li><a href="#industries">Industries</a></li>
                        <li><a href="#solutions">Solutions</a></li>
                        <li><a href="#how-it-works">How It Works</a></li>
                    </ul>
                </nav>
                <div className="header-actions">
                    <Link to="/auth" className="btn-outline" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Sign In</Link>
                    <Link to="/auth" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Sign Up</Link>
                </div>
            </header>

            <section className="hero">
                <div className="grid-overlay"></div>
                <h2>Advanced Sack Detection with Value-driven Vision Intelligence</h2>
                <p>Building real-world vision applications that strengthen inventory intelligence and automate warehouse workflows with precision counting.</p>

                <Link to="/dashboard" className="cta-btn">
                    Get Started
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </Link>

                <div className="trust-labels">
                    <div className="trust-label">YOLOv8 POWERED</div>
                    <div className="trust-label">REAL-TIME TRACKING</div>
                    <div className="trust-label">PRECISION COUNTING</div>
                </div>
            </section>

            <div className="section-title reveal" id="expertise">
                <h3>Primary Expertise | What We Do Best</h3>
            </div>
            <p className="section-subtitle reveal">Warehouse management systems engage Sack Detection Data when their vision implementation needs to move beyond experimentation and into everyday operations.</p>

            <section className="features-grid" id="solutions">
                <div className="feature-card reveal delay-1">
                    <div className="feature-icon">
                        <svg viewBox="0 0 100 100" fill="none">
                            <rect x="20" y="20" width="60" height="60" rx="4" stroke="#4CAF50" strokeWidth="2" />
                            <circle cx="50" cy="50" r="15" stroke="#00BCD4" strokeWidth="2" />
                            <path d="M20 50H80M50 20V80" stroke="#4CAF50" strokeWidth="1" strokeDasharray="2 2" />
                        </svg>
                    </div>
                    <h4>Object Detection Solutions</h4>
                    <p>Production-grade YOLOv8 trackers designed to work inside complex warehouse environments, grounded in specialized jute bag datasets.</p>
                </div>

                <div className="feature-card reveal delay-2">
                    <div className="feature-icon">
                        <svg viewBox="0 0 100 100" fill="none">
                            <path d="M20 80L40 50L60 70L80 20" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="20" cy="80" r="4" fill="#00BCD4" />
                            <circle cx="40" cy="50" r="4" fill="#00BCD4" />
                            <circle cx="60" cy="70" r="4" fill="#00BCD4" />
                            <circle cx="80" cy="20" r="4" fill="#00BCD4" />
                        </svg>
                    </div>
                    <h4>Vision Agents for Tracking & Count</h4>
                    <p>Intelligent vision agents that monitor, act, and coordinate across various conveyor belts to reduce manual effort while maintaining visibility.</p>
                </div>

                <div className="feature-card reveal delay-3">
                    <div className="feature-icon">
                        <svg viewBox="0 0 100 100" fill="none">
                            <path d="M20 30H80V70H20V30Z" stroke="#4CAF50" strokeWidth="2" />
                            <path d="M30 45L45 55L70 35" stroke="#00BCD4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            <rect x="40" y="70" width="20" height="10" fill="#4CAF50" />
                        </svg>
                    </div>
                    <h4>Visual Intelligence Analytics</h4>
                    <p>Applied computer vision systems that turn visual data into operational signals to support inventory audit, quality control, and situational awareness.</p>
                </div>
            </section>

            <div className="section-title reveal" id="industries">
                <p style={{ color: 'var(--primary-green)', fontWeight: 600, marginBottom: '5px' }}>Industries We Serve</p>
                <h3>We Know How These Industries Function</h3>
            </div>
            <p className="section-subtitle reveal">Sack Detection brings applied vision engineering experience across industries where decisions are data-intensive and outcomes matter.</p>

            <section className="industries-section reveal">
                <div className="industries-grid">
                    <div className="industry-card reveal delay-1">
                        <div className="industry-icon">🏗️</div>
                        <div className="industry-info">
                            <h5>Manufacturing</h5>
                            <p>Building vision systems for production monitoring and supply forecasting across jute processing plants.</p>
                        </div>
                    </div>
                    <div className="industry-card reveal delay-2">
                        <div className="industry-icon">📦</div>
                        <div className="industry-info">
                            <h5>Logistics & Warehousing</h5>
                            <p>Developing vision solutions for automated stock counting, load optimization, and real-time inventory tracking.</p>
                        </div>
                    </div>
                    <div className="industry-card reveal delay-3">
                        <div className="industry-icon">🚢</div>
                        <div className="industry-info">
                            <h5>Export & Trade</h5>
                            <p>Delivering high-accuracy counting systems for export audit and large-scale shipping verification.</p>
                        </div>
                    </div>
                    <div className="industry-card reveal delay-1">
                        <div className="industry-icon">📊</div>
                        <div className="industry-info">
                            <h5>Supply Chain Data</h5>
                            <p>Our analytics engines are designed for modern supply chain operations with persistent tracking.</p>
                        </div>
                    </div>
                    <div className="industry-card reveal delay-2">
                        <div className="industry-icon">🏪</div>
                        <div className="industry-info">
                            <h5>Retail Inventory</h5>
                            <p>Reducing manual labor and improving stock accuracy with automated vision-based audit tools.</p>
                        </div>
                    </div>
                    <div className="industry-card reveal delay-3">
                        <div className="industry-icon">🏢</div>
                        <div className="industry-info">
                            <h5>Enterprise Operations</h5>
                            <p>Deploying vision systems that operate reliably in complex, real-world commercial environments.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="how-it-works" id="how-it-works">
                <div className="section-title reveal">
                    <p style={{ color: 'var(--primary-green)', fontWeight: 600, marginBottom: '20px' }}>Process Workflow</p>
                    <h3>How Sack Detection Works</h3>
                </div>
                <div className="workflow-container">
                    <div className="workflow-step reveal delay-1">
                        <div className="step-number">01</div>
                        <h4>Visual Input Data</h4>
                        <p>Our system integrates directly with warehouse CCTV feeds or handles batch video uploads from your inventory audit sessions.</p>
                    </div>
                    <div className="step-arrow reveal delay-1">→</div>
                    <div className="workflow-step reveal delay-2">
                        <div className="step-number">02</div>
                        <h4>AI Neural Detection</h4>
                        <p>Specialized YOLOv8 models identify individual jute sacks in real-time, even in low-light or occluded environments.</p>
                    </div>
                    <div className="step-arrow reveal delay-2">→</div>
                    <div className="workflow-step reveal delay-3">
                        <div className="step-number">03</div>
                        <h4>Tracking & Analysis</h4>
                        <p>Visual agents track bag movement across 'magic lines' (ROIs) to provide precise count verification and movement logs.</p>
                    </div>
                </div>
            </section>

            <footer id="resources">
                <div className="footer-content">
                    <div className="footer-col">
                        <h6>Specialized Platforms</h6>
                        <ul>
                            <li><a href="#">Vision Demo Central</a></li>
                            <li><a href="#">Precision Counter</a></li>
                            <li><a href="#">Sack Detection Analytics</a></li>
                            <li><a href="#">Vision API</a></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h6>Valuable Resources</h6>
                        <ul>
                            <li><a href="#">Technical Blog</a></li>
                            <li><a href="#">Resource Library</a></li>
                            <li><a href="#">Vision Technologies</a></li>
                            <li><a href="#">Developers</a></li>
                        </ul>
                    </div>
                    <div className="footer-message">
                        <h6>Get Started Today</h6>
                        <p>Share your requirements with our vision engineers to initiate a productive discussion on automating your warehouse operations.</p>
                    </div>
                </div>
                <div className="bottom-bar">
                    <div>&copy; 2026 Sack Detection, All rights reserved.</div>
                    <div>Company Policies | Privacy | Security</div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
