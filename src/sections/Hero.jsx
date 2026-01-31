import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Zap } from 'lucide-react';
import './Hero.css';

const Hero = () => {
    return (
        <section className="hero">
            <div className="chakra-bg">
                <div className="chakra-particle p1"></div>
                <div className="chakra-particle p2"></div>
                <div className="chakra-particle p3"></div>
            </div>

            <div className="container hero-content">
                <motion.div
                    className="hero-text"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <motion.h4
                        className="hero-subtitle"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        Believe It!
                    </motion.h4>
                    <motion.h1
                        className="hero-title"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7, duration: 0.6 }}
                    >
                        Mastering the Art of <span className="highlight">Modern Web</span>
                    </motion.h1>
                    <motion.p
                        className="hero-description"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    >
                        I decompose complex architectures into high-performance experiences.
                        Blending ninja-fast development with elegant, intuitive design.
                    </motion.p>

                    <motion.div
                        className="hero-cta"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                    >
                        <a href="#projects" className="btn btn-primary">
                            View Missions <ChevronRight size={18} />
                            <span className="btn-glow"></span>
                        </a>
                        <a href="#contact" className="btn btn-secondary">
                            Summon Me
                        </a>
                    </motion.div>
                </motion.div>

                <motion.div
                    className="hero-image-wrapper"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                >
                    <div className="ninja-circle">
                        <Zap className="chakra-icon" size={64} />
                        <div className="orbital o1"></div>
                        <div className="orbital o2"></div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
