import React from 'react';
import { motion } from 'framer-motion';
import { Maximize2 } from 'lucide-react';
import './Photography.css';

// Import images
import img1 from '../assets/IMG_2287.jpg';
import img2 from '../assets/IMG_2362.jpg';
import img3 from '../assets/IMG_5326.jpg';
import img4 from '../assets/IMG_6881.jpg';
import img5 from '../assets/IMG_6957.jpg';

const Photography = () => {
    const images = [
        { id: 1, src: img1, title: 'Durga Puja Sylhet', category: 'Nature' },
        { id: 2, src: img2, title: 'Devi Durga', category: 'Urban' },
        { id: 3, src: img3, title: 'IICT Sust', category: 'Action' },
        { id: 4, src: img4, title: 'My Cooking', category: 'Abstract' },
        { id: 5, src: img5, title: 'A dream afternoon', category: 'Urban' },
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
                            <div className="photo-card-inner">
                                <img src={img.src} alt={img.title} className="photo-image" />
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
