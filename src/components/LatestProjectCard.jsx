import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Star, GitFork, GitBranch, ArrowUpRight, Github, ExternalLink } from 'lucide-react';
import { useMotionTransition } from '../lib/motion';

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
  const transition = useMotionTransition('standard');
  const shouldReduce = useReducedMotion();

  if (!project) return null;

  const isCurated = !!project.title;
  const title = project.title || project.name;
  const description = project.description;
  const githubUrl = project.github_url || project.html_url;
  const liveUrl = project.live_url;
  const techStack = project.tech_stack || '';
  
  const dotColor = languageColors[project.language] || '#FF9800';

  const isRecent = project.updated_at
    ? (Date.now() - new Date(project.updated_at).getTime()) < 30 * 24 * 60 * 60 * 1000
    : false;

  return (
    <motion.div
      className="block no-underline text-white w-full max-w-2xl mx-auto group"
      initial={{ opacity: 0, y: shouldReduce ? 0 : 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={transition}
      whileHover={shouldReduce ? {} : { y: -5 }}
    >
      <div className="relative overflow-hidden rounded-xl border border-solid border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-6 sm:p-8 transition-all duration-300 ease-in-out group-hover:border-zinc-700 group-hover:bg-zinc-900/80 group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        
        {/* Top-Right Glow Accent */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-zinc-800/20 rounded-full blur-2xl group-hover:bg-orange/10 transition-all duration-300 ease-in-out pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              {isRecent && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isRecent ? 'bg-orange' : 'bg-zinc-500'}`}></span>
            </span>
            <span className={`text-[10px] font-bold tracking-widest uppercase font-main ${isRecent ? 'text-orange' : 'text-zinc-500'}`}>
              {isRecent ? 'Mission Active' : 'Mission Complete'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-500 font-main">
            {githubUrl && (
              <a 
                href={githubUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-orange transition-colors flex items-center gap-1"
                title="View Source Code"
              >
                <Github size={13} />
                <span>Code</span>
              </a>
            )}
            {liveUrl && (
              <a 
                href={liveUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-orange transition-colors flex items-center gap-1"
                title="View Live Demo"
              >
                <ExternalLink size={13} />
                <span>Demo</span>
              </a>
            )}
          </div>
        </div>

        {/* Repository Name */}
        <h3 className="text-xl sm:text-2xl font-bold font-accent mb-3 group-hover:text-orange transition-all duration-300 ease-in-out tracking-wide">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-neutral-400 text-xs sm:text-sm mb-6 font-main line-clamp-3 leading-relaxed transition-colors duration-300 ease-in-out group-hover:text-neutral-300">
          {description}
        </p>

        {/* Footer Stats / Tech Stack */}
        <div className="flex items-center justify-between pt-4 border-t border-solid border-zinc-800 transition-colors duration-300 ease-in-out group-hover:border-zinc-700">
          {isCurated ? (
            <div className="flex flex-wrap gap-1.5">
              {techStack.split(',').filter(Boolean).map(tech => (
                <span 
                  key={tech} 
                  className="text-[10px] bg-zinc-950/80 text-zinc-400 border border-solid border-zinc-800/80 px-2.5 py-0.5 rounded-full font-main"
                >
                  {tech.trim()}
                </span>
              ))}
            </div>
          ) : (
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
          )}

          {project.updated_at && (
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-main transition-colors duration-300 ease-in-out group-hover:text-neutral-400">
              <GitBranch size={12} />
              <span>{new Date(project.updated_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default LatestProjectCard;
