import { useEffect, useRef, useState } from 'react';
import data from '../../../../content/project-graph.json';
import { foldSearch, mapFor, type GraphEdge, type ReaderGraph } from '../lib/project-graph';

const graph: ReaderGraph = data;
const firstNode = 'ma-person-draupadi';
const hub = [50, 49];
const spokes = [[26, 15], [74, 15], [12, 49], [88, 49], [26, 83], [74, 83]];
const starter = { node: firstNode, work: 'all', relation: 'all', edge: '', depth: 0 };
const workNames: Record<string, string> = {
  mahabharata: 'Mahābhārata', ramayana: 'Rāmāyaṇa', maratha: 'Maratha history',
  sky: 'Sky and calendar', sources: 'Sources', purana: 'Purāṇa and Harivaṃśa',
};
const edgeKey = (edge: GraphEdge) => `${edge.from}:${edge.relation}:${edge.to}`;
const peer = (edge: GraphEdge, id: string) => edge.from === id ? edge.to : edge.from;
const byId = new Map(graph.nodes.map((node) => [node.id, node]));
const relationNames = [...new Set(graph.edges.map((edge) => edge.relation))].sort();

export default function ProjectMindMap() {
  const [view, setView] = useState(starter);
  const [search, setSearch] = useState('');
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const node = byId.get(view.node) ?? byId.get(firstNode)!;
  const edges = graph.edges.filter((edge) => (edge.from === node.id || edge.to === node.id) &&
    (view.relation === 'all' || edge.relation === view.relation) &&
    (view.work === 'all' || byId.get(peer(edge, node.id))?.work === view.work));
  const visual = [...new Set(edges.map((edge) => peer(edge, node.id)))].slice(0, spokes.length);
  const selectedEdge = edges.find((edge) => edgeKey(edge) === view.edge);
  const selectedSource = selectedEdge && graph.sources[selectedEdge.source];
  const results = search.trim() ? graph.nodes.filter((item) => foldSearch([item.title, ...item.aliases].join(' '))
    .includes(foldSearch(search.trim()))).slice(0, 12) : [];

  useEffect(() => {
    function restore() {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('node') ?? firstNode;
      const work = params.get('work') ?? 'all';
      const relation = params.get('relation') ?? 'all';
      setView({
        node: graph.nodes.some((candidate) => candidate.id === id) ? id : firstNode,
        work: workNames[work] ? work : 'all',
        relation: graph.edges.some((edge) => edge.relation === relation) ? relation : 'all',
        edge: params.get('edge') ?? '',
        depth: window.history.state?.mapDepth ?? 0,
      });
      setExpanded(false);
    }
    restore();
    setReady(true);
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);

  function update(next: typeof starter, push = false) {
    const url = new URL(mapFor(next.node), window.location.origin);
    if (next.work !== 'all') url.searchParams.set('work', next.work);
    if (next.relation !== 'all') url.searchParams.set('relation', next.relation);
    if (next.edge) url.searchParams.set('edge', next.edge);
    if (push) window.history.pushState({ mapDepth: next.depth }, '', url);
    else window.history.replaceState({ mapDepth: next.depth }, '', url);
    setView(next);
  }

  function open(id: string) {
    if (id === view.node) return;
    update({ ...view, node: id, edge: '', depth: view.depth + 1 }, true);
    setExpanded(false);
    setSearch('');
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  }

  return (
    <div className="map-workspace">
      <div className="map-controls">
        <label>Find a person, place, or idea<input type="search" value={search} disabled={!ready}
          placeholder="Draupadī, कर्ण, Raigad" onChange={(event) => setSearch(event.target.value)} /></label>
        <label>Neighbour work<select disabled={!ready} value={view.work} onChange={(event) => update({ ...view, work: event.target.value, edge: '' })}>
          <option value="all">All works</option>{Object.entries(workNames).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select></label>
        <label>Relationship<select disabled={!ready} value={view.relation} onChange={(event) => update({ ...view, relation: event.target.value, edge: '' })}>
          <option value="all">All relationships</option>{relationNames.map((name) => <option key={name}>{name}</option>)}
        </select></label>
        <button disabled={!ready || !view.depth} onClick={() => window.history.back()}>← Back a node</button>
      </div>
      {search.trim() && <ul className="map-results" aria-label="Matching nodes">
        {results.map((item) => <li key={item.id}><button onClick={() => open(item.id)}>{item.title} <small>{item.kind}</small></button></li>)}
        {!results.length && <li>No matching nodes. Try a shorter spelling or another name.</li>}
      </ul>}
      <div className="map-reading">
        <section className="map-diagram" aria-label="Selected node and nearby connections">
          <div className="map-hub" style={{ left: `${hub[0]}%`, top: `${hub[1]}%` }}>
            <small>{node.kind}</small><strong>{node.title}</strong>
          </div>
          {visual.map((id, i) => {
            const [x, y] = spokes[i];
            const left = Math.min(x, hub[0]), width = Math.abs(x - hub[0]);
            const target = byId.get(id)!;
            return <div key={id}>
              <span className="map-connector" aria-hidden="true" style={{
                left: `${left}%`, top: `${Math.min(y, hub[1])}%`, width: `${width}%`, height: `${Math.abs(y - hub[1]) + 1}%`,
                clipPath: ((x < hub[0]) === (y < hub[1])) ? 'polygon(0 0,100% 97%,100% 100%,0 3%)' : 'polygon(0 97%,100% 0,100% 3%,0 100%)',
              }} />
              <button className={`map-spoke${i === 2 || i === 3 ? ' map-spoke-side' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} disabled={!ready}
                aria-label={`Follow ${target.title}`} onClick={() => open(id)}>{target.title}</button>
            </div>;
          })}
        </section>
        <section className="map-neighbors" aria-labelledby="map-selection">
          <p className="map-node-kind">{node.kind} · {workNames[node.work]}</p>
          <h2 id="map-selection" ref={heading} tabIndex={-1}>{node.title}</h2>
          <p>{node.summary}</p>
          {node.href && <a href={node.href}>Open {node.kind === 'source' ? 'source' : 'reading'} →</a>}
          <h3>Connected readings</h3>
          <ul aria-label="Sourced connections">
            {edges.slice(0, expanded ? undefined : spokes.length).map((edge) => {
              const target = byId.get(peer(edge, node.id))!;
              const key = edgeKey(edge);
              return <li key={key}>
                <span>{edge.from === node.id ? `→ ${edge.relation}` : `← ${edge.relation}`}</span>
                <button className="map-node-button" disabled={!ready} onClick={() => open(target.id)}>{target.title}</button>
                <button className="map-inspect" disabled={!ready} aria-pressed={view.edge === key} onClick={() =>
                  update({ ...view, edge: view.edge === key ? '' : key })}>Inspect <span className="map-sr-only">connection with {target.title}</span></button>
              </li>;
            })}
            {edges.length === 0 && <li>There are no connections under these filters.</li>}
          </ul>
          {edges.length > spokes.length && <button disabled={!ready} onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Show fewer connections' : `Show all ${edges.length} connections`}
          </button>}
          {selectedEdge && selectedSource && <article className="map-evidence" aria-label="Relationship evidence">
            <h3>{byId.get(selectedEdge.from)?.title} {selectedEdge.relation} {byId.get(selectedEdge.to)?.title}</h3>
            <p>{selectedEdge.why}</p><p>{selectedEdge.scope}</p>
            <p>{selectedSource.creator} · {selectedSource.edition}</p>
            <p>{selectedSource.locator}</p>
            <a href={selectedEdge.url ?? selectedSource.url}>Open evidence source ↗</a>
          </article>}
        </section>
      </div>
    </div>
  );
}
