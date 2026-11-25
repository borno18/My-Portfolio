export function setupLiveFilters() {
  const form = document.querySelector<HTMLFormElement>('[data-live-filters]');
  if (!form) return;
  const selector = `[data-live-results="${form.dataset.liveFilters}"]`;
  const feedback = document.createElement('p');
  feedback.className = 'admin-filter-feedback';
  feedback.setAttribute('role', 'status');
  form.after(feedback);
  let pending: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout>;
  const cancel = () => { clearTimeout(timer); pending?.abort(); };
  const hasUnsavedOrder = (results: HTMLElement) => {
    if (!results.querySelector('.photo-reorder:not([hidden])')) return false;
    form.dataset.waitingForOrder = 'true';
    feedback.classList.remove('admin-sr-only');
    feedback.textContent = 'Save or discard the new photo order before filtering.';
    return true;
  };
  const refresh = async () => {
    const previous = document.querySelector<HTMLElement>(selector);
    if (!previous || hasUnsavedOrder(previous)) return;
    const controller = new AbortController();
    pending = controller;
    const url = new URL(form.action);
    for (const [name, value] of new FormData(form)) {
      if (String(value)) url.searchParams.set(name, String(value));
    }
    previous.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error();
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      const results = page.querySelector<HTMLElement>(selector);
      if (controller.signal.aborted || hasUnsavedOrder(previous)) return;
      if (!results) throw new Error();
      previous.replaceWith(results);
      for (const [link, state] of [['[data-repo-sync]', '[data-repo-sync-state]'], ['[data-photo-upload-link]', '[data-photo-upload-state]']]) {
        const anchor = document.querySelector<HTMLAnchorElement>(link);
        const url = results.querySelector<HTMLElement>(state)?.dataset.url;
        if (anchor && url) anchor.href = url;
      }
      history.replaceState(history.state, '', url);
      feedback.textContent = 'Results updated.';
      feedback.classList.add('admin-sr-only');
      document.dispatchEvent(new CustomEvent('admin:results-updated', { detail: results }));
    } catch {
      if (!controller.signal.aborted) {
        feedback.classList.remove('admin-sr-only');
        feedback.textContent = 'Could not refresh results. Try the filter again.';
      }
    } finally {
      if (pending === controller) previous.removeAttribute('aria-busy');
    }
  };
  form.addEventListener('input', event => {
    if (!(event.target instanceof HTMLInputElement) || event.target.type !== 'search') return;
    cancel();
    timer = setTimeout(() => void refresh(), 250);
  });
  form.addEventListener('change', event => {
    if (event.target instanceof HTMLSelectElement) { cancel(); void refresh(); }
  });
  form.addEventListener('submit', event => { event.preventDefault(); cancel(); void refresh(); });
}
