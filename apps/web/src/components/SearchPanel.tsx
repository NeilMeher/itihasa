import { useEffect, useRef, useState } from 'react';
import { findEntries } from '../lib/search-index';

export default function SearchPanel() {
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const value = new URLSearchParams(location.search).get('q') ?? input.current?.value ?? '';
    if (input.current) input.current.value = value;
    setQuery(value);
  }, []);
  const results = findEntries(query);
  return (
    <section aria-label="Search results">
      <label htmlFor="library-query">Search Itihāsa</label>
      <input ref={input} id="library-query" type="search" onChange={(event) => setQuery(event.currentTarget.value)}
        placeholder="Try rāshi, Ayodhyā, or 6.2.31" />
      <p className="small-note" role="status">
        {query.trim() ? `${results.length} ${results.length === 1 ? 'result' : 'results'}` : 'Browse by topic'}
      </p>
      {results.length === 0 && <p>Try an alternate spelling, a person’s name, or a passage number. <a href="/epics/">Browse Epics &amp; Purāṇas</a>.</p>}
      <ul className="search-list">{results.slice(0, 60).map(({ url, title, text, context }) =>
        <li key={url}><a href={url}>{title}</a><small className="search-context">{context}</small><p>{text}</p></li>
      )}</ul>
    </section>
  );
}
