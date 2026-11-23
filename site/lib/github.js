export const githubOwner = 'borno18';

async function github(path) {
  const response = await fetch('https://api.github.com' + path, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'joydip-portfolio' },
    signal: AbortSignal.timeout(6000),
    redirect: 'error',
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('GitHub repositories are temporarily unavailable.');
  return response.json();
}

function repository(repo) {
  if (!repo || repo.private !== false || repo.owner?.login.toLowerCase() !== githubOwner ||
      !Number.isSafeInteger(repo.id) || !/^[A-Za-z0-9_.-]{1,100}$/.test(repo.name)) return null;
  return {
    slug: 'github-' + repo.id,
    name: repo.name,
    description: (repo.description || '').slice(0, 350),
    language: (repo.language || '').slice(0, 60),
  };
}

export async function listRepositories(page) {
  const perPage = 30;
  const rows = await github('/users/' + githubOwner + '/repos?type=owner&sort=updated&per_page=' + perPage + '&page=' + page);
  return { repositories: (rows || []).map(repository).filter(Boolean), hasNext: rows?.length === perPage };
}

export async function getRepository(name) {
  if (!/^[A-Za-z0-9_.-]{1,100}$/.test(name) || ['.', '..'].includes(name)) return null;
  return repository(await github('/repos/' + githubOwner + '/' + encodeURIComponent(name)));
}
