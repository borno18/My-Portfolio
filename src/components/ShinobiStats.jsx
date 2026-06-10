import React from 'react';
import { motion } from 'framer-motion';
import { Github, Code2, Users, MapPin, Award, BookOpen, Trophy, ExternalLink, Zap } from 'lucide-react';
import githubProfile  from '../data/github-profile.json';
import leetcodeStats  from '../data/leetcode-stats.json';
import cfStats        from '../data/codeforces-stats.json';

// ─── CF rank → colour ────────────────────────────────────────────────────────
const CF_RANK_COLORS = {
  newbie:           { text: 'text-zinc-400',   border: 'border-zinc-700/40',  bg: 'bg-zinc-800/30'  },
  pupil:            { text: 'text-green-400',  border: 'border-green-600/30', bg: 'bg-green-900/20' },
  specialist:       { text: 'text-cyan-400',   border: 'border-cyan-600/30',  bg: 'bg-cyan-900/20'  },
  expert:           { text: 'text-blue-400',   border: 'border-blue-600/30',  bg: 'bg-blue-900/20'  },
  'candidate master': { text: 'text-violet-400', border: 'border-violet-600/30', bg: 'bg-violet-900/20' },
  master:           { text: 'text-orange',     border: 'border-orange/30',    bg: 'bg-orange/10'    },
  grandmaster:      { text: 'text-red-400',    border: 'border-red-600/30',   bg: 'bg-red-900/20'   },
};
const getCFColor = (rank) => CF_RANK_COLORS[(rank || '').toLowerCase()] || CF_RANK_COLORS.newbie;

// ─── GitHub rank from repo count ─────────────────────────────────────────────
function getGHRank(repos) {
  if (repos >= 15) return { label: 'Jonin Developer (S-Rank)',   color: 'text-red-400 border-red-500/30 bg-red-950/20' };
  if (repos >= 5)  return { label: 'Chunin Developer (A-Rank)',  color: 'text-orange border-orange/30 bg-orange/10'    };
  return               { label: 'Genin Developer (C-Rank)',      color: 'text-zinc-400 border-zinc-700 bg-zinc-900/30' };
}

