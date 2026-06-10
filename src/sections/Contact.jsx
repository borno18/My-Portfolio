import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Github, Linkedin, Send } from 'lucide-react';
import emailjs from '@emailjs/browser';
import './Contact.css';
 
const Contact = () => {
    const form = useRef();
    const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'success' | 'error'
 
    const sendEmail = (e) => {
        e.preventDefault();
        
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID';
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';
 
        if (serviceId === 'YOUR_SERVICE_ID' || templateId === 'YOUR_TEMPLATE_ID' || publicKey === 'YOUR_PUBLIC_KEY') {
            console.warn('[ContactForm] EmailJS credentials are still using default placeholders. Form submissions will fail.');
        }
 
        setStatus('sending');
 
        emailjs.sendForm(
            serviceId,
            templateId,
            form.current,
            publicKey
        )
        .then(() => {
            setStatus('success');
            e.target.reset();
            setTimeout(() => setStatus('idle'), 5000);
        })
        .catch((err) => {
            console.error('[ContactForm] EmailJS Error:', err);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 5000);
        });
    };
 
    return (
        <section id="contact" className="contact">
            <div className="container">
 
                <motion.div
                    className="section-header"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="section-title">Messenger Hawk</h2>
                    <div className="title-underline"></div>
                </motion.div>
 
                <div className="contact-grid">
 
                    <motion.div
                        className="contact-info"
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h3>Ready for the next mission?</h3>
                        <p>Send me a message and let's build something epic together.</p>
 
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
                                    className="transition-all duration-300 ease-in-out hover:text-orange hover:scale-105 inline-block"
                                    aria-label="GitHub Profile"
                                >
                                    <Github size={28} />
                                </a>
 
                                <a 
                                    href="https://www.linkedin.com/in/joydip-majumdar/" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="transition-all duration-300 ease-in-out hover:text-orange hover:scale-105 inline-block"
                                    aria-label="LinkedIn Profile"
                                >
                                    <Linkedin size={28} />
                                </a>
                            </div>
                        </div>
                    </motion.div>
 
                    {/* FORM PART */}
                    <motion.form
                        ref={form}
                        onSubmit={sendEmail}
                        className="contact-form"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
 
                         <div className="form-group">
                            <input
                                name="user_name"
                                type="text"
                                placeholder="Your Name"
                                required
                                disabled={status === 'sending'}
                                className="transition-all duration-300 ease-in-out focus:border-orange focus:ring-1 focus:ring-orange/20 disabled:opacity-50"
                            />
                        </div>
 
                        <div className="form-group">
                            <input
                                name="user_email"
                                type="email"
                                placeholder="Email Address"
                                required
                                disabled={status === 'sending'}
                                className="transition-all duration-300 ease-in-out focus:border-orange focus:ring-1 focus:ring-orange/20 disabled:opacity-50"
                            />
                        </div>
 
                        <div className="form-group">
                            <textarea
                                name="message"
                                placeholder="Your Message"
                                rows="5"
                                required
                                disabled={status === 'sending'}
                                className="transition-all duration-300 ease-in-out focus:border-orange focus:ring-1 focus:ring-orange/20 disabled:opacity-50"
                            ></textarea>
                        </div>
 
                        <button 
                            type="submit" 
                            disabled={status === 'sending'}
                            className="btn btn-primary form-submit transition-all duration-300 ease-in-out hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
                        >
                            {status === 'sending' ? (
                                <>Sending Scroll... <Send className="animate-pulse" size={18} /></>
                            ) : (
                                <>Send Scroll ✉ <Send size={18} /></>
                            )}
                        </button>

                        <AnimatePresence>
                            {status === 'success' && (
                                <motion.div 
                                    className="mt-4 p-3.5 rounded-xl border border-solid border-emerald-500/30 bg-emerald-950/20 text-emerald-400 text-xs sm:text-sm text-center font-main font-semibold"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                >
                                    Scroll sent successfully! 🦅 The Messenger Hawk is on its way.
                                </motion.div>
                            )}
                            {status === 'error' && (
                                <motion.div 
                                    className="mt-4 p-3.5 rounded-xl border border-solid border-red-500/30 bg-red-950/20 text-red-400 text-xs sm:text-sm text-center font-main font-semibold"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                >
                                    Failed to send scroll. Please try again or email directly.
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