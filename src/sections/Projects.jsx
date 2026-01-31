import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, ExternalLink, Code } from 'lucide-react';
import './Projects.css';

const Projects = () => {
    const [filter, setFilter] = useState('All');

    const projects = [
        {
            title: 'Rasen-Bank',
            description: 'A high-performance banking dashboard with real-time chakra monitoring.',
            tech: ['React', 'Next.js', 'PostgreSQL'],
            category: 'Web App',
            github: '#',
            demo: '#',
            color: 'var(--color-orange)'
        },
        {
            title: 'Hidden Leaf Maps',
            description: 'Interactive map system for navigating dangerous shinobi territories.',
            tech: ['Leaflet', 'React', 'Firebase'],
            category: 'Service',
            github: '#',
            demo: '#',
            color: 'var(--color-chakra)'
        },
        {
            title: 'Jutsu Compiler',
            description: 'A specialized compiler for converting hand signs into executable bytes.',
            tech: ['Rust', 'Wasm', 'Node.js'],
            category: 'Tools',
            github: '#',
            demo: '#',
            color: '#4CAF50'
        },
        {
            title: 'Shadow Clone CDN',
            description: 'Massively distributed content delivery network with zero latency.',
            tech: ['Go', 'Redis', 'Docker'],
            category: 'Web App',
            github: '#',
            demo: '#',
            color: '#E91E63'
        }
    ];

    const categories = ['All', 'Web App', 'Service', 'Tools'];

    const filteredProjects = filter === 'All'
        ? projects
        : projects.filter(p => p.category === filter);

    return (
        <section id="projects" className="projects">
            <div className="container">
                <motion.div
                    className="section-header"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="section-title">Completed Missions</h2>
                    <div className="title-underline"></div>
                </motion.div>

                <div className="filter-bar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`filter-btn ${filter === cat ? 'active' : ''}`}
                            onClick={() => setFilter(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <motion.div layout className="projects-grid">
                    <AnimatePresence mode='popLayout'>
                        {filteredProjects.map((project, idx) => (
                            <motion.div
                                key={project.title}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                className="project-card"
                                style={{ '--accent-color': project.color }}
                            >
                                <div className="project-banner">
                                    <Code size={40} className="banner-icon" />
                                </div>
                                <div className="project-info">
                                    <span className="project-cat">{project.category}</span>
                                    <h3>{project.title}</h3>
                                    <p>{project.description}</p>

                                    <div className="project-tech">
                                        {project.tech.map(t => <span key={t}>{t}</span>)}
                                    </div>

                                    <div className="project-links">
                                        <a href={project.github} className="icon-link"><Github size={20} /></a>
                                        <a href={project.demo} className="icon-link"><ExternalLink size={20} /></a>
                                    </div>
                                </div>
                                <div className="card-chakra-glow"></div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>
        </section>
    );
};

export default Projects;
