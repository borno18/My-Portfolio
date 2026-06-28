import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X, ChevronLeft, ChevronRight, Camera, MapPin, ArrowRight } from 'lucide-react';
import { useSharedReveal, useMotionTransition, revealVariants } from '../lib/motion';
import { photos as staticPhotos } from '../assets/photos.js';
import './Photography.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');
    
    const transition = useMotionTransition('standard');
    const slowTransition = useMotionTransition('slow');
    const [headerRef, headerVisible] = useSharedReveal(true);

    useEffect(() => {
        const fetchPhotos = async () => {
            const formattedStatic = staticPhotos.map((p, idx) => ({
                id: `static-${idx}`,
                src: p.src,
                thumbnail: p.src,
                title: p.title,
                story: 'A beautiful frame captured on FUJIFILM camera. Sharing this memory from the archives.',
                category: p.category,
                camera: 'FUJIFILM X-T30 II',
                lens: '18-55mm f/2.8-4',
                settings: 'f/4.0, 1/250s, ISO 320',
                location: p.location || 'Sylhet, Bangladesh'
            }));

            try {
                const res = await fetch(`${API_BASE}/api/photos`);
                if (!res.ok) throw new Error('Failed to fetch photos');
                const data = await res.json();
                
                if (data && data.length > 0) {
                    const dbPhotos = data.map(p => ({
                        id: p.id,
                        src: p.image_url,
                        thumbnail: p.thumbnail_url || p.image_url,
                        title: p.story ? p.story.split('\n')[0] : 'Untitled',
                        story: p.story || '',
                        category: p.category || (p.camera ? 'Fujifilm' : 'Street'),
                        camera: p.camera || 'FUJIFILM',
                        lens: p.lens || '',
                        settings: p.settings || '',
                        location: p.taken_at ? new Date(p.taken_at).toLocaleDateString() : '',
                    }));
                    setPhotos([...dbPhotos, ...formattedStatic]);
                } else {
                    setPhotos(formattedStatic);
                }
            } catch (err) {
                console.error('Backend photos fetch error, falling back to static:', err);
                setPhotos(formattedStatic);
            } finally {
                setLoading(false);
            }
        };

        fetchPhotos();
    }, []);

    // For landing page, we only show up to 5 items to keep it clean, but let's filter first
    const ALL_CATEGORIES = ['All', ...new Set(photos.map(p => p.category))];
    const filteredAll = activeCategory === 'All'
        ? photos
        : photos.filter(p => p.category === activeCategory);
    
    // limit to 5
    const filtered = filteredAll.slice(0, 5);

    const openLightbox = useCallback((globalIdx) => setActiveIndex(globalIdx), []);
    const closeLightbox = useCallback(() => setActiveIndex(null), []);

    const prev = useCallback(() => {
        setActiveIndex(i => (i === 0 ? photos.length - 1 : i - 1));
    }, [photos.length]);

    const next = useCallback(() => {
        setActiveIndex(i => (i === photos.length - 1 ? 0 : i + 1));
    }, [photos.length]);

    // Keyboard navigation
    useEffect(() => {
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
                    ref={headerRef}
                    className="section-header text-center mb-10"
                    initial="hidden"
                    animate={headerVisible ? "visible" : "hidden"}
                    variants={revealVariants}
                    transition={transition}
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

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-10 h-10 border-2 border-orange border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs uppercase tracking-widest text-zinc-500">Loading frames...</p>
                    </div>
                ) : (
                    <>
                        {/* Category Filter */}
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

                        {/* Photo Grid */}
                        <div className="photography-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <AnimatePresence mode="popLayout">
                                {filtered.map((img) => {
                                    const globalIdx = photos.indexOf(img);
                                    return (
                                        <motion.div
                                            key={img.id + '-' + img.title}
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
                                                    src={img.thumbnail}
                                                    alt={img.title}
                                                    className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                                                    loading="lazy"
                                                />

                                                {/* Hover overlay */}
                                                <div className="photo-overlay absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 text-center font-main">
                                                    <Maximize2 size={20} className="text-orange stroke-[2.5]" />
                                                    <span className="font-bold text-xs text-white tracking-wide">{img.title}</span>
                                                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-solid ${getCatColor(img.category)}`}>
                                                        {img.category}
                                                    </span>
                                                </div>

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

                        {/* View All Button */}
                        <div className="text-center mt-10">
                            <Link 
                                to="/photos" 
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-solid border-zinc-800 bg-zinc-900/60 text-xs font-bold uppercase tracking-wider text-white hover:text-orange hover:border-orange/30 transition-all duration-300"
                            >
                                Open Full Gallery <ArrowRight size={14} />
                            </Link>
                        </div>
                    </>
                )}
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {activeIndex !== null && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeLightbox}
                    >
                        <button
                            className="absolute top-5 right-5 p-2.5 rounded-full bg-zinc-900/70 border border-solid border-zinc-800 text-white hover:text-orange hover:border-orange/30 transition-all duration-200 z-50 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
                            aria-label="Close lightbox"
                        >
                            <X size={22} />
                        </button>

                        <button
                            className="absolute left-4 sm:left-6 p-3 rounded-full bg-zinc-900/70 border border-solid border-zinc-800 text-white hover:text-orange hover:border-orange/30 transition-all duration-200 z-50 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); prev(); }}
                            aria-label="Previous photo"
                        >
                            <ChevronLeft size={26} />
                        </button>

                        <button
                            className="absolute right-4 sm:right-6 p-3 rounded-full bg-zinc-900/70 border border-solid border-zinc-800 text-white hover:text-orange hover:border-orange/30 transition-all duration-200 z-50 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); next(); }}
                            aria-label="Next photo"
                        >
                            <ChevronRight size={26} />
                        </button>

                        <motion.div
                            className="relative max-w-4xl w-full flex flex-col md:flex-row items-center justify-center gap-6 select-none bg-zinc-900/60 p-6 rounded-2xl border border-solid border-zinc-800/80 backdrop-blur-lg"
                            initial={{ scale: 0.92, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.92, y: 20 }}
                            transition={{ type: 'spring', damping: 26, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="max-w-[100%] md:max-w-[65%] flex items-center justify-center">
                                <img
                                    src={photos[activeIndex].src}
                                    alt={photos[activeIndex].title}
                                    className="max-h-[60vh] max-w-full object-contain rounded-xl border border-solid border-zinc-800/60 shadow-2xl"
                                />
                            </div>

                            <div className="flex-1 text-left font-main self-start md:self-center">
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-solid ${getCatColor(photos[activeIndex].category)} inline-block mb-3`}>
                                    {photos[activeIndex].category}
                                </span>
                                <h3 className="text-white text-2xl font-bold font-accent tracking-wide mb-2">
                                    {photos[activeIndex].title}
                                </h3>
                                
                                {photos[activeIndex].story && (
                                    <p className="text-zinc-400 text-sm mb-6 leading-relaxed whitespace-pre-line">
                                        {photos[activeIndex].story}
                                    </p>
                                )}

                                <div className="border-t border-solid border-zinc-800/80 pt-4 space-y-2 text-xs text-zinc-500">
                                    {photos[activeIndex].location && (
                                        <div className="flex items-center gap-2">
                                            <MapPin size={12} className="text-orange" />
                                            <span>{photos[activeIndex].location}</span>
                                        </div>
                                    )}
                                    {photos[activeIndex].camera && (
                                        <div className="flex items-center gap-2">
                                            <Camera size={12} />
                                            <span>{photos[activeIndex].camera}</span>
                                        </div>
                                    )}
                                    {photos[activeIndex].lens && (
                                        <div className="flex items-center gap-2 pl-5 text-[11px] text-zinc-600">
                                            <span>Lens: {photos[activeIndex].lens}</span>
                                        </div>
                                    )}
                                    {photos[activeIndex].settings && (
                                        <div className="flex items-center gap-2 pl-5 text-[11px] text-zinc-600">
                                            <span>Settings: {photos[activeIndex].settings}</span>
                                        </div>
                                    )}
                                </div>

                                <p className="mt-6 text-[10px] text-neutral-600 uppercase tracking-widest">
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
