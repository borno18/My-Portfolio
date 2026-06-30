import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    LayoutDashboard, BookOpen, Image, FileText, Lock, LogOut, Plus, 
    Edit2, Trash2, Save, X, ArrowLeft, RefreshCw, Upload, Link2, Eye, EyeOff, Swords,
    Mail, MailOpen, Briefcase
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
    const [activeTab, setActiveTab] = useState('blog'); // 'blog' | 'photos' | 'notes' | 'skills' | 'password'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const transition = useMotionTransition('standard');

    // Data States
    const [blogs, setBlogs] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [notes, setNotes] = useState([]);
    const [skills, setSkills] = useState([]);
    const [simpleSlugs, setSimpleSlugs] = useState([]);
    const [previewIconFailed, setPreviewIconFailed] = useState(false);
    const [messages, setMessages] = useState([]);
    const [expandedMessageIds, setExpandedMessageIds] = useState({});
    const [blogFilter, setBlogFilter] = useState('all');
    const [projects, setProjects] = useState([]);
    const [projectForm, setProjectForm] = useState({ title: '', description: '', github_url: '', live_url: '', tech_stack: '', display_order: 0, is_visible: true });
    const [githubRepoPath, setGithubRepoPath] = useState('');

    // Editing States
    const [editingItem, setEditingItem] = useState(null); // { type: 'blog'|'photo'|'note', data: ... } or null
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Form inputs
    const [blogForm, setBlogForm] = useState({ title: '', slug: '', content: '', cover_image_url: '', status: 'draft', read_time: '' });
    const [photoForm, setPhotoForm] = useState({ image_url: '', story: '', camera: '', lens: '', settings: '', taken_at: '', display_order: 0, category: 'Street' });
    const [noteForm, setNoteForm] = useState({ title: '', content: '' });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
    const [skillForm, setSkillForm] = useState({ name: '', category: 'Machine Learning', icon_key: '', status: 'mastered', display_order: 0, is_visible: true });

    // Cloudinary upload states
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadMode, setUploadMode] = useState('url'); // 'url' | 'file'
    const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);

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

    useEffect(() => {
        const fetchSlugs = async () => {
            const fallbackSlugs = [
                { brand: 'Python', slug: 'python' },
                { brand: 'JavaScript', slug: 'javascript' },
                { brand: 'React', slug: 'react' },
                { brand: 'FastAPI', slug: 'fastapi' },
                { brand: 'C', slug: 'c' },
                { brand: 'C++', slug: 'cplusplus' },
                { brand: 'Java', slug: 'java' },
                { brand: 'HTML5', slug: 'html5' },
                { brand: 'CSS3', slug: 'css3' },
                { brand: 'Git', slug: 'git' },
                { brand: 'GitHub', slug: 'github' },
                { brand: 'Docker', slug: 'docker' },
                { brand: 'PostgreSQL', slug: 'postgresql' },
                { brand: 'MongoDB', slug: 'mongodb' },
                { brand: 'Node.js', slug: 'nodedotjs' },
                { brand: 'TypeScript', slug: 'typescript' },
                { brand: 'Next.js', slug: 'nextdotjs' },
                { brand: 'Tailwind CSS', slug: 'tailwindcss' },
                { brand: 'PyTorch', slug: 'pytorch' },
                { brand: 'TensorFlow', slug: 'tensorflow' },
                { brand: 'scikit-learn', slug: 'scikitlearn' },
                { brand: 'NumPy', slug: 'numpy' },
                { brand: 'Pandas', slug: 'pandas' },
                { brand: 'Matplotlib', slug: 'matplotlib' },
                { brand: 'Jupyter', slug: 'jupyter' },
                { brand: 'Kaggle', slug: 'kaggle' },
                { brand: 'VS Code', slug: 'visualstudiocode' },
                { brand: 'Vercel', slug: 'vercel' },
                { brand: 'Linux', slug: 'linux' }
            ];
            try {
                const res = await fetch('https://raw.githubusercontent.com/simple-icons/simple-icons/develop/slugs.md');
                if (res.ok) {
                    const text = await res.text();
                    const lines = text.split('\n');
                    const list = [];
                    for (const line of lines) {
                        const parts = line.split('|');
                        if (parts.length >= 3) {
                            const brand = parts[1].replace(/`/g, '').trim();
                            const slug = parts[2].replace(/`/g, '').trim();
                            if (slug && slug !== 'Brand slug' && !slug.startsWith(':')) {
                                list.push({ brand, slug });
                            }
                        }
                    }
                    if (list.length > 0) {
                        setSimpleSlugs(list);
                        return;
                    }
                }
                setSimpleSlugs(fallbackSlugs);
            } catch (err) {
                console.warn('Failed to fetch Simple Icons slugs from GitHub:', err);
                setSimpleSlugs(fallbackSlugs);
            }
        };
        fetchSlugs();
    }, []);

    useEffect(() => {
        setPreviewIconFailed(false);
    }, [skillForm.icon_key]);

    const loadAllData = async () => {
        setAuthChecking(false);
        try {
            // Load blogs
            const resBlog = await fetch(`${API_BASE}/api/admin/blog`, { credentials: 'include' });
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

            // Load skills (all — admin view)
            const resSkills = await fetch(`${API_BASE}/api/skills?all=true`, { credentials: 'include' });
            if (resSkills.ok) {
                const data = await resSkills.json();
                setSkills(data);
            }

            // Load contact messages (authenticated)
            const resMsg = await fetch(`${API_BASE}/api/admin/messages`, { credentials: 'include' });
            if (resMsg.ok) {
                const data = await resMsg.json();
                setMessages(data);
            }

            // Load curated projects
            const resProj = await fetch(`${API_BASE}/api/admin/projects`, { credentials: 'include' });
            if (resProj.ok) {
                const data = await resProj.json();
                setProjects(data);
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

    const insertFormatting = (before, after = '') => {
        const textarea = document.getElementById('blog-content-textarea');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selected = text.substring(start, end);
        const replacement = before + selected + after;

        const newContent = text.substring(0, start) + replacement + text.substring(end);
        setBlogForm({ ...blogForm, content: newContent });

        // Restore focus and selection
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
        }, 0);
    };

    const handleSkillNameChange = (e) => {
        const name = e.target.value;
        setSkillForm(prev => {
            const newForm = { ...prev, name };
            const query = name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const aliasMap = {
                'aws': 'amazonwebservices',
                'gcp': 'googlecloud',
                'js': 'javascript',
                'ts': 'typescript',
                'tailwind': 'tailwindcss',
                'postgres': 'postgresql',
                'reactjs': 'react'
            };
            const lookupQuery = aliasMap[query] || query;
            if (lookupQuery && simpleSlugs.length > 0) {
                let match = simpleSlugs.find(item => 
                    item.brand.toLowerCase().replace(/[^a-z0-9]/g, '') === lookupQuery || 
                    item.slug === lookupQuery
                );
                if (!match) {
                    match = simpleSlugs.find(item => 
                        item.brand.toLowerCase().replace(/[^a-z0-9]/g, '').startsWith(lookupQuery) ||
                        item.slug.startsWith(lookupQuery)
                    );
                }
                if (!match) {
                    match = simpleSlugs.find(item => item.slug.includes(lookupQuery));
                }
                if (match) {
                    newForm.icon_key = match.slug;
                }
            } else if (!lookupQuery) {
                newForm.icon_key = '';
            }
            return newForm;
        });
    };

    // ──â”€ Image Uploading ──────────────────────────────────────────────────────â”€
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

    // ──â”€ Blog CRUD Operations ──────────────────────────────────────────────────
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

            const payload = {
                ...blogForm,
                read_time: blogForm.read_time ? parseInt(blogForm.read_time, 10) : null
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to save blog post');
            }

            // Reload blogs
            const resBlogs = await fetch(`${API_BASE}/api/admin/blog`, { credentials: 'include' });
            const data = await resBlogs.json();
            setBlogs(data);

            setSuccess('Blog post saved successfully!');
            setShowCreateForm(false);
            setEditingItem(null);
            setBlogForm({ title: '', slug: '', content: '', cover_image_url: '', status: 'draft', read_time: '' });
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

    // ──â”€ Photos CRUD Operations ────────────────────────────────────────────────
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
            setPhotoForm({ image_url: '', story: '', camera: '', lens: '', settings: '', taken_at: '', display_order: 0, category: 'Street' });
            setShowCustomCategoryInput(false);
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

    // ──â”€ Notes CRUD Operations ────────────────────────────────────────────────â”€
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

    // ──â”€ Skills CRUD Operations ────────────────────────────────────────────────
    const saveSkill = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const isEditing = editingItem && editingItem.type === 'skill';
            const url = isEditing
                ? `${API_BASE}/api/skills/${editingItem.data.id}`
                : `${API_BASE}/api/skills`;
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...skillForm, display_order: parseInt(skillForm.display_order) || 0 }),
                credentials: 'include'
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to save skill');
            }

            const resSkills = await fetch(`${API_BASE}/api/skills?all=true`, { credentials: 'include' });
            const data = await resSkills.json();
            setSkills(data);

            setSuccess('Skill saved successfully!');
            setShowCreateForm(false);
            setEditingItem(null);
            setSkillForm({ name: '', category: 'Machine Learning', icon_key: '', status: 'mastered', display_order: 0, is_visible: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteSkill = async (id) => {
        if (!confirm('Are you sure you want to delete this skill?')) return;
        try {
            const res = await fetch(`${API_BASE}/api/skills/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                setSkills(skills.filter(s => s.id !== id));
                setSuccess('Skill deleted successfully.');
            }
        } catch (err) {
            setError('Failed to delete skill');
        }
    };

    const toggleSkillStatus = async (skill) => {
        const newStatus = skill.status === 'mastered' ? 'learning' : 'mastered';
        try {
            const res = await fetch(`${API_BASE}/api/skills/${skill.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
                credentials: 'include'
            });
            if (res.ok) {
                setSkills(skills.map(s => s.id === skill.id ? { ...s, status: newStatus } : s));
            }
        } catch (err) {
            setError('Failed to update skill status');
        }
    };

    const toggleSkillVisibility = async (skill) => {
        const newVisibility = !skill.is_visible;
        try {
            const res = await fetch(`${API_BASE}/api/skills/${skill.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_visible: newVisibility }),
                credentials: 'include'
            });
            if (res.ok) {
                setSkills(skills.map(s => s.id === skill.id ? { ...s, is_visible: newVisibility } : s));
                setSuccess(`Skill "${skill.name}" is now ${newVisibility ? 'visible' : 'hidden'} on the site.`);
            }
        } catch (err) {
            setError('Failed to update skill visibility');
        }
    };

    const saveProject = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const isEditing = editingItem && editingItem.type === 'project';
            const url = isEditing 
                ? `${API_BASE}/api/projects/${editingItem.data.id}`
                : `${API_BASE}/api/projects`;
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectForm),
                credentials: 'include'
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to save project');
            }

            // Reload projects
            const resProjects = await fetch(`${API_BASE}/api/admin/projects`, { credentials: 'include' });
            const data = await resProjects.json();
            setProjects(data);

            setSuccess('Project saved successfully!');
            setShowCreateForm(false);
            setEditingItem(null);
            setProjectForm({ title: '', description: '', github_url: '', live_url: '', tech_stack: '', display_order: 0, is_visible: true });
            setGithubRepoPath('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteProject = async (id) => {
        if (!confirm('Are you sure you want to delete this project?')) return;
        try {
            const res = await fetch(`${API_BASE}/api/projects/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                setProjects(projects.filter(p => p.id !== id));
                setSuccess('Project deleted successfully.');
            }
        } catch (err) {
            setError('Failed to delete project');
        }
    };

    const toggleMessageRead = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/messages/${id}/read`, {
                method: 'PATCH',
                credentials: 'include'
            });
            if (res.ok) {
                setMessages(messages.map(m => m.id === id ? { ...m, is_read: true } : m));
                setSuccess('Message marked as read.');
            } else {
                throw new Error('Failed to update status');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const deleteMessage = async (id) => {
        if (!confirm('Are you sure you want to delete this message?')) return;
        try {
            const res = await fetch(`${API_BASE}/api/admin/messages/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                setMessages(messages.filter(m => m.id !== id));
                setSuccess('Message deleted successfully.');
            } else {
                throw new Error('Failed to delete message');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const toggleExpandMessage = (id) => {
        setExpandedMessageIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

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
                    /* ── Admin Dashboard ──────────────────────────────────────â”€ */
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
                                onClick={() => { setActiveTab('messages'); setShowCreateForm(false); setEditingItem(null); }}
                                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                    activeTab === 'messages' ? 'bg-orange text-black' : 'bg-zinc-900/60 text-zinc-400 border border-solid border-zinc-800/40 hover:text-white'
                                }`}
                            >
                                <Mail size={16} /> Hawk Inbox
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
                                onClick={() => { setActiveTab('skills'); setShowCreateForm(false); setEditingItem(null); }}
                                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                    activeTab === 'skills' ? 'bg-orange text-black' : 'bg-zinc-900/60 text-zinc-400 border border-solid border-zinc-800/40 hover:text-white'
                                }`}
                            >
                                <Swords size={16} /> Skills Arsenal
                            </button>
                            <button 
                                onClick={() => { setActiveTab('projects'); setShowCreateForm(false); setEditingItem(null); }}
                                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                    activeTab === 'projects' ? 'bg-orange text-black' : 'bg-zinc-900/60 text-zinc-400 border border-solid border-zinc-800/40 hover:text-white'
                                }`}
                            >
                                <Briefcase size={16} /> Missions Control
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
                                                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-zinc-950/60 border border-solid border-zinc-800 border-b-0 rounded-t-lg font-main text-xs text-zinc-400">
                                                    <button
                                                        type="button"
                                                        onClick={() => insertFormatting('**', '**')}
                                                        className="px-2.5 py-1 bg-zinc-900 border border-solid border-zinc-800 rounded hover:text-white hover:bg-zinc-800 font-bold transition-colors cursor-pointer"
                                                        title="Bold"
                                                    >
                                                        B
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => insertFormatting('*', '*')}
                                                        className="px-2.5 py-1 bg-zinc-900 border border-solid border-zinc-800 rounded hover:text-white hover:bg-zinc-800 italic font-main transition-colors cursor-pointer"
                                                        title="Italic"
                                                    >
                                                        I
                                                    </button>
                                                    <select
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                insertFormatting(`<span style="font-size: ${e.target.value};">`, '</span>');
                                                                e.target.value = '';
                                                            }
                                                        }}
                                                        className="bg-zinc-900 border border-solid border-zinc-800 text-zinc-400 hover:text-white rounded px-2 py-1 text-xs cursor-pointer focus:outline-none focus:border-orange/60"
                                                    >
                                                        <option value="">Font Size</option>
                                                        <option value="12px">12px</option>
                                                        <option value="14px">14px</option>
                                                        <option value="16px">16px</option>
                                                        <option value="18px">18px</option>
                                                        <option value="20px">20px</option>
                                                        <option value="24px">24px</option>
                                                        <option value="32px">32px</option>
                                                    </select>
                                                    <select
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                insertFormatting(`<span style="font-family: ${e.target.value};">`, '</span>');
                                                                e.target.value = '';
                                                            }
                                                        }}
                                                        className="bg-zinc-900 border border-solid border-zinc-800 text-zinc-400 hover:text-white rounded px-2 py-1 text-xs cursor-pointer focus:outline-none focus:border-orange/60"
                                                    >
                                                        <option value="">Font Family</option>
                                                        <option value="sans-serif">Sans-Serif</option>
                                                        <option value="serif">Serif</option>
                                                        <option value="'Times New Roman', Times, serif">Times New Roman</option>
                                                        <option value="'Courier New', Courier, monospace">Monospace</option>
                                                        <option value="'Georgia', serif">Georgia</option>
                                                        <option value="'Impact', Charcoal, sans-serif">Impact</option>
                                                    </select>
                                                </div>
                                                <textarea 
                                                    id="blog-content-textarea"
                                                    rows={12}
                                                    value={blogForm.content}
                                                    onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                                                    className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-3 rounded-b-lg rounded-t-none text-white font-main resize-y focus:outline-none"
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
                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">
                                                    Read Time (Minutes) <span className="normal-case text-zinc-600">(Optional - leave empty or 0 to auto-calculate)</span>
                                                </label>
                                                <input 
                                                    type="number"
                                                    value={blogForm.read_time || ''}
                                                    onChange={(e) => setBlogForm({ ...blogForm, read_time: e.target.value ? parseInt(e.target.value, 10) : '' })}
                                                    className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2.5 rounded-lg text-white font-main"
                                                    placeholder="e.g. 5"
                                                    min="0"
                                                />
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

                                    {/* ── Photo Form ────────────────────────────────────────â”€ */}
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
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Photo Type / Category</label>
                                                    <select
                                                        value={showCustomCategoryInput ? 'custom' : photoForm.category || 'Street'}
                                                        onChange={(e) => {
                                                            if (e.target.value === 'custom') {
                                                                setShowCustomCategoryInput(true);
                                                                setPhotoForm({ ...photoForm, category: '' });
                                                            } else {
                                                                setShowCustomCategoryInput(false);
                                                                setPhotoForm({ ...photoForm, category: e.target.value });
                                                            }
                                                        }}
                                                        className="w-full bg-zinc-900 border border-solid border-zinc-800 px-4 py-2.5 rounded-lg text-white font-main"
                                                    >
                                                        {Array.from(new Set(['Street', 'Festival', 'Architecture', 'Food', ...photos.map(p => p.category).filter(Boolean)])).map(cat => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                        <option value="custom">+ Add Custom...</option>
                                                    </select>
                                                </div>
                                                {showCustomCategoryInput && (
                                                    <div>
                                                        <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Custom Type Name</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="e.g. Portrait, Nature..."
                                                            value={photoForm.category}
                                                            onChange={(e) => setPhotoForm({ ...photoForm, category: e.target.value })}
                                                            className="w-full bg-zinc-900 border border-solid border-zinc-800 px-4 py-2.5 rounded-lg text-white font-main"
                                                            required
                                                        />
                                                    </div>
                                                )}
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

                                    {/* ── Project Form ────────────────────────────────────────── */}
                                    {activeTab === 'projects' && (
                                        <form onSubmit={saveProject} className="space-y-4 font-main">
                                            <div className="bg-zinc-950/40 p-4 rounded-xl border border-solid border-zinc-800/60 mb-4">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">GitHub Repo Lookup (Auto-fill)</h4>
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={githubRepoPath}
                                                        onChange={(e) => setGithubRepoPath(e.target.value)}
                                                        className="flex-1 bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2 rounded-lg text-white text-sm"
                                                        placeholder="e.g. borno18/My-Portfolio"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            if (!githubRepoPath) {
                                                                alert('Please enter repository path (owner/repo)');
                                                                return;
                                                            }
                                                            setLoading(true);
                                                            try {
                                                                const res = await fetch(`https://api.github.com/repos/${githubRepoPath}`);
                                                                if (!res.ok) throw new Error('Repository not found or rate limited');
                                                                const data = await res.json();
                                                                setProjectForm(prev => ({
                                                                    ...prev,
                                                                    title: data.name || '',
                                                                    description: data.description || '',
                                                                    github_url: data.html_url || '',
                                                                    tech_stack: data.language ? data.language : prev.tech_stack
                                                                }));
                                                            } catch (err) {
                                                                alert(err.message);
                                                            } finally {
                                                                setLoading(false);
                                                            }
                                                        }}
                                                        disabled={loading}
                                                        className="bg-orange text-black font-bold uppercase tracking-wider text-xs px-4 py-2 rounded-lg hover:bg-orange/90 flex items-center gap-1.5"
                                                    >
                                                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Fetch Info
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Project Title</label>
                                                <input 
                                                    type="text" 
                                                    value={projectForm.title}
                                                    onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                                                    className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2.5 rounded-lg text-white"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Description</label>
                                                <textarea 
                                                    rows={4}
                                                    value={projectForm.description}
                                                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                                                    className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-3 rounded-lg text-white resize-y"
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">GitHub URL</label>
                                                    <input 
                                                        type="url" 
                                                        value={projectForm.github_url || ''}
                                                        onChange={(e) => setProjectForm({ ...projectForm, github_url: e.target.value })}
                                                        className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2.5 rounded-lg text-white"
                                                        placeholder="e.g. https://github.com/..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Live Demo URL</label>
                                                    <input 
                                                        type="url" 
                                                        value={projectForm.live_url || ''}
                                                        onChange={(e) => setProjectForm({ ...projectForm, live_url: e.target.value })}
                                                        className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2.5 rounded-lg text-white"
                                                        placeholder="e.g. https://..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Tech Stack <span className="normal-case text-zinc-600">(comma-separated)</span></label>
                                                    <input 
                                                        type="text" 
                                                        value={projectForm.tech_stack || ''}
                                                        onChange={(e) => setProjectForm({ ...projectForm, tech_stack: e.target.value })}
                                                        className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2.5 rounded-lg text-white"
                                                        placeholder="e.g. React, Node.js, CSS"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Display Order</label>
                                                    <input 
                                                        type="number" 
                                                        value={projectForm.display_order}
                                                        onChange={(e) => setProjectForm({ ...projectForm, display_order: parseInt(e.target.value) || 0 })}
                                                        className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2.5 rounded-lg text-white"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Visibility</label>
                                                <select 
                                                    value={projectForm.is_visible ? 'true' : 'false'}
                                                    onChange={(e) => setProjectForm({ ...projectForm, is_visible: e.target.value === 'true' })}
                                                    className="w-full bg-zinc-900 border border-solid border-zinc-800 px-4 py-2.5 rounded-lg text-white"
                                                >
                                                    <option value="true">Visible</option>
                                                    <option value="false">Hidden</option>
                                                </select>
                                            </div>

                                            <button 
                                                type="submit" 
                                                disabled={loading}
                                                className="bg-orange text-black font-bold uppercase tracking-wider text-xs px-6 py-3 rounded-lg cursor-pointer hover:bg-orange/90 inline-flex items-center gap-2"
                                            >
                                                <Save size={14} /> Save Mission
                                            </button>
                                        </form>
                                    )}

                                    {/* ── Skill Form ────────────────────────────────────────── */}
                                    {activeTab === 'skills' && (
                                        <form onSubmit={saveSkill} className="space-y-4 font-main">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Skill Name</label>
                                                    <input
                                                        type="text"
                                                        value={skillForm.name}
                                                        onChange={handleSkillNameChange}
                                                        className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2.5 rounded-lg text-white font-main focus:outline-none"
                                                        placeholder="e.g. Python"
                                                        required
                                                    />
                                                    {/* Slugs Suggestion Drawer */}
                                                    {skillForm.name && simpleSlugs.length > 0 && (
                                                        <div className="mt-2 text-[11px] border border-solid border-zinc-800/80 rounded-lg p-2.5 bg-zinc-950/80 max-w-full">
                                                            <span className="text-zinc-500 font-semibold block mb-1.5">Matching Icons (Click to apply):</span>
                                                            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                                                                {simpleSlugs
                                                                    .filter(item => {
                                                                        const q = skillForm.name.toLowerCase().trim();
                                                                        const aliasMap = { 
                                                                            'aws': 'amazonwebservices', 
                                                                            'gcp': 'googlecloud', 
                                                                            'js': 'javascript', 
                                                                            'ts': 'typescript',
                                                                            'tailwind': 'tailwindcss',
                                                                            'postgres': 'postgresql',
                                                                            'reactjs': 'react'
                                                                        };
                                                                        const mapped = aliasMap[q] || q;
                                                                        return item.brand.toLowerCase().includes(mapped) || item.slug.includes(mapped);
                                                                    })
                                                                    .slice(0, 10)
                                                                    .map(item => (
                                                                        <button
                                                                            key={item.slug}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSkillForm({ ...skillForm, icon_key: item.slug });
                                                                                setPreviewIconFailed(false);
                                                                            }}
                                                                            className="bg-zinc-900/90 hover:bg-orange hover:text-black border border-solid border-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded transition-colors text-[10px] font-semibold cursor-pointer"
                                                                        >
                                                                            {item.brand}
                                                                        </button>
                                                                    ))
                                                                }
                                                            </div>
                                                            <div className="mt-1.5 text-[9px] text-zinc-600 flex justify-between">
                                                                <span>Can't find it? Search on <a href="https://simpleicons.org" target="_blank" rel="noopener noreferrer" className="text-orange hover:underline font-bold">simpleicons.org</a></span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Category</label>
                                                    <input
                                                        type="text"
                                                        value={skillForm.category}
                                                        onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
                                                        className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2.5 rounded-lg text-white font-main"
                                                        placeholder="e.g. Machine Learning"
                                                        list="skill-categories"
                                                    />
                                                    <datalist id="skill-categories">
                                                        {Array.from(new Set(skills.map(s => s.category).filter(Boolean))).map(c => (
                                                            <option key={c} value={c} />
                                                        ))}
                                                    </datalist>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">
                                                        Icon Key <span className="normal-case text-zinc-600">(Simple Icons slug, e.g. <code className="text-orange/80">python</code>, <code className="text-orange/80">react</code>)</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={skillForm.icon_key}
                                                        onChange={(e) => setSkillForm({ ...skillForm, icon_key: e.target.value.toLowerCase().replace(/\s/g, '') })}
                                                        className="w-full bg-zinc-900/60 border border-solid border-zinc-800 focus:border-orange/60 px-4 py-2.5 rounded-lg text-white font-main"
                                                        placeholder="e.g. python"
                                                    />
                                                    {skillForm.icon_key && (
                                                        <div className="mt-2 flex items-center gap-2">
                                                            {!previewIconFailed ? (
                                                                <>
                                                                    <img
                                                                        src={`https://cdn.simpleicons.org/${skillForm.icon_key}`}
                                                                        alt="preview"
                                                                        className="w-5 h-5 object-contain"
                                                                        onError={() => setPreviewIconFailed(true)}
                                                                    />
                                                                    <span className="text-[11px] text-zinc-600">Logo preview</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-[11px] text-rose-500 font-semibold">No matching icon found</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Status</label>
                                                    <select
                                                        value={skillForm.status}
                                                        onChange={(e) => setSkillForm({ ...skillForm, status: e.target.value })}
                                                        className="w-full bg-zinc-900 border border-solid border-zinc-800 px-4 py-2.5 rounded-lg text-white font-main"
                                                    >
                                                        <option value="mastered">✓ Mastered</option>
                                                        <option value="learning">↻ Currently Learning</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5">Display Order</label>
                                                    <input
                                                        type="number"
                                                        value={skillForm.display_order}
                                                        onChange={(e) => setSkillForm({ ...skillForm, display_order: parseInt(e.target.value) || 0 })}
                                                        className="w-full bg-zinc-900 border border-solid border-zinc-800 px-4 py-2.5 rounded-lg text-white font-main"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-3">Visibility</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSkillForm({ ...skillForm, is_visible: !skillForm.is_visible })}
                                                        className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border border-solid transition-all cursor-pointer ${
                                                            skillForm.is_visible
                                                                ? 'bg-emerald-900/20 border-emerald-600/30 text-emerald-400 hover:bg-emerald-900/40'
                                                                : 'bg-zinc-900/60 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                                        }`}
                                                    >
                                                        {skillForm.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                                        {skillForm.is_visible ? 'Visible on Site' : 'Hidden from Site'}
                                                    </button>
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="bg-orange text-black font-bold uppercase tracking-wider text-xs px-6 py-3 rounded-lg cursor-pointer hover:bg-orange/90 inline-flex items-center gap-2"
                                            >
                                                <Save size={14} /> Save Skill
                                            </button>
                                        </form>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {/* ── TAB CONTENT: HAWK INBOX ─────────────────────────── */}
                                    {activeTab === 'messages' && (
                                        <div>
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2">
                                                    <Mail className="text-orange" size={20} /> Hawk Inbox
                                                </h3>
                                            </div>

                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left font-main border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-solid border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                                                            <th className="py-3 px-4">Name</th>
                                                            <th className="py-3 px-4">Email</th>
                                                            <th className="py-3 px-4">Message</th>
                                                            <th className="py-3 px-4">Date</th>
                                                            <th className="py-3 px-4 text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {messages.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={5} className="py-8 px-4 text-center text-zinc-500">
                                                                    No messages received yet. The sky is clear!
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            messages.map(msg => {
                                                                const isExpanded = !!expandedMessageIds[msg.id];
                                                                const isRead = msg.is_read;
                                                                return (
                                                                    <tr key={msg.id} className={`border-b border-solid border-zinc-800/40 text-sm hover:bg-zinc-900/10 ${!isRead ? 'font-semibold text-white' : 'text-zinc-400'}`}>
                                                                        <td className="py-3 px-4">
                                                                            <div className="flex items-center gap-1.5">
                                                                                {!isRead && <span className="w-2 h-2 rounded-full bg-orange inline-block flex-shrink-0 animate-pulse" title="Unread" />}
                                                                                <span>{msg.name}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-3 px-4">
                                                                            <a href={`mailto:${msg.email}`} className="text-orange hover:underline">{msg.email}</a>
                                                                        </td>
                                                                        <td className="py-3 px-4 max-w-xs sm:max-w-md">
                                                                            <div 
                                                                                onClick={() => toggleExpandMessage(msg.id)} 
                                                                                className="cursor-pointer break-words"
                                                                            >
                                                                                {isExpanded ? (
                                                                                    <span className="whitespace-pre-wrap">{msg.message}</span>
                                                                                ) : (
                                                                                    <span>
                                                                                        {msg.message.length > 80 ? msg.message.slice(0, 80) + '...' : msg.message}
                                                                                        {msg.message.length > 80 && <span className="text-[10px] text-orange ml-1.5 hover:underline">(expand)</span>}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-3 px-4 text-xs whitespace-nowrap text-zinc-500">
                                                                            {new Date(msg.created_at).toLocaleString()}
                                                                        </td>
                                                                        <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                                                                            {!isRead && (
                                                                                <button 
                                                                                    onClick={() => toggleMessageRead(msg.id)}
                                                                                    title="Mark as Read"
                                                                                    className="p-1.5 bg-zinc-900 border border-solid border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                                                                >
                                                                                    <MailOpen size={13} />
                                                                                </button>
                                                                            )}
                                                                            <button 
                                                                                onClick={() => deleteMessage(msg.id)}
                                                                                title="Delete Message"
                                                                                className="p-1.5 bg-zinc-900 border border-solid border-zinc-800 text-zinc-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                                                                            >
                                                                                <Trash2 size={13} />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── TAB CONTENT: BLOG LIST ────────────────────────────â”€ */}
                                    {activeTab === 'blog' && (
                                        <div>
                                            <div className="flex justify-between items-center mb-6">
                                                <div className="flex items-center gap-4">
                                                    <h3 className="text-lg font-bold uppercase tracking-widest text-white">Blog Posts</h3>
                                                    <select 
                                                        value={blogFilter}
                                                        onChange={(e) => setBlogFilter(e.target.value)}
                                                        className="bg-zinc-900 border border-solid border-zinc-800 text-xs px-3 py-1.5 rounded-lg text-zinc-300 font-main focus:border-orange/60 outline-none"
                                                    >
                                                        <option value="all">All Status</option>
                                                        <option value="published">Published Only</option>
                                                        <option value="draft">Drafts Only</option>
                                                    </select>
                                                </div>
                                                <button 
                                                    onClick={() => { setShowCreateForm(true); setBlogForm({ title: '', slug: '', content: '', cover_image_url: '', status: 'draft', read_time: '' }); }}
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
                                                        {blogs
                                                            .filter(blog => blogFilter === 'all' ? true : blog.status === blogFilter)
                                                            .map(blog => (
                                                                <tr key={blog.id} className="border-b border-solid border-zinc-800/40 text-sm hover:bg-zinc-900/10">
                                                                    <td className="py-3 px-4 text-white font-semibold">{blog.title}</td>
                                                                    <td className="py-3 px-4">
                                                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-solid ${
                                                                            blog.status === 'published' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20' : 'text-amber-400 border-amber-500/20 bg-amber-950/20'
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

                                    {/* ── TAB CONTENT: PHOTOS LIST ──────────────────────────â”€ */}
                                    {activeTab === 'photos' && (
                                        <div>
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-lg font-bold uppercase tracking-widest text-white">Photo Catalog</h3>
                                                <button 
                                                    onClick={() => { setShowCreateForm(true); setPhotoForm({ image_url: '', story: '', camera: '', lens: '', settings: '', taken_at: '', display_order: 0, category: 'Street' }); setShowCustomCategoryInput(false); }}
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
                                                                            display_order: p.display_order || 0,
                                                                            category: p.category || 'Street'
                                                                        });
                                                                        setShowCustomCategoryInput(false);
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

                                    {/* ── TAB CONTENT: PROJECTS LIST ────────────────────────── */}
                                    {activeTab === 'projects' && (
                                        <div>
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-lg font-bold uppercase tracking-widest text-white">Missions Control</h3>
                                                <button
                                                    onClick={() => { setShowCreateForm(true); setProjectForm({ title: '', description: '', github_url: '', live_url: '', tech_stack: '', display_order: projects.length + 1, is_visible: true }); setGithubRepoPath(''); }}
                                                    className="bg-orange text-black font-bold uppercase tracking-wider text-xs px-4 py-2.5 rounded-xl cursor-pointer hover:bg-orange/90 inline-flex items-center gap-1.5"
                                                >
                                                    <Plus size={14} /> Add Mission
                                                </button>
                                            </div>

                                            <div className="space-y-3 font-main">
                                                {projects.length === 0 ? (
                                                    <p className="text-zinc-500 text-sm text-center py-8">No missions registered.</p>
                                                ) : (
                                                    projects.map(p => (
                                                        <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl border border-solid transition-all ${
                                                            p.is_visible
                                                                ? 'border-zinc-800/60 bg-zinc-900/20 hover:border-zinc-700/60'
                                                                : 'border-zinc-800/30 bg-zinc-900/10 opacity-50'
                                                        }`}>
                                                            <div>
                                                                <h4 className="font-bold text-white text-base">{p.title}</h4>
                                                                <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{p.description}</p>
                                                                <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-600">
                                                                    <span>Order: {p.display_order}</span>
                                                                    <span>•</span>
                                                                    <span>Tech: {p.tech_stack || 'None'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2.5">
                                                                <button 
                                                                    onClick={async () => {
                                                                        const nextVal = !p.is_visible;
                                                                        const res = await fetch(`${API_BASE}/api/projects/${p.id}`, {
                                                                            method: 'PUT',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ is_visible: nextVal }),
                                                                            credentials: 'include'
                                                                        });
                                                                        if (res.ok) {
                                                                            setProjects(projects.map(item => item.id === p.id ? { ...item, is_visible: nextVal } : item));
                                                                        }
                                                                    }}
                                                                    title={p.is_visible ? "Hide from public site" : "Show on public site"}
                                                                    className="p-1.5 bg-zinc-900 border border-solid border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                                                >
                                                                    {p.is_visible ? <Eye size={13} /> : <EyeOff size={13} />}
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        setEditingItem({ type: 'project', data: p });
                                                                        setProjectForm({
                                                                            title: p.title,
                                                                            description: p.description,
                                                                            github_url: p.github_url || '',
                                                                            live_url: p.live_url || '',
                                                                            tech_stack: p.tech_stack || '',
                                                                            display_order: p.display_order,
                                                                            is_visible: p.is_visible
                                                                        });
                                                                        setGithubRepoPath('');
                                                                    }}
                                                                    className="p-1.5 bg-zinc-900 border border-solid border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                                                >
                                                                    <Edit2 size={13} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => deleteProject(p.id)}
                                                                    className="p-1.5 bg-zinc-900 border border-solid border-zinc-800 text-zinc-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* ── TAB CONTENT: SKILLS LIST ──────────────────────────â”€ */}
                                    {activeTab === 'skills' && (
                                        <div>
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-lg font-bold uppercase tracking-widest text-white">Skills Arsenal</h3>
                                                <button
                                                    onClick={() => { setShowCreateForm(true); setSkillForm({ name: '', category: 'Machine Learning', icon_key: '', status: 'mastered', display_order: skills.length + 1, is_visible: true }); }}
                                                    className="bg-orange text-black font-bold uppercase tracking-wider text-xs px-4 py-2.5 rounded-xl cursor-pointer hover:bg-orange/90 inline-flex items-center gap-1.5"
                                                >
                                                    <Plus size={14} /> Add Skill
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                {skills.map(s => (
                                                    <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border border-solid transition-all ${
                                                            s.is_visible
                                                                ? 'border-zinc-800/60 bg-zinc-900/20 hover:border-zinc-700/60'
                                                                : 'border-zinc-800/30 bg-zinc-900/10 opacity-50'
                                                        }`}>
                                                        {s.icon_key ? (
                                                            <img
                                                                src={`https://cdn.simpleicons.org/${s.icon_key}`}
                                                                alt={s.name}
                                                                className="w-5 h-5 object-contain flex-shrink-0"
                                                                onError={(e) => { 
                                                                    e.target.onerror = null;
                                                                    e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f97316' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='16 18 22 12 16 6'></polyline><polyline points='8 6 2 12 8 18'></polyline></svg>"; 
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-orange/10 text-orange text-xs font-bold rounded">
                                                                {s.name[0]}
                                                            </span>
                                                        )}
                                                        <span className="text-sm font-semibold text-zinc-200 flex-1">{s.name}</span>
                                                        <span className="text-[10px] text-zinc-500 hidden sm:block">{s.category}</span>
                                                        {!s.is_visible && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-solid text-zinc-500 border-zinc-700 bg-zinc-900/50">Hidden</span>
                                                        )}
                                                        <button
                                                            onClick={() => toggleSkillStatus(s)}
                                                            title="Toggle mastered/learning"
                                                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border border-solid cursor-pointer transition-all ${
                                                                s.status === 'mastered'
                                                                    ? 'text-emerald-400 border-emerald-600/30 bg-emerald-900/20 hover:bg-emerald-900/40'
                                                                    : 'text-orange border-orange/30 bg-orange/10 hover:bg-orange/20'
                                                            }`}
                                                        >
                                                            {s.status === 'mastered' ? '✓ Mastered' : '↻ Learning'}
                                                        </button>
                                                        <button
                                                            onClick={() => toggleSkillVisibility(s)}
                                                            title={s.is_visible ? 'Hide from site' : 'Show on site'}
                                                            className={`p-1.5 border border-solid rounded-lg transition-colors cursor-pointer ${
                                                                s.is_visible
                                                                    ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-600/40'
                                                                    : 'bg-zinc-900 border-zinc-700 text-zinc-600 hover:text-zinc-300'
                                                            }`}
                                                        >
                                                            {s.is_visible ? <Eye size={12} /> : <EyeOff size={12} />}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingItem({ type: 'skill', data: s });
                                                                setSkillForm({
                                                                    name: s.name,
                                                                    category: s.category || '',
                                                                    icon_key: s.icon_key || '',
                                                                    status: s.status || 'mastered',
                                                                    display_order: s.display_order || 0,
                                                                    is_visible: s.is_visible !== false,
                                                                });
                                                            }}
                                                            className="p-1.5 bg-zinc-900 border border-solid border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteSkill(s.id)}
                                                            className="p-1.5 bg-zinc-900 border border-solid border-zinc-800 text-zinc-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* ── TAB CONTENT: PASSWORD CHANGE ──────────────────────â”€ */}
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
