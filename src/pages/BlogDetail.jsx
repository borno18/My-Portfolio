import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowLeft, BookOpen } from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import { useMotionTransition, revealVariants } from '../lib/motion';
import './BlogDetail.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const FacebookIcon = () => (
    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
    </svg>
);

const WhatsAppIcon = () => (
    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.16 1.448 4.717 1.449 5.572 0 10.104-4.527 10.107-10.104.001-2.701-1.05-5.242-2.958-7.153C16.606 1.436 14.07 0.387 11.372 0.387c-5.576 0-10.106 4.529-10.11 10.106-.002 1.884.502 3.724 1.46 5.35L1.7 21.23l5.088-1.334z"/>
    </svg>
);

const TelegramIcon = () => (
    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.16-.22 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.577.194l-8.53 7.702-.33 4.97c.488 0 .703-.223.976-.485l2.344-2.28 4.873 3.6c.898.496 1.543.24 1.768-.83l3.197-15.06c.328-1.31-.497-1.902-1.357-1.52z"/>
    </svg>
);

const MessengerIcon = () => (
    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M12 0C5.373 0 0 4.974 0 11.11c0 3.498 1.743 6.607 4.462 8.677V24l4.053-2.226c1.08.3 2.22.46 3.485.46 6.627 0 12-4.975 12-11.11S18.627 0 12 0zm1.26 14.576l-3.07-3.27-5.99 3.27 6.58-6.99 3.07 3.27 5.99-3.27-6.58 6.99z"/>
    </svg>
);

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

    const shareUrl = window.location.href;
    const shareTitle = post ? post.title : '';

    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
        messenger: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(shareUrl)}`
    };

    return (
        <div className="blog-detail-page bg-[#0A0A0A] min-height-screen">
            <div className="container max-w-4xl mx-auto px-4 py-20">
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
                        className="max-w-3xl mx-auto"
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
                            <h1 className="text-3xl sm:text-5xl font-bold font-accent text-white mb-4 leading-tight blog-post-title">
                                {post.title}
                            </h1>
                            <div className="flex items-center gap-3.5 text-xs text-zinc-500">
                                <span className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    {post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, {
                                        year: 'numeric', month: 'long', day: 'numeric'
                                    }) : 'Draft'}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <BookOpen size={12} />
                                    {post.read_time || 1} min read
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <User size={12} /> Joydip Majumdar
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 mt-6 border-t border-b border-solid border-zinc-900 py-4">
                                <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mr-1.5">Share Scroll:</span>
                                <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900/80 border border-solid border-zinc-800 text-zinc-400 hover:text-white hover:bg-[#1877F2]/20 hover:border-[#1877F2]/40 transition-all duration-300" title="Share on Facebook">
                                    <FacebookIcon />
                                </a>
                                <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900/80 border border-solid border-zinc-800 text-zinc-400 hover:text-white hover:bg-[#25D366]/20 hover:border-[#25D366]/40 transition-all duration-300" title="Share on WhatsApp">
                                    <WhatsAppIcon />
                                </a>
                                <a href={shareLinks.telegram} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900/80 border border-solid border-zinc-800 text-zinc-400 hover:text-white hover:bg-[#0088cc]/20 hover:border-[#0088cc]/40 transition-all duration-300" title="Share on Telegram">
                                    <TelegramIcon />
                                </a>
                                <a href={shareLinks.messenger} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900/80 border border-solid border-zinc-800 text-zinc-400 hover:text-white hover:bg-[#00B2FF]/20 hover:border-[#00B2FF]/40 transition-all duration-300" title="Share on Messenger">
                                    <MessengerIcon />
                                </a>
                            </div>
                        </header>

                        <div className="markdown-body font-main text-zinc-300 leading-relaxed text-base sm:text-lg max-w-2xl mx-auto">
                            <Markdown>{post.content}</Markdown>
                        </div>
                    </motion.article>
                )}
            </div>
        </div>
    );
};

export default BlogDetail;
