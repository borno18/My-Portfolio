import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERNAME = 'borno18';
// Fetch top 5 recently updated repositories
const API_URL = `https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=5`;

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
        language: repo.language || "Markdown",
        updated_at: repo.updated_at
      }));

    console.log(`[GitHub Fetch] Successfully fetched and processed ${projectsData.length} repositories.`);

    const dataDir = path.join(__dirname, '..', 'src', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const outputPath = path.join(dataDir, 'latest-project.json');
    fs.writeFileSync(outputPath, JSON.stringify(projectsData, null, 2), 'utf-8');
    console.log(`[GitHub Fetch] Data written successfully to ${outputPath}`);
  } catch (error) {
    console.error('[GitHub Fetch] Error fetching repositories from GitHub:', error.message);

    // Fallback static array of projects to ensure the build doesn't fail
    const fallbackData = [
      {
        name: "My-Portfolio",
        description: "A premium, responsive developer portfolio showing my ninja-level coding skills.",
        html_url: `https://github.com/${USERNAME}/My-Portfolio`,
        stargazers_count: 0,
        language: "JavaScript",
        updated_at: new Date().toISOString()
      }
    ];

    const dataDir = path.join(__dirname, '..', 'src', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const outputPath = path.join(dataDir, 'latest-project.json');
    fs.writeFileSync(outputPath, JSON.stringify(fallbackData, null, 2), 'utf-8');
    console.log(`[GitHub Fetch] Wrote fallback repository array to prevent build failure.`);
  }
}

fetchLatestProjects();
