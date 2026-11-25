export const githubOwner = 'borno18';

async function github(path) {
  const response = await fetch('https://api.github.com' + path, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'joydip-portfolio' },
    signal: AbortSignal.timeout(6000),
    redirect: 'error',
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('GitHub repositories are temporarily unavailable.');
  return { rows: await response.json(), hasMore: /rel="next"/.test(response.headers.get('link') || '') };
}

function repository(repo) {
  if (!repo || repo.private !== false || repo.owner?.login?.toLowerCase() !== githubOwner ||
      !Number.isSafeInteger(repo.id) || !/^[A-Za-z0-9_.-]{1,100}$/.test(repo.name)) return null;
  return {
    slug: 'github-' + repo.id,
    name: repo.name,
    description: (repo.description || '').slice(0, 350),
    language: (repo.language || '').slice(0, 60),
  };
}

let snapshot;
let loading;

export async function listRepositories(refresh = false) {
  if (!refresh && snapshot && Date.now() - Date.parse(snapshot.syncedAt) < 300000) return snapshot;
  loading ||= (async () => {
    const repositories = [];
    for (let page = 1; ; page++) {
      const response = await github('/users/' + githubOwner + '/repos?type=owner&sort=updated&per_page=100&page=' + page);
      for (const row of response?.rows || []) {
        const repo = repository(row);
        if (repo) repositories.push({
          ...repo,
          stars: Number.isSafeInteger(row.stargazers_count) ? row.stargazers_count : 0,
          updatedAt: Number.isFinite(Date.parse(row.updated_at)) ? row.updated_at : null,
        });
      }
      if (!response?.hasMore) break;
    }
    snapshot = { repositories, syncedAt: new Date().toISOString() };
    return snapshot;
  })().finally(() => { loading = null; });
  try {
    return await loading;
  } catch (error) {
    if (!snapshot) throw error;
    return { ...snapshot, stale: true };
  }
}

export async function getRepository(name) {
  if (!/^[A-Za-z0-9_.-]{1,100}$/.test(name) || ['.', '..'].includes(name)) return null;
  const response = await github('/repos/' + githubOwner + '/' + encodeURIComponent(name));
  return repository(response?.rows);
}
