import { useEffect, useRef, useState } from 'react';
import catalog from '../../../../content/explorer-catalog.json';
import { foldSearch, mapFor, type GraphEdge, type GraphNode, type GraphSource } from '../lib/project-graph';
import { withQuery } from '../lib/selection';

const firstNode = 'ma-person-draupadi';
const hub = [50, 49];
const spokes = [[26, 15], [74, 15], [12, 49], [88, 49], [26, 83], [74, 83]];
const starter = { node: firstNode, work: 'all', relation: 'all', edge: '', depth: 0 };
type GraphSelection = Pick<typeof starter, 'node' | 'work' | 'relation' | 'edge'>;
type ConnectedMap = {
  selection: GraphSelection;
  hasReader?: boolean;
  previous?: string;
  change: (selection: GraphSelection, push: boolean, trigger?: HTMLElement) => void;
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
const byId = new Map<string, GraphNode>(catalog.nodes.map((node) => [node.id, node]));
const sources: Record<string, GraphSource> = catalog.sources;
const relationNames = catalog.relations;
const readingRelationships = new Set(['leads to', 'precedes', 'frames', 'is interpreted by', 'takes place in', 'is placed at']);
const edgeCache = new Map<string, Promise<GraphEdge[]>>();

function loadEdges(work: string) {
  const cached = edgeCache.get(work);
  if (cached) return cached;
  const request = fetch(`/map/edges/${work}.json`).then((response) => {
    if (!response.ok) throw new Error('Unavailable relationship data');
    return response.json() as Promise<GraphEdge[]>;
  }).catch((error) => { edgeCache.delete(work); throw error; });
  edgeCache.set(work, request);
  return request;
}

export default function ProjectMindMap({ connected }: { connected?: ConnectedMap }) {
  const [view, setView] = useState(starter);
  const [search, setSearch] = useState('');
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [person, setPerson] = useState('');
  const [missing, setMissing] = useState('');
  const [edgeData, setEdgeData] = useState<{ work: string; items: GraphEdge[] | null }>();
  const heading = useRef<HTMLHeadingElement>(null);
  const controlled = Boolean(connected);
  const active = connected?.selection ?? view;
  const node = byId.get(active.node) ?? byId.get(firstNode)!;
  const currentEdges = edgeData?.work === node.work ? edgeData.items : undefined;
  const edges = (currentEdges ?? []).filter((edge) => (edge.from === node.id || edge.to === node.id) &&
    (active.relation === 'all' || edge.relation === active.relation) &&
    (active.work === 'all' || byId.get(peer(edge, node.id))?.work === active.work));
  if (connected) {
    const priority = (edge: GraphEdge) => peer(edge, node.id) === connected.previous ? 2 : Number(readingRelationships.has(edge.relation));
    edges.sort((left, right) => priority(right) - priority(left));
  }
  const visual = [...new Set(edges.map((edge) => peer(edge, node.id)))].slice(0, spokes.length);
  const selectedEdge = edges.find((edge) => edgeKey(edge) === active.edge);
  const selectedSource = selectedEdge && sources[selectedEdge.source];
  const appearances = node.kind === 'person' ? (currentEdges ?? []).filter((edge) => edge.from === node.id && edge.relation === 'appears in') : [];
  const results = search.trim() ? catalog.nodes.filter((item) => foldSearch([item.title, ...item.aliases].join(' '))
    .includes(foldSearch(search.trim()))).slice(0, 12) : [];

  useEffect(() => {
    if (controlled) { setReady(true); return; }
    function restore() {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('node') ?? firstNode;
      const work = params.get('work') ?? 'all';
      const relation = params.get('relation') ?? 'all';
      setPerson(params.get('person') ?? '');
      setMissing(byId.has(id) ? '' : id);
      setView({
        node: byId.has(id) ? id : firstNode,
        work: workNames[work] ? work : 'all',
        relation: relationNames.includes(relation) ? relation : 'all',
        edge: params.get('edge') ?? '',
        depth: window.history.state?.mapDepth ?? 0,
      });
      setExpanded(false);
    }
    restore();
    setReady(true);
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [controlled]);

  useEffect(() => {
    let active = true;
    loadEdges(node.work).then(
      (items) => { if (active) setEdgeData({ work: node.work, items }); },
      () => { if (active) setEdgeData({ work: node.work, items: null }); },
    );
    return () => { active = false; };
  }, [node.work]);

  function update(next: GraphSelection, push = false, trigger?: HTMLElement) {
    if (connected) {
      connected.change(next, push, trigger);
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

  function open(id: string, trigger?: HTMLElement) {
    if (id === active.node) return;
    update({ ...active, node: id, edge: '' }, true, trigger);
    setExpanded(false);
    setSearch('');
    if (!connected) requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
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
        {results.map((item) => <li key={item.id}><button onClick={(event) => open(item.id, event.currentTarget)}>{item.title} <small>{item.kind} · {workNames[item.work]}</small></button></li>)}
        {!results.length && <li>No matching nodes. Try a shorter spelling or another name.</li>}
      </ul>}
      <div className="map-reading">
        <section className="map-diagram" aria-label="Selected node and nearby connections">
          <div key={node.id} className="map-hub" tabIndex={-1} style={{ left: `${hub[0]}%`, top: `${hub[1]}%` }}>
            <small>{node.kind}</small><strong>{node.title}</strong>
          </div>
          {visual.map((id, i) => {
            const [x, y] = spokes[i];
            const left = Math.min(x, hub[0]), width = Math.abs(x - hub[0]);
            const target = byId.get(id)!;
            return <div key={id}>
              <span className={`map-connector${id === connected?.previous ? ' map-connector-traversed' : ''}`} aria-hidden="true" style={{
                left: `${left}%`, top: `${Math.min(y, hub[1])}%`, width: `${width}%`, height: `${Math.abs(y - hub[1]) + 1}%`,
                clipPath: ((x < hub[0]) === (y < hub[1])) ? 'polygon(0 0,100% 97%,100% 100%,0 3%)' : 'polygon(0 97%,100% 0,100% 3%,0 100%)',
              }} />
              <button className={`map-spoke${i === 2 || i === 3 ? ' map-spoke-side' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} disabled={!ready}
                aria-label={`Follow ${target.title}`} onClick={(event) => open(id, event.currentTarget)}>{target.title}</button>
            </div>;
          })}
        </section>
        <section className="map-neighbors" aria-labelledby="map-selection">
          {!connected?.hasReader && <p className="map-node-kind">{node.kind} · {workNames[node.work]}</p>}
          <h2 id="map-selection" ref={heading} tabIndex={-1}>{connected?.hasReader ? 'Connections' : node.title}</h2>
          {!connected?.hasReader && <p>{node.summary}</p>}
          {connected && node.kind === 'person' && <button onClick={() => connected.trail(node)}>Follow this person</button>}
          {node.href && <a href={connected ? connected.reading(node) : node.href.startsWith('/ramayana/?scene=') ? withQuery(node.href, { person }) : node.href}>Open {node.kind === 'source' ? 'source' : 'reading'} →</a>}
          {appearances.length > 0 && <details className="source-card">
            <summary>{node.title}’s story trail</summary>
            <ol className="reading-list">{appearances.map((edge) => {
              const story = byId.get(edge.to)!;
              return <li key={edge.to}>{connected ? <button onClick={(event) => open(story.id, event.currentTarget)}>{story.title}</button> : <a href={story.href}>{story.title}</a>}<p>{edge.why} · {edge.scope}</p></li>;
            })}</ol>
          </details>}
          {!connected?.hasReader && <h3>Connected readings</h3>}
          {currentEdges === undefined && <p role="status">Loading relationships…</p>}
          {currentEdges === null && <p role="status">Relationships are unavailable. Use the reading or Timeline links to continue.</p>}
          <ul aria-label="Sourced connections">
            {edges.slice(0, expanded ? undefined : spokes.length).map((edge) => {
              const target = byId.get(peer(edge, node.id))!;
              const key = edgeKey(edge);
              return <li key={key}>
                <span>{edge.from === node.id ? `→ ${edge.relation}` : `← ${edge.relation}`}</span>
                <button className="map-node-button" disabled={!ready} onClick={(event) => open(target.id, event.currentTarget)}>{target.title}</button>
                <button className="map-inspect" disabled={!ready} aria-pressed={active.edge === key} onClick={() =>
                  update({ ...active, edge: active.edge === key ? '' : key }, controlled)}>Inspect <span className="map-sr-only">connection with {target.title}</span></button>
              </li>;
            })}
            {currentEdges && edges.length === 0 && <li>There are no connections under these filters.</li>}
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
