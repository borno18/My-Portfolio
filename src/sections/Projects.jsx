import React from 'react';
import { motion } from 'framer-motion';
import LatestProjectCard from '../components/LatestProjectCard';
import projectData from '../data/latest-project.json';
import './Projects.css';

const Projects = () => {
    return (
        <section id="projects" className="projects bg-[#1A1A1A]">
            <div className="container max-w-6xl mx-auto px-4">
                <motion.div
                    className="section-header text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
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
