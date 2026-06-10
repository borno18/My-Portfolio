import React from 'react';
import { motion } from 'framer-motion';
import { Github, Code2, Users, MapPin, Award, BookOpen, Trophy } from 'lucide-react';
import githubProfile from '../data/github-profile.json';
import leetcodeStats from '../data/leetcode-stats.json';

const ShinobiStats = () => {
  // Determine developer rank based on GitHub public repos
  let devRank = "Genin Developer";
  let rankColor = "text-zinc-400 border-zinc-800 bg-zinc-900/30";
  
  if (githubProfile.public_repos >= 15) {
    devRank = "Jonin Developer (S-Rank)";
    rankColor = "text-red-400 border-red-500/30 bg-red-950/20";
  } else if (githubProfile.public_repos >= 5) {
    devRank = "Chunin Developer (A-Rank)";
    rankColor = "text-orange border-orange/30 bg-orange/10";
  }

  // Solved breakdown
  const easyCount = leetcodeStats.easySolved ?? 0;
  const mediumCount = leetcodeStats.mediumSolved ?? 0;
  const hardCount = leetcodeStats.hardSolved ?? 0;
  const totalCount = leetcodeStats.solvedProblem ?? 0;

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 font-main">
      
      {/* GitHub Shinobi Profile Stats Card */}
      <motion.div 
        className="rounded-2xl border border-solid border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-md transition-all duration-300 ease-in-out hover:border-zinc-700/60"
        initial={{ opacity: 0, x: -25 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-zinc-800/60 text-orange">
            <Github size={22} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white tracking-wide">GitHub Intel</h4>
            <p className="text-xs text-neutral-500">Live account synchronization</p>
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-950/50 border border-solid border-zinc-800/40 mb-6">
          <img 
            src={githubProfile.avatar_url} 
            alt={githubProfile.name}
            className="w-14 h-14 rounded-full border border-solid border-zinc-700/80 shadow-md object-cover"
          />
          <div>
            <h5 className="font-bold text-zinc-100">{githubProfile.name}</h5>
            <div className="flex items-center gap-1.5 text-neutral-400 text-xs mt-1">
              <MapPin size={12} className="text-orange" />
              <span>{githubProfile.location}</span>
            </div>
          </div>
        </div>

        {/* Profile Stats Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-lg bg-zinc-950/30 border border-solid border-zinc-800/40">
            <BookOpen size={16} className="mx-auto text-zinc-500 mb-1" />
            <span className="block text-xl font-bold text-white">{githubProfile.public_repos}</span>
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Jutsus</span>
          </div>
          <div className="p-3 rounded-lg bg-zinc-950/30 border border-solid border-zinc-800/40">
            <Users size={16} className="mx-auto text-zinc-500 mb-1" />
            <span className="block text-xl font-bold text-white">{githubProfile.followers}</span>
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Allies</span>
          </div>
          <div className="p-3 rounded-lg bg-zinc-950/30 border border-solid border-zinc-800/40">
            <Award size={16} className="mx-auto text-zinc-500 mb-1" />
            <span className="block text-xs font-bold text-zinc-300 truncate mt-1">{githubProfile.following}</span>
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Following</span>
          </div>
        </div>

        {/* Dynamic Rank Badge */}
        <div className={`mt-5 w-full flex items-center justify-between p-3 rounded-xl border border-solid ${rankColor}`}>
          <div className="flex items-center gap-2">
            <Trophy size={16} />
            <span className="text-xs font-bold tracking-wide">Developer Rank</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">{devRank}</span>
        </div>
      </motion.div>

      {/* LeetCode Ninjutsu Training Stats Card */}
      <motion.div 
        className="rounded-2xl border border-solid border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-md transition-all duration-300 ease-in-out hover:border-zinc-700/60"
        initial={{ opacity: 0, x: 25 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-zinc-800/60 text-orange">
            <Code2 size={22} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white tracking-wide">Algorithms Training</h4>
            <p className="text-xs text-neutral-500">Live LeetCode challenge tracking</p>
          </div>
        </div>

        {/* Total Solved Stats */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/50 border border-solid border-zinc-800/40 mb-6">
          <div>
            <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Total Accomplished</span>
            <span className="block text-2xl font-black text-white mt-0.5">{totalCount} solved</span>
          </div>
          <div className="h-10 w-10 rounded-full border border-solid border-orange/20 bg-orange/5 flex items-center justify-center text-orange">
            <Award size={20} className="animate-pulse" />
          </div>
        </div>

        {/* Difficulty Breakdown (Progress bars) */}
        <div className="space-y-4">
          
          {/* Easy */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1 text-neutral-400">
              <span className="text-emerald-400">Easy Solves</span>
              <span className="text-white">{easyCount} solved</span>
            </div>
            <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full" 
                style={{ width: `${totalCount > 0 ? (easyCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Medium */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1 text-neutral-400">
              <span className="text-amber-400">Medium Solves</span>
              <span className="text-white">{mediumCount} solved</span>
            </div>
            <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-amber-500 h-1.5 rounded-full" 
                style={{ width: `${totalCount > 0 ? (mediumCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Hard */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1 text-neutral-400">
              <span className="text-red-400">Hard Solves</span>
              <span className="text-white">{hardCount} solved</span>
            </div>
            <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-red-500 h-1.5 rounded-full" 
                style={{ width: `${totalCount > 0 ? (hardCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>

        </div>
      </motion.div>

    </div>
  );
};

export default ShinobiStats;
