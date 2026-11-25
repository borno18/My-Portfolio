export function setupArticleEditor(form: HTMLFormElement) {
  const writing = form.querySelector<HTMLElement>('#editor-writing-panel')!;
  const settings = form.querySelector<HTMLElement>('#editor-settings')!;
  const views = form.querySelector<HTMLElement>('[data-editor-views]')!;
  const viewButtons = [...views.querySelectorAll<HTMLButtonElement>('button')];
  const body = form.elements.namedItem('body') as HTMLTextAreaElement;
  const title = form.elements.namedItem('title') as HTMLInputElement;
  const slug = form.elements.namedItem('slug') as HTMLInputElement;
  const schedule = form.elements.namedItem('publish_at') as HTMLInputElement;
  const publish = form.querySelector<HTMLButtonElement>('[data-publish-button]')!;
  const toolbar = form.querySelector<HTMLElement>('[data-editor-tools]')!;
  const formatButtons = [...toolbar.querySelectorAll<HTMLButtonElement>('[data-before]')];
  const previewButton = form.querySelector<HTMLButtonElement>('[data-live-preview]')!;
  const preview = form.querySelector<HTMLElement>('#editor-preview')!;
  const previewContent = preview.querySelector<HTMLElement>('[data-preview-content]')!;
  const previewFeedback = preview.querySelector<HTMLElement>('[data-preview-feedback]')!;

  const showView = (view: string) => {
    settings.hidden = view !== 'settings';
    writing.hidden = view !== 'write';
    for (const button of viewButtons) button.setAttribute('aria-pressed', String(button.dataset.editorView === view));
  };
  views.hidden = toolbar.hidden = false;
  for (const button of viewButtons) button.addEventListener('click', () => showView(button.dataset.editorView!));
  showView(form.dataset.settingsOpen === 'yes' ? 'settings' : 'write');
  let firstInvalid = true;
  form.addEventListener('invalid', event => {
    if (!firstInvalid) return;
    firstInvalid = false;
    if (settings.contains(event.target as Node)) showView('settings');
    if (writing.contains(event.target as Node)) showView('write');
    queueMicrotask(() => { firstInvalid = true; });
  }, true);

  let autoSlug = !slug.value;
  slug.addEventListener('input', () => { autoSlug = !slug.value; });
  title.addEventListener('input', () => {
    if (!slug.readOnly && autoSlug) {
      slug.value = title.value.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').slice(0, 100).replace(/^-|-$/g, '');
    }
  });
  schedule.addEventListener('input', () => {
    publish.textContent = schedule.value ? 'Schedule publication' : publish.dataset.publishLabel!;
  });

  const format = (button: HTMLButtonElement) => {
    const before = button.dataset.before!;
    const after = button.dataset.after || '';
    const start = body.selectionStart;
    const end = body.selectionEnd;
    if (body.value.length + before.length + after.length > body.maxLength) return;
    if (after) {
      body.setRangeText(before + body.value.slice(start, end) + after, start, end);
      body.setSelectionRange(start + before.length, end + before.length);
    } else {
      const lineStart = start === 0 ? 0 : body.value.lastIndexOf('\n', start - 1) + 1;
      body.setRangeText(before, lineStart, lineStart);
      body.setSelectionRange(start + before.length, end + before.length);
    }
    body.focus();
    body.dispatchEvent(new Event('input', { bubbles: true }));
  };
  for (const button of formatButtons) button.addEventListener('click', () => format(button));
  body.addEventListener('keydown', event => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;
    const button = formatButtons.find(tool => tool.dataset.shortcut === event.key.toUpperCase());
    if (!button) return;
    event.preventDefault();
    format(button);
  });

  let request: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout>;
  const cancelPreview = () => { clearTimeout(timer); request?.abort(); };
  const renderPreview = async () => {
    const controller = new AbortController();
    request = controller;
    if (!body.value.trim()) {
      previewContent.replaceChildren();
      previewFeedback.textContent = 'Write something to preview it.';
      return;
    }
    try {
      const data = new URLSearchParams({ action: 'live-preview', body: body.value });
      const response = await fetch('/admin?section=blog', { method: 'POST', body: data, signal: controller.signal });
      if (!response.ok) throw new Error();
      const html = await response.text();
      if (controller.signal.aborted) return;
      // The server renders and sanitizes Markdown with the same rules as public articles.
      previewContent.innerHTML = html;
      previewFeedback.textContent = '';
    } catch {
      if (!controller.signal.aborted) previewFeedback.textContent = 'Preview unavailable. Toggle it off and on to retry.';
    }
  };
  previewButton.addEventListener('click', () => {
    cancelPreview();
    preview.hidden = !preview.hidden;
    previewButton.setAttribute('aria-pressed', String(!preview.hidden));
    if (!preview.hidden) void renderPreview();
  });
  body.addEventListener('input', () => {
    if (preview.hidden) return;
    cancelPreview();
    timer = setTimeout(() => void renderPreview(), 300);
  });

  let dirty = false;
  form.addEventListener('input', () => { dirty = true; });
  form.addEventListener('submit', () => { dirty = false; });
  window.addEventListener('beforeunload', event => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });
  setupCover(form);
}

