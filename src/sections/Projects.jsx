import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LatestProjectCard from '../components/LatestProjectCard';
import projectData from '../data/latest-project.json';
import { useSharedReveal, useMotionTransition, revealVariants } from '../lib/motion';
import './Projects.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Projects = () => {
    const transition = useMotionTransition('standard');
    const [headerRef, headerVisible] = useSharedReveal(true);
    const [projects, setProjects] = useState(projectData);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/projects`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        setProjects(data);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch curated projects:', err);
            }
        };
        fetchProjects();
    }, []);

    return (
        <section id="projects" className="projects bg-[#1A1A1A]">
            <div className="container max-w-6xl mx-auto px-4">
                <motion.div
                    ref={headerRef}
                    className="section-header text-center mb-16"
                    initial="hidden"
                    animate={headerVisible ? "visible" : "hidden"}
                    variants={revealVariants}
                    transition={transition}
                >
                    <h2 className="section-title text-3xl sm:text-4xl font-bold font-accent mb-2">Completed Missions</h2>
                    <p className="text-neutral-500 font-main">Real-time repository updates fetched directly from GitHub</p>
                    <div className="title-underline mx-auto mt-4 w-12 h-1 bg-orange"></div>
                </motion.div>

                {/* GitHub Contributions Heatmap */}
                <div className="max-w-5xl mx-auto mb-16 p-6 rounded-2xl border border-solid border-emerald-500/20 bg-black/95 shadow-[0_0_25px_rgba(57,211,83,0.08)]">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-4 text-center">Ninjutsu Activity Heatmap</h3>
                    <div className="overflow-x-auto flex justify-center py-2">
                        <img 
                            src="https://ghchart.rshah.org/39D353/borno18" 
                            alt="Joydip's GitHub Contributions Heatmap" 
                            className="min-w-[650px] sm:min-w-0 max-h-[110px] p-2 bg-black rounded-lg"
                        />
                    </div>
                    <p className="text-[10px] text-zinc-500 text-center mt-3 font-main">
                        Activity graph generated dynamically from github.com/borno18
                    </p>
                </div>

                {/* Grid layout for all fetched projects */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                    {projects.map((project) => (
                        <LatestProjectCard key={project.title || project.name} project={project} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Projects;
