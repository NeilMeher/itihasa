import { useEffect, useState } from 'react';
import land from '../../../../content/swarajya-land.json';
import { mapFor } from '../lib/project-graph';
import { kandaUrl, ramaPassageUrl, ramayana, ramayanaReadings, ramayanaSceneUrl } from '../lib/ramayana';
import { passagePart } from '../lib/chapter-reading';

const { books, episodes, people, places } = ramayana;
const [west, south, east, north] = land.views.overview.bounds;
const initial = { scene: episodes[0].id, person: '', place: '' };

export default function RamayanaRoute() {
  const [selection, setSelection] = useState(initial);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const person = people.find((item) => item.id === selection.person);
  const arc = person ? episodes.filter((item) => item.people.includes(person.id)) : episodes;
  const scene = arc.find((item) => item.id === selection.scene) ?? arc[0];
  const at = arc.indexOf(scene);
  const place = places.find((item) => item.id === (selection.place || scene.place));
  const note = ramayanaReadings.get(scene.id)!;

  useEffect(() => {
    function restore() {
      const query = new URLSearchParams(window.location.search);
      setSelection({
        scene: episodes.find((item) => item.id === query.get('scene'))?.id ?? initial.scene,
        person: people.find((item) => item.id === query.get('person'))?.id ?? '',
        place: places.find((item) => item.id === query.get('place'))?.id ?? '',
      });
      setPlaying(false);
    }
    restore();
    setReady(true);
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || at === arc.length - 1) {
        setPlaying(false);
        return;
      }
      setPosition({ ...selection, scene: arc[at + 1].id, place: '' });
    }, 7800);
    return () => window.clearTimeout(timer);
  }, [playing, at, arc, selection]);

  function setPosition(next: typeof initial) {
    setSelection(next);
    const url = new URL(ramayanaSceneUrl(next.scene), window.location.origin);
    if (next.person) url.searchParams.set('person', next.person);
    if (next.place) url.searchParams.set('place', next.place);
    window.history.replaceState(null, '', url);
  }

  function choose(id: string, personId = selection.person) {
    setPlaying(false);
    setPosition({ scene: id, person: personId, place: '' });
  }

  function placeChoice(id: string) {
    setPlaying(false);
    setPosition({ ...selection, place: id });
  }

  return <section className="route-reader" aria-label="Rāmāyaṇa story and journey">
    <div className="route-controls">
      <label>Follow a person<select disabled={!ready} value={selection.person} onChange={(event) => {
        const id = event.target.value;
        const next = episodes.find((item) => item.id === scene.id && (!id || item.people.includes(id)))
          ?? episodes.find((item) => !id || item.people.includes(id))!;
        choose(next.id, id);
      }}><option value="">All story scenes</option>{people.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Jump to a kāṇḍa <select disabled={!ready} value={scene.book} onChange={(event) =>
        choose(episodes.find((item) => item.book === Number(event.target.value))!.id, '')}>
        {books.map((book) => <option key={book.number} value={book.number}>{book.name} · {book.title}</option>)}
      </select></label>
      <div className="route-step">
        <button disabled={!ready || !at} aria-label="Previous Rāmāyaṇa scene" onClick={() => choose(arc[at - 1].id)}>←</button>
        <button disabled={!ready} onClick={() => {
          if (playing) { setPlaying(false); return; }
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) choose(arc[(at + 1) % arc.length].id);
          else { if (at === arc.length - 1) setPosition({ ...selection, scene: arc[0].id, place: '' }); setPlaying(true); }
        }}>{playing ? 'Pause' : 'Play'}</button>
        <button disabled={!ready || at === arc.length - 1} aria-label="Next Rāmāyaṇa scene" onClick={() => choose(arc[at + 1].id)}>→</button>
      </div>
    </div>
    <label className="route-scrub">Scene {at + 1} of {arc.length}
      <input disabled={!ready} type="range" min="0" max={arc.length - 1} value={at} aria-valuetext={scene.title}
        onChange={(event) => choose(arc[Number(event.target.value)].id)} />
    </label>
    <div className="route-stage">
      <article className="route-scene" aria-live="polite">
        <p className="route-locator">Baroda {books[scene.book - 1].name} · {scene.book}.{scene.chapter}</p>
        <h2>{scene.title}</h2>
        <p>{note.voice}</p><p>{note.summary}</p><p>{note.aftermath}</p>
        <div className="route-links">{note.anchors.map((line) => <a key={line} href={ramaPassageUrl(scene.book, line)}>{passagePart(line)} Sanskrit ↗</a>)}</div>
        <div className="route-links">
          <a href={`${kandaUrl(scene.book)}#sarga-${scene.chapter}`}>Read the annotated sarga →</a>
          <a href={mapFor(`ra-episode-${scene.id}`)}>Open in the mind map →</a>
          {scene.related && <a href={scene.related}>Open related investigation →</a>}
        </div>
        <h3>People in the scene</h3>
        <div className="route-links">{scene.people.map((id) => <a key={id} href={mapFor(`ra-person-${id}`)}>{people.find((item) => item.id === id)!.name}</a>)}</div>
      </article>
      <section className="route-map" aria-label="Literary route and geographic references">
        <div className="route-map-frame" aria-label="Modern geographic reference points">
          {land.views.overview.outlines.map((shape, num) => <span key={num} aria-hidden="true" style={{ clipPath: `polygon(${shape})` }} />)}
          <span className="route-north" aria-hidden="true">↑ N</span>
          {places.filter((item) => item.lat !== null).map((item) =>
            <button key={item.id} type="button" aria-pressed={item.id === place?.id} disabled={!ready}
              aria-label={`Locate ${item.name}`} style={{
                left: `${(item.lon! - west) * 100 / (east - west)}%`, top: `${(north - item.lat!) * 100 / (north - south)}%`,
              }} onClick={() => placeChoice(item.id)}>{item.id === place?.id ? item.name : '•'}</button>)}
        </div>
        <p className="route-map-credit">Modern references · <a href="https://www.naturalearthdata.com/downloads/50m-physical-vectors/50m-land/">Natural Earth</a></p>
        <label>Inspect a place <select disabled={!ready} value={place?.id ?? ''} onChange={(event) => placeChoice(event.target.value)}>
          <option value="">Place from the current scene</option>{places.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
        {place ? <div className="route-place-detail">
          <h3>{place.name}</h3><p><strong>{place.status}.</strong> {place.summary}</p>
          <a href={place.source}>Place source ↗</a>{' · '}<a href={mapFor(`ra-place-${place.id}`)}>Mind map →</a>
          <ul>{episodes.filter((item) => item.place === place.id).map((item) => <li key={item.id}>
            <button disabled={!ready} onClick={() => choose(item.id, person && item.people.includes(person.id) ? person.id : '')}>{item.title}</button>
          </li>)}</ul>
        </div> : <p>The selected scene has no fixed location on this map.</p>}
      </section>
    </div>
    {person && <div className="route-person">
      <h3>{person.name}’s narrative sequence</h3><p>{person.summary}</p>
      <ol>{arc.map((item) => <li key={item.id}><button disabled={!ready} aria-current={scene.id === item.id ? 'step' : undefined}
        onClick={() => choose(item.id)}>{item.title}</button> <span>{places.find((stop) => stop.id === item.place)?.name ?? 'Literary setting'}</span></li>)}</ol>
    </div>}
  </section>;
}
