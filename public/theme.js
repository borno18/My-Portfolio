(() => {
  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  const storageKey = 'portfolio-theme';
  let saved;
  try { saved = localStorage.getItem(storageKey); } catch {}

  const automatic = () => preference.matches ? 'dark' : 'light';
  let selected = ['light', 'dark'].includes(saved) ? saved : undefined;

  function apply(theme) {
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1d231f' : '#f5efe5');
    const button = document.querySelector('[data-theme-toggle]');
    if (button) {
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
      button.hidden = false;
    }
  }

  apply(selected || automatic());
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('[data-theme-toggle]');
    apply(selected || automatic());
    const masthead = document.querySelector('.masthead');
    if (masthead && 'ResizeObserver' in window) {
      const updateOffset = () => root.style.setProperty('--masthead-offset', masthead.offsetHeight + 'px');
      updateOffset();
      new ResizeObserver(updateOffset).observe(masthead);
    }
    button?.addEventListener('click', () => {
      selected = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(storageKey, selected); } catch {}
      apply(selected);
    });
  });
  window.addEventListener('storage', event => {
    if (event.key !== storageKey) return;
    selected = ['light', 'dark'].includes(event.newValue) ? event.newValue : undefined;
    apply(selected || automatic());
  });
  preference.addEventListener('change', () => { if (!selected) apply(automatic()); });
})();
