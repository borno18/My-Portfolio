import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Calendar } from 'lucide-react';
import './Education.css';

const Education = () => {
    const educationData = [
        {
            institution: 'Shahjalal University of Science and Technology',
            degree: 'Bsc. in Software Engineering',
            duration: '2024 - Present',
            description: 'Mastering the jutsus of Software Engineering.',
        },
        {
            institution: 'Jalabad Cantonment Public School and College',
            degree: 'HSC',
            duration: '2022 - 2023',
            description: 'Appeared in chunin exam AKA Higher School Certificate Examination',
        },
    ];

    return (
        <section id="education" className="education">
            <div className="container">
                <motion.div
                    className="section-header"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="section-title">Academic Scroll</h2>
                    <div className="title-underline"></div>
                </motion.div>

                <div className="timeline">
                    {educationData.map((edu, idx) => (
                        <motion.div
                            key={idx}
                            className={`timeline-item ${idx % 2 === 0 ? 'left' : 'right'}`}
                            initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: idx * 0.2 }}
                        >
                            <div className="timeline-dot">
                                <GraduationCap size={18} />
                            </div>
                            <div className="timeline-content">
                                <div className="edu-header">
                                    <h3>{edu.degree}</h3>
                                    <span className="edu-date"><Calendar size={14} /> {edu.duration}</span>
                                </div>
                                <h4 className="edu-inst">{edu.institution}</h4>
                                <p>{edu.description}</p>
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
