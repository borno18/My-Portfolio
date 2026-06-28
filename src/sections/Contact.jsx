import React, { useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Mail, Github, Linkedin, Send, CheckCircle, XCircle, Loader } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { useSharedReveal, useMotionTransition, revealVariants } from '../lib/motion';
import './Contact.css';

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || 'YOUR_SERVICE_ID';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || 'YOUR_PUBLIC_KEY';

const OWNER_EMAIL = 'joydipmajumdarborno@gmail.com';
const isEmailJSConfigured = () =>
    SERVICE_ID !== 'YOUR_SERVICE_ID' && TEMPLATE_ID !== 'YOUR_TEMPLATE_ID' && PUBLIC_KEY !== 'YOUR_PUBLIC_KEY';

const Contact = () => {
    const form = useRef();
    const [status, setStatus] = useState('idle');
    const transition = useMotionTransition('standard');
    const slowTransition = useMotionTransition('slow');
    const shouldReduce = useReducedMotion();

    const [headerRef, headerVisible] = useSharedReveal(true);
    const [infoRef, infoVisible] = useSharedReveal(true);
    const [formRef, formVisible] = useSharedReveal(true);

    const sendEmail = (e) => {
        e.preventDefault();
        const name    = form.current.user_name?.value  || '';
        const email   = form.current.user_email?.value || '';
        const message = form.current.message?.value    || '';

        if (!isEmailJSConfigured()) {
            const subject  = encodeURIComponent(`Portfolio Contact from ${name}`);
            const body     = encodeURIComponent(`${message}\n\n---\nFrom: ${name}\nReply to: ${email}`);
            window.open(`mailto:${OWNER_EMAIL}?subject=${subject}&body=${body}`, '_self');
            setStatus('success');
            e.target.reset();
            setTimeout(() => setStatus('idle'), 5000);
            return;
        }

        setStatus('sending');
        emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form.current, PUBLIC_KEY)
            .then(() => {
                setStatus('success');
                e.target.reset();
                setTimeout(() => setStatus('idle'), 5000);
            })
            .catch(() => {
                setStatus('error');
                setTimeout(() => setStatus('idle'), 5000);
            });
    };

    const isSending = status === 'sending';

    return (
        <section id="contact" className="contact">
            <div className="container">

                <motion.div
                    ref={headerRef}
                    className="section-header"
                    initial="hidden"
                    animate={headerVisible ? "visible" : "hidden"}
                    variants={revealVariants}
                    transition={transition}
                >
                    <h2 className="section-title">Messenger Hawk</h2>
                    <div className="title-underline"></div>
                </motion.div>

                <div className="contact-grid">

                    <motion.div
                        ref={infoRef}
                        className="contact-info"
                        initial={{ opacity: 0, x: -20 }}
                        animate={infoVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                        transition={slowTransition}
                    >
                        <h3>Ready for the next mission?</h3>
                        <p>Send me a message and let&apos;s build something epic together.</p>

                        <div className="contact-links">
                            <a href="mailto:joydipmajumdarborno@gmail.com" className="contact-item transition-all duration-300 ease-in-out hover:text-orange">
                                <Mail size={24} />
                                <span>joydipmajumdarborno@gmail.com</span>
                            </a>

                            <div className="social-links">
                                <a
                                    href="https://github.com/borno18"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="GitHub Profile"
                                    className="transition-all duration-300 ease-in-out hover:text-orange hover:scale-105 inline-block"
                                >
                                    <Github size={28} />
                                </a>

                                <a
                                    href="https://www.linkedin.com/in/joydip-majumdar/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="LinkedIn Profile"
                                    className="transition-all duration-300 ease-in-out hover:text-orange hover:scale-105 inline-block"
                                >
                                    <Linkedin size={28} />
                                </a>
                            </div>
                        </div>
                    </motion.div>

                    <motion.form
                        ref={formRef}
                        onSubmit={sendEmail}
                        className="contact-form"
                        initial={{ opacity: 0, x: 20 }}
                        animate={formVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                        transition={slowTransition}
                    >
                        <div className="form-group">
                            <input
                                name="user_name"
                                type="text"
                                placeholder="Your Name"
                                required
                                disabled={isSending}
                                className="transition-all duration-300 ease-in-out focus:border-orange focus:ring-1 focus:ring-orange/20"
                            />
                        </div>

                        <div className="form-group">
                            <input
                                name="user_email"
                                type="email"
                                placeholder="Email Address"
                                required
                                disabled={isSending}
                                className="transition-all duration-300 ease-in-out focus:border-orange focus:ring-1 focus:ring-orange/20"
                            />
                        </div>

                        <div className="form-group">
                            <textarea
                                name="message"
                                placeholder="Your Message"
                                rows="5"
                                required
                                disabled={isSending}
                                className="transition-all duration-300 ease-in-out focus:border-orange focus:ring-1 focus:ring-orange/20"
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={isSending}
                            className="btn btn-primary form-submit transition-all duration-300 ease-in-out hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isSending ? (
                                <>
                                    <Loader size={18} className="animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    Send Scroll ✉ <Send size={18} />
                                </>
                            )}
                        </button>

                        <AnimatePresence>
                            {status === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={transition}
                                    className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-sm font-medium"
                                >
                                    <CheckCircle size={16} />
                                    Message sent successfully! I&apos;ll get back to you soon.
                                </motion.div>
                            )}
                            {status === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={transition}
                                    className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-950/60 border border-red-500/30 text-red-400 text-sm font-medium"
                                >
                                    <XCircle size={16} />
                                    Failed to send. Please try again or email me directly.
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </motion.form>
                </div>
            </div>
        </section>
    );
};

export default Contact;