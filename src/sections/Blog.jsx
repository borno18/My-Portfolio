import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, BookOpen, ArrowRight } from 'lucide-react';
import { useSharedReveal, useMotionTransition, revealVariants } from '../lib/motion';
import './Blog.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Blog = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const transition = useMotionTransition('standard');
    const [headerRef, headerVisible] = useSharedReveal(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/blog`);
                if (!res.ok) throw new Error('Failed to fetch posts');
                const data = await res.json();
                const published = Array.isArray(data) ? data.filter(p => !p.status || p.status === 'published') : [];
                setPosts(published.slice(0, 3));
            } catch (err) {
                console.error('Error fetching landing page blogs:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    return (
        <section id="blog" className="blog bg-[#1A1A1A]">
            <div className="container max-w-6xl mx-auto px-4">
                <motion.div
                    ref={headerRef}
                    className="section-header text-center mb-16"
                    initial="hidden"
                    animate={headerVisible ? "visible" : "hidden"}
                    variants={revealVariants}
                    transition={transition}
                >
                    <h2 className="section-title text-3xl sm:text-4xl font-bold font-accent mb-2">Shinobi Scrolls</h2>
                    <p className="text-neutral-500 font-main">Notes, articles, and logs of my coding journey</p>
                    <div className="title-underline mx-auto mt-4 w-12 h-1 bg-orange"></div>
                </motion.div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <div className="w-10 h-10 border-2 border-orange border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500">
                        <BookOpen size={40} className="mx-auto text-zinc-700 mb-3" />
                        <p>No scrolls have been written yet. Believe It!</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
                            {posts.map((post, idx) => {
                                const plainExcerpt = post.excerpt 
                                    ? post.excerpt.replace(/[\*\#\_\`]/g, '') 
                                    : post.content.replace(/[\*\#\_\`]/g, '').slice(0, 100) + '...';
                                    
                                return (
                                    <motion.article
                                        key={post.id}
                                        className="landing-blog-card border border-solid border-zinc-800/80 bg-zinc-900/40 rounded-xl overflow-hidden hover:border-orange/20 transition-all duration-300 flex flex-col justify-between"
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true, margin: "-100px" }}
                                        variants={revealVariants}
                                        transition={{ ...transition, delay: idx * 0.1 }}
                                    >
                                        <div>
                                            {post.cover_image_url && (
                                                <div className="h-48 overflow-hidden">
                                                    <img 
                                                        src={post.cover_image_url} 
                                                        alt={post.title} 
                                                        className="w-full h-full object-cover transition-transform duration-500"
                                                    />
                                                </div>
                                            )}
                                            <div className="p-6">
                                                <div className="flex items-center gap-2 text-zinc-500 text-xs mb-3">
                                                    <Calendar size={12} />
                                                    <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <BookOpen size={12} />
                                                    <span>{post.read_time || 1} min read</span>
                                                </div>
                                                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 hover:text-orange transition-colors blog-post-title">
                                                    <Link to={`/blog/${post.slug}`} className="blog-post-title">{post.title}</Link>
                                                </h3>
                                                <p className="text-zinc-400 text-sm line-clamp-3 mb-4">
                                                    {plainExcerpt}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="p-6 pt-0">
                                            <Link 
                                                to={`/blog/${post.slug}`} 
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-orange uppercase tracking-wider hover:opacity-85 transition-opacity"
                                            >
                                                Unroll Scroll <ArrowRight size={12} />
                                            </Link>
                                        </div>
                                    </motion.article>
                                );
                            })}
                        </div>
                        
                        <div className="text-center">
                            <Link 
                                to="/blog" 
                                className="inline-flex items-center gap-2 px-6 py-3 border border-orange text-orange font-bold uppercase tracking-wider text-xs rounded-full hover:bg-orange hover:text-black transition-all duration-300"
                            >
                                Unroll All Scrolls <ArrowRight size={14} />
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

export default Blog;
