import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'About', href: '#about' },
        { name: 'Projects', href: '#projects' },
        { name: 'Skills', href: '#skills' },
        { name: 'Contact', href: '#contact' },
    ];

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''} transition-all duration-300 ease-in-out`}>
            <div className="nav-container">
                <motion.div
                    className="nav-logo transition-all duration-300 ease-in-out hover:opacity-85"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="logo-symbol transition-all duration-300 ease-in-out">渦</span>
                    <span className="logo-text">Uzumaki</span>
                </motion.div>

                {/* Desktop Nav */}
                <ul className="nav-links desktop">
                    {navLinks.map((link, index) => (
                        <motion.li
                            key={link.name}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 + 0.5 }}
                        >
                            <a 
                                href={link.href}
                                className="transition-all duration-300 ease-in-out hover:text-orange"
                            >
                                {link.name}
                            </a>
                        </motion.li>
                    ))}
                </ul>

                {/* Mobile menu button */}
                <div 
                    className="mobile-toggle transition-all duration-300 ease-in-out hover:text-orange" 
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={28} /> : <Menu size={28} />}
                </div>
            </div>

            {/* Mobile Nav */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="mobile-menu"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <ul>
                            {navLinks.map((link) => (
                                <li key={link.name} onClick={() => setIsOpen(false)}>
                                    <a 
                                        href={link.href}
                                        className="transition-all duration-300 ease-in-out hover:text-orange"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
