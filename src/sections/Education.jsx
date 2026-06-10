import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Calendar } from 'lucide-react';
import './Education.css';

const Education = () => {
    const educationData = [
        {
            institution: 'Shahjalal University of Science and Technology',
            degree: 'B.Sc. in Software Engineering',
            duration: '2024 - Present',
            description: 'Mastering the jutsus of Software Engineering, focusing on algorithms, backend architectures, and developer nindo (ninja ways).',
        },
        {
            institution: 'Jalalabad Cantonment Public School and College',
            degree: 'Higher School Certificate (HSC)',
            duration: '2022 - 2023',
            description: 'Appeared in chunin exam (HSC) with a focus on science, mathematics, and analytical problem-solving.',
        },
    ];

    return (
        <section id="education" className="education bg-[#0A0A0A] relative overflow-hidden">
            
            {/* Subtle decorative background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange/5 rounded-full blur-3xl pointer-events-none" />

            <div className="container max-w-5xl mx-auto px-4 relative z-10">
                <motion.div
                    className="section-header text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="section-title text-3xl sm:text-4xl font-bold font-accent mb-2">Academic Scroll</h2>
                    <div className="title-underline mx-auto mt-4 w-12 h-1 bg-orange"></div>
                </motion.div>

                <div className="timeline relative">
                    {educationData.map((edu, idx) => (
                        <motion.div
                            key={idx}
                            className={`timeline-item ${idx % 2 === 0 ? 'left' : 'right'}`}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: idx * 0.15 }}
                        >
                            {/* Dot element with soft drop-shadow */}
                            <div className="timeline-dot shadow-[0_0_15px_rgba(255,152,0,0.25)] transition-all duration-300 ease-in-out">
                                <GraduationCap size={18} />
                            </div>

                            {/* Main Card with Zinc Styling */}
                            <div className="timeline-content rounded-2xl border border-solid border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-md transition-all duration-300 ease-in-out hover:border-orange/30 hover:bg-zinc-900/70 hover:shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
                                <div className="edu-header flex items-center justify-between gap-4 mb-2">
                                    <h3 className="text-lg font-bold text-orange font-accent tracking-wide">{edu.degree}</h3>
                                    <span className="edu-date flex items-center gap-1 text-xs text-neutral-500 font-main">
                                        <Calendar size={13} /> 
                                        {edu.duration}
                                    </span>
                                </div>
                                <h4 className="edu-inst text-sm font-semibold text-zinc-300 mb-4 font-main">{edu.institution}</h4>
                                <p className="text-xs sm:text-sm text-neutral-400 font-main leading-relaxed">{edu.description}</p>
                            </div>
                        </motion.div>
                    ))}
                    <div className="timeline-line"></div>
                </div>
            </div>
        </section>
    );
};

export default Education;
