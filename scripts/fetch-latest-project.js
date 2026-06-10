import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERNAME = 'borno18';

// Target files paths
const reposPath = path.join(__dirname, '..', 'src', 'data', 'latest-project.json');
const profilePath = path.join(__dirname, '..', 'src', 'data', 'github-profile.json');
const leetcodePath = path.join(__dirname, '..', 'src', 'data', 'leetcode-stats.json');

// Ensure parent directory exists
const dataDir = path.join(__dirname, '..', 'src', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const ghHeaders = {
  'User-Agent': 'portfolio-build-script',
  'Accept': 'application/vnd.github.v3+json',
};

if (process.env.GITHUB_TOKEN) {
  console.log('[GitHub Fetch] Authorization token detected.');
  ghHeaders['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
}

// Helper to handle API fetch with cache fallback
async function fetchWithFallback({ url, headers = {}, outputPath, fallbackData, name, dataFormatter }) {
  console.log(`[API Fetch] Fetching ${name}...`);
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }
    const data = await response.json();
    const formattedData = dataFormatter ? dataFormatter(data) : data;
    
    fs.writeFileSync(outputPath, JSON.stringify(formattedData, null, 2), 'utf-8');
    console.log(`[API Fetch] Saved ${name} successfully to ${outputPath}`);
  } catch (error) {
    console.error(`[API Fetch] Error fetching ${name}:`, error.message);
    
    if (fs.existsSync(outputPath)) {
      console.log(`[API Fetch] Cache found for ${name}. Keeping existing cache.`);
      try {
        JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
        return; // Valid cache exists, return
      } catch (err) {
        console.error(`[API Fetch] Cached ${name} was corrupt. Re-creating.`);
      }
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(fallbackData, null, 2), 'utf-8');
    console.log(`[API Fetch] Wrote fallback default values for ${name}`);
  }
}

async function runFetcher() {
  console.log('[Build Step] Running build-time API fetching pipeline...');

  const tasks = [
    // Task 1: Fetch Repositories
    fetchWithFallback({
      name: 'GitHub Repositories',
      url: `https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=5`,
      headers: ghHeaders,
      outputPath: reposPath,
      fallbackData: [
        {
          name: "My-Portfolio",
          description: "A premium, responsive developer portfolio showing my ninja-level coding skills.",
          html_url: `https://github.com/${USERNAME}/My-Portfolio`,
          stargazers_count: 0,
          forks_count: 0,
          language: "JavaScript",
          updated_at: new Date().toISOString()
        }
      ],
      dataFormatter: (repos) => {
        if (!Array.isArray(repos)) throw new Error('Invalid repos response');
        return repos
          .filter(repo => !repo.fork)
          .map(repo => ({
            name: repo.name,
            description: repo.description || "No description provided for this ninja mission.",
            html_url: repo.html_url,
            stargazers_count: repo.stargazers_count ?? 0,
            forks_count: repo.forks_count ?? 0,
            language: repo.language || "Markdown",
            updated_at: repo.updated_at
          }));
      }
    }),

    // Task 2: Fetch GitHub Profile Stats
    fetchWithFallback({
      name: 'GitHub Profile Details',
      url: `https://api.github.com/users/${USERNAME}`,
      headers: ghHeaders,
      outputPath: profilePath,
      fallbackData: {
        avatar_url: `https://github.com/${USERNAME}.png`,
        name: "Joydip Majumdar",
        public_repos: 7,
        followers: 6,
        following: 19,
        location: "Sylhet, Bangladesh"
      },
      dataFormatter: (profile) => ({
        avatar_url: profile.avatar_url || `https://github.com/${USERNAME}.png`,
        name: profile.name || "Joydip Majumdar",
        public_repos: profile.public_repos ?? 0,
        followers: profile.followers ?? 0,
        following: profile.following ?? 0,
        location: profile.location || "Sylhet, Bangladesh"
      })
    }),

    // Task 3: Fetch LeetCode Stats
    fetchWithFallback({
      name: 'LeetCode solved count',
      url: `https://alfa-leetcode-api.onrender.com/${USERNAME}/solved`,
      outputPath: leetcodePath,
      fallbackData: {
        solvedProblem: 1,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 1
      },
      dataFormatter: (lc) => ({
        solvedProblem: lc.solvedProblem ?? 0,
        easySolved: lc.easySolved ?? 0,
        mediumSolved: lc.mediumSolved ?? 0,
        hardSolved: lc.hardSolved ?? 0
      })
    })
  ];

  await Promise.allSettled(tasks);
  console.log('[Build Step] API fetching pipeline complete.');
}

runFetcher();
