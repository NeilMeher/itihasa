import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { explorerHref, lanes, type Lane, type WorkspaceState } from '../lib/explorer';
import { items, laneFor, nodes, placeById, timeline } from '../lib/explorer-content';
import { groups, includesPerson, initial, readingHref, resolve } from '../lib/explorer-state';
import { foldSearch, type GraphNode } from '../lib/project-graph';
import { commitSelection } from '../lib/selection';
import ExplorerReader from './ExplorerReader';

const ProjectMindMap = lazy(() => import('./ProjectMindMap'));

export default function Explorer() {
  const [state, setState] = useState(initial);
  const [invalid, setInvalid] = useState('');
  const [ready, setReady] = useState(false);
  const [closed, setClosed] = useState(false);
  const [draft, setDraft] = useState<number>();
  const scrubbing = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const eventList = useRef<HTMLOListElement>(null);

  useEffect(() => {
    function restore() {
      const result = resolve(new URLSearchParams(location.search));
      setState(result.state);
      setInvalid(result.invalid);
      setClosed(false);
      setDraft(undefined);
      scrubbing.current = false;
    }
    restore();
    setReady(true);
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);

  useEffect(() => {
    const list = eventList.current;
    const active = list?.querySelector('[aria-current="step"]');
    if (list && active) {
      const viewport = list.getBoundingClientRect();
      const entry = active.getBoundingClientRect();
      if (entry.bottom > viewport.bottom || entry.top < viewport.top) list.scrollTop += entry.top - viewport.top - 4;
    }
  }, [state.node, state.view, state.scope, state.person, state.place]);

  const entries = timeline[state.lane];
  const scopes = [...new Map(entries.map((item) => [item.scope, item.section]))];
  const query = foldSearch(state.query.trim());
  const matching = entries.filter((item) =>
    (state.scope === 'all' || item.scope === state.scope || state.scope === 'war' && item.day) &&
    includesPerson(item, state.person) && (!state.place || item.places.includes(state.place)) &&
    foldSearch([item.title, item.label, item.summary, ...nodes.get(item.id)?.aliases ?? []].join(' ')).includes(query));
  const selected = draft === undefined ? items.get(state.node) : matching[draft];
  const currentAt = matching.findIndex((item) => item.id === state.node);
  const scrubAt = draft ?? Math.max(0, currentAt);
  const outside = Boolean(selected?.lane === state.lane && currentAt < 0 && draft === undefined);

  function update(next: WorkspaceState, mode: 'push' | 'replace' = 'push') {
    setState(next);
    setInvalid('');
    commitSelection(explorerHref(next), mode);
  }

  function select(id: string, trigger?: HTMLElement) {
    const target = nodes.get(id);
    const to = items.get(id)?.lane ?? laneFor(target) ?? state.lane;
    if (trigger) opener.current = trigger;
    setDraft(undefined);
    setClosed(false);
    update({
      ...state, node: id, lane: to, edge: '', context: target?.kind === 'place' ? selected?.id ?? state.context : '',
      scope: to === state.lane ? state.scope : 'all', panel: target?.kind === 'place' ? 'geography' : 'story',
    });
    if (trigger) requestAnimationFrame(() => heading.current?.focus());
  }

  function chooseLane(lane: Lane) {
    setClosed(false);
    setDraft(undefined);
    update({ ...initial, lane, view: state.view, node: timeline[lane][0].id });
  }

  function follow(person: GraphNode) {
    const lane = laneFor(person) ?? state.lane;
    const first = timeline[lane].find((item) => includesPerson(item, person.id));
    setClosed(false);
    update({ ...state, lane, view: 'timeline', node: first?.id ?? person.id, person: person.id, scope: 'all', place: '', query: '', edge: '', panel: 'story' });
  }

  function changeView(view: WorkspaceState['view']) {
    setClosed(false);
    update({ ...state, view });
  }

  function close() {
    setClosed(true);
    requestAnimationFrame(() => (opener.current?.isConnected ? opener.current : document.getElementById('explorer-open-reading'))?.focus());
  }

  return <div className="explorer-shell">
    <nav className="explorer-views" aria-label="Explorer views">
      <button disabled={!ready} aria-pressed={state.view === 'timeline'} onClick={() => changeView('timeline')}>Timeline</button>
      <button disabled={!ready} aria-pressed={state.view === 'map'} onClick={() => changeView('map')}>Mind Map</button>
      {closed && <button id="explorer-open-reading" onClick={() => { setClosed(false); requestAnimationFrame(() => heading.current?.focus()); }}>Open selected reading</button>}
    </nav>
    {invalid && <p className="explorer-notice" role="status">That Explorer {invalid} is unavailable. Choose a lane or search the available readings.</p>}
    {state.view === 'timeline' ? <nav className="explorer-lanes" aria-label="Timeline lanes">
      {(Object.keys(lanes) as Lane[]).map((lane) => <button key={lane} disabled={!ready}
        aria-pressed={state.lane === lane} onClick={() => chooseLane(lane)}>{lanes[lane].name}</button>)}
    </nav> : <>
      <nav className="explorer-lanes" aria-label="Mind Map groups">
        {groups.map(([label, id]) => <button key={id} disabled={!ready} aria-pressed={id === state.node}
          onClick={() => select(id)}>{label}</button>)}
      </nav>
      <Suspense fallback={<p role="status">Opening the Mind Map…</p>}>
        <ProjectMindMap connected={{
          selection: state,
          change: (next, push) => {
            if (next.node !== state.node) select(next.node);
            else update({ ...state, ...next }, push ? 'push' : 'replace');
          },
          back: () => changeView('timeline'),
          reading: (target) => readingHref(items.get(target.id)?.href ?? target.href, state.person),
          trail: follow,
        }} />
      </Suspense>
    </>}
    <div className={state.view === 'timeline' ? 'explorer-stage' : 'explorer-map-details'}>
      {state.view === 'timeline' && <section className="explorer-track" aria-label="Timeline">
        <header className="explorer-track-intro"><p>{lanes[state.lane].time}</p><h2>{lanes[state.lane].name}</h2>
          <p>{lanes[state.lane].description}</p></header>
        <div className="explorer-filters">
          <label>Scope<select disabled={!ready} value={state.scope} onChange={(event) => update({ ...state, scope: event.target.value })}>
            <option value="all">Whole lane</option>
            {state.lane === 'mahabharata' && <option value="war">All eighteen war days</option>}
            {scopes.map(([scope, name]) => <option value={scope} key={scope}>{name}</option>)}
          </select></label>
          <label>Find in this lane<input type="search" disabled={!ready} value={state.query} placeholder="Try a name or passage"
            onChange={(event) => update({ ...state, query: event.currentTarget.value }, 'replace')} /></label>
        </div>
        {state.person && <p className="explorer-filter-note">Following {nodes.get(state.person)?.title} <button onClick={() => update({ ...state, person: '' })}>Clear person</button></p>}
        {state.place && <p className="explorer-filter-note">Events at {placeById.get(state.place)?.name} <button onClick={() => update({ ...state, place: '' })}>Clear place</button></p>}
        {outside && <p className="explorer-notice">The selected reading is outside these filters. <button onClick={() => update({
          ...state, scope: 'all', query: '', person: includesPerson(selected!, state.person) ? state.person : '',
          place: selected!.places.includes(state.place) ? state.place : '',
        })}>Reveal selected event</button></p>}
        {matching.length > 0 && <div className="explorer-scrub">
          <div><button disabled={!ready || currentAt <= 0} aria-label="Previous event" onClick={() => select(matching[currentAt - 1].id)}>←</button>
            <button disabled={!ready || currentAt === matching.length - 1} aria-label="Next event" onClick={() => select(matching[currentAt + 1].id)}>→</button></div>
          <label>Move through this list<input type="range" min={0} max={matching.length - 1} disabled={!ready || matching.length < 2}
            value={scrubAt} aria-valuetext={matching[scrubAt]?.title}
            onPointerDown={(event) => { scrubbing.current = true; event.currentTarget.setPointerCapture(event.pointerId); }}
            onPointerCancel={() => { scrubbing.current = false; setDraft(undefined); }}
            onPointerUp={(event) => { scrubbing.current = false; select(matching[event.currentTarget.valueAsNumber].id); }}
            onChange={(event) => scrubbing.current ? setDraft(event.currentTarget.valueAsNumber) : select(matching[event.currentTarget.valueAsNumber].id)} /></label>
          <button disabled={!ready || closed} onClick={() => heading.current?.focus()}>Go to reading</button>
        </div>}
        <ol ref={eventList} className="explorer-events" aria-label={lanes[state.lane].name + ' event list'}>
          {matching.map((item) => <li key={item.id}>
            <button disabled={!ready} aria-current={selected?.id === item.id ? 'step' : undefined} onClick={(event) => select(item.id, event.currentTarget)}>
              <small>{item.label}</small><span>{item.title}</span>
            </button>
          </li>)}
        </ol>
        {matching.length === 0 && <p>No events match this selection. <button onClick={() => update({ ...state, scope: 'all', query: '', person: '', place: '' })}>Show the whole lane</button></p>}
      </section>}
      {!closed && <ExplorerReader state={state} selected={selected} ready={ready} heading={heading} onSelect={select} onFollow={follow} onClose={close}
        update={update} />}
    </div>
  </div>;
}
