import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useMotionTransition } from '../lib/motion';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const isHome = location.pathname === '/';
    const transition = useMotionTransition('standard');

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'About', href: isHome ? '#about' : '/#about' },
        { name: 'Education', href: isHome ? '#education' : '/#education' },
        { name: 'Projects', href: isHome ? '#projects' : '/#projects' },
        { name: 'Skills', href: isHome ? '#skills' : '/#skills' },
        { name: 'Gallery', href: '/photos' },
        { name: 'Blog', href: isHome ? '#blog' : '/#blog' },
        { name: 'Contact', href: isHome ? '#contact' : '/#contact' },
    ];

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''} transition-all duration-300 ease-in-out`}>
            <div className="nav-container">
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <motion.div
                        className="nav-logo transition-all duration-300 ease-in-out hover:opacity-85"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={transition}
                    >
                        <span className="logo-symbol transition-all duration-300 ease-in-out">渦</span>
                        <span className="logo-text">Uzumaki</span>
                    </motion.div>
                </Link>

                {/* Desktop Nav */}
                <ul className="nav-links desktop">
                    {navLinks.map((link, index) => {
                        const isExternal = link.href.startsWith('/');
                        return (
                            <motion.li
                                key={link.name}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ ...transition, delay: index * 0.05 + 0.3 }}
                            >
                                {isExternal ? (
                                    <Link 
                                        to={link.href}
                                        className="transition-all duration-300 ease-in-out hover:text-orange"
                                    >
                                        {link.name}
                                    </Link>
                                ) : (
                                    <a 
                                        href={link.href}
                                        className="transition-all duration-300 ease-in-out hover:text-orange"
                                    >
                                        {link.name}
                                    </a>
                                )}
                            </motion.li>
                        );
                    })}
                </ul>

                {/* Mobile menu button */}
                <div 
                    className="mobile-toggle transition-all duration-300 ease-in-out hover:text-orange" 
                    onClick={() => setIsOpen(!isOpen)}
                    role="button"
                    tabIndex={0}
                    aria-label="Toggle navigation menu"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setIsOpen(!isOpen);
                        }
                    }}
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
                        transition={transition}
                    >
                        <ul>
                            {navLinks.map((link) => {
                                const isExternal = link.href.startsWith('/');
                                return (
                                    <li key={link.name} onClick={() => setIsOpen(false)}>
                                        {isExternal ? (
                                            <Link 
                                                to={link.href}
                                                className="transition-all duration-300 ease-in-out hover:text-orange"
                                            >
                                                {link.name}
                                            </Link>
                                        ) : (
                                            <a 
                                                href={link.href}
                                                className="transition-all duration-300 ease-in-out hover:text-orange"
                                            >
                                                {link.name}
                                            </a>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
