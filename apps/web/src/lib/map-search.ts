import { mapReadingHref } from './map-branches';

export function attachMapSearch(form: HTMLFormElement) {
  const input = form.querySelector<HTMLInputElement>('input[type="search"]');
  const box = form.querySelector<HTMLElement>('[data-map-results]');
  if (!input || !box) return;
  let revision = 0;
  const close = () => { revision++; box.hidden = true; };
  const update = async () => {
    const query = input.value.trim();
    if (!query) { close(); return; }
    const request = ++revision;
    const message = document.createElement('p');
    message.setAttribute('role', 'status');
    message.textContent = 'Searching the catalogue…';
    box.replaceChildren(message);
    box.hidden = false;
    try {
      const [{ findEntries }, { previewNodes }] = await Promise.all([import('./search-index'), import('./map-previews')]);
      if (revision !== request) return;
      const results = findEntries(query);
      message.textContent = results.length ? `Showing ${Math.min(8, results.length)} of ${results.length} matches` : 'No matching item. Try a shorter name or a passage number.';
      const list = document.createElement('ul');
      for (const result of results.slice(0, 8)) {
        const row = document.createElement('li');
        const link = document.createElement('a');
        link.href = result.node && previewNodes.has(result.node) ? mapReadingHref(result.node) : result.url;
        if (result.branch && (result.node || result.reference)) {
          link.dataset.homeResultBranch = result.branch;
          link.dataset.title = result.title;
          link.dataset.summary = result.context + '. ' + result.text;
          link.dataset.reading = result.url;
          if (result.node) link.dataset.homeNode = result.node;
          if (result.reference) link.dataset.homeReference = result.url;
        }
        link.textContent = result.title;
        const context = document.createElement('small');
        context.textContent = result.context;
        link.append(context);
        row.append(link);
        list.append(row);
      }
      box.append(list);
    } catch {
      if (revision === request) message.textContent = 'Use Find to open the full search page.';
    }
  };
  input.addEventListener('input', () => void update());
  input.addEventListener('focus', () => { if (box.hidden && input.value) void update(); });
  box.addEventListener('click', (event) => {
    if ((event.target as Element).closest('[data-home-result-branch]')) requestAnimationFrame(close);
  });
  form.addEventListener('focusout', (event) => { if (!form.contains(event.relatedTarget as Node | null)) close(); });
  form.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !box.hidden) { event.preventDefault(); input.focus(); close(); }
  });
  if (input.value) void update();
}
