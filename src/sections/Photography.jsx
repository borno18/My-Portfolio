import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Maximize2 } from 'lucide-react';
import './Photography.css';

const Photography = () => {
    const images = [
        { id: 1, title: 'Hidden Leaf Sunrise', category: 'Nature' },
        { id: 2, title: 'Street Level', category: 'Urban' },
        { id: 3, title: 'Training Grounds', category: 'Action' },
        { id: 4, title: 'Scroll Library', category: 'Abstract' },
        { id: 5, title: 'Neon Night', category: 'Urban' },
        { id: 6, title: 'Forest Path', category: 'Nature' },
    ];

    return (
        <section id="photography" className="photography">
            <div className="container">
                <motion.div
                    className="section-header"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="section-title">Sharingan Views</h2>
                    <div className="title-underline"></div>
                </motion.div>

                <div className="photography-grid">
                    {images.map((img, idx) => (
                        <motion.div
                            key={img.id}
                            className="photo-card"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <div className="photo-placeholder">
                                <Camera size={32} className="photo-icon" />
                                <div className="photo-overlay">
                                    <Maximize2 size={24} />
                                    <span>{img.title}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Photography;
