import React, { useState, useEffect, useRef } from 'react';
import { UserButton } from "@clerk/clerk-react";
import { Link } from 'react-router-dom';
import "../style.css";

const Dashboard = () => {
    const [count, setCount] = useState(0);
    const [uploads, setUploads] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const socketRef = useRef(null);

    // WebSocket Setup
    useEffect(() => {
        const wsUrl = `ws://${window.location.hostname}:8000/ws`;
        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.count !== undefined) {
                setCount(prev => {
                    if (data.count > prev) {
                        // Animation logic handled by CSS pulse-animation
                    }
                    return data.count;
                });
            }
        };

        return () => {
            if (socketRef.current) socketRef.current.close();
        };
    }, []);

    const handleUpload = async (file) => {
        const taskId = Math.random().toString(36).substring(7);
        const newUpload = {
            id: taskId,
            name: file.name,
            status: 'Uploading...',
            progress: 0,
            count: null,
            videoUrl: null
        };

        setUploads(prev => [newUpload, ...prev]);
        setIsModalOpen(false);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                updateUploadStatus(taskId, { status: 'Processing...', progress: 50 });
                pollTaskStatus(data.task_id, taskId);
            } else {
                throw new Error(data.detail || 'Upload failed');
            }
        } catch (error) {
            updateUploadStatus(taskId, { status: 'Failed', error: true });
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
                    updateUploadStatus(localTaskId, { status: 'Failed', error: true });
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
        <div className="app-container">
            <div className="grid-overlay"></div>
            <aside className="sidebar">
                <div className="brand" style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', marginBottom: '3rem', paddingBottom: '5px' }}>
                    <img src="/logo_main.png" alt="JuteVision Logo" style={{ height: '35px', display: 'block' }} />
                    <h1 style={{ fontSize: '1.2rem', margin: 0, whiteSpace: 'nowrap', lineHeight: '1', display: 'flex', alignItems: 'baseline' }}>
                        <span style={{ color: 'var(--primary-green)', fontWeight: '700' }}>JuteVision</span>
                        <span style={{ color: 'var(--accent-gold)', fontWeight: '800', marginLeft: '5px' }}>AI</span>
                    </h1>
                </div>
                <nav className="nav-menu">
                    <Link to="/dashboard" className="nav-item active">Dashboard</Link>
                    <Link to="/" className="nav-item">Landing Page</Link>
                </nav>
                <div className="system-status">
                    <div className="status-indicator online connected"></div>
                    <span>System Online</span>
                </div>
            </aside>

            <main className="main-content">
                <header className="top-bar">
                    <h2>Real-Time Monitoring</h2>
                    <div className="actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button className="btn-secondary">Export Data</button>
                        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                            Upload Video
                        </button>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </header>

                <div className="dashboard-grid">
                    <div className="card video-feed-card">
                        <div className="card-header">
                            <h3>Live Feed 01</h3>
                            <span className="live-badge">LIVE</span>
                        </div>
                        <div className="video-container">
                            <img src="/stream" alt="Live Camera Feed" className="live-stream-img"
                                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML += '<p class="error-msg">Stream Offline</p>' }} />
                            <div className="overlay-ui">
                                <div className="zone-line"></div>
                            </div>
                        </div>
                    </div>

                    <div className="stats-column">
                        <div className="card stat-card total-count">
                            <h3>Total Bags</h3>
                            <div className={`stat-value ${count > 0 ? 'pulse-animation' : ''}`} id="current-count">{count}</div>
                            <div className="stat-trend positive">+12% vs last hour</div>
                        </div>

                        <div className="card upload-status-card">
                            <h3>Upload Status</h3>
                            <div className="upload-list">
                                {uploads.length === 0 ? (
                                    <div className="empty-state">No active uploads</div>
                                ) : (
                                    uploads.map(u => (
                                        <div key={u.id} className={`upload-item ${u.status.toLowerCase()}`}>
                                            <div className="file-info">
                                                <span className="file-name">{u.name}</span>
                                                <span className="status-text" style={{ color: u.error ? 'var(--danger)' : '' }}>{u.status}</span>
                                                {u.count !== null && <span className="result-count" style={{ color: 'var(--accent-gold)', fontWeight: 'bold', marginLeft: '10px' }}>Count: {u.count}</span>}
                                            </div>
                                            <div className="progress-bar">
                                                <div className="fill" style={{ width: `${u.progress}%`, backgroundColor: u.status === 'Completed' ? 'var(--accent-green)' : '' }}></div>
                                            </div>
                                            {u.videoUrl && (
                                                <div className="result-video-container" style={{ marginTop: '10px' }}>
                                                    <video controls src={u.videoUrl} style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)' }}></video>
                                                    <a href={u.videoUrl} download className="download-link" style={{ display: 'block', marginTop: '5px', color: 'var(--accent-green)', fontSize: '0.8rem' }}>Download Processed Video</a>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {isModalOpen && (
                    <div className="modal-backdrop active" style={{ opacity: 1, pointerEvents: 'auto' }} onClick={(e) => e.target.className === 'modal-backdrop active' && setIsModalOpen(false)}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>Upload Video for Analysis</h3>
                                <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
                            </div>
                            <div className={`drop-zone ${isDragging ? 'dragover' : ''}`}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files[0]); }}
                                onClick={() => fileInputRef.current.click()}>
                                <div className="upload-icon">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" />
                                        <path d="M17 8L12 3L7 8" />
                                        <path d="M12 3V15" />
                                    </svg>
                                </div>
                                <p>Drag & Drop video here or <span>Browse</span></p>
                                <input type="file" ref={fileInputRef} accept="video/mp4,video/avi" hidden onChange={(e) => handleUpload(e.target.files[0])} />
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
