import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Usernames ───────────────────────────────────────────────────────────────
const GH_USERNAME = 'borno18';
const LC_USERNAME = 'nightguy01';   // LeetCode
const CF_USERNAME = 'nightguy01';   // Codeforces
// ─────────────────────────────────────────────────────────────────────────────

const dataDir      = path.join(__dirname, '..', 'src', 'data');
const reposPath    = path.join(dataDir, 'latest-project.json');
const profilePath  = path.join(dataDir, 'github-profile.json');
const leetcodePath = path.join(dataDir, 'leetcode-stats.json');
const cfPath       = path.join(dataDir, 'codeforces-stats.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const ghHeaders = {
  'User-Agent': 'portfolio-build-script',
  'Accept': 'application/vnd.github.v3+json',
};
if (process.env.GITHUB_TOKEN) {
  ghHeaders['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
}

async function safeFetch(url, options = {}) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000), ...options });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function readCached(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch { return null; }
}

// ─── Count unique AC problems from CF status array ───────────────────────────
function countCFSolved(submissions) {
  const solved = new Set();
  for (const sub of submissions) {
    if (sub.verdict === 'OK') {
      solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
    }
  }
  return solved.size;
}

async function runFetcher() {
  console.log('[Build] Starting API fetch pipeline...\n');

  // ── 1. GitHub Repositories ─────────────────────────────────────────────────
  try {
    const repos = await safeFetch(
      `https://api.github.com/users/${GH_USERNAME}/repos?sort=updated&per_page=6`,
      { headers: ghHeaders }
    );
    const data = repos
      .filter(r => !r.fork)
      .map(r => ({
        name: r.name,
        description: r.description || 'No description provided.',
        html_url: r.html_url,
        stargazers_count: r.stargazers_count ?? 0,
        forks_count: r.forks_count ?? 0,
        language: r.language || 'Markdown',
        updated_at: r.updated_at,
      }));
    writeJSON(reposPath, data);
    console.log('[GitHub] ✓ Repositories saved');
  } catch (e) {
    console.error(`[GitHub] ✗ Repositories: ${e.message}`);
    if (!readCached(reposPath)) writeJSON(reposPath, [{
      name: 'My-Portfolio', description: 'Developer portfolio.',
      html_url: `https://github.com/${GH_USERNAME}/My-Portfolio`,
      stargazers_count: 0, forks_count: 0, language: 'JavaScript',
      updated_at: new Date().toISOString()
    }]);
  }

  // ── 2. GitHub Profile ──────────────────────────────────────────────────────
  try {
    const p = await safeFetch(`https://api.github.com/users/${GH_USERNAME}`, { headers: ghHeaders });
    writeJSON(profilePath, {
      avatar_url: p.avatar_url,
      name: p.name || 'Joydip Majumdar',
      public_repos: p.public_repos ?? 0,
      followers: p.followers ?? 0,
      following: p.following ?? 0,
      location: p.location || 'Sylhet, Bangladesh',
    });
    console.log('[GitHub] ✓ Profile saved');
  } catch (e) {
    console.error(`[GitHub] ✗ Profile: ${e.message}`);
    if (!readCached(profilePath)) writeJSON(profilePath, {
      avatar_url: `https://github.com/${GH_USERNAME}.png`,
      name: 'Joydip Majumdar', public_repos: 7, followers: 6, following: 19,
      location: 'Sylhet, Bangladesh'
    });
  }

  // ── 3. LeetCode Stats ──────────────────────────────────────────────────────
  try {
    const lc = await safeFetch(`https://alfa-leetcode-api.onrender.com/${LC_USERNAME}/solved`);
    writeJSON(leetcodePath, {
      solvedProblem: lc.solvedProblem ?? 0,
      easySolved:    lc.easySolved    ?? 0,
      mediumSolved:  lc.mediumSolved  ?? 0,
      hardSolved:    lc.hardSolved    ?? 0,
    });
    console.log('[LeetCode] ✓ Stats saved');
  } catch (e) {
    console.error(`[LeetCode] ✗ ${e.message}`);
    if (!readCached(leetcodePath)) writeJSON(leetcodePath, { solvedProblem: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0 });
  }

  // ── 4. Codeforces Stats ────────────────────────────────────────────────────
  try {
    const cfInfo = await safeFetch(`https://codeforces.com/api/user.info?handles=${CF_USERNAME}`);
    if (!cfInfo.result?.[0]) throw new Error('No CF user result');
    const u = cfInfo.result[0];

    // Count unique solved problems from submissions
    let solvedCount = 0;
    try {
      const statusData = await safeFetch(
        `https://codeforces.com/api/user.status?handle=${CF_USERNAME}&from=1&count=10000`
      );
      if (statusData.result) solvedCount = countCFSolved(statusData.result);
    } catch { /* non-critical */ }

    writeJSON(cfPath, {
      handle: u.handle,
      rating: u.rating ?? null,
      maxRating: u.maxRating ?? null,
      rank: u.rank ?? 'Newbie',
      maxRank: u.maxRank ?? 'Newbie',
      avatar: u.titlePhoto || u.avatar || '',
      solvedCount,
    });
    console.log(`[Codeforces] ✓ Stats saved (rating: ${u.rating ?? 'Unrated'}, solved: ${solvedCount})`);
  } catch (e) {
    console.error(`[Codeforces] ✗ ${e.message}`);
    if (!readCached(cfPath) || Object.keys(readCached(cfPath) || {}).length === 0) {
      writeJSON(cfPath, {
        handle: CF_USERNAME, rating: null, maxRating: null,
        rank: 'Unrated', maxRank: 'Unrated', avatar: '', solvedCount: 0
      });
    }
  }

  console.log('\n[Build] ✓ Pipeline complete.');
}

runFetcher();
