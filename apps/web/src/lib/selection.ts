export function withQuery(path: string, fields: Record<string, string | number | undefined>) {
  const url = new URL(path, 'https://itihasa.invalid');
  for (const [name, value] of Object.entries(fields)) {
    if (value !== '' && value !== undefined) url.searchParams.set(name, String(value));
    else url.searchParams.delete(name);
  }
  return url.pathname + url.search + url.hash;
}

export function commitSelection(path: string, mode: 'push' | 'replace' = 'push') {
  const current = location.pathname + location.search + location.hash;
  if (path !== current) {
    if (mode === 'push') history.pushState(null, '', path);
    else history.replaceState(history.state, '', path);
  }
}
