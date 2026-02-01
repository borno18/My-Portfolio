import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Github, Linkedin, Send } from 'lucide-react';
import emailjs from '@emailjs/browser';
import './Contact.css';

const Contact = () => {

    const form = useRef();

    const sendEmail = (e) => {
        e.preventDefault();

        emailjs.sendForm(
            'YOUR_SERVICE_ID',
            'YOUR_TEMPLATE_ID',
            form.current,
            'YOUR_PUBLIC_KEY'
        )
        .then(() => {
            alert("Message Sent Successfully!");
            e.target.reset();
        })
        .catch(() => {
            alert("Failed to send message");
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
                            <a href="mailto:joydipmajumdarborno@gmail.com" className="contact-item">
                                <Mail size={24} />
                                <span>joydipmajumdarborno@gmail.com</span>
                            </a>

                            <div className="social-links">
                                <a href="https://github.com/borno18" target="_next">
                                    <Github size={28} />
                                </a>

                                <a href="https://www.linkedin.com/in/joydip-majumdar/" target="_next">
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
                            />
                        </div>

                        <div className="form-group">
                            <input
                                name="user_email"
                                type="email"
                                placeholder="Email Address"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <textarea
                                name="message"
                                placeholder="Your Message"
                                rows="5"
                                required
                            ></textarea>
                        </div>

                        <button type="submit" className="btn btn-primary form-submit">
                            Send Scroll ✉ <Send size={18} />
                        </button>

                    </motion.form>
                </div>
            </div>
        </section>
    );
};

export default Contact;