import { useEffect, useState } from 'react';
import history from '../../../../content/maratha-history.json';
import historical from '../../../../content/maratha-sources.json';
import shared from '../../../../content/source-register.json';
import land from '../../../../content/swarajya-land.json';
import { mapFor, type GraphSource } from '../lib/project-graph';
import { commitSelection, withQuery } from '../lib/selection';

const { events, periods, places, dossiers } = history;
const sources: Record<string, GraphSource> = { ...shared, ...historical };
const [west, south, east, north] = land.views.overview.bounds;

export default function MarathaHistory() {
  const [selection, setSelection] = useState({ event: events[0].id, place: '', focus: 'event' });
  const [ready, setReady] = useState(false);
  const event = events.find((item) => item.id === selection.event)!;
  const period = periods.find((item) => item.id === event.period)!;
  const place = places.find((item) => item.id === (selection.place || event.place))!;
  const evidence = sources[event.source];
  const siteEvidence = sources[place.source];
  const dossier = dossiers.find((item) => item.place === place.id);
  const datedRecords = events.filter((item) => item.place === place.id);

  useEffect(() => {
    function restore() {
      const query = new URLSearchParams(window.location.search);
      const site = places.find((item) => item.id === query.get('place'))?.id ?? '';
      setSelection({
        event: events.find((item) => item.id === query.get('event'))?.id ?? events.find((item) => item.place === site)?.id ?? events[0].id,
        place: site,
        focus: query.get('focus') === 'place' || (site && !query.get('event')) ? 'place' : 'event',
      });
    }
    restore();
    setReady(true);
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);

  function select(id: string, placeId = '') {
    const focus = placeId ? 'place' : 'event';
    commitSelection(withQuery('/swarajya/history/', { event: id, place: placeId, focus: placeId ? focus : '' }));
    setSelection({ event: id, place: placeId, focus });
  }

  return <section className="route-reader" aria-label="Maratha period and site explorer">
    <div className="route-controls">
      <label>Historical period<select disabled={!ready} value={period.id} onChange={(e) =>
        select(events.find((item) => item.period === e.target.value)!.id)}>
        {periods.map((item) => <option value={item.id} key={item.id}>{item.start}–{item.end} · {item.title}</option>)}
      </select></label>
      <label>Place to inspect<select disabled={!ready} value={place.id} onChange={(e) => select(event.id, e.target.value)}>
        {places.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
      </select></label>
    </div>
    <label className="route-scrub">Documented change · {event.date}
      <input disabled={!ready} type="range" min="0" max={events.length - 1} value={events.indexOf(event)}
        aria-valuetext={`${event.date}: ${event.title}`} onChange={(e) => select(events[Number(e.target.value)].id)} />
    </label>
    <div className="route-links maratha-event-buttons" aria-label="Events in this period">
      {events.filter((item) => item.period === period.id).map((item) => <button key={item.id} disabled={!ready} aria-pressed={item.id === event.id}
        onClick={() => select(item.id)}>{item.title}</button>)}
    </div>
    <div className="route-stage">
      <article className="route-scene" aria-live="polite">
        {selection.focus === 'place' && <p className="route-locator">Previous event for context · Inspecting {place.name}</p>}
        <p className="route-locator">{event.date} · {event.precision}</p>
        <h2>{event.title}</h2>
        <p><strong>{event.authority}.</strong> {event.summary}</p>
        <p>{event.consequence}</p>
        <p className="route-locator">{period.title} · {period.start}–{period.end}</p>
        <p>{period.summary}</p>
        <a href={mapFor(`maratha-event-${event.id}`)}>Follow connected people, places and records →</a>
        <details className="source-card">
          <summary>Read the evidence for this change</summary>
          <p>{evidence.creator} · {evidence.edition}</p>
          <p>{evidence.locator}</p><p>{evidence.review}</p>
          <a href={evidence.url}>{evidence.work} ↗</a>
        </details>
        {event.id === 'escape' && <a href="/swarajya/#escape">Compare the Agra escape accounts →</a>}
      </article>
      <section className="route-map" aria-label="Historic sites and geographic reference points">
        <div className="route-map-frame" aria-label="Modern references for the selected records">
          {land.views.overview.outlines.map((shape, i) => <span key={i} aria-hidden="true" style={{ clipPath: `polygon(${shape})` }} />)}
          <span className="route-north" aria-hidden="true">↑ N</span>
          {places.filter((item) => item.lat !== null && (item.id === place.id || event.place === item.id ||
            (period.id === 'panipat' ? ['delhi', 'panipat', 'kunjpura'].includes(item.id) : ['raigad', 'rajgad', 'suvarnadurg', 'gingee'].includes(item.id))))
            .map((item) => <button key={item.id} disabled={!ready} aria-label={`Locate ${item.name}`} aria-pressed={item.id === place.id}
              style={{ left: `${(item.lon! - west) * 100 / (east - west)}%`, top: `${(north - item.lat!) * 100 / (north - south)}%` }}
              onClick={() => select(event.id, item.id)}>{item.id === place.id ? item.name : '•'}</button>)}
        </div>
        <p className="route-map-credit">Modern locators · <a href="https://www.naturalearthdata.com/downloads/50m-physical-vectors/50m-land/">Natural Earth</a></p>
        {selection.focus === 'place' && <p className="route-locator">Selected place · Choose an event below</p>}
        <h3>{place.name}</h3><p><strong>{place.precision}.</strong> {place.summary}</p>
        <p className="route-links"><a href={siteEvidence.url}>Site source ↗</a><a href={mapFor(`maratha-place-${place.id}`)}>Mind map →</a></p>
        {datedRecords.length > 0 && <details className="source-card" open={selection.focus === 'place' || undefined}><summary>Dated records at this location</summary>
          <ul className="reading-list">{datedRecords.map((item) => <li key={item.id}><button className="route-event-link" disabled={!ready}
            onClick={() => select(item.id)}>{item.date} · {item.title}</button></li>)}</ul></details>}
        {dossier && <section className="maratha-dossier" aria-labelledby="dossier-title">
          <h3 id="dossier-title">{dossier.title}</h3><p>{dossier.summary}</p>
          <p className="route-links"><a href={dossier.href}>Explore the case →</a><a href={sources[dossier.source].url}>Open its source ↗</a></p>
        </section>}
      </section>
    </div>
    <section className="route-person" aria-labelledby="fort-journey">
      <h3 id="fort-journey">What did forts and ports need?</h3>
      <div className="route-links maratha-event-buttons">{dossiers.map((item) => <button disabled={!ready} key={item.id} aria-pressed={place.id === item.place}
          onClick={() => select(event.id, item.place)}>{places.find((point) => point.id === item.place)!.name}</button>)}</div>
      <p>Each site opens its own case. The date control follows documented changes in authority, and the map locates separate records and sites.</p>
    </section>
  </section>;
}
