import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight } from 'lucide-react';
import './Blog.css';

const Blog = () => {
    const posts = [
        {
            title: 'Mastering React Chakra Management',
            excerpt: 'Learn how to optimize your components for maximum spiritual energy and performance.',
            date: 'May 12, 2024',
            readTime: '5 min read'
        },
        {
            title: 'The Art of Stealth Coding',
            excerpt: 'Writing clean, invisible code that scales without being noticed by bugs.',
            date: 'Apr 28, 2024',
            readTime: '8 min read'
        },
        {
            title: 'CSS Genjutsu: Visual Illusions',
            excerpt: 'Using advanced CSS properties to create stunning visual effects that captivate users.',
            date: 'Mar 15, 2024',
            readTime: '10 min read'
        }
    ];

    return (
        <section id="blog" className="blog">
            <div className="container">
                <motion.div
                    className="section-header"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="section-title">Knowledge Scrolls</h2>
                    <div className="title-underline"></div>
                </motion.div>

                <div className="blog-grid">
                    {posts.map((post, idx) => (
                        <motion.article
                            key={idx}
                            className="blog-card"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <div className="blog-date">
                                <span>{post.date}</span>
                                <span>{post.readTime}</span>
                            </div>
                            <h3>{post.title}</h3>
                            <p>{post.excerpt}</p>
                            <a href="#" className="read-more">
                                Open Scroll <ArrowRight size={16} />
                            </a>
                            <BookOpen className="blog-icon" size={24} />
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Blog;
