import { useEffect, useRef, useState } from 'react';

type Entry = { url: string; title: string; text: string; aliases: string };

function normalize(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/(\p{Script=Latin})\p{M}+/gu, '$1').normalize('NFC');
}

export default function SearchPanel({ entries }: { entries: Entry[] }) {
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (input.current?.value) setQuery(input.current.value);
  }, []);
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const results = terms.length ? entries.filter(({ title, text, aliases }) => {
    const haystack = normalize(`${title} ${text} ${aliases}`);
    return terms.every((term) => haystack.includes(term));
  }) : entries.slice(0, 6);
  return (
    <section aria-label="Search results">
      <label htmlFor="library-query">Search the library</label>
      <input ref={input} id="library-query" type="search" onChange={(event) => setQuery(event.currentTarget.value)}
        placeholder="Try rāshi, Ayodhyā, or 6.2.31" />
      <p className="small-note" role="status">
        {terms.length ? `${results.length} ${results.length === 1 ? 'result' : 'results'}` : 'Browse by topic'}
      </p>
      {results.length === 0 && <p>Try an alternate spelling, a person’s name, or a passage number. <a href="/epics/">Browse Epics &amp; Purāṇas</a>.</p>}
      <ul className="search-list">{results.map(({ url, title, text }) =>
        <li key={url}><a href={url}>{title}</a><p>{text}</p></li>
      )}</ul>
    </section>
  );
}
