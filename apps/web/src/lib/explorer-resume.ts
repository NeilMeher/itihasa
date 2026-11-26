import { explorerHref, type WorkspaceState } from './explorer';

const key = 'itihasa.public-selection.v1';

export function rememberSelection({ node, lane, view, scope, person, place, panel }: WorkspaceState) {
  try { localStorage.setItem(key, explorerHref({ node, lane, view, scope, person, place, panel })); }
  catch { /* The site also works without browser storage. */ }
}

export function resumeHref() {
  try {
    const value = localStorage.getItem(key) ?? '';
    return value.startsWith('/explorer/?node=') ? value : '';
  } catch { return ''; }
}
