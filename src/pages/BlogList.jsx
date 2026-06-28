import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, BookOpen } from 'lucide-react';
import { useMotionTransition, revealVariants } from '../lib/motion';
import './BlogList.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const BlogList = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const transition = useMotionTransition('standard');

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/blog`);
                if (!res.ok) throw new Error('Failed to fetch posts');
                const data = await res.json();
                setPosts(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    return (
        <div className="blog-list-page bg-[#0A0A0A] min-height-screen">
            <div className="container max-w-4xl mx-auto px-4 py-20">
                <Link to="/" className="back-link text-xs uppercase tracking-widest text-zinc-500 hover:text-orange transition-colors mb-8 inline-flex items-center gap-2">
                    ← Back to Scroll
                </Link>

                <motion.div 
                    className="blog-header mb-16 text-center"
                    initial="hidden"
                    animate="visible"
                    variants={revealVariants}
                    transition={transition}
                >
                    <h1 className="text-4xl sm:text-5xl font-bold font-accent text-white mb-4">
                        Shinobi Scrolls
                    </h1>
                    <div className="title-underline mx-auto w-16 h-1 bg-orange"></div>
                    <p className="text-zinc-400 mt-4 max-w-md mx-auto">
                        Notes, articles, and documentation of my coding journey and tech experiments.
                    </p>
                </motion.div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-10 h-10 border-2 border-orange border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs uppercase tracking-widest text-zinc-500">Unrolling scrolls...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-zinc-500">
                        <p>Failed to load scrolls: {error}</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20 text-zinc-500">
                        <BookOpen size={48} className="mx-auto text-zinc-700 mb-4" />
                        <p>No scrolls have been written yet. Believe It!</p>
                    </div>
                ) : (
                    <div className="grid gap-8">
                        {posts.map((post, idx) => (
                            <motion.article 
                                key={post.id}
                                className="blog-card border border-solid border-zinc-800/80 bg-zinc-900/40 rounded-xl overflow-hidden hover:border-orange/20 transition-all duration-300 group flex flex-col md:flex-row"
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={revealVariants}
                                transition={{ ...transition, delay: idx * 0.05 }}
                            >
                                {post.cover_image_url && (
                                    <div className="md:w-1/3 h-48 md:h-auto overflow-hidden relative">
                                        <img 
                                            src={post.cover_image_url} 
                                            alt={post.title} 
                                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                                        />
                                    </div>
                                )}
                                <div className={`p-6 flex flex-col justify-between ${post.cover_image_url ? 'md:w-2/3' : 'w-full'}`}>
                                    <div>
                                        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                                            <Calendar size={12} />
                                            {post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, {
                                                year: 'numeric', month: 'long', day: 'numeric'
                                            }) : 'Draft'}
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-bold font-accent text-white group-hover:text-orange transition-colors mb-2">
                                            <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                                        </h2>
                                        <p className="text-zinc-400 text-sm line-clamp-3 mb-4">
                                            {post.excerpt}
                                        </p>
                                    </div>
                                    <Link to={`/blog/${post.slug}`} className="inline-flex items-center gap-1 text-xs font-bold text-orange uppercase tracking-wider hover:opacity-80 transition-opacity">
                                        Read Scroll <ChevronRight size={14} />
                                    </Link>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogList;
