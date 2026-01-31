import React from 'react';
import { motion } from 'framer-motion';
import { User, Target, ShieldCheck } from 'lucide-react';
import './About.css';
import profileImg from '../assets/IMG_8750.jpg';

const About = () => {
    const skills = [
  {
    name: 'Frontend',
    items: ['HTML', 'CSS', 'JavaScript (Learning)', 'React (Learning)']
  },
  {
    name: 'Programming Languages',
    items: ['C', 'C++', 'Java (Learning)', 'Python (Learning)']
  },
  {
    name: 'Backend',
    items: ['FastAPI (Learning)']
  },
  {
    name: 'Game Development',
    items: ['Unreal Engine 5 (Learning)']
  },
  {
    name: 'Computer Science',
    items: ['Data Structures & Algorithms (C++)']
  },
  {
    name: 'Tools',
    items: ['Git', 'GitHub', 'VS Code', 'Vercel']
  }
];


    return (
        <section id="about" className="about">
            <div className="container">
                <motion.div
                    className="section-header"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="section-title">Nindo: My Developer Way</h2>
                    <div className="title-underline"></div>
                </motion.div>

                <div className="about-grid">
                    <motion.div
                        className="about-image-card"
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="image-placeholder">
  <img src={profileImg} alt="Profile" className="profile-image" />
</div>
                        <div className="image-overlay-border"></div>
                    </motion.div>

                    <motion.div
                        className="about-content"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h3>Aspiring Software Developer & Problem Solver</h3>

                        <p className="about-text">
                            Hello, since you have come here, it's either to know me or to know my work. 
                            My name is Joydip Majumdar. 
                            I'm an aspiring software developer and problem solver. 
                            I love to cook, read, watch movies, and play video games.
                            I'm currently learning how to build software and systems. 
                            This website has my blog posts, photos, projects, and contact information. 
                            Hopefully, I dont disappoint you.
                        </p>


                        <div className="about-stats">
                            <div className="stat-item">
                                <Target size={24} color="var(--color-orange)" />
                                <div>
                                    <h4>Goal</h4>
                                    <p>Become a skilled software engineer & builder</p>
                                </div>
                            </div>
                            <div className="stat-item">
                                <ShieldCheck size={24} color="var(--color-orange)" />
                                <div>
                                    <h4>Focus</h4>
                                    <p>Programming, DSA & Web Development</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="skills-container">
                    {skills.map((skillGroup, idx) => (
                        <motion.div
                            key={skillGroup.name}
                            className="skill-card"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <h4>{skillGroup.name}</h4>
                            <div className="skill-tags">
                                {skillGroup.items.map(skill => (
                                    <span key={skill} className="skill-tag">{skill}</span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default About;