function setupCover(form: HTMLFormElement) {
  const zone = form.querySelector<HTMLElement>('[data-cover-drop]')!;
  const input = form.elements.namedItem('cover') as HTMLInputElement;
  const alt = form.elements.namedItem('cover_alt') as HTMLInputElement;
  const removeSaved = form.elements.namedItem('remove_cover') as HTMLInputElement | null;
  const thumbnail = zone.querySelector<HTMLImageElement>('[data-cover-thumbnail]')!;
  const savedSrc = thumbnail.getAttribute('src');
  const label = zone.querySelector<HTMLElement>('[data-cover-label]')!;
  const feedback = form.querySelector<HTMLElement>('[data-cover-feedback]')!;
  const remove = form.querySelector<HTMLButtonElement>('[data-remove-cover]')!;
  zone.querySelector<HTMLElement>('[data-drop-instruction]')!.hidden = false;
  const fallback = form.querySelector<HTMLElement>('[data-cover-fallback]');
  if (fallback) fallback.hidden = true;

  const update = () => {
    const file = input.files?.[0];
    const saved = savedSrc && !removeSaved?.checked;
    alt.required = Boolean(file || saved);
    thumbnail.hidden = true;
    label.textContent = file || saved ? 'Replace cover' : 'Choose cover';
    remove.hidden = !file && !savedSrc;
    remove.textContent = !file && removeSaved?.checked ? 'Restore saved cover' : 'Remove cover';
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        if (input.files?.[0] !== file || typeof reader.result !== 'string') return;
        thumbnail.src = reader.result;
        thumbnail.hidden = false;
      });
      reader.readAsDataURL(file);
    } else if (saved) {
      thumbnail.src = saved;
      thumbnail.hidden = false;
    }
  };
  const valid = (file?: File) => Boolean(file && file.size > 0 && file.size <= 3500000 &&
    (file.type ? ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) : /\.(jpe?g|png|webp)$/i.test(file.name)));
  const invalid = 'Choose one JPG, PNG, or WebP image under 3.5 MB.';
  const choose = () => {
    const file = input.files?.[0];
    if (file && !valid(file)) {
      input.value = '';
      feedback.textContent = invalid;
    } else if (file) {
      if (removeSaved) removeSaved.checked = false;
      feedback.textContent = file.name + ' selected. Save the article to apply it.';
    }
    update();
  };
  input.addEventListener('change', choose);
  zone.addEventListener('dragover', event => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    zone.classList.add('is-dragging');
  });
  zone.addEventListener('dragleave', event => {
    if (!zone.contains(event.relatedTarget as Node | null)) zone.classList.remove('is-dragging');
  });
  zone.addEventListener('drop', event => {
    event.preventDefault();
    zone.classList.remove('is-dragging');
    const files = event.dataTransfer?.files;
    if (files?.length !== 1 || !valid(files[0])) {
      feedback.textContent = invalid;
      return;
    }
    input.files = files;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    choose();
  });
  remove.addEventListener('click', () => {
    if (input.files?.length) {
      input.value = '';
      feedback.textContent = 'Selected image removed.';
    } else if (removeSaved) {
      removeSaved.checked = !removeSaved.checked;
      feedback.textContent = removeSaved.checked ? 'The saved cover will be removed when you save.' : 'Saved cover restored.';
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    update();
    if (remove.hidden) input.focus();
  });
  update();
}
