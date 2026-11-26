import { lazy, Suspense, type RefObject } from 'react';
import { explorerHref, lanes, type WorkspaceState } from '../lib/explorer';
import { items, neighbors, nodes, placeById, places, sources, timeline, type ExplorerItem } from '../lib/explorer-content';
import { includesPerson, readingHref } from '../lib/explorer-state';
import type { GraphNode } from '../lib/project-graph';
import library from '../../../../content/library.json';
import type { Episode } from '../lib/library';

const Geography = lazy(() => import('./ExplorerGeography'));
const Evidence = lazy(() => import('./MahabharataEvidence'));
const birthComparison: Episode = library.episodes.find((episode) => episode.id === 'rama-birth')!;
const editionSources = library.sources as Record<string, { edition: string; attribution: string; url: string }>;

export default function ExplorerReader({ state, selected, ready, heading, onSelect, onFollow, onClose, update }: {
  state: WorkspaceState; selected?: ExplorerItem; ready: boolean; heading: RefObject<HTMLHeadingElement | null>;
  onSelect: (id: string, trigger?: HTMLElement) => void; onFollow: (node: GraphNode) => void;
  onClose: () => void; update: (state: WorkspaceState, mode?: 'push' | 'replace') => void;
}) {
  const node = nodes.get(selected?.id ?? state.node);
  const place = placeById.get(node?.id ?? '');
  const placeNames = selected?.places.flatMap((id) => placeById.get(id) ?? []) ?? [];
  const people = selected?.people.flatMap((id) => nodes.get(id) ?? []) ?? [];
  const entries = timeline[state.lane];
  const at = selected ? entries.indexOf(selected) : -1;
  const earlier = at > 0 ? entries[at - 1] : undefined;
  const later = at >= 0 ? entries[at + 1] : undefined;
  const nearby = neighbors[node?.id ?? ''] ?? [];
  const related = entries.filter((item) => place ? item.places.includes(place.id)
    : node?.kind === 'person' ? includesPerson(item, node.id)
    : node?.kind === 'period' ? 'maratha-period-' + item.scope === node.id : nearby.includes(item.id));
  const source = node?.kind === 'source' ? sources[node.id.slice('source-'.length)] : undefined;
  const mapPlaces = places.filter((entry) => entry.lane === state.lane);
  const href = readingHref(selected?.href ?? node?.href ?? '', state.person);
  const hasComparison = selected?.lane === 'research' && Boolean(selected.clue);
  const panel = state.panel === 'investigation' && !hasComparison || state.panel === 'geography' && !mapPlaces.length ? 'story' : state.panel;
  const relatedList = (withDates = false) => <ul className="reading-list">{related.map((item) =>
    <li key={item.id}><button className="explorer-text-button" disabled={!ready}
      onClick={(event) => onSelect(item.id, event.currentTarget)}>{withDates ? item.label + ' · ' : ''}{item.title}</button></li>)}</ul>;
  const panels = [
    { id: 'story', label: 'Story', show: true },
    { id: 'geography', label: 'Geography', show: mapPlaces.length > 0 },
    { id: 'sources', label: 'Sources', show: true },
    { id: 'investigation', label: 'Dating comparison', show: hasComparison },
  ] as const;

  return <article className="explorer-reading" aria-label="Selected reading">
    <header className="explorer-reading-header">
      <p>{selected?.label ?? (node?.kind ?? 'Reading') + ' · ' + lanes[state.lane].name}</p>
      <button aria-label="Close reading" disabled={!ready} onClick={onClose}>×</button>
      <h2 ref={heading} tabIndex={-1}>{selected?.title ?? place?.name ?? node?.title}</h2>
    </header>
    <p className="explorer-summary">{selected?.summary ?? place?.summary ?? node?.summary}</p>
    <nav className="explorer-reading-tabs" aria-label="Reading views">
      {panels.filter((entry) => entry.show).map(({ id, label }) =>
        <button key={id} disabled={!ready} aria-pressed={panel === id} onClick={() => update({ ...state, panel: id })}>{label}</button>)}
    </nav>
    {panel === 'story' && <>
      {selected?.body.filter((line) => line !== selected.summary).map((line, index) => <p key={index}>{line}</p>)}
      {node?.id === 'story-rama-birth' && <section className="explorer-comparison" aria-label="Compare Rāma’s birth passages">
        <h3>What the editions say about Rāma’s birth</h3>
        <div>{birthComparison.passages.map((passage) => <article className="source-card" key={passage.id}>
          <h4>{passage.locator}</h4>
          <p className="small-note">{editionSources[passage.source].edition} · {editionSources[passage.source].attribution}</p>
          {passage.excerpt && <blockquote lang="sa-Latn">{passage.excerpt}</blockquote>}
          <p>{passage.reading}</p>
          <a href={passage.url ?? editionSources[passage.source].url}>Open the edition ↗</a>
        </article>)}</div>
        <p><a href="/festivals/rama-navami/">Open the Rāma Navamī calendar example →</a></p>
      </section>}
      {node?.id === 'maratha-event-capital' && <p><a href="/swarajya/#terrain">Inspect Raigad’s elevation profile and rainwater evidence →</a></p>}
      {selected?.parent && <p>This story is told inside <button className="explorer-text-button" disabled={!ready}
        onClick={(event) => onSelect(selected.parent!, event.currentTarget)}>{items.get(selected.parent)?.title}</button>.</p>}
      {people.length > 0 && <ul className="explorer-people" aria-label="People in this reading">{people.map((person) =>
        <li key={person.id}><button disabled={!ready} onClick={(event) => onSelect(person.id, event.currentTarget)}>{person.title}</button></li>)}</ul>}
      {node?.kind === 'person' && related.length > 0 && <button disabled={!ready} onClick={() => onFollow(node)}>Follow {node.title} on the timeline</button>}
      {href && <a className="explorer-full-reading" href={href}>
        {selected?.lane === 'sky' ? 'Open the tool' : selected?.lane === 'research' ? 'Open the full investigation' : node?.kind === 'chapter' ? 'Open the chapter in the Library' : 'Open full reading'} →</a>}
      {selected?.lane === 'mahabharata' && selected.clue && <a className="explorer-full-reading" href={explorerHref({
        ...state, lane: 'research', node: selected.clue === 'stars' ? 'claim-oak-ahead' : 'research-' + selected.clue,
        scope: 'all', context: selected.id, panel: 'story',
      })}>Inspect the dating clue →</a>}
      {related.length > 0 && <><h3>Related events</h3>{relatedList()}</>}
      {(earlier || later) && <nav className="explorer-story-steps" aria-label="Story sequence">
        {earlier && <button disabled={!ready} onClick={(event) => onSelect(earlier.id, event.currentTarget)}>← {earlier.title}</button>}
        {later && <button disabled={!ready} onClick={(event) => onSelect(later.id, event.currentTarget)}>{later.title} →</button>}
      </nav>}
    </>}
    {panel === 'geography' && <>
      {place && state.context && <p className="explorer-notice">Selected place. Previous event for context · <button className="explorer-text-button" disabled={!ready}
        onClick={(event) => onSelect(state.context, event.currentTarget)}>{items.get(state.context)?.title}</button></p>}
      {place && <><p><strong>{place.precision}.</strong> {place.lat === null ? 'No point is plotted for this location.' : 'The marker shows a modern geographic reference.'}</p>
        <p><a href={place.source.href}>{place.source.label} ↗</a></p>
        <button disabled={!ready} onClick={() => update({ ...state, view: 'timeline', place: place.id })}>Filter timeline to {place.name}</button></>}
      {placeNames.length > 0 && <p>Places in this reading · {placeNames.map((entry) => <button key={entry.id} className="explorer-text-button" disabled={!ready}
        onClick={(event) => onSelect(entry.id, event.currentTarget)}>{entry.name}</button>)}</p>}
      <Suspense fallback={<p role="status">Loading geographic layer…</p>}>
        <Geography places={mapPlaces} selected={place?.id ?? placeNames[0]?.id ?? ''} onSelect={onSelect} />
      </Suspense>
      <label>Inspect a place<select disabled={!ready} value={place?.id ?? ''} onChange={(event) => onSelect(event.target.value)}>
        <option value="" disabled>Choose a place</option>
        {mapPlaces.map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}
      </select></label>
      {place && <><h3>Events at {place.name}</h3>{related.length ? relatedList(true) :
        <p>No event is assigned to this place in the current lane.</p>}</>}
    </>}
    {panel === 'sources' && <>
      {source && <div className="source-card"><h3>{source.work}</h3><p>{source.creator} · {source.edition}</p>
        <p>{source.locator}</p><p>{source.basis} · {source.review}</p><a href={source.url}>Open the source ↗</a></div>}
      {selected && <ul className="reading-list">{[...selected.sources, ...selected.links].map(({ href: url, label }) =>
        <li key={label}><a href={url}>{label}</a></li>)}</ul>}
      {node?.id === 'ma-chapter-6-2' && <p><a href="/arundhati/#verse">Read the Arundhatī–Vasiṣṭha verse at BORI 6.2.31 →</a></p>}
      {!selected && place && <p><a href={place.source.href}>{place.source.label} ↗</a></p>}
      {!selected && !place && !source && href && <p><a href={href}>Open the reading and its source →</a></p>}
      {!selected && !place && !source && !href && <p>Open a related event or inspect a graph relationship for the exact passage.</p>}
    </>}
    {panel === 'investigation' && selected?.clue && <div className="explorer-evidence">
      <Suspense fallback={<p role="status">Opening the dating comparison…</p>}>
        <Evidence initial={selected.clue} useTransit={state.ahead !== 'relative'}
          filters={state.bounds.split(',').filter((entry) => entry && (state.ahead !== 'relative' || entry !== 'stars'))}
          onGeometry={(transit) => update({ ...state, ahead: transit ? '' : 'relative',
            bounds: transit ? state.bounds : state.bounds.split(',').filter((entry) => entry !== 'stars').join(',') })}
          onClue={(clue, bounds) => update({ ...state, bounds: bounds?.join(',') ?? state.bounds,
            node: clue === 'stars' ? 'claim-oak-ahead' : 'research-' + clue })} />
      </Suspense>
    </div>}
  </article>;
}
