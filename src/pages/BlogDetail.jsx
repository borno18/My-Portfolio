import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import { useMotionTransition, revealVariants } from '../lib/motion';
import './BlogDetail.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const BlogDetail = () => {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const transition = useMotionTransition('standard');

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/blog/${slug}`);
                if (!res.ok) throw new Error('Failed to find this scroll');
                const data = await res.json();
                setPost(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [slug]);

    return (
        <div className="blog-detail-page bg-[#0A0A0A] min-height-screen">
            <div className="container max-w-3xl mx-auto px-4 py-20">
                <Link to="/blog" className="back-link text-xs uppercase tracking-widest text-zinc-500 hover:text-orange transition-colors mb-8 inline-flex items-center gap-2">
                    <ArrowLeft size={12} /> Back to Scrolls
                </Link>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-10 h-10 border-2 border-orange border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs uppercase tracking-widest text-zinc-500">Unrolling scroll details...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-zinc-500">
                        <p>Failed to load scroll: {error}</p>
                    </div>
                ) : !post ? (
                    <div className="text-center py-20 text-zinc-500">
                        <p>Scroll not found.</p>
                    </div>
                ) : (
                    <motion.article 
                        initial="hidden"
                        animate="visible"
                        variants={revealVariants}
                        transition={transition}
                    >
                        {post.cover_image_url && (
                            <div className="detail-cover-wrapper w-full h-64 sm:h-96 rounded-2xl overflow-hidden mb-8 border border-solid border-zinc-800">
                                <img 
                                    src={post.cover_image_url} 
                                    alt={post.title} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        <header className="detail-header mb-8">
                            <h1 className="text-3xl sm:text-5xl font-bold font-accent text-white mb-4 leading-tight">
                                {post.title}
                            </h1>
                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                                <span className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    {post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, {
                                        year: 'numeric', month: 'long', day: 'numeric'
                                    }) : 'Draft'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <User size={12} /> Joydip Majumdar
                                </span>
                            </div>
                            <div className="title-underline mt-6 w-16 h-1 bg-orange"></div>
                        </header>

                        <div className="markdown-body font-main text-zinc-300 leading-relaxed text-base sm:text-lg">
                            <Markdown>{post.content}</Markdown>
                        </div>
                    </motion.article>
                )}
            </div>
        </div>
    );
};

export default BlogDetail;
