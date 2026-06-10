import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X, ChevronLeft, ChevronRight, Camera, MapPin } from 'lucide-react';
import './Photography.css';
import { photos } from '../assets/photos.js';

// Category filter list derived from photo data
const ALL_CATEGORIES = ['All', ...new Set(photos.map(p => p.category))];

// Fujifilm film simulation colour label per category
const CATEGORY_COLORS = {
    Festival:     'text-rose-400 border-rose-500/30 bg-rose-900/20',
    Street:       'text-cyan-400 border-cyan-500/30 bg-cyan-900/20',
    Nature:       'text-emerald-400 border-emerald-500/30 bg-emerald-900/20',
    Food:         'text-amber-400 border-amber-500/30 bg-amber-900/20',
    Architecture: 'text-violet-400 border-violet-500/30 bg-violet-900/20',
    Portrait:     'text-pink-400 border-pink-500/30 bg-pink-900/20',
};
const getCatColor = (cat) => CATEGORY_COLORS[cat] || 'text-orange border-orange/30 bg-orange/10';

const Photography = () => {
    const [activeIndex, setActiveIndex] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');

    const filtered = activeCategory === 'All'
        ? photos
        : photos.filter(p => p.category === activeCategory);

    const openLightbox = useCallback((globalIdx) => setActiveIndex(globalIdx), []);
    const closeLightbox = useCallback(() => setActiveIndex(null), []);

    const prev = useCallback(() => {
        setActiveIndex(i => (i === 0 ? photos.length - 1 : i - 1));
    }, []);

    const next = useCallback(() => {
        setActiveIndex(i => (i === photos.length - 1 ? 0 : i + 1));
    }, []);

    // Keyboard navigation for lightbox
    React.useEffect(() => {
        if (activeIndex === null) return;
        const onKey = (e) => {
            if (e.key === 'ArrowLeft')  prev();
            if (e.key === 'ArrowRight') next();
            if (e.key === 'Escape')     closeLightbox();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [activeIndex, prev, next, closeLightbox]);

    return (
        <section id="photography" className="photography bg-[#0A0A0A]">
            <div className="container max-w-6xl mx-auto px-4">

                {/* ── Section Header ──────────────────────────────────────── */}
                <motion.div
                    className="section-header text-center mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="section-title text-3xl sm:text-4xl font-bold font-accent mb-2">
                        Sharingan Views
                    </h2>
                    <div className="title-underline mx-auto mt-4 w-12 h-1 bg-orange"></div>

                    {/* Fujifilm badge */}
                    <div className="flex items-center justify-center gap-2 mt-5">
                        <Camera size={14} className="text-neutral-500" />
                        <span className="text-[11px] font-bold uppercase tracking-[3px] text-neutral-500">
                            Shot on FUJIFILM
                        </span>
                    </div>
                </motion.div>

                {/* ── Category Filter ─────────────────────────────────────── */}
                {ALL_CATEGORIES.length > 2 && (
                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                        {ALL_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-solid transition-all duration-250 ease-in-out cursor-pointer ${
                                    activeCategory === cat
                                        ? 'bg-orange text-black border-orange'
                                        : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-orange/40 hover:text-zinc-200'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Photo Grid ──────────────────────────────────────────── */}
                <div className="photography-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((img) => {
                            // find the index in the full photos array for lightbox
                            const globalIdx = photos.indexOf(img);
                            return (
                                <motion.div
                                    key={img.title + img.src}
                                    layout
                                    className="photo-card relative aspect-square overflow-hidden rounded-xl bg-zinc-900 border border-solid border-zinc-800 transition-all duration-300 hover:border-orange/30 shadow-md cursor-pointer group"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.35 }}
                                    onClick={() => openLightbox(globalIdx)}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`View photo: ${img.title}`}
                                    onKeyDown={(e) => e.key === 'Enter' && openLightbox(globalIdx)}
                                >
                                    <div className="w-full h-full relative overflow-hidden">
                                        <img
                                            src={img.src}
                                            alt={img.title}
                                            className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                                        />

                                        {/* Hover overlay */}
                                        <div className="photo-overlay absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 text-center font-main">
                                            <Maximize2 size={20} className="text-orange stroke-[2.5]" />
                                            <span className="font-bold text-xs text-white tracking-wide">{img.title}</span>
                                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-solid ${getCatColor(img.category)}`}>
                                                {img.category}
                                            </span>
                                        </div>

                                        {/* Fujifilm corner badge */}
                                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold text-neutral-400 uppercase tracking-wider">
                                                <Camera size={8} />
                                                FUJIFILM
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* ── Photo count ─────────────────────────────────────────── */}
                <p className="text-center text-xs text-neutral-600 mt-6 font-main uppercase tracking-widest">
                    {filtered.length} of {photos.length} frames
                </p>
            </div>

            {/* ── Lightbox Modal ──────────────────────────────────────────── */}
            <AnimatePresence>
                {activeIndex !== null && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeLightbox}
                    >
                        {/* Close */}
                        <button
                            className="absolute top-5 right-5 p-2.5 rounded-full bg-zinc-900/70 border border-solid border-zinc-800 text-white hover:text-orange hover:border-orange/30 transition-all duration-200 z-50 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
                            aria-label="Close lightbox"
                        >
                            <X size={22} />
                        </button>

                        {/* Prev */}
                        <button
                            className="absolute left-4 sm:left-6 p-3 rounded-full bg-zinc-900/70 border border-solid border-zinc-800 text-white hover:text-orange hover:border-orange/30 transition-all duration-200 z-50 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); prev(); }}
                            aria-label="Previous photo"
                        >
                            <ChevronLeft size={26} />
                        </button>

                        {/* Next */}
                        <button
                            className="absolute right-4 sm:right-6 p-3 rounded-full bg-zinc-900/70 border border-solid border-zinc-800 text-white hover:text-orange hover:border-orange/30 transition-all duration-200 z-50 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); next(); }}
                            aria-label="Next photo"
                        >
                            <ChevronRight size={26} />
                        </button>

                        {/* Image container */}
                        <motion.div
                            className="relative max-w-4xl w-full flex flex-col items-center gap-5 select-none"
                            initial={{ scale: 0.92, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.92, y: 20 }}
                            transition={{ type: 'spring', damping: 26, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={photos[activeIndex].src}
                                alt={photos[activeIndex].title}
                                className="max-h-[70vh] max-w-full object-contain rounded-xl border border-solid border-zinc-800/60 shadow-2xl"
                            />

                            {/* Caption */}
                            <div className="text-center font-main">
                                <h3 className="text-white text-xl font-bold font-accent tracking-wide">
                                    {photos[activeIndex].title}
                                </h3>
                                <div className="flex items-center justify-center gap-3 mt-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-solid ${getCatColor(photos[activeIndex].category)}`}>
                                        {photos[activeIndex].category}
                                    </span>
                                    {photos[activeIndex].location && (
                                        <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                                            <MapPin size={10} />
                                            {photos[activeIndex].location}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1 text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
                                        <Camera size={10} />
                                        FUJIFILM
                                    </span>
                                </div>
                                {/* Counter */}
                                <p className="mt-2 text-[10px] text-neutral-600 uppercase tracking-widest">
                                    {activeIndex + 1} / {photos.length}
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default Photography;
