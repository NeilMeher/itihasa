import { homeSelectionEvent } from './explorer';
import { commitSelection, withQuery } from './selection';

const libraryPath = /^\/(?:mahabharata\/parva\/\d{2}\/#chapter-|ramayana\/\d{2}\/#sarga-)\d+$/;

function primaryClick(event: MouseEvent) {
  return event.button === 0 && !event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

export function attachHomeExplorer(home: HTMLElement) {
  const stage = home.querySelector<HTMLElement>('[data-home-stage]')!;
  const branchPanel = home.querySelector<HTMLElement>('#home-branch')!;
  const reader = home.querySelector<HTMLElement>('[data-home-reader]')!;
  const preview = home.querySelector<HTMLElement>('[data-home-preview]')!;
  const live = home.querySelector<HTMLElement>('[data-home-explorer]')!;
  const templates = new Map([...home.querySelectorAll<HTMLTemplateElement>('[data-branch-template]')].map((element) => [element.dataset.branchTemplate!, element]));
  const branchLinks = [...home.querySelectorAll<HTMLAnchorElement>('[data-home-branch]')];
  const branchLink = (branch: string) => branchLinks.find((anchor) => anchor.dataset.homeBranch === branch);
  const entries = () => [...branchPanel.querySelectorAll<HTMLAnchorElement>('[data-home-node]')];
  let branch = '';
  let opener: HTMLElement | undefined;
  let openedFrom = '';
  let cleanup: (() => void) | undefined;
  let loading: Promise<typeof import('./home-explorer-panel')> | undefined;
  let revision = 0;

  function prepare() {
    loading ??= import('./home-explorer-panel').catch((error) => { loading = undefined; throw error; });
    return loading;
  }

  function focusBranch(fallback = true) {
    const anchor = entries().find((entry) => entry.dataset.homeNode === openedFrom);
    if (opener?.isConnected && !opener.closest('[hidden]')) opener.focus();
    else if (anchor) anchor.focus();
    else if (fallback) branchPanel.querySelector<HTMLElement>('[data-branch-heading]')?.focus();
  }

  function close() {
    commitSelection(withQuery('/', { branch }));
    show();
    focusBranch();
  }

  function rememberOpener() {
    if (openedFrom) history.replaceState({ ...history.state, homeOpener: openedFrom }, '');
  }

  function setPreview(node: string, origin?: HTMLAnchorElement, reference?: string) {
    const entry = origin?.dataset.title ? origin : entries().find((link) => link.dataset.homeNode === node);
    const article = document.createElement('article');
    article.className = 'home-quick-reading';
    article.setAttribute('aria-label', 'Reading preview');
    const heading = document.createElement('h2');
    heading.tabIndex = -1;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'home-quick-close';
    button.setAttribute('aria-label', 'Close reading preview');
    button.textContent = '×';
    button.addEventListener('click', close);
    const text = document.createElement('p');
    const reading = document.createElement('a');
    reading.href = reference ?? (entry?.dataset.reading || withQuery('/explorer/', Object.fromEntries(new URLSearchParams(location.search))));
    reading.textContent = reference ? 'Open the exact Library entry →' : 'Open full reading →';
    heading.textContent = entry?.dataset.title ?? (reference ? `Chapter ${reference.match(/\/(\d{2})\/#[a-z]+-(\d+)/)?.slice(1).map(Number).join('.') ?? ''}` : 'Open the selected reading');
    text.textContent = entry?.dataset.summary ?? (reference ? 'The Library entry shows its edition, annotation status, and access to the primary text.' : 'The reading and its source open in the Explorer.');
    article.append(button);
    if (entry?.dataset.locator) {
      const locator = document.createElement('small');
      locator.textContent = entry.dataset.locator;
      article.append(locator);
    }
    article.append(heading, text, reading);
    if (entry?.dataset.passage) {
      const passage = document.createElement('a');
      passage.href = entry.dataset.passage;
      passage.textContent = 'Chapter and primary text →';
      article.append(passage);
    }
    preview.replaceChildren(article);
    preview.hidden = false;
    return heading;
  }

  function show(origin?: HTMLAnchorElement, shouldFocus = false) {
    const url = new URLSearchParams(location.search);
    const requested = url.get('branch') ?? '';
    const next = templates.has(requested) ? requested : '';
    const wasOpen = !reader.hidden;
    const node = next ? url.get('node') ?? '' : '';
    const ref = next ? url.get('ref') ?? '' : '';
    const reference = libraryPath.test(ref) ? ref : '';
    const run = ++revision;
    if (node && !shouldFocus) openedFrom = history.state?.homeOpener ?? node;
    if (next !== branch) {
      branchPanel.replaceChildren(...(templates.get(next) ? [templates.get(next)!.content.cloneNode(true)] : []));
      branch = next;
      home.dataset.activeBranch = next;
      stage.hidden = !next;
      branchLinks.forEach((link) => link.setAttribute('aria-expanded', String(link.dataset.homeBranch === next)));
    }
    entries().forEach((entry) => {
      if (entry.dataset.homeNode === node) entry.setAttribute('aria-current', 'location');
      else entry.removeAttribute('aria-current');
    });
    reader.hidden = !node && !reference;
    if (!node && cleanup) { cleanup(); cleanup = undefined; live.hidden = true; }
    if (reader.hidden) {
      preview.replaceChildren();
      if (shouldFocus && next) branchPanel.querySelector<HTMLElement>('[data-branch-heading]')?.focus();
      else if (wasOpen && !shouldFocus) focusBranch();
      return;
    }
    if (cleanup) {
      window.dispatchEvent(new Event(homeSelectionEvent));
      if (shouldFocus) requestAnimationFrame(() => live.querySelector<HTMLElement>('.explorer-reading-heading, .explorer-reading h2')?.focus());
      return;
    }
    const heading = setPreview(node, origin, reference || undefined);
    if (shouldFocus) heading.focus();
    if (reference) return;
    void prepare().then(({ mountExplorer }) => {
      if (run !== revision || reader.hidden) return;
      cleanup = mountExplorer(live, {
        onClose: close,
        onReady() {
          const keepFocus = preview.contains(document.activeElement);
          preview.hidden = true;
          live.hidden = false;
          if (keepFocus) requestAnimationFrame(() => live.querySelector<HTMLElement>('.explorer-reading h2')?.focus());
        },
        onNavigate() {
          rememberOpener();
          const id = new URLSearchParams(location.search).get('node');
          for (const entry of entries()) {
            if (entry.dataset.homeNode === id) entry.setAttribute('aria-current', 'location');
            else entry.removeAttribute('aria-current');
          }
        },
      });
    }).catch(() => { /* The HTML reading and passage links remain available. */ });
  }

  home.addEventListener('click', (event) => {
    if (!primaryClick(event)) return;
    const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!anchor) return;
    const data = anchor.dataset;
    const target = new URL(anchor.href);
    const category = data.homeBranch ?? data.homeGuide ?? data.homeResultBranch;
    const guideNode = data.homeGuide ? target.pathname.match(/^\/map\/reading\/([^/]+)\//)?.[1] : undefined;
    const node = data.homeNode ?? guideNode;
    if (data.homeReset !== undefined) {
      event.preventDefault();
      const former = branch;
      commitSelection('/');
      show();
      branchLink(former)?.focus();
    } else if (data.homeBranch && templates.has(data.homeBranch)) {
      event.preventDefault();
      opener = undefined;
      openedFrom = '';
      commitSelection(withQuery('/', { branch: data.homeBranch }));
      show(undefined, true);
    } else if (node || data.homeReference) {
      const next = category ?? branch;
      if (!templates.has(next)) return;
      event.preventDefault();
      opener = anchor;
      openedFrom = node ?? '';
      const params = new URLSearchParams(location.search);
      const previous = params.get('node');
      const sameBranch = params.get('branch') === next;
      const carry = sameBranch && !data.homeGuide && !data.homeReference ? Object.fromEntries(params) : {};
      commitSelection(withQuery('/', { ...carry, ...Object.fromEntries(target.searchParams), branch: next, node,
        view: data.homeReference ? '' : 'map', panel: target.searchParams.get('panel') ?? '', edge: '',
        context: sameBranch && previous && node?.includes('-place-') ? previous : '',
        ref: data.homeReference, trail: sameBranch && previous && previous !== node ? [...(params.get('trail') ?? '').split(',').filter(Boolean), previous].slice(-5).join(',') : carry.trail }));
      rememberOpener();
      show(anchor, true);
    }
  });

  window.addEventListener('popstate', () => show());
  branchLinks.forEach((link) => link.setAttribute('aria-expanded', 'false'));
  show();
}
