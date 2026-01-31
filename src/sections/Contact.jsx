import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Github, Linkedin, Send } from 'lucide-react';
import './Contact.css';

const Contact = () => {
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
                            <a href="mailto:ninja@example.com" className="contact-item">
                                <Mail size={24} />
                                <span>ninja@example.com</span>
                            </a>
                            <div className="social-links">
                                <a href="#"><Github size={28} /></a>
                                <a href="#"><Linkedin size={28} /></a>
                            </div>
                        </div>
                    </motion.div>

                    <motion.form
                        className="contact-form"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="form-group">
                            <input type="text" placeholder="Your Name" required />
                        </div>
                        <div className="form-group">
                            <input type="email" placeholder="Email Address" required />
                        </div>
                        <div className="form-group">
                            <textarea placeholder="Your Message" rows="5" required></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary form-submit">
                            Send Scroll <Send size={18} />
                        </button>
                    </motion.form>
                </div>
            </div>
        </section>
    );
};

export default Contact;
