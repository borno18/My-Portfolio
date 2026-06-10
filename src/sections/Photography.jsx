import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import './Photography.css';

// Import images
import img1 from '../assets/img_2287.jpg';
import img2 from '../assets/img_2362.jpg';
import img3 from '../assets/img_5326.jpg';
import img4 from '../assets/img_6881.jpg';
import img5 from '../assets/img_6957.jpg';

const Photography = () => {
    const [activePhotoIndex, setActivePhotoIndex] = useState(null);

    const images = [
        { id: 1, src: img1, title: 'Durga Puja Sylhet', category: 'Nature' },
        { id: 2, src: img2, title: 'Devi Durga', category: 'Urban' },
        { id: 3, src: img3, title: 'IICT Sust', category: 'Action' },
        { id: 4, src: img4, title: 'My Cooking', category: 'Abstract' },
        { id: 5, src: img5, title: 'A dream afternoon', category: 'Urban' },
    ];

    return (
        <section id="photography" className="photography bg-[#0A0A0A]">
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
                            onClick={() => setActivePhotoIndex(idx)}
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

            {/* Premium Lightbox Modal */}
            <AnimatePresence>
                {activePhotoIndex !== null && (
                    <motion.div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setActivePhotoIndex(null)}
                    >
                        {/* Close button */}
                        <button 
                            className="absolute top-6 right-6 p-2.5 rounded-full bg-zinc-900/60 border border-solid border-zinc-800 text-white hover:text-orange hover:border-orange/20 transition-all duration-300 ease-in-out cursor-pointer z-50 hover:scale-105"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActivePhotoIndex(null);
                            }}
                            aria-label="Close Lightbox"
                        >
                            <X size={24} />
                        </button>

                        {/* Prev Button */}
                        <button 
                            className="absolute left-4 sm:left-6 p-3 rounded-full bg-zinc-900/60 border border-solid border-zinc-800 text-white hover:text-orange hover:border-orange/20 transition-all duration-300 ease-in-out cursor-pointer z-50 hover:scale-105"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActivePhotoIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                            }}
                            aria-label="Previous Photo"
                        >
                            <ChevronLeft size={28} />
                        </button>

                        {/* Next Button */}
                        <button 
                            className="absolute right-4 sm:right-6 p-3 rounded-full bg-zinc-900/60 border border-solid border-zinc-800 text-white hover:text-orange hover:border-orange/20 transition-all duration-300 ease-in-out cursor-pointer z-50 hover:scale-105"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActivePhotoIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                            }}
                            aria-label="Next Photo"
                        >
                            <ChevronRight size={28} />
                        </button>

                        {/* Main Lightbox Content Container */}
                        <motion.div 
                            className="relative max-w-4xl max-h-[85vh] flex flex-col items-center select-none"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img 
                                src={images[activePhotoIndex].src} 
                                alt={images[activePhotoIndex].title} 
                                className="max-w-full max-h-[70vh] object-contain rounded-lg border border-solid border-zinc-800 shadow-2xl" 
                            />
                            
                            {/* Image description banner */}
                            <div className="mt-5 text-center font-main">
                                <h3 className="text-white text-lg sm:text-xl font-bold font-accent tracking-wide">{images[activePhotoIndex].title}</h3>
                                <span className="inline-block mt-2 text-xs text-orange uppercase tracking-wider font-bold bg-orange/10 px-3.5 py-1 rounded-full border border-solid border-orange/20">
                                    {images[activePhotoIndex].category}
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default Photography;
