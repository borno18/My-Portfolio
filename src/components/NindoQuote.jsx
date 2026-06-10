import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, RefreshCw } from 'lucide-react';

const quotes = [
  {
    text: "I never go back on my word... that is my nindo, my ninja way! The same goes for my code—clean, committed, and refactored to the end.",
    author: "Naruto Uzumaki (Developer Edit)"
  },
  {
    text: "If you don't like your stack or your project's architecture, don't accept it. Have the courage to refactor it the way it should be.",
    author: "Naruto Uzumaki (Refactor Edit)"
  },
  {
    text: "A person grows when they are able to overcome trials. Coding is no different; every compilation error is a step toward mastery.",
    author: "Jiraiya the Gallant"
  },
  {
    text: "Even the most complex S-rank software projects are built by writing simple, modular lines of code, one compilation at a time.",
    author: "Minato Namikaze"
  },
  {
    text: "In the shinobi world, those who break the rules are scum... but those who write undocumented spaghetti code are worse than scum.",
    author: "Obito Uchiha (Developer Edit)"
  },
  {
    text: "Talk is cheap. Show me the code.",
    author: "Linus Torvalds"
  }
];

const NindoQuote = () => {
  const [index, setIndex] = useState(0);

  // Cycle automatically every 15 seconds, resetting the timer when index changes (manual refresh)
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % quotes.length);
    }, 15000);
    return () => clearInterval(timer);
  }, [index]);

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % quotes.length);
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-8 relative font-main px-4">
      <div className="rounded-xl border border-solid border-zinc-800/80 bg-zinc-900/30 backdrop-blur-md p-6 relative group overflow-hidden">
        
        {/* Glow */}
        <div className="absolute top-0 left-0 w-16 h-16 bg-orange/5 rounded-full blur-xl group-hover:bg-orange/10 transition-all duration-300" />
        
        <Quote className="absolute top-3 left-4 text-orange/15 w-12 h-12 pointer-events-none" />

        <div className="relative min-h-[90px] flex flex-col justify-center select-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="text-center"
            >
              <p className="text-zinc-300 text-sm sm:text-base italic leading-relaxed px-6 font-medium">
                "{quotes[index].text}"
              </p>
              <span className="block mt-3 text-xs font-bold text-orange tracking-widest uppercase">
                — {quotes[index].author}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Refresh button */}
        <button
          onClick={handleNext}
          className="absolute bottom-3 right-4 p-1.5 rounded-lg border border-solid border-zinc-800 bg-zinc-950/40 text-neutral-500 hover:text-orange hover:border-orange/20 transition-all duration-300 ease-in-out cursor-pointer hover:scale-105"
          title="Cycle Quote"
          aria-label="Cycle Quote"
        >
          <RefreshCw size={12} className="group-hover:rotate-45 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
};

export default NindoQuote;
