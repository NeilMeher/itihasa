import { useEffect, useRef, useState } from 'react';
import { entries, indexedMatches } from '../lib/search-index';
import { foldSearch } from '../lib/project-graph';

export default function SearchPanel() {
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (input.current?.value) setQuery(input.current.value);
  }, []);
  const terms = foldSearch(query).trim().split(/\s+/).filter(Boolean);
  const found = terms.length ? entries.filter(({ title, text, aliases, context }) => {
    const haystack = foldSearch(`${title} ${text} ${aliases} ${context}`);
    return terms.every((term) => haystack.includes(term));
  }) : entries.slice(0, 6);
  const results = [...new Map([...found, ...indexedMatches(foldSearch(query))].map((entry) => [entry.url, entry])).values()];
  return (
    <section aria-label="Search results">
      <label htmlFor="library-query">Search Itihāsa</label>
      <input ref={input} id="library-query" type="search" onChange={(event) => setQuery(event.currentTarget.value)}
        placeholder="Try rāshi, Ayodhyā, or 6.2.31" />
      <p className="small-note" role="status">
        {terms.length ? `${results.length} ${results.length === 1 ? 'result' : 'results'}` : 'Browse by topic'}
      </p>
      {results.length === 0 && <p>Try an alternate spelling, a person’s name, or a passage number. <a href="/epics/">Browse Epics &amp; Purāṇas</a>.</p>}
      <ul className="search-list">{results.slice(0, 60).map(({ url, title, text, context }) =>
        <li key={url}><a href={url}>{title}</a><small className="search-context">{context}</small><p>{text}</p></li>
      )}</ul>
    </section>
  );
}