const ShinobiStats = () => {
  const lcTotal   = leetcodeStats.solvedProblem  ?? 0;
  const lcEasy    = leetcodeStats.easySolved      ?? 0;
  const lcMedium  = leetcodeStats.mediumSolved    ?? 0;
  const lcHard    = leetcodeStats.hardSolved      ?? 0;
  const cfRating  = cfStats.rating;
  const cfRank    = cfStats.rank    || 'Unrated';
  const cfSolved  = cfStats.solvedCount ?? 0;
  const cfColor   = getCFColor(cfRank);
  const ghRank    = getGHRank(githubProfile.public_repos);

  const cardAnim = (dir) => ({
    initial: { opacity: 0, x: dir },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 },
  });

  return (
    <div className="w-full mt-12 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-main">

        {/* ── LEFT: GitHub Intel ─────────────────────────────────────────── */}
        <motion.div
          className="rounded-2xl border border-solid border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-md hover:border-zinc-700/60 transition-all duration-300"
          {...cardAnim(-25)}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-lg bg-zinc-800/60 text-orange">
              <Github size={20} />
            </div>
            <div>
              <h4 className="text-base font-bold text-white tracking-wide">GitHub Intel</h4>
              <p className="text-[11px] text-neutral-500">Live account synchronisation</p>
            </div>
            <a
              href={`https://github.com/${githubProfile.name?.split(' ')[0]?.toLowerCase() || 'borno18'}`}
              target="_blank" rel="noopener noreferrer"
              aria-label="GitHub profile"
              className="ml-auto text-zinc-600 hover:text-orange transition-colors duration-200"
            >
              <ExternalLink size={14} />
            </a>
          </div>

          {/* User card */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-950/50 border border-solid border-zinc-800/40 mb-5">
            <img
              src={githubProfile.avatar_url}
              alt={githubProfile.name}
              className="w-12 h-12 rounded-full border border-solid border-zinc-700/80 object-cover shadow-md"
            />
            <div>
              <h5 className="font-bold text-zinc-100 text-sm">{githubProfile.name}</h5>
              <div className="flex items-center gap-1.5 text-neutral-400 text-xs mt-0.5">
                <MapPin size={11} className="text-orange" />
                <span>{githubProfile.location}</span>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2.5 text-center mb-5">
            {[
              { icon: <BookOpen size={14} />, value: githubProfile.public_repos, label: 'Repos' },
              { icon: <Users size={14} />,    value: githubProfile.followers,    label: 'Followers' },
              { icon: <Award size={14} />,    value: githubProfile.following,    label: 'Following' },
            ].map(({ icon, value, label }) => (
              <div key={label} className="p-2.5 rounded-lg bg-zinc-950/30 border border-solid border-zinc-800/40">
                <div className="flex justify-center text-zinc-500 mb-1">{icon}</div>
                <span className="block text-lg font-bold text-white">{value}</span>
                <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold">{label}</span>
              </div>
            ))}
          </div>

          {/* Rank badge */}
          <div className={`flex items-center justify-between p-3 rounded-xl border border-solid ${ghRank.color}`}>
            <div className="flex items-center gap-2">
              <Trophy size={14} />
              <span className="text-xs font-bold tracking-wide">Developer Rank</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">{ghRank.label}</span>
          </div>
        </motion.div>

        {/* ── RIGHT: Problem Solving (LC + CF) ──────────────────────────── */}
        <motion.div
          className="rounded-2xl border border-solid border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-md hover:border-zinc-700/60 transition-all duration-300 flex flex-col gap-5"
          {...cardAnim(25)}
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-zinc-800/60 text-orange">
              <Code2 size={20} />
            </div>
            <div>
              <h4 className="text-base font-bold text-white tracking-wide">Problem Solving</h4>
              <p className="text-[11px] text-neutral-500">LeetCode &amp; Codeforces — live tracking</p>
            </div>
          </div>

          {/* ── LeetCode sub-card ────────────────────────────────────────── */}
          <div className="rounded-xl border border-solid border-zinc-800/50 bg-zinc-950/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">LeetCode</span>
                <span className="text-[10px] text-neutral-500">nightguy01</span>
              </div>
              <a
                href="https://leetcode.com/u/nightguy01/"
                target="_blank" rel="noopener noreferrer"
                aria-label="LeetCode profile"
                className="text-zinc-600 hover:text-amber-400 transition-colors duration-200"
              >
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="flex items-end gap-1 mb-4">
              <span className="text-2xl font-black text-white">{lcTotal}</span>
              <span className="text-xs text-neutral-500 mb-0.5">solved</span>
            </div>

            <div className="space-y-2.5">
              {[
                { label: 'Easy',   count: lcEasy,   color: 'bg-emerald-500', labelColor: 'text-emerald-400' },
                { label: 'Medium', count: lcMedium, color: 'bg-amber-500',   labelColor: 'text-amber-400'   },
                { label: 'Hard',   count: lcHard,   color: 'bg-red-500',     labelColor: 'text-red-400'     },
              ].map(({ label, count, color, labelColor }) => (
                <div key={label}>
                  <div className="flex justify-between text-[11px] font-semibold mb-1">
                    <span className={labelColor}>{label}</span>
                    <span className="text-neutral-400">{count}</span>
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`${color} h-1.5 rounded-full transition-all duration-700`}
                      style={{ width: `${lcTotal > 0 ? (count / lcTotal) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Codeforces sub-card ──────────────────────────────────────── */}
          <div className="rounded-xl border border-solid border-zinc-800/50 bg-zinc-950/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Codeforces</span>
                <span className="text-[10px] text-neutral-500">nightguy01</span>
              </div>
              <a
                href="https://codeforces.com/profile/nightguy01"
                target="_blank" rel="noopener noreferrer"
                aria-label="Codeforces profile"
                className="text-zinc-600 hover:text-blue-400 transition-colors duration-200"
              >
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-zinc-900/60">
                <span className="block text-xl font-black text-white">
                  {cfRating !== null ? cfRating : '—'}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-neutral-500">Rating</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900/60">
                <span className="block text-xl font-black text-white">{cfSolved}</span>
                <span className="text-[9px] uppercase tracking-wider text-neutral-500">Solved</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900/60">
                <Zap size={14} className="mx-auto text-zinc-500 mb-1" />
                <span className="block text-[10px] font-bold text-zinc-300 capitalize truncate">{cfRank}</span>
                <span className="text-[9px] uppercase tracking-wider text-neutral-500">Rank</span>
              </div>
            </div>

            {/* CF rank badge */}
            <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-solid ${cfColor.border} ${cfColor.bg}`}>
              <Trophy size={12} className={cfColor.text} />
              <span className={`text-[11px] font-bold uppercase tracking-wide ${cfColor.text}`}>
                Max Rating: {cfStats.maxRating !== null ? cfStats.maxRating : 'Unrated'}
              </span>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default ShinobiStats;
