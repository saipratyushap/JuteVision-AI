import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import '../home.css';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!supabase) {
            console.log("Supabase not configured, bypassing with dummy login for testing.");
            setLoading(false);
            navigate('/dashboard');
            return;
        }

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate('/dashboard');
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('Sign up successful! Please check your email for the confirmation link.');
                setIsLogin(true);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="home-wrapper auth-page" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#f8fbff'
        }}>

            <div className="auth-card" style={{
                background: 'white',
                padding: '50px',
                width: '100%',
                maxWidth: '450px',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.08)',
                position: 'relative',
                zIndex: 10,
                textAlign: 'center'
            }}>
                <Link to="/" style={{ display: 'inline-block', marginBottom: '30px', textDecoration: 'none' }}>
                    <div className="logo" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                        <img src="/logo_main.png" alt="Logo" style={{ height: '32px' }} />
                        <span style={{ color: 'var(--primary-green)', fontWeight: '700', fontSize: '1.2rem' }}>Sack Detection</span>
                    </div>
                </Link>

                <h2 style={{ fontSize: '1.8rem', marginBottom: '10px', color: 'var(--primary-green)' }}>
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p style={{ color: '#666', marginBottom: '30px', fontSize: '0.95rem' }}>
                    {isLogin ? 'Enter your credentials to access the dashboard' : 'Sign up to start your visual intelligence journey'}
                </p>

                <form onSubmit={handleAuth} style={{ textAlign: 'left' }}>
                    {error && (
                        <div style={{
                            background: '#fff5f5',
                            color: '#e53e3e',
                            padding: '12px',
                            borderRadius: '4px',
                            marginBottom: '20px',
                            fontSize: '0.9rem',
                            borderLeft: '4px solid #e53e3e'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            required
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '1px solid #ddd',
                                outline: 'none',
                                fontSize: '1rem',
                                transition: 'var(--transition)'
                            }}
                            className="auth-input"
                        />
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '1px solid #ddd',
                                outline: 'none',
                                fontSize: '1rem',
                                transition: 'var(--transition)'
                            }}
                            className="auth-input"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: 'var(--primary-green)',
                            color: 'white',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'var(--transition)',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>

                <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary-green)',
                                fontWeight: '700',
                                cursor: 'pointer',
                                padding: 0,
                                fontSize: '0.9rem'
                            }}
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
