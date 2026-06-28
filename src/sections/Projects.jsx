import React from 'react';
import { motion } from 'framer-motion';
import LatestProjectCard from '../components/LatestProjectCard';
import projectData from '../data/latest-project.json';
import { useSharedReveal, useMotionTransition, revealVariants } from '../lib/motion';
import './Projects.css';

const Projects = () => {
    const transition = useMotionTransition('standard');
    const [headerRef, headerVisible] = useSharedReveal(true);

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

                {/* Grid layout for all fetched repositories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                    {projectData.map((project) => (
                        <LatestProjectCard key={project.name} project={project} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Projects;
