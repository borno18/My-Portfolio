import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    LayoutDashboard, BookOpen, Image, FileText, Lock, LogOut, Plus, 
    Edit2, Trash2, Save, X, ArrowLeft, RefreshCw, Upload, Link2 
} from 'lucide-react';
import { useMotionTransition, revealVariants } from '../lib/motion';
import './Admin.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// Cloudinary configuration from import.meta.env
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY || '';

const Admin = () => {
    const [authenticated, setAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [authChecking, setAuthChecking] = useState(true);
    const [activeTab, setActiveTab] = useState('blog'); // 'blog' | 'photos' | 'notes' | 'password'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const transition = useMotionTransition('standard');

    // Data States
    const [blogs, setBlogs] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [notes, setNotes] = useState([]);

    // Editing States
    const [editingItem, setEditingItem] = useState(null); // { type: 'blog'|'photo'|'note', data: ... } or null
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Form inputs
    const [blogForm, setBlogForm] = useState({ title: '', slug: '', content: '', cover_image_url: '', status: 'draft' });
    const [photoForm, setPhotoForm] = useState({ image_url: '', story: '', camera: '', lens: '', settings: '', taken_at: '', display_order: 0 });
    const [noteForm, setNoteForm] = useState({ title: '', content: '' });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });

    // Cloudinary upload states
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadMode, setUploadMode] = useState('url'); // 'url' | 'file'

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/auth/me`, {
                    credentials: 'include'
                });
                const data = await res.json();
                if (data.authenticated) {
                    setAuthenticated(true);
                    loadAllData();
                } else {
                    setAuthChecking(false);
                }
            } catch (err) {
                console.error('Session check failed:', err);
                setAuthChecking(false);
            }
        };
        checkSession();
    }, []);

    const loadAllData = async () => {
        setAuthChecking(false);
        try {
            // Load blogs
            const resBlog = await fetch(`${API_BASE}/api/blog`);
            if (resBlog.ok) {
                const data = await resBlog.json();
                setBlogs(data);
            }

            // Load photos
            const resPhotos = await fetch(`${API_BASE}/api/photos`);
            if (resPhotos.ok) {
                const data = await resPhotos.json();
                setPhotos(data);
            }

            // Load notes (authenticated)
            const resNotes = await fetch(`${API_BASE}/api/notes`, { credentials: 'include' });
            if (resNotes.ok) {
                const data = await resNotes.json();
                setNotes(data);
            }
        } catch (err) {
            console.error('Error fetching admin dashboard data:', err);
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
                throw new Error(errData.detail || errData.error || 'Incorrect admin password');
            }
            setAuthenticated(true);
            await loadAllData();
        } catch (err) {
            setError(err.message);
        } finally {
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
            setBlogs([]);
            setPhotos([]);
            setNotes([]);
            setPassword('');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    // Auto-slugify blog titles
    const handleBlogTitleChange = (e) => {
        const title = e.target.value;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        setBlogForm({ ...blogForm, title, slug });
    };

    // ─── Image Uploading ───────────────────────────────────────────────────────
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            let imageUrl = '';

            if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY) {
                // Upload to Cloudinary
                const timestamp = Math.round((new Date()).getTime() / 1000);
                const folder = 'portfolio';
                const params = { timestamp, folder };

                // Request signature from backend
                const sigRes = await fetch(`${API_BASE}/api/photos/upload-signature`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        params,
                        file_size: file.size,
                        mime_type: file.type
                    }),
                    credentials: 'include'
                });
                if (!sigRes.ok) throw new Error('Failed to sign upload request');
                const { signature } = await sigRes.json();

                // Direct upload to Cloudinary
                const formData = new FormData();
                formData.append('file', file);
                formData.append('api_key', CLOUDINARY_API_KEY);
                formData.append('timestamp', timestamp.toString());
                formData.append('folder', folder);
                formData.append('signature', signature);

                const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (!uploadRes.ok) {
                    const errorText = await uploadRes.text();
                    let errorMessage = 'Cloudinary upload error';
                    try {
                        const errorJson = JSON.parse(errorText);
                        if (errorJson.error && errorJson.error.message) {
                            errorMessage = `Cloudinary upload error: ${errorJson.error.message}`;
                        }
                    } catch (e) {
                        errorMessage = `Cloudinary upload error: ${errorText}`;
                    }
                    throw new Error(errorMessage);
                }
                const uploadData = await uploadRes.json();
                imageUrl = uploadData.secure_url;
            } else {
                // Fallback: Local backend upload
                const formData = new FormData();
                formData.append('file', file);

                const uploadRes = await fetch(`${API_BASE}/api/upload`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });

                if (!uploadRes.ok) {
                    const errData = await uploadRes.json();
                    throw new Error(errData.detail || 'Local upload error');
                }
                const uploadData = await uploadRes.json();
                imageUrl = `${API_BASE}${uploadData.url}`;
            }

            // Set the URL in the respective form
            if (activeTab === 'blog') {
                setBlogForm(prev => ({ ...prev, cover_image_url: imageUrl }));
            } else if (activeTab === 'photos') {
                setPhotoForm(prev => ({ ...prev, image_url: imageUrl }));
            }
            alert('Image uploaded successfully!');
        } catch (err) {
            console.error(err);
            alert(`Upload failed: ${err.message}`);
        } finally {
            setUploadingImage(false);
        }
    };

    // ─── Blog CRUD Operations ──────────────────────────────────────────────────
    const saveBlog = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const isEditing = editingItem && editingItem.type === 'blog';
            const url = isEditing 
                ? `${API_BASE}/api/blog/${editingItem.data.id}`
                : `${API_BASE}/api/blog`;
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(blogForm),
                credentials: 'include'
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to save blog post');
            }

            // Reload blogs
            const resBlogs = await fetch(`${API_BASE}/api/blog`);
            const data = await resBlogs.json();
            setBlogs(data);

            setSuccess('Blog post saved successfully!');
            setShowCreateForm(false);
            setEditingItem(null);
            setBlogForm({ title: '', slug: '', content: '', cover_image_url: '', status: 'draft' });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteBlog = async (id) => {
        if (!confirm('Are you sure you want to delete this blog post?')) return;
        try {
            const res = await fetch(`${API_BASE}/api/blog/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                setBlogs(blogs.filter(b => b.id !== id));
                setSuccess('Blog post deleted successfully.');
            }
        } catch (err) {
            setError('Failed to delete blog post');
        }
    };

    // ─── Photos CRUD Operations ────────────────────────────────────────────────
    const savePhoto = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const isEditing = editingItem && editingItem.type === 'photo';
            const url = isEditing 
                ? `${API_BASE}/api/photos/${editingItem.data.id}`
                : `${API_BASE}/api/photos`;
            const method = isEditing ? 'PUT' : 'POST';

            // Send formatted taken_at
            const payload = { ...photoForm };
            if (!payload.taken_at) delete payload.taken_at;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to save photo');
            }

            // Reload photos
            const resPhotos = await fetch(`${API_BASE}/api/photos`);
            const data = await resPhotos.json();
            setPhotos(data);

            setSuccess('Photo saved successfully!');
            setShowCreateForm(false);
            setEditingItem(null);
            setPhotoForm({ image_url: '', story: '', camera: '', lens: '', settings: '', taken_at: '', display_order: 0 });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const deletePhoto = async (id) => {
        if (!confirm('Are you sure you want to delete this photo?')) return;
        try {
            const res = await fetch(`${API_BASE}/api/photos/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                setPhotos(photos.filter(p => p.id !== id));
                setSuccess('Photo deleted successfully.');
            }
        } catch (err) {
            setError('Failed to delete photo');
        }
    };

    // ─── Notes CRUD Operations ─────────────────────────────────────────────────
    const saveNote = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const isEditing = editingItem && editingItem.type === 'note';
            const url = isEditing 
                ? `${API_BASE}/api/notes/${editingItem.data.id}`
                : `${API_BASE}/api/notes`;
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(noteForm),
                credentials: 'include'
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to save note');
            }

            // Reload notes
            const resNotes = await fetch(`${API_BASE}/api/notes`, { credentials: 'include' });
            const data = await resNotes.json();
            setNotes(data);

            setSuccess('Note saved and encrypted successfully!');
            setShowCreateForm(false);
            setEditingItem(null);
            setNoteForm({ title: '', content: '' });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteNote = async (id) => {
        if (!confirm('Are you sure you want to delete this note?')) return;
        try {
            const res = await fetch(`${API_BASE}/api/notes/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                setNotes(notes.filter(n => n.id !== id));
                setSuccess('Note deleted successfully.');
            }
        } catch (err) {
            setError('Failed to delete note');
        }
    };

    // ─── Change Password ───────────────────────────────────────────────────────
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await fetch(`${API_BASE}/api/auth/password`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordForm),
                credentials: 'include'
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to update password');
            }

            setSuccess('Password updated successfully! Change is immediately live.');
            setPasswordForm({ currentPassword: '', newPassword: '' });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (authChecking) {
        return (
            <div className="admin-page bg-[#0A0A0A] min-height-screen flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-orange border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="admin-page bg-[#0A0A0A] min-height-screen">
            <div className="container max-w-6xl mx-auto px-4 py-20">
                <div className="flex justify-between items-center mb-8">
                    <Link to="/" className="back-link text-xs uppercase tracking-widest text-zinc-500 hover:text-orange transition-colors inline-flex items-center gap-2">
                        <ArrowLeft size={12} /> Back to Scroll
                    </Link>

                    {authenticated && (
                        <button 
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors uppercase tracking-widest bg-zinc-900 border border-solid border-zinc-800 px-3.5 py-1.5 rounded-full cursor-pointer"
                        >
                            <LogOut size={12} /> Logout Admin
                        </button>
                    )}
                </div>

                {!authenticated ? (
                    /* ── Admin Login Gate ────────────────────────────────────── */
                    <motion.div 
                        className="login-gate max-w-md mx-auto border border-solid border-zinc-800/80 bg-zinc-900/40 rounded-2xl p-8 text-center mt-12 shadow-2xl"
                        initial="hidden"
                        animate="visible"
                        variants={revealVariants}
                        transition={transition}
                    >
                        <div className="w-12 h-12 bg-orange/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-solid border-orange/20 text-orange">
                            <Lock size={20} />
                        </div>
                        <h2 className="text-2xl font-bold font-accent text-white mb-2">Hokage Office</h2>
                        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-6">Authorized Jonin Only</p>
                        
                        <form onSubmit={handleLogin} className="space-y-4">
                            <input 
                                type="password" 
                                placeholder="Enter Admin Secret..." 
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
                                {loading ? 'Unsealing Gate...' : 'Enter Dashboard'}
                            </button>
                        </form>
                    </motion.div>
                ) : (
                    /* ── Admin Dashboard ─────────────────────────────────────── */
                    <div className="dashboard-layout grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Sidebar Tabs */}
                        <div className="md:col-span-1 space-y-2">
                            <h2 className="text-xl font-bold font-accent text-white mb-6 flex items-center gap-2 px-3">
                                <LayoutDashboard size={18} className="text-orange" />
                                Hokage Office
                            </h2>
                            <button 
                                onClick={() => { setActiveTab('blog'); setShowCreateForm(false); setEditingItem(null); }}
                                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                    activeTab === 'blog' ? 'bg-orange text-black' : 'bg-zinc-900/60 text-zinc-400 border border-solid border-zinc-800/40 hover:text-white'
                                }`}
                            >
                                <BookOpen size={16} /> Blog Posts
                            </button>
                            <button 
                                onClick={() => { setActiveTab('photos'); setShowCreateForm(false); setEditingItem(null); }}
                                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                    activeTab === 'photos' ? 'bg-orange text-black' : 'bg-zinc-900/60 text-zinc-400 border border-solid border-zinc-800/40 hover:text-white'
                                }`}
                            >
                                <Image size={16} /> Photo Gallery
                            </button>
                            <button 
                                onClick={() => { setActiveTab('notes'); setShowCreateForm(false); setEditingItem(null); }}
                                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                    activeTab === 'notes' ? 'bg-orange text-black' : 'bg-zinc-900/60 text-zinc-400 border border-solid border-zinc-800/40 hover:text-white'
                                }`}
                            >
                                <FileText size={16} /> Secret Notes
                            </button>
                            <button 
                                onClick={() => { setActiveTab('password'); setShowCreateForm(false); setEditingItem(null); }}
                                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                    activeTab === 'password' ? 'bg-orange text-black' : 'bg-zinc-900/60 text-zinc-400 border border-solid border-zinc-800/40 hover:text-white'
                                }`}
                            >
                                <Lock size={16} /> Credentials
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="md:col-span-3 border border-solid border-zinc-800/60 bg-zinc-900/10 rounded-2xl p-6 md:p-8 backdrop-blur-md">
                            {success && (
                                <div className="p-4 rounded-xl bg-emerald-950/30 border border-solid border-emerald-500/20 text-emerald-400 text-sm mb-6 flex justify-between items-center">
                                    <span>{success}</span>
                                    <X size={16} className="cursor-pointer" onClick={() => setSuccess(null)} />
                                </div>
                            )}

                            {error && (
                                <div className="p-4 rounded-xl bg-rose-950/30 border border-solid border-rose-500/20 text-rose-400 text-sm mb-6 flex justify-between items-center">
                                    <span>{error}</span>
                                    <X size={16} className="cursor-pointer" onClick={() => setError(null)} />
                                </div>
                            )}

                            {/* Form Render Check */}
                            {(showCreateForm || editingItem) ? (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-bold font-accent text-white">
                                            {editingItem ? 'Edit Item' : 'Create New'}
                                        </h3>
                                        <button 
                                            onClick={() => { setShowCreateForm(false); setEditingItem(null); }}
                                            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* ── Blog Form ────────────────────────────────────────── */}
                                    {activeTab === 'blog' && (
                                        <form onSubmit={saveBlog} className="space-y-4 font-main">
                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Post Title</label>
                                                <input 
                                                    type="text" 
                                                    value={blogForm.title}
                                                    onChange={handleBlogTitleChange}
                                                    className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2.5 rounded-lg text-white font-main"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Slug</label>
                                                <input 
                                                    type="text" 
                                                    value={blogForm.slug}
                                                    onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                                                    className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2.5 rounded-lg text-white font-main"
                                                    required
                                                />
                                            </div>

                                            {/* Image Upload Selection */}
                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Cover Image</label>
                                                <div className="flex gap-2 mb-3">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setUploadMode('url')}
                                                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-bold border border-solid ${uploadMode === 'url' ? 'bg-orange text-black border-orange' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                                                    >
                                                        <Link2 size={12} /> Image URL
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setUploadMode('file')}
                                                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-bold border border-solid ${uploadMode === 'file' ? 'bg-orange text-black border-orange' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                                                    >
                                                        <Upload size={12} /> Upload File
                                                    </button>
                                                </div>

                                                {uploadMode === 'url' ? (
                                                    <input 
                                                        type="text" 
                                                        placeholder="Paste image link..."
                                                        value={blogForm.cover_image_url}
                                                        onChange={(e) => setBlogForm({ ...blogForm, cover_image_url: e.target.value })}
                                                        className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2.5 rounded-lg text-white font-main"
                                                    />
                                                ) : (
                                                    <div className="border border-dashed border-zinc-800 rounded-lg p-6 bg-zinc-900/20 text-center">
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            onChange={handleImageUpload} 
                                                            id="blog-image-file" 
                                                            className="hidden" 
                                                        />
                                                        <label htmlFor="blog-image-file" className="cursor-pointer inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-lg border border-solid border-zinc-800 transition-colors">
                                                            {uploadingImage ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                                                            {uploadingImage ? 'Uploading to Cloudinary...' : 'Choose File'}
                                                        </label>
                                                        {blogForm.cover_image_url && <p className="text-emerald-400 text-xs mt-3">Uploaded: {blogForm.cover_image_url.split('/').pop()}</p>}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Markdown Content</label>
                                                <textarea 
                                                    rows={12}
                                                    value={blogForm.content}
                                                    onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                                                    className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-3 rounded-lg text-white font-main resize-y"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Status</label>
                                                <select 
                                                    value={blogForm.status}
                                                    onChange={(e) => setBlogForm({ ...blogForm, status: e.target.value })}
                                                    className="w-full bg-zinc-900 border border-solid border-zinc-800 px-4 py-2.5 rounded-lg text-white font-main"
                                                >
                                                    <option value="draft">Draft</option>
                                                    <option value="published">Published</option>
                                                </select>
                                            </div>
                                            <button 
                                                type="submit" 
                                                disabled={loading}
                                                className="bg-orange text-black font-bold uppercase tracking-wider text-xs px-6 py-3 rounded-lg cursor-pointer hover:bg-orange/90 inline-flex items-center gap-2"
                                            >
                                                <Save size={14} /> Save Post
                                            </button>
                                        </form>
                                    )}

                                    {/* ── Photo Form ───────────────────────────────────────── */}
                                    {activeTab === 'photos' && (
                                        <form onSubmit={savePhoto} className="space-y-4 font-main">
                                            {/* Image Upload Selection */}
                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Photo Image</label>
                                                <div className="flex gap-2 mb-3">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setUploadMode('url')}
                                                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-bold border border-solid ${uploadMode === 'url' ? 'bg-orange text-black border-orange' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                                                    >
                                                        <Link2 size={12} /> Image URL
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setUploadMode('file')}
                                                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-bold border border-solid ${uploadMode === 'file' ? 'bg-orange text-black border-orange' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                                                    >
                                                        <Upload size={12} /> Upload File
                                                    </button>
                                                </div>

                                                {uploadMode === 'url' ? (
                                                    <input 
                                                        type="text" 
                                                        placeholder="Paste image link..."
                                                        value={photoForm.image_url}
                                                        onChange={(e) => setPhotoForm({ ...photoForm, image_url: e.target.value })}
                                                        className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2.5 rounded-lg text-white font-main"
                                                        required
                                                    />
                                                ) : (
                                                    <div className="border border-dashed border-zinc-800 rounded-lg p-6 bg-zinc-900/20 text-center">
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            onChange={handleImageUpload} 
                                                            id="photo-image-file" 
                                                            className="hidden" 
                                                        />
                                                        <label htmlFor="photo-image-file" className="cursor-pointer inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-lg border border-solid border-zinc-800 transition-colors">
                                                            {uploadingImage ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                                                            {uploadingImage ? 'Uploading to Cloudinary...' : 'Choose File'}
                                                        </label>
                                                        {photoForm.image_url && <p className="text-emerald-400 text-xs mt-3">Uploaded: {photoForm.image_url.split('/').pop()}</p>}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Story / Narrative</label>
                                                <textarea 
                                                    rows={4}
                                                    value={photoForm.story}
                                                    onChange={(e) => setPhotoForm({ ...photoForm, story: e.target.value })}
                                                    className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2.5 rounded-lg text-white font-main"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Camera Body</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="e.g. Fujifilm X-T30 II"
                                                        value={photoForm.camera}
                                                        onChange={(e) => setPhotoForm({ ...photoForm, camera: e.target.value })}
                                                        className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2.5 rounded-lg text-white font-main"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Lens Used</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="e.g. XF 18-55mm f/2.8-4"
                                                        value={photoForm.lens}
                                                        onChange={(e) => setPhotoForm({ ...photoForm, lens: e.target.value })}
                                                        className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2.5 rounded-lg text-white font-main"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Settings (Apt, Shutter, ISO)</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="e.g. f/4.0, 1/250s, ISO 320"
                                                        value={photoForm.settings}
                                                        onChange={(e) => setPhotoForm({ ...photoForm, settings: e.target.value })}
                                                        className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2.5 rounded-lg text-white font-main"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Date Taken</label>
                                                    <input 
                                                        type="date" 
                                                        value={photoForm.taken_at}
                                                        onChange={(e) => setPhotoForm({ ...photoForm, taken_at: e.target.value })}
                                                        className="w-full bg-zinc-900 border border-solid border-zinc-800 px-4 py-2.5 rounded-lg text-white font-main"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Display Order</label>
                                                    <input 
                                                        type="number" 
                                                        value={photoForm.display_order}
                                                        onChange={(e) => setPhotoForm({ ...photoForm, display_order: parseInt(e.target.value) || 0 })}
                                                        className="w-full bg-zinc-900 border border-solid border-zinc-800 px-4 py-2.5 rounded-lg text-white font-main"
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                type="submit" 
                                                disabled={loading}
                                                className="bg-orange text-black font-bold uppercase tracking-wider text-xs px-6 py-3 rounded-lg cursor-pointer hover:bg-orange/90 inline-flex items-center gap-2"
                                            >
                                                <Save size={14} /> Save Photo
                                            </button>
                                        </form>
                                    )}

                                    {/* ── Note Form ────────────────────────────────────────── */}
                                    {activeTab === 'notes' && (
                                        <form onSubmit={saveNote} className="space-y-4 font-main">
                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Note Title</label>
                                                <input 
                                                    type="text" 
                                                    value={noteForm.title}
                                                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                                                    className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2.5 rounded-lg text-white font-main"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Secret Content (AES-256 Encrypted)</label>
                                                <textarea 
                                                    rows={8}
                                                    value={noteForm.content}
                                                    onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                                                    className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-3 rounded-lg text-white font-main resize-y"
                                                    required
                                                />
                                            </div>
                                            <button 
                                                type="submit" 
                                                disabled={loading}
                                                className="bg-orange text-black font-bold uppercase tracking-wider text-xs px-6 py-3 rounded-lg cursor-pointer hover:bg-orange/90 inline-flex items-center gap-2"
                                            >
                                                <Save size={14} /> Encrypt & Save Note
                                            </button>
                                        </form>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {/* ── TAB CONTENT: BLOG LIST ───────────────────────────── */}
                                    {activeTab === 'blog' && (
                                        <div>
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-lg font-bold uppercase tracking-widest text-white">Blog Posts</h3>
                                                <button 
                                                    onClick={() => { setShowCreateForm(true); setBlogForm({ title: '', slug: '', content: '', cover_image_url: '', status: 'draft' }); }}
                                                    className="bg-orange text-black font-bold uppercase tracking-wider text-xs px-4 py-2.5 rounded-xl cursor-pointer hover:bg-orange/90 inline-flex items-center gap-1.5"
                                                >
                                                    <Plus size={14} /> New Scroll
                                                </button>
                                            </div>

                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left font-main border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-solid border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                                                            <th className="py-3 px-4">Title</th>
                                                            <th className="py-3 px-4">Status</th>
                                                            <th className="py-3 px-4">Date</th>
                                                            <th className="py-3 px-4 text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {blogs.map(blog => (
                                                            <tr key={blog.id} className="border-b border-solid border-zinc-800/40 text-sm hover:bg-zinc-900/10">
                                                                <td className="py-3 px-4 text-white font-semibold">{blog.title}</td>
                                                                <td className="py-3 px-4">
                                                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-solid ${
                                                                        blog.status === 'published' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20' : 'text-zinc-400 border-zinc-800 bg-zinc-900/30'
                                                                    }`}>
                                                                        {blog.status}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-4 text-zinc-500">
                                                                    {blog.published_at ? new Date(blog.published_at).toLocaleDateString() : 'N/A'}
                                                                </td>
                                                                <td className="py-3 px-4 text-right space-x-2">
                                                                    <button 
                                                                        onClick={async () => {
                                                                            const res = await fetch(`${API_BASE}/api/blog/${blog.slug}`);
                                                                            if (res.ok) {
                                                                                const fullBlog = await res.json();
                                                                                setEditingItem({ type: 'blog', data: fullBlog });
                                                                                setBlogForm(fullBlog);
                                                                            }
                                                                        }}
                                                                        className="p-1.5 bg-zinc-900 border border-solid border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                                                    >
                                                                        <Edit2 size={13} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => deleteBlog(blog.id)}
                                                                        className="p-1.5 bg-zinc-900 border border-solid border-zinc-800 text-zinc-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                                                                    >
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── TAB CONTENT: PHOTOS LIST ─────────────────────────── */}
                                    {activeTab === 'photos' && (
                                        <div>
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-lg font-bold uppercase tracking-widest text-white">Photo Catalog</h3>
                                                <button 
                                                    onClick={() => { setShowCreateForm(true); setPhotoForm({ image_url: '', story: '', camera: '', lens: '', settings: '', taken_at: '', display_order: 0 }); }}
                                                    className="bg-orange text-black font-bold uppercase tracking-wider text-xs px-4 py-2.5 rounded-xl cursor-pointer hover:bg-orange/90 inline-flex items-center gap-1.5"
                                                >
                                                    <Plus size={14} /> Add Frame
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                {photos.map(p => (
                                                    <div key={p.id} className="border border-solid border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30 p-2 relative group">
                                                        <img src={p.image_url} alt={p.story} className="w-full aspect-square object-cover rounded-lg mb-2" />
                                                        <p className="text-xs text-zinc-400 truncate mb-1">{p.story || 'Untitled'}</p>
                                                        <div className="flex justify-between items-center mt-2 border-t border-solid border-zinc-800/40 pt-2">
                                                            <span className="text-[10px] text-zinc-600 font-bold">Order: {p.display_order}</span>
                                                            <div className="flex gap-1">
                                                                <button 
                                                                    onClick={() => {
                                                                        setEditingItem({ type: 'photo', data: p });
                                                                        setPhotoForm({
                                                                            image_url: p.image_url,
                                                                            story: p.story || '',
                                                                            camera: p.camera || '',
                                                                            lens: p.lens || '',
                                                                            settings: p.settings || '',
                                                                            taken_at: p.taken_at || '',
                                                                            display_order: p.display_order || 0
                                                                        });
                                                                    }}
                                                                    className="p-1 bg-zinc-900 border border-solid border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                                                >
                                                                    <Edit2 size={11} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => deletePhoto(p.id)}
                                                                    className="p-1 bg-zinc-900 border border-solid border-zinc-800 text-zinc-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                                                                >
                                                                    <Trash2 size={11} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* ── TAB CONTENT: NOTES LIST ──────────────────────────── */}
                                    {activeTab === 'notes' && (
                                        <div>
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-lg font-bold uppercase tracking-widest text-white">Secret Notes</h3>
                                                <button 
                                                    onClick={() => { setShowCreateForm(true); setNoteForm({ title: '', content: '' }); }}
                                                    className="bg-orange text-black font-bold uppercase tracking-wider text-xs px-4 py-2.5 rounded-xl cursor-pointer hover:bg-orange/90 inline-flex items-center gap-1.5"
                                                >
                                                    <Plus size={14} /> New Secret
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 font-main">
                                                {notes.map(n => (
                                                    <div key={n.id} className="border border-solid border-zinc-800/80 bg-zinc-900/30 rounded-xl p-4 flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Lock size={12} className="text-orange" />
                                                                <h4 className="font-bold text-white text-base font-accent">{n.title}</h4>
                                                            </div>
                                                            <p className="text-xs text-zinc-400 line-clamp-2 pr-4 whitespace-pre-line">{n.content}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingItem({ type: 'note', data: n });
                                                                    setNoteForm({ title: n.title, content: n.content });
                                                                }}
                                                                className="p-1.5 bg-zinc-900 border border-solid border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <Edit2 size={13} />
                                                            </button>
                                                            <button 
                                                                onClick={() => deleteNote(n.id)}
                                                                className="p-1.5 bg-zinc-900 border border-solid border-zinc-800 text-zinc-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* ── TAB CONTENT: PASSWORD CHANGE ─────────────────────── */}
                                    {activeTab === 'password' && (
                                        <div className="max-w-md">
                                            <h3 className="text-lg font-bold uppercase tracking-widest text-white mb-6">Update Admin Password</h3>
                                            <form onSubmit={handlePasswordChange} className="space-y-4 font-main">
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Current Password</label>
                                                    <input 
                                                        type="password" 
                                                        value={passwordForm.currentPassword}
                                                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                        className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2.5 rounded-lg text-white"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">New Password</label>
                                                    <input 
                                                        type="password" 
                                                        value={passwordForm.newPassword}
                                                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                        className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2.5 rounded-lg text-white"
                                                        required
                                                    />
                                                </div>
                                                <button 
                                                    type="submit" 
                                                    disabled={loading}
                                                    className="bg-orange text-black font-bold uppercase tracking-wider text-xs px-6 py-3 rounded-lg cursor-pointer hover:bg-orange/90 inline-flex items-center gap-1.5"
                                                >
                                                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Update Credentials
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;
