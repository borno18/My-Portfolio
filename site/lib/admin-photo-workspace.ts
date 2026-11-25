export function setupPhotoGallery(gallery: HTMLElement) {
  const selectAll = gallery.querySelector<HTMLInputElement>('[data-select-photos]');
  const boxes = [...gallery.querySelectorAll<HTMLInputElement>('.photo-checkbox')];
  const selection = gallery.querySelector<HTMLElement>('[data-photo-selected]');
  if (selectAll && selection && boxes.length) {
    selectAll.closest('label')!.hidden = false;
    const update = () => {
      const count = boxes.filter(box => box.checked).length;
      selectAll.checked = count === boxes.length;
      selectAll.indeterminate = count > 0 && count < boxes.length;
      selection.textContent = count + ' selected';
    };
    selectAll.addEventListener('change', () => {
      for (const box of boxes) box.checked = selectAll.checked;
      update();
    });
    for (const box of boxes) box.addEventListener('change', update);
    update();
  }

  const grid = gallery.querySelector<HTMLElement>('[data-photo-grid]');
  const reorder = gallery.querySelector<HTMLFormElement>('.photo-reorder');
  if (!grid || !reorder) return;
  const initial = [...grid.querySelectorAll<HTMLElement>('[data-photo-id]')];
  const current = () => [...grid.querySelectorAll<HTMLElement>('[data-photo-id]')];
  const update = () => { reorder.hidden = current().every((card, index) => card === initial[index]); };
  const moveCard = (card: HTMLElement, target: HTMLElement) => {
    if (card === target) return;
    if (card.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING) target.after(card);
    else target.before(card);
    update();
  };
  let dragged: HTMLElement | null = null;
  for (const card of initial) {
    card.draggable = matchMedia('(any-pointer: fine)').matches;
    for (const child of card.querySelectorAll<HTMLElement>('a, img')) child.draggable = false;
    card.addEventListener('dragstart', event => {
      dragged = card;
      event.dataTransfer?.setData('text/plain', card.dataset.photoId || '');
      card.classList.add('is-dragging');
    });
    card.addEventListener('dragend', () => { card.classList.remove('is-dragging'); dragged = null; });
    card.addEventListener('dragover', event => { if (dragged) event.preventDefault(); });
    card.addEventListener('drop', event => {
      if (!dragged || dragged === card) return;
      event.preventDefault();
      moveCard(dragged, card);
    });
    const handle = card.querySelector<HTMLButtonElement>('[data-photo-drag]');
    if (handle) {
      handle.hidden = false;
      handle.addEventListener('pointerdown', event => {
        if (event.pointerType === 'mouse') return;
        handle.setPointerCapture(event.pointerId);
        card.classList.add('is-dragging');
      });
      handle.addEventListener('pointerup', event => {
        if (!handle.hasPointerCapture(event.pointerId)) return;
        card.classList.remove('is-dragging');
        const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('.photo-card');
        if (target && grid.contains(target)) moveCard(card, target);
      });
      handle.addEventListener('lostpointercapture', () => card.classList.remove('is-dragging'));
    }
    card.addEventListener('keydown', event => {
      if (!event.altKey || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const sibling = event.key === 'ArrowUp' ? card.previousElementSibling : card.nextElementSibling;
      if (!sibling) return;
      if (event.key === 'ArrowUp') sibling.before(card);
      else sibling.after(card);
      (event.target as HTMLElement).focus({ preventScroll: true });
      update();
    });
  }
  reorder.querySelector('[data-discard-order]')?.addEventListener('click', () => {
    grid.append(...initial);
    update();
    const filters = document.querySelector<HTMLFormElement>('[data-live-filters="photos"]');
    if (filters?.dataset.waitingForOrder) {
      delete filters.dataset.waitingForOrder;
      filters.requestSubmit();
    }
    grid.querySelector<HTMLAnchorElement>('.photo-image')?.focus({ preventScroll: true });
  });
  reorder.addEventListener('submit', () => {
    for (const input of reorder.querySelectorAll('[name=id]')) input.remove();
    for (const card of current()) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'id';
      input.value = card.dataset.photoId || '';
      reorder.append(input);
    }
    reorder.dataset.saving = 'true';
  });
}

export function setupPhotoDrawer(drawer: HTMLDialogElement) {
  const close = drawer.querySelector<HTMLAnchorElement>('[data-close-photo]')!;
  drawer.removeAttribute('open');
  drawer.showModal();
  const closeDrawer = () => {
    drawer.close();
    history.replaceState(history.state, '', close.href);
    const card = [...document.querySelectorAll<HTMLElement>('.photo-card')].find(card => card.dataset.photoId === drawer.dataset.photoId);
    card?.classList.remove('is-selected');
    const trigger = card?.querySelector<HTMLElement>('.photo-image') || document.querySelector<HTMLElement>('[data-photo-upload-link]');
    trigger?.focus({ preventScroll: true });
  };
  close.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    closeDrawer();
  });
  drawer.addEventListener('cancel', event => { event.preventDefault(); closeDrawer(); });

  const input = drawer.querySelector<HTMLInputElement>('input[type=file]');
  const feedback = drawer.querySelector<HTMLElement>('[data-file-help]');
  if (!input || !feedback) return;
  const help = feedback.textContent;
  input.addEventListener('change', () => { feedback.textContent = input.files?.[0]?.name || help; });
  input.form?.addEventListener('reset', () => { feedback.textContent = help; });
}
