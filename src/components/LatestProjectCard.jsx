import React from 'react';
import { motion } from 'framer-motion';
import { Star, GitFork, GitBranch, ArrowUpRight } from 'lucide-react';

const languageColors = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
};

const LatestProjectCard = ({ project }) => {
  if (!project) return null;
  const dotColor = languageColors[project.language] || '#FF9800';

  const isRecentlyUpdated = project.updated_at 
    ? (new Date() - new Date(project.updated_at)) < 30 * 24 * 60 * 60 * 1000 
    : false;

  return (
    <motion.a
      href={project.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block no-underline text-white w-full max-w-2xl mx-auto group"
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -5 }}
      aria-label={`View GitHub repository for project ${project.name}`}
    >
      <div className="relative overflow-hidden rounded-xl border border-solid border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-6 sm:p-8 transition-all duration-300 ease-in-out group-hover:border-zinc-700 group-hover:bg-zinc-900/80 group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        
        {/* Top-Right Glow Accent */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-zinc-800/20 rounded-full blur-2xl group-hover:bg-orange/10 transition-all duration-300 ease-in-out pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isRecentlyUpdated ? (
              <>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange"></span>
                </span>
                <span className="text-[10px] font-bold tracking-widest text-orange uppercase font-main">
                  Mission Active
                </span>
              </>
            ) : (
              <>
                <span className="flex h-2 w-2 relative">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase font-main">
                  Mission Accomplished
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-neutral-500 group-hover:text-orange transition-all duration-300 ease-in-out font-main">
            <span>Codebase</span>
            <ArrowUpRight size={13} className="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300 ease-in-out" />
          </div>
        </div>

        {/* Repository Name */}
        <h3 className="text-xl sm:text-2xl font-bold font-accent mb-3 group-hover:text-orange transition-all duration-300 ease-in-out tracking-wide">
          {project.name}
        </h3>
        
        {/* Description */}
        <p className="text-neutral-400 text-xs sm:text-sm mb-6 font-main line-clamp-2 leading-relaxed h-10 transition-colors duration-300 ease-in-out group-hover:text-neutral-300">
          {project.description}
        </p>

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-solid border-zinc-800 transition-colors duration-300 ease-in-out group-hover:border-zinc-700">
          <div className="flex items-center gap-5">
            {/* Programming Language */}
            <div className="flex items-center gap-2">
              <span 
                className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" 
                style={{ backgroundColor: dotColor }}
              />
              <span className="text-xs font-medium text-neutral-300 font-main transition-colors duration-300 ease-in-out group-hover:text-neutral-200">
                {project.language}
              </span>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1 text-neutral-400 hover:text-yellow-400 transition-colors duration-200 ease-in-out">
              <Star size={14} className="fill-current text-yellow-500/80" />
              <span className="text-xs font-semibold font-main">
                {project.stargazers_count}
              </span>
            </div>

            {/* Forks */}
            <div className="flex items-center gap-1 text-neutral-400 hover:text-sky-400 transition-colors duration-200 ease-in-out">
              <GitFork size={14} className="text-sky-500/80" />
              <span className="text-xs font-semibold font-main">
                {project.forks_count}
              </span>
            </div>
          </div>

          {/* Updated date */}
          {project.updated_at && (
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-main transition-colors duration-300 ease-in-out group-hover:text-neutral-400">
              <GitBranch size={12} />
              <span>{new Date(project.updated_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>
    </motion.a>
  );
};

export default LatestProjectCard;
