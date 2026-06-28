import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, FileText, Calendar, LogOut, ArrowLeft } from 'lucide-react';
import { useMotionTransition, revealVariants } from '../lib/motion';
import './Notes.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Notes = () => {
    const [authenticated, setAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [authChecking, setAuthChecking] = useState(true);
    const [error, setError] = useState(null);
    const transition = useMotionTransition('standard');

    // 1. Check if session cookie is already valid
    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/auth/me`, {
                    credentials: 'include'
                });
                const data = await res.json();
                if (data.authenticated) {
                    setAuthenticated(true);
                    fetchNotes();
                } else {
                    setAuthChecking(false);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Session check failed:', err);
                setAuthChecking(false);
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/notes`, {
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to load notes');
            const data = await res.json();
            setNotes(data);
            setAuthenticated(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setAuthChecking(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
                credentials: 'include'
            });
            
            if (!res.ok) {
                const errData = await res.json();
                if (res.status === 429) {
                    throw new Error(errData.error || 'Rate limit exceeded. Please wait or restart the backend server.');
                }
                throw new Error(errData.detail || errData.error || 'Incorrect password');
            }
            
            // Login successful, fetch the notes!
            await fetchNotes();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch(`${API_BASE}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            setAuthenticated(false);
            setNotes([]);
            setPassword('');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    if (authChecking) {
        return (
            <div className="notes-page bg-[#0A0A0A] min-height-screen flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-orange border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="notes-page bg-[#0A0A0A] min-height-screen">
            <div className="container max-w-4xl mx-auto px-4 py-20">
                <div className="flex justify-between items-center mb-8">
                    <Link to="/" className="back-link text-xs uppercase tracking-widest text-zinc-500 hover:text-orange transition-colors inline-flex items-center gap-2">
                        <ArrowLeft size={12} /> Back to Scroll
                    </Link>

                    {authenticated && (
                        <button 
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors uppercase tracking-widest bg-zinc-900 border border-solid border-zinc-800 px-3.5 py-1.5 rounded-full cursor-pointer"
                        >
                            <LogOut size={12} /> Logout
                        </button>
                    )}
                </div>

                {!authenticated ? (
                    /* ── Password Gate ──────────────────────────────────────── */
                    <motion.div 
                        className="password-gate max-w-md mx-auto border border-solid border-zinc-800/80 bg-zinc-900/40 rounded-2xl p-8 text-center mt-12 shadow-2xl"
                        initial="hidden"
                        animate="visible"
                        variants={revealVariants}
                        transition={transition}
                    >
                        <div className="w-12 h-12 bg-orange/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-solid border-orange/20 text-orange">
                            <Lock size={20} />
                        </div>
                        <h2 className="text-2xl font-bold font-accent text-white mb-2">Private Notes</h2>
                        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-6">Classified Jutsu Only</p>
                        
                        <form onSubmit={handleLogin} className="space-y-4">
                            <input 
                                type="password" 
                                placeholder="Enter Access Password..." 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-3 rounded-lg text-white font-main text-center transition-colors placeholder:text-zinc-700 outline-none"
                                required
                            />
                            {error && <p className="text-red-400 text-xs font-main mt-2">{error}</p>}
                            
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-orange hover:bg-orange/90 text-black font-bold uppercase tracking-wider py-3 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {loading ? 'Checking Signature...' : 'Unlock Notes'}
                            </button>
                        </form>
                    </motion.div>
                ) : (
                    /* ── Authenticated Notes View ────────────────────────────── */
                    <div>
                        <motion.div 
                            className="notes-header text-center mb-16"
                            initial="hidden"
                            animate="visible"
                            variants={revealVariants}
                            transition={transition}
                        >
                            <h1 className="text-4xl sm:text-5xl font-bold font-accent text-white mb-4">
                                Secret Archive
                            </h1>
                            <div className="title-underline mx-auto w-16 h-1 bg-orange"></div>
                            <p className="text-zinc-400 mt-4 max-w-md mx-auto text-sm">
                                Private notes and logs. Content is decrypted server-side in real-time only upon request.
                            </p>
                        </motion.div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <div className="w-10 h-10 border-2 border-orange border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-xs uppercase tracking-widest text-zinc-500">Decrypting scrolls...</p>
                            </div>
                        ) : notes.length === 0 ? (
                            <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                                <FileText size={48} className="mx-auto text-zinc-700 mb-4" />
                                <p>Archive is empty.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {notes.map((note, idx) => (
                                    <motion.div 
                                        key={note.id}
                                        className="note-card border border-solid border-zinc-800/80 bg-zinc-900/40 rounded-xl p-6 shadow-md hover:border-orange/20 transition-all duration-300"
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true }}
                                        variants={revealVariants}
                                        transition={{ ...transition, delay: idx * 0.05 }}
                                    >
                                        <div className="flex items-center justify-between mb-4 border-b border-solid border-zinc-800/60 pb-3">
                                            <h2 className="text-lg font-bold font-accent text-white">{note.title}</h2>
                                            <span className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase tracking-wider">
                                                <Calendar size={10} />
                                                {new Date(note.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-zinc-300 text-sm whitespace-pre-line leading-relaxed font-main">
                                            {note.content}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notes;
