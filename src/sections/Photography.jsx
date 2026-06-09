import React from 'react';
import { motion } from 'framer-motion';
import { Maximize2 } from 'lucide-react';
import './Photography.css';

// Import images
import img1 from '../assets/img_2287.jpg';
import img2 from '../assets/img_2362.jpg';
import img3 from '../assets/img_5326.jpg';
import img4 from '../assets/img_6881.jpg';
import img5 from '../assets/img_6957.jpg';

const Photography = () => {
    const images = [
        { id: 1, src: img1, title: 'Durga Puja Sylhet', category: 'Nature' },
        { id: 2, src: img2, title: 'Devi Durga', category: 'Urban' },
        { id: 3, src: img3, title: 'IICT Sust', category: 'Action' },
        { id: 4, src: img4, title: 'My Cooking', category: 'Abstract' },
        { id: 5, src: img5, title: 'A dream afternoon', category: 'Urban' },
    ];

    return (
        <section id="photography" className="photography py-20 bg-[#0A0A0A]">
            <div className="container max-w-6xl mx-auto px-4">
                <motion.div
                    className="section-header text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="section-title text-3xl sm:text-4xl font-bold font-accent mb-2">Sharingan Views</h2>
                    <div className="title-underline mx-auto mt-4 w-12 h-1 bg-orange"></div>
                </motion.div>

                {/* Grid layout with explicit overflow-hidden and gap configurations */}
                <div className="photography-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {images.map((img, idx) => (
                        <motion.div
                            key={img.id}
                            className="photo-card relative aspect-square overflow-hidden rounded-xl bg-zinc-900 border border-solid border-zinc-800 transition-all duration-300 ease-in-out hover:border-orange/30 shadow-md cursor-pointer group"
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1, duration: 0.4 }}
                        >
                            <div className="w-full h-full relative overflow-hidden">
                                {/* Smooth 500ms transform transitions on hover scale */}
                                <img 
                                    src={img.src} 
                                    alt={img.title} 
                                    className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105" 
                                />
                                
                                {/* Overlay with smooth opacity transition */}
                                <div className="photo-overlay absolute inset-0 bg-orange/80 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out p-4 text-center text-black font-main">
                                    <Maximize2 size={24} className="stroke-[2.5]" />
                                    <span className="font-bold text-sm tracking-wide">{img.title}</span>
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
