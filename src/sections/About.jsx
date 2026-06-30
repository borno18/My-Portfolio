import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import ShinobiStats from '../components/ShinobiStats';
import { useSharedReveal, useMotionTransition, revealVariants } from '../lib/motion';
import './About.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Brand colors for common icon_keys
const ICON_BRAND_COLORS = {
    python: '3776AB',
    pytorch: 'EE4C2C',
    tensorflow: 'FF6F00',
    scikitlearn: 'F7931E',
    numpy: '4DABCF',
    pandas: '150458',
    c: 'A8B9CC',
    cplusplus: '00599C',
    java: 'ED8B00',
    html5: 'E34F26',
    css3: '1572B6',
    javascript: 'F7DF1E',
    react: '61DAFB',
    fastapi: '009688',
    matplotlib: '11557C',
    jupyter: 'F37626',
    kaggle: '20BEFF',
    git: 'F05032',
    github: 'aaaaaa',
    visualstudiocode: '007ACC',
    vercel: 'aaaaaa',
    linux: 'FCC624',
    docker: '2496ED',
    postgresql: '336791',
    mongodb: '47A248',
    nodejs: '339933',
    typescript: '3178C6',
    nextdotjs: 'aaaaaa',
    tailwindcss: '06B6D4',
};

const getIconColor = (icon_key) => ICON_BRAND_COLORS[icon_key] || '888888';

const SkillCard = ({ skill }) => {
    const isMastered = skill.status === 'mastered';
    const iconColor = getIconColor(skill.icon_key);
    const iconUrl = skill.icon_key
        ? `https://cdn.simpleicons.org/${skill.icon_key}/${iconColor}`
        : null;

    return (
        <motion.div
            className="skill-chip"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            whileHover={{ scale: 1.03 }}
        >
            <div className="skill-chip-inner">
                {iconUrl ? (
                    <img
                        src={iconUrl}
                        alt={skill.name}
                        className="skill-icon"
                        onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f97316' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='16 18 22 12 16 6'></polyline><polyline points='8 6 2 12 8 18'></polyline></svg>"; 
                        }}
                    />
                ) : (
                    <span className="skill-icon-fallback">{skill.name[0]}</span>
                )}
                <span className="skill-name">{skill.name}</span>
                <span
                    className={`skill-status-dot ${isMastered ? 'mastered' : 'learning'}`}
                    title={isMastered ? 'Mastered' : 'Currently Learning'}
                >
                    {isMastered ? (
                        <CheckCircle2 size={11} />
                    ) : (
                        <span className="learning-pulse" />
                    )}
                </span>
            </div>
        </motion.div>
    );
};

const About = () => {
    const transition = useMotionTransition('standard');
    const slowTransition = useMotionTransition('slow');

    const [headerRef, headerVisible] = useSharedReveal(true);
    const [bioRef, bioVisible] = useSharedReveal(true);

    const [skills, setSkills] = useState([]);
    const [skillsLoading, setSkillsLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_BASE}/api/skills`)
            .then(res => res.ok ? res.json() : [])
            .then(data => setSkills(data))
            .catch(() => setSkills([]))
            .finally(() => setSkillsLoading(false));
    }, []);

    // Group skills by category, preserving display_order
    const grouped = skills.reduce((acc, skill) => {
        const cat = skill.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(skill);
        return acc;
    }, {});

    const categoryOrder = ['Machine Learning', 'Programming', 'Web Development', 'Data Science', 'Tools & Platforms'];
    const sortedCategories = [
        ...categoryOrder.filter(c => grouped[c]),
        ...Object.keys(grouped).filter(c => !categoryOrder.includes(c)),
    ];

    return (
        <section id="about" className="about">
            <div className="container">
                {/* ── Header ─────────────────────────────────────────── */}
                <motion.div
                    ref={headerRef}
                    className="section-header"
                    initial="hidden"
                    animate={headerVisible ? "visible" : "hidden"}
                    variants={revealVariants}
                    transition={transition}
                >
                    <h2 className="section-title">Nindo: My Developer Way</h2>
                    <div className="title-underline"></div>
                </motion.div>

                {/* ── Minimalist Bio ──────────────────────────────────── */}
                <motion.div
                    ref={bioRef}
                    className="about-bio"
                    initial={{ opacity: 0, y: 20 }}
                    animate={bioVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={slowTransition}
                >
                    <p className="about-text">
                        Hello, since you have come here, it's either to know me or to know my work.
                        My name is <strong className="about-name">Joydip Majumdar</strong>.
                        I'm an aspiring software developer and problem solver.
                        I love to cook, read, watch movies, and play video games.
                        I'm currently learning how to build software and systems.
                        This website has my blog posts, photos, projects, and contact information.
                        Hopefully, I don't disappoint you.
                    </p>
                    <div className="bio-divider">
                        <span className="bio-dot" />
                        <span className="bio-dot" />
                        <span className="bio-dot" />
                    </div>
                </motion.div>

                {/* ── Skills Section ─────────────────────────────────── */}
                <div id="skills" className="skills-section">
                    <ShinobiStats />

                    <motion.div
                        className="skills-header"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={revealVariants}
                        transition={transition}
                    >
                        <h3 className="skills-title">Arsenal</h3>
                        <div className="skills-legend">
                            <span className="legend-item">
                                <CheckCircle2 size={11} className="legend-icon mastered-icon" />
                                <span>Mastered</span>
                            </span>
                            <span className="legend-item">
                                <span className="learning-pulse legend-pulse" />
                                <span>Learning</span>
                            </span>
                        </div>
                    </motion.div>

                    {skillsLoading ? (
                        <div className="skills-loading">
                            <Loader2 className="animate-spin text-orange" size={24} />
                        </div>
                    ) : (
                        <div className="skills-categories">
                            {sortedCategories.map((category) => (
                                <div key={category} className="skill-category-block">
                                    <motion.h4
                                        className="skill-category-name"
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {category}
                                    </motion.h4>
                                    <div className="skill-chips-row">
                                        {grouped[category].map(skill => (
                                            <SkillCard key={skill.id} skill={skill} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default About;
