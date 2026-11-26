import { useEffect, useRef, useState } from 'react';
import catalog from '../../../../content/explorer-catalog.json';
import edges from '../../../../content/explorer-edges.json';
import { foldSearch, mapFor, type GraphEdge, type GraphNode, type ReaderGraph } from '../lib/project-graph';
import { withQuery } from '../lib/selection';

const graph: ReaderGraph = { nodes: catalog.nodes, sources: catalog.sources, edges };
const firstNode = 'ma-person-draupadi';
const hub = [50, 49];
const spokes = [[26, 15], [74, 15], [12, 49], [88, 49], [26, 83], [74, 83]];
const starter = { node: firstNode, work: 'all', relation: 'all', edge: '', depth: 0 };
type GraphSelection = Pick<typeof starter, 'node' | 'work' | 'relation' | 'edge'>;
type ConnectedMap = {
  selection: GraphSelection;
  change: (selection: GraphSelection, push: boolean) => void;
  back: () => void;
  reading: (node: GraphNode) => string;
  trail: (node: GraphNode) => void;
};
const workNames: Record<string, string> = {
  mahabharata: 'Mahābhārata', ramayana: 'Rāmāyaṇa', maratha: 'Maratha history',
  sky: 'Sky and calendar', sources: 'Sources', purana: 'Purāṇa and Harivaṃśa',
};
const edgeKey = (edge: GraphEdge) => `${edge.from}:${edge.relation}:${edge.to}`;
const peer = (edge: GraphEdge, id: string) => edge.from === id ? edge.to : edge.from;
const byId = new Map(graph.nodes.map((node) => [node.id, node]));
const relationNames = [...new Set(graph.edges.map((edge) => edge.relation))].sort();
const readingRelationships = new Set(['leads to', 'precedes', 'frames', 'is interpreted by', 'takes place in', 'is placed at']);

export default function ProjectMindMap({ connected }: { connected?: ConnectedMap }) {
  const [view, setView] = useState(starter);
  const [search, setSearch] = useState('');
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [person, setPerson] = useState('');
  const [missing, setMissing] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const active = connected?.selection ?? view;
  const node = byId.get(active.node) ?? byId.get(firstNode)!;
  const edges = graph.edges.filter((edge) => (edge.from === node.id || edge.to === node.id) &&
    (active.relation === 'all' || edge.relation === active.relation) &&
    (active.work === 'all' || byId.get(peer(edge, node.id))?.work === active.work));
  if (connected) edges.sort((left, right) => Number(readingRelationships.has(right.relation)) - Number(readingRelationships.has(left.relation)));
  const visual = [...new Set(edges.map((edge) => peer(edge, node.id)))].slice(0, spokes.length);
  const selectedEdge = edges.find((edge) => edgeKey(edge) === active.edge);
  const selectedSource = selectedEdge && graph.sources[selectedEdge.source];
  const appearances = node.kind === 'person' ? graph.edges.filter((edge) => edge.from === node.id && edge.relation === 'appears in') : [];
  const results = search.trim() ? graph.nodes.filter((item) => foldSearch([item.title, ...item.aliases].join(' '))
    .includes(foldSearch(search.trim()))).slice(0, 12) : [];

  useEffect(() => {
    function restore() {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('node') ?? firstNode;
      const work = params.get('work') ?? 'all';
      const relation = params.get('relation') ?? 'all';
      setPerson(params.get('person') ?? '');
      setMissing(byId.has(id) ? '' : id);
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

  function update(next: GraphSelection, push = false) {
    if (connected) {
      connected.change(next, push);
      return;
    }
    const url = new URL(mapFor(next.node), window.location.origin);
    if (person) url.searchParams.set('person', person);
    if (next.work !== 'all') url.searchParams.set('work', next.work);
    if (next.relation !== 'all') url.searchParams.set('relation', next.relation);
    if (next.edge) url.searchParams.set('edge', next.edge);
    const depth = push ? view.depth + 1 : view.depth;
    if (push) window.history.pushState({ mapDepth: depth }, '', url);
    else window.history.replaceState({ mapDepth: depth }, '', url);
    setView({ ...next, depth });
    setMissing('');
  }

  function open(id: string) {
    if (id === active.node) return;
    update({ ...active, node: id, edge: '' }, true);
    setExpanded(false);
    setSearch('');
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  }

  return (
    <div className="map-workspace">
      <div className="map-controls">
        <label>Find a person, place, or idea<input type="search" value={search} disabled={!ready}
          placeholder="Draupadī, कर्ण, Raigad" onChange={(event) => setSearch(event.target.value)} /></label>
        <label>Neighbour work<select disabled={!ready} value={active.work} onChange={(event) => update({ ...active, work: event.target.value, edge: '' })}>
          <option value="all">All works</option>{Object.entries(workNames).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select></label>
        <label>Relationship<select disabled={!ready} value={active.relation} onChange={(event) => update({ ...active, relation: event.target.value, edge: '' })}>
          <option value="all">All relationships</option>{relationNames.map((name) => <option key={name}>{name}</option>)}
        </select></label>
        <button disabled={!ready || (!connected && !view.depth)} onClick={() => connected ? connected.back() : window.history.back()}>← {connected ? 'Back to timeline' : 'Back a node'}</button>
      </div>
      {!connected && missing && <p role="status">That item is unavailable. Start with Draupadī or search for a person, place, or passage.</p>}
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
          {connected && node.kind === 'person' && <button onClick={() => connected.trail(node)}>Follow this person</button>}
          {node.href && <a href={connected ? connected.reading(node) : node.href.startsWith('/ramayana/?scene=') ? withQuery(node.href, { person }) : node.href}>Open {node.kind === 'source' ? 'source' : 'reading'} →</a>}
          {appearances.length > 0 && <details className="source-card">
            <summary>{node.title}’s story trail</summary>
            <ol className="reading-list">{appearances.map((edge) => {
              const story = byId.get(edge.to)!;
              return <li key={edge.to}>{connected ? <button onClick={() => open(story.id)}>{story.title}</button> : <a href={story.href}>{story.title}</a>}<p>{edge.why} · {edge.scope}</p></li>;
            })}</ol>
          </details>}
          <h3>Connected readings</h3>
          <ul aria-label="Sourced connections">
            {edges.slice(0, expanded ? undefined : spokes.length).map((edge) => {
              const target = byId.get(peer(edge, node.id))!;
              const key = edgeKey(edge);
              return <li key={key}>
                <span>{edge.from === node.id ? `→ ${edge.relation}` : `← ${edge.relation}`}</span>
                <button className="map-node-button" disabled={!ready} onClick={() => open(target.id)}>{target.title}</button>
                <button className="map-inspect" disabled={!ready} aria-pressed={active.edge === key} onClick={() =>
                  update({ ...active, edge: active.edge === key ? '' : key })}>Inspect <span className="map-sr-only">connection with {target.title}</span></button>
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
