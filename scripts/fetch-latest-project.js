import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERNAME = 'borno18';
const API_URL = `https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=5`;
const outputPath = path.join(__dirname, '..', 'src', 'data', 'latest-project.json');

async function fetchLatestProjects() {
  console.log(`[GitHub Fetch] Fetching latest repositories for user: ${USERNAME}...`);

  const headers = {
    'User-Agent': 'portfolio-build-script',
    'Accept': 'application/vnd.github.v3+json',
  };

  if (process.env.GITHUB_TOKEN) {
    console.log('[GitHub Fetch] Authorization token detected.');
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(API_URL, { headers });

    if (!response.ok) {
      throw new Error(`GitHub API returned status ${response.status}: ${response.statusText}`);
    }

    const repos = await response.json();
    if (!repos || !Array.isArray(repos)) {
      throw new Error(`Invalid response structure from GitHub API`);
    }

    // Filter out forks and map required fields
    const projectsData = repos
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

    console.log(`[GitHub Fetch] Successfully fetched and processed ${projectsData.length} repositories.`);

    // Ensure directory exists
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write to local json file
    fs.writeFileSync(outputPath, JSON.stringify(projectsData, null, 2), 'utf-8');
    console.log(`[GitHub Fetch] Data written successfully to ${outputPath}`);
  } catch (error) {
    console.error('[GitHub Fetch] Error fetching repositories from GitHub:', error.message);

    // Try to fall back to the existing cache first
    if (fs.existsSync(outputPath)) {
      console.log(`[GitHub Fetch] Cache found at ${outputPath}. Preserving existing cache for build safety.`);
      try {
        const cachedData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
        console.log(`[GitHub Fetch] Successfully verified cache file containing ${cachedData.length} items.`);
        return; // Return early without overwriting the file
      } catch (cacheError) {
        console.error('[GitHub Fetch] Existing cache file was corrupt, recreating cache with default values.');
      }
    }

    // If no cache or corrupt cache, write default values to prevent build crash
    const fallbackData = [
      {
        name: "My-Portfolio",
        description: "A premium, responsive developer portfolio showing my ninja-level coding skills.",
        html_url: `https://github.com/${USERNAME}/My-Portfolio`,
        stargazers_count: 0,
        forks_count: 0,
        language: "JavaScript",
        updated_at: new Date().toISOString()
      }
    ];

    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(fallbackData, null, 2), 'utf-8');
    console.log(`[GitHub Fetch] Wrote fallback repository array to prevent build failure.`);
  }
}

fetchLatestProjects();
