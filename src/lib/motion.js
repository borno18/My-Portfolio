import { useEffect, useState, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

// Easing Curves
export const easeStandard = [0.25, 0.1, 0.25, 1.0];
export const easeEmphasis = [0.68, -0.6, 0.32, 1.6];

// Durations (in seconds)
export const durationFast = 0.15;
export const durationBase = 0.25;
export const durationSlow = 0.40;

// Framer Motion transition presets that respect reduced motion
export const useMotionTransition = (presetName = 'standard') => {
    const shouldReduce = useReducedMotion();
    
    const presets = {
        fast: { ease: easeStandard, duration: durationFast },
        standard: { ease: easeStandard, duration: durationBase },
        slow: { ease: easeStandard, duration: durationSlow },
        emphasis: { ease: easeEmphasis, duration: durationBase }
    };
    
    if (shouldReduce) {
        return { duration: 0.01 };
    }
    
    return presets[presetName] || presets.standard;
};

// ─── Centralized Shared IntersectionObserver ──────────────────────────────────
let sharedObserver = null;
const callbacks = new Map();

const getSharedObserver = () => {
    if (typeof window === 'undefined') return null;
    if (!sharedObserver) {
        sharedObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const cb = callbacks.get(entry.target);
                if (cb) {
                    cb(entry);
                }
            });
        }, {
            rootMargin: '-50px',
            threshold: 0.05
        });
    }
    return sharedObserver;
};

export const useSharedReveal = (once = true) => {
    const ref = useRef(null);
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = getSharedObserver();
        if (!observer) return;

        const cb = (entry) => {
            if (entry.isIntersecting) {
                setIsIntersecting(true);
                if (once) {
                    observer.unobserve(element);
                    callbacks.delete(element);
                }
            } else if (!once) {
                setIsIntersecting(false);
            }
        };

        callbacks.set(element, cb);
        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
                callbacks.delete(element);
            }
        };
    }, [once]);

    return [ref, isIntersecting];
};

// Standard Reveal Variants for framer-motion that respect prefers-reduced-motion
export const revealVariants = {
    hidden: (shouldReduce) => ({
        opacity: 0,
        y: shouldReduce ? 0 : 20,
        scale: shouldReduce ? 1 : 0.98,
    }),
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
    }
};
