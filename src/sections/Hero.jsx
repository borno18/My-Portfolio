import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Zap } from 'lucide-react';
import ChakraCanvas from '../components/ChakraCanvas';
import NindoQuote from '../components/NindoQuote';
import { useMotionTransition } from '../lib/motion';
import './Hero.css';

const Hero = () => {
    const transition = useMotionTransition('standard');
    const slowTransition = useMotionTransition('slow');

    return (
        <section className="hero">
            <ChakraCanvas />
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
                    transition={slowTransition}
                >
                    <motion.h4
                        className="hero-subtitle"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...transition, delay: 0.3 }}
                    >
                        Believe It!
                    </motion.h4>
                    <motion.h1
                        className="hero-title"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...slowTransition, delay: 0.5 }}
                    >
                        Mastering the Art of <span className="highlight">Software Engineering</span>
                    </motion.h1>
                    <motion.p
                        className="hero-description"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ ...transition, delay: 0.7 }}
                    >
                        A chunin waiting to become a jonin by completing some S rank missions.
                    </motion.p>

                    <NindoQuote />

                    <motion.div
                        className="hero-cta"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...transition, delay: 0.9 }}
                    >
                        <a href="#projects" className="btn btn-primary transition-all duration-300 ease-in-out">
                            View Missions <ChevronRight size={18} />
                            <span className="btn-glow"></span>
                        </a>
                        <a href="#contact" className="btn btn-secondary transition-all duration-300 ease-in-out">
                            Summon Me
                        </a>
                    </motion.div>
                </motion.div>

                <motion.div
                    className="hero-image-wrapper"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={slowTransition}
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
