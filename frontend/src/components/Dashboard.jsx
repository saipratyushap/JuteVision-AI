import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import "../style.css";

const Dashboard = () => {
    const [count, setCount] = useState(0);
    const [uploads, setUploads] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const socketRef = useRef(null);
    const navigate = useNavigate();

    // WebSocket Setup for live count
    useEffect(() => {
        const wsUrl = `ws://${window.location.hostname}:8000/ws`;
        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.count !== undefined) {
                setCount(data.count);
            }
        };

        return () => {
            if (socketRef.current) socketRef.current.close();
        };
    }, []);

    const handleLogout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
        navigate('/auth');
    };

    const handleUpload = async (file) => {
        if (!file) return;

        const taskId = Math.random().toString(36).substring(7);
        const newUpload = {
            id: taskId,
            name: file.name,
            status: 'Uploading...',
            progress: 30,
            count: null,
            videoUrl: null
        };

        setUploads(prev => [newUpload, ...prev]);
        setIsModalOpen(false);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Simulated upload progress for UI feel
            setTimeout(() => updateUploadStatus(taskId, { progress: 60, status: 'Processing...' }), 1000);

            // Real API call here
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                pollTaskStatus(data.task_id, taskId);
            } else {
                throw new Error(data.detail || 'Upload failed');
            }
        } catch (error) {
            updateUploadStatus(taskId, { status: 'Failed', progress: 100, error: true });
        }
    };

    const pollTaskStatus = (apiTaskId, localTaskId) => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/tasks/${apiTaskId}`);
                const task = await response.json();

                if (task.status === 'completed') {
                    clearInterval(interval);
                    updateUploadStatus(localTaskId, {
                        status: 'Completed',
                        progress: 100,
                        count: task.count,
                        videoUrl: task.video_url
                    });
                } else if (task.status === 'failed') {
                    clearInterval(interval);
                    updateUploadStatus(localTaskId, { status: 'Failed', progress: 100, error: true });
                }
            } catch (e) {
                clearInterval(interval);
            }
        }, 2000);
    };

    const updateUploadStatus = (id, updates) => {
        setUploads(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    };

    return (
        <div className="dashboard-wrapper">
            {/* Navbar */}
            <nav className="dash-nav">
                <div className="logo-area">
                    <img src="/logo_main.png" alt="ThirdEye Logo" />
                    <span className="separator">|</span>
                    <h1>Sack Detection</h1>
                </div>

                <div className="nav-center">
                    <Link to="/">Home</Link>
                    <Link to="/dashboard" className="active">Dashboard</Link>
                    <Link to="#">Analytics</Link>
                </div>

                <div className="nav-right">
                    <button onClick={handleLogout} className="btn-signout">Sign Out</button>
                </div>
            </nav>

            <main className="dash-container">
                <div className="dash-header">
                    <h2>Real-Time Monitoring</h2>
                    <div className="header-actions">
                        <button className="btn-secondary-dash">Export Data</button>
                        <button className="btn-primary-dash" onClick={() => setIsModalOpen(true)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                            </svg>
                            Upload Video
                        </button>
                    </div>
                </div>

                <div className="dashboard-grid">
                    {/* Left Side: Live Feed */}
                    <div className="dash-card video-feed-card">
                        <div className="card-title">
                            Live Camera Feed
                            <div className="live-indicator">
                                <span className="dot-glow"></span>
                                LIVE
                            </div>
                        </div>
                        <div className="video-wrapper">
                            <img
                                src="/stream"
                                alt="Live Feed"
                                className="live-stream-img"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML += '<div style="color: #64748b; text-align: center; padding-top: 20%;">Camera Offline</div>'
                                }}
                            />
                        </div>
                    </div>

                    {/* Right Side Cards */}
                    <div className="stats-stack">
                        {/* Total Bags Card */}
                        <div className="dash-card stat-card-total">
                            <div className="stat-header">
                                <div className="stat-label">Total Bags</div>
                                <div className="stat-icon">📦</div>
                            </div>
                            <div className="stat-main">
                                <div className={`stat-big-number ${count > 0 ? 'pulse-animation' : ''}`}>
                                    {count}
                                </div>
                                <div className="stat-sub">Detected in last hour</div>
                            </div>
                        </div>

                        {/* Upload Status Card */}
                        <div className="dash-card upload-card">
                            <div className="card-title">Upload Status</div>
                            <div className="upload-list">
                                {uploads.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.9rem' }}>
                                        No active uploads
                                    </div>
                                ) : (
                                    uploads.map(u => (
                                        <div key={u.id} className="upload-item">
                                            <div className="upload-info">
                                                <span className="file-name">{u.name}</span>
                                                <span className={`status-tag ${u.status.toLowerCase().replace('...', '')}`}>
                                                    {u.status}
                                                </span>
                                            </div>
                                            <div className="progress-container">
                                                <div className="progress-fill" style={{ width: `${u.progress}%` }}></div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Upload Modal (kept functional) */}
            {isModalOpen && (
                <div className="modal-backdrop active" onClick={(e) => e.target.className.includes('modal-backdrop') && setIsModalOpen(false)}>
                    <div className="modal-content" style={{ borderRadius: '20px' }}>
                        <div className="modal-header">
                            <h3>Upload for Detection</h3>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>
                        <div
                            className={`drop-zone ${isDragging ? 'dragover' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files[0]); }}
                            onClick={() => fileInputRef.current.click()}
                            style={{ borderRadius: '12px' }}
                        >
                            <p>Drag & Drop video here or <span>Browse</span></p>
                            <input type="file" ref={fileInputRef} hidden onChange={(e) => handleUpload(e.target.files[0])} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
