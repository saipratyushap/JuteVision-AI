import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import Home from './components/Home';
import Dashboard from './components/Dashboard';

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Home Page */}
                <Route path="/" element={<Home />} />

                {/* Protected Dashboard Page */}
                <Route
                    path="/dashboard"
                    element={
                        <>
                            <SignedIn>
                                <Dashboard />
                            </SignedIn>
                            <SignedOut>
                                <RedirectToSignIn />
                            </SignedOut>
                        </>
                    }
                />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
