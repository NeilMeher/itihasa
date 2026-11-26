import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import atlas from '../../../../content/mahabharata-atlas.json';
import reading from '../../../../content/mahabharata-reading.json';
import clues from '../../../../content/mahabharata-evidence.json';
import { chapterCount, chaptersFor, locator, parvaUrl, people, readings, scenes, sourceUrl } from '../lib/mahabharata';
import { foldSearch, mapFor } from '../lib/project-graph';
import MahabharataMap from './MahabharataMap';
const MahabharataEvidence = lazy(() => import('./MahabharataEvidence'));
const MahabharataSky = lazy(() => import('./MahabharataSky'));

type Mode = 'story' | 'sky' | 'evidence';
type Position = { mode: Mode; scene: string; place: string; clue: string; day: number; constraints: string[] };
type ReadingPanel = { kind: 'person'; id: string } | { kind: 'sources' };
const start: Position = { mode: 'story', scene: 'frame', place: '', clue: '', day: 1, constraints: [] };
const tabs: { id: Mode; label: string }[] = [
  { id: 'story', label: 'Story & map' }, { id: 'sky', label: 'Sky map' }, { id: 'evidence', label: 'Dating evidence' },
];

function fromUrl(): Position {
  const query = new URLSearchParams(window.location.search);
  const scene = scenes.find((item) => item.id === (query.get('scene') ?? query.get('episode')));
  const view = query.get('view');
  const day = Number(query.get('day'));
  return {
    scene: scene?.id ?? start.scene,
    place: atlas.places.find((item) => item.id === query.get('place'))?.id ?? scene?.place ?? '',
    clue: clues.find((item) => item.id === query.get('clue'))?.id ?? scene?.clue ?? '',
    mode: view === 'evidence' || view === 'sky' ? view : 'story',
    day: reading.warDays.some((item) => day === item.day) ? day : 1,
    constraints: clues.filter((item) => item.younger !== null && query.get('bounds')?.split(',').includes(item.id)).map((item) => item.id),
  };
}

function commander(day: number) {
  if (day <= 10) return 'Bhīṣma';
  if (day <= 15) return 'Droṇa';
  return day <= 17 ? 'Karṇa' : 'Śalya';
}

export default function MahabharataAtlas({ graphBranches }: {
  graphBranches: Record<string, { id: string; title: string; relation: string }[]>;
}) {
  const [state, setState] = useState<Position>(start);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [query, setQuery] = useState('');
  const [panel, setPanel] = useState<ReadingPanel>();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const sceneHeading = useRef<HTMLHeadingElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const position = scenes.findIndex((item) => item.id === state.scene);
  const scene = scenes[position];
  const excerpt = readings[scene.id];
  const book = atlas.books[scene.book - 1];
  const arc = atlas.arcs.find((item) => item.id === book.arc)!;
  const place = atlas.places.find((item) => item.id === state.place);
  const era = scenes.filter((item) => atlas.books[item.book - 1].arc === arc.id);
  const battle = reading.warDays[state.day - 1];
  const chapterMatch = query.trim().match(/^(\d{1,2})\.(\d{1,3})$/);
  const jumpBook = chapterMatch && atlas.books[Number(chapterMatch[1]) - 1];
  const jumpChapter = jumpBook && chaptersFor(jumpBook.number)[Number(chapterMatch[2]) - 1];
  const matches = query.trim() ? scenes.filter((item) => foldSearch([
    item.title, item.summary, atlas.books[item.book - 1].name, ...readings[item.id].people.map((id) => people[id].name),
  ].join(' ')).includes(foldSearch(query.trim()))) : [];

  useEffect(() => {
    function restore() {
      setState(fromUrl());
      setPlaying(false);
    }
    restore();
    setReady(true);
    if (searchInput.current?.value) setQuery(searchInput.current.value);
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      const next = scenes[position + 1];
      if (next && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        selectScene(next.id, false);
        if (position + 1 === scenes.length - 1) setPlaying(false);
      } else {
        setPlaying(false);
      }
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [playing, state, position]);

  useEffect(() => {
    if (panel && !dialog.current?.open) dialog.current?.showModal();
  }, [panel]);

  function update(next: Position) {
    setState(next);
    const url = new URL(window.location.href);
    url.searchParams.delete('episode');
    for (const [key, value] of Object.entries({
      scene: next.scene, view: next.mode, place: next.place, clue: next.clue, day: next.day === 1 ? '' : next.day, bounds: next.constraints.join(','),
    })) {
      if (value) url.searchParams.set(key, String(value));
      else url.searchParams.delete(key);
    }
    window.history.replaceState(null, '', url);
  }

  function selectScene(id: string, pause = true, day?: number, keepFocus = true) {
    const next = scenes.find((item) => item.id === id);
    if (!next) return;
    if (pause) setPlaying(false);
    const linkedDay = reading.warDays.find((item) => item.scene === id && item.direct)?.day;
    update({ ...state, scene: id, place: next.place, clue: next.clue, day: day ?? linkedDay ?? state.day });
    if (!keepFocus) requestAnimationFrame(() => sceneHeading.current?.focus());
  }

  function changeMode(mode: Mode, clue = state.clue) {
    setPlaying(false);
    update({ ...state, mode, clue });
  }

  function openPanel(value: ReadingPanel, trigger: HTMLElement) {
    opener.current = trigger;
    setPlaying(false);
    setPanel(value);
  }

  return (
    <>
      <nav className="ma-tabs" aria-label="Explorer views">
        {tabs.map((tab) => <button key={tab.id} disabled={!ready} aria-pressed={state.mode === tab.id} onClick={() => changeMode(tab.id)}>{tab.label}</button>)}
      </nav>
      {state.mode !== 'story' && <div className="ma-context">
        <button className="ma-text-button" onClick={() => {
          changeMode('story');
          requestAnimationFrame(() => sceneHeading.current?.focus());
        }}>← Return to {scene.title}</button>
        <span>{book.name} {scene.book} · {place?.name ?? 'Story context'}</span>
      </div>}
      {state.mode !== 'story' && <Suspense fallback={<p className="ma-lab" role="status">Opening {state.mode === 'sky' ? 'the sky map' : 'the dating evidence'}…</p>}>
        {state.mode === 'sky' && <MahabharataSky place={state.place} clue={state.clue || scene.clue} />}
        {state.mode === 'evidence' && <MahabharataEvidence initial={state.clue || scene.clue} filters={state.constraints}
          onClue={(clue, constraints = state.constraints) => update({ ...state, clue, constraints })} />}
      </Suspense>}
      {state.mode === 'story' && <section className="ma-story" aria-label="Narrative timeline">
        <div className="ma-story-bar">
          <h2>Follow the story</h2>
          <span className="ma-scene-count">18 parvas · {scenes.length} scenes · {chapterCount.toLocaleString('en')} chapters indexed</span>
        </div>
        <div className="ma-scrubber">
          <div className="ma-scrubber-head">
            <div className="ma-playback">
              <button aria-label="Previous scene" disabled={!ready || position === 0} onClick={() => selectScene(scenes[position - 1].id)}>←</button>
              <button className="ma-play" disabled={!ready} onClick={() => {
                if (!playing && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                  if (position < scenes.length - 1) selectScene(scenes[position + 1].id);
                  return;
                }
                if (position === scenes.length - 1) selectScene(start.scene);
                setPlaying(!playing);
              }}>{playing ? 'Pause story' : 'Play story'}</button>
              <button aria-label="Next scene" disabled={!ready || position === scenes.length - 1} onClick={() => selectScene(scenes[position + 1].id)}>→</button>
            </div>
            <label htmlFor="ma-scene">Scene {position + 1} of {scenes.length}</label>
          </div>
          <input id="ma-scene" type="range" disabled={!ready} min="0" max={scenes.length - 1} value={position}
            aria-valuetext={scene.title} onChange={(event) => selectScene(scenes[Number(event.target.value)].id)} />
          <div className="ma-narration" role="status"><span>{book.number}. {book.name}</span><span>{scene.title}</span></div>
        </div>
        <div className="ma-jump">
          <label>Jump to parva <select disabled={!ready} value={scene.book} onChange={(event) => selectScene(scenes.find((item) => item.book === Number(event.target.value))!.id)}>
            {atlas.books.map((item) => <option key={item.number} value={item.number}>{item.number}. {item.name} · {item.title}</option>)}
          </select></label>
          <label>Find a scene, person, or chapter <input type="search" ref={searchInput} defaultValue={query} placeholder="Dice, Draupadī, or 2.60" onChange={(event) => setQuery(event.target.value)} /></label>
          <button className="ma-flat" onClick={() => selectScene(start.scene)}>Restart</button>
        </div>
        {query.trim() && <ul className="ma-search-results" aria-label="Timeline search results">
          {jumpChapter && jumpBook && <li><a href={`${parvaUrl(jumpBook.number)}#chapter-${jumpChapter.chapter}`}>Chapter {jumpBook.number}.{jumpChapter.chapter} · {jumpChapter.readings.length ? 'Selected reading and source' : 'Index and source'} →</a></li>}
          {matches.map((match) => <li key={match.id}><button className="ma-text-button" onClick={() => {
            selectScene(match.id, true, undefined, false);
            if (searchInput.current) searchInput.current.value = '';
            setQuery('');
          }}>{match.title} · {atlas.books[match.book - 1].name}</button></li>)}
          {!matches.length && !jumpChapter && <li>No matching scenes or chapters.</li>}
        </ul>}
        <div className="ma-arcs" aria-label="Select a story arc">
          {atlas.arcs.map((item) => <button aria-pressed={arc.id === item.id} key={item.id} onClick={() =>
            selectScene(scenes.find((episode) => atlas.books[episode.book - 1].arc === item.id)!.id)}>{item.title}</button>)}
        </div>
        <div className="ma-stage">
          <article className="ma-episode">
            <p className="ma-kicker">{book.name} Parva · BORI {locator(excerpt.line)}</p>
            <h3 tabIndex={-1} ref={sceneHeading}>{scene.title}</h3>
            {excerpt.notes.map((note) => <p key={note}>{note}</p>)}
            <p className="ma-speaker"><strong>Voice in the passage.</strong> {excerpt.speaker}</p>
            <div className="ma-source-links">
              <a href={sourceUrl(excerpt.line)}>Read BORI {locator(excerpt.line)} ↗</a>
              <a href={`${parvaUrl(book.number)}#chapter-${Number(excerpt.line.slice(2, 5))}`}>Parva guide &amp; chapter index →</a>
              <button className="ma-text-button" onClick={(event) => openPanel({ kind: 'sources' }, event.currentTarget)}>Passages &amp; editions</button>
            </div>
            <div className="ma-scene-actions">
              {scene.id === 'exile-start' && <button className="ma-flat" onClick={() => selectScene('nala', true, undefined, false)}>Enter Bṛhadaśva’s story →</button>}
              {scene.id === 'rule' && <button className="ma-flat" onClick={() => selectScene('liberation', true, undefined, false)}>Hear the father and son →</button>}
              {excerpt.nestedUnder && <button className="ma-flat" onClick={() => selectScene(excerpt.nestedUnder!, true, undefined, false)}>
                {excerpt.nestedUnder === 'exile-start' ? '← Return to the forest exile' : '← Return to Bhīṣma and Yudhiṣṭhira'}
              </button>}
              {scene.id === 'dice' && <button className="ma-flat" onClick={() => selectScene('exile-start', true, undefined, false)}>Follow the consequence into exile →</button>}
              {scene.id === 'peace' && <button className="ma-flat" onClick={() => selectScene('gita', true, 1, false)}>Go to battle day 1 →</button>}
              {scene.id === 'omens' && <a href="/arundhati/">Open the illustrative two-star lesson →</a>}
              <button className="ma-flat" onClick={() => changeMode('sky')}>Open the observer sky →</button>
              {scene.clue && <button className="ma-flat" onClick={() => changeMode('evidence', scene.clue)}>Follow the evidence →</button>}
            </div>
            {excerpt.people.length > 0 && <div className="ma-people" aria-label="People in the scene">
              {excerpt.people.map((id) => <button key={id} className="ma-flat" onClick={(event) => openPanel({ kind: 'person', id }, event.currentTarget)}>{people[id].name}</button>)}
            </div>}
            <details className="ma-chapters">
              <summary>Connections in the mind map</summary>
              <ul className="ma-graph-branches">{graphBranches[scene.id]?.map((branch) =>
                <li key={branch.id}>{branch.relation} · <a href={mapFor(branch.id)}>{branch.title}</a></li>)}</ul>
              <a href={mapFor(`ma-episode-${scene.id}`)}>Open this scene in the mind map →</a>
            </details>
          </article>
          <MahabharataMap selected={state.place} onSelect={(id) => update({ ...state, place: id })} onScene={(id) => selectScene(id, true, undefined, false)} />
        </div>
        {scene.id === 'dice' && <div className="ma-dice">
          <section aria-labelledby="ma-wagers-title"><h3 id="ma-wagers-title">Follow the wagers</h3>
            <ol>{reading.wagers.map(([line, title, summary]) => <li key={line}><a href={sourceUrl(line)}>{title} <small>{locator(line)} ↗</small></a><p>{summary}</p></li>)}</ol>
          </section>
          <section aria-labelledby="ma-court-title"><h3 id="ma-court-title">Who answers Draupadī?</h3>
            <ol>{reading.court.map(([line, name, summary]) => <li key={line}><a href={sourceUrl(line)}>{name} <small>{locator(line)} ↗</small></a><p>{summary}</p></li>)}</ol>
          </section>
        </div>}
        <p className="ma-arc-note">{arc.summary} <span>The selected readings follow the order of the text, including its nested stories.</span></p>
        <div className="ma-episode-rail" aria-label={`Scenes in ${arc.title}`}>
          {era.map((item) => <button key={item.id} aria-pressed={item.id === scene.id} onClick={() => selectScene(item.id)}>
            <span>{atlas.books[item.book - 1].name}</span>{item.title}
          </button>)}
        </div>
        <details className="ma-war-days" open={arc.id === 'war' || scene.id === 'peace' || undefined}>
          <summary>18-day war track</summary>
          <div className="ma-day-buttons" aria-label="Choose a battle day">
            {reading.warDays.map((item) => <button key={item.day} aria-pressed={state.day === item.day} aria-label={`Battle day ${item.day}`} onClick={() => {
              if (item.scene) selectScene(item.scene, true, item.day);
              else { setPlaying(false); update({ ...state, day: item.day, place: 'kurukshetra' }); }
            }}>{item.day}</button>)}
          </div>
          <h3>Day {state.day} · {commander(state.day)} commands</h3>
          <p>{battle.event ?? 'Commander verified. The major events and their exact day assignments await a passage-level check.'}</p>
          <p><a href={sourceUrl('01002026a')}>Command lengths in Ādi 1.2.26–28 ↗</a>{battle.line && <> · <a href={sourceUrl(battle.line)}>Day passage {locator(battle.line)} ↗</a></>}</p>
          <p className="ma-arc-note">Day numbers follow the BORI battle sequence. The night fighting between days 14 and 15 and the raid after day 18 have separate narrative positions.</p>
          <details>
            <summary>Compare battle chapter numbering</summary>
            <p>The Bhīṣma translation by Alex Cherniak labels the opening of day five chapter 69. The corresponding day begins with dawn at BORI 6.65.1. Cherniak’s day-nine chapter 99 opens with the same preparation for battle as BORI 6.95.1.</p>
            <a href="https://claysanskritlibrary.org/wp-content/uploads/2021/05/CSLMahabharata6Bhishma2KauravasConsultation.pdf">Cherniak’s chapter list ↗</a>
          </details>
        </details>
        <details className="ma-chapters">
          <summary>Browse all 18 parvas</summary>
          <div className="ma-books">
            {atlas.books.map((item) => <article key={item.number}>
              <a href={parvaUrl(item.number)}><strong>{item.number}. {item.name}</strong> · {item.title} →</a>
              <p>{item.summary}</p>
            </article>)}
          </div>
        </details>
      </section>}
      <dialog ref={dialog} className="ma-dialog" aria-labelledby="ma-dialog-title" onClose={() => {
        setPanel(undefined);
        opener.current?.focus();
      }}>
        <form method="dialog"><button className="ma-flat" autoFocus>Close</button></form>
        {panel?.kind === 'person' && <>
          <h2 id="ma-dialog-title">{people[panel.id].name}</h2>
          <p>{people[panel.id].bio}</p>
          <a href={mapFor(`ma-person-${panel.id}`)}>Follow {people[panel.id].name} in the mind map →</a>
          <ul>{people[panel.id].links.map(([id, title]) => <li key={id}><button className="ma-text-button" onClick={() => {
            dialog.current?.close();
            selectScene(id, true, undefined, false);
          }}>{title} →</button></li>)}</ul>
        </>}
        {panel?.kind === 'sources' && <>
          <h2 id="ma-dialog-title">Passages for {scene.title}</h2>
          <p>{excerpt.edition ?? 'Sanskrit locators use the BORI Critical Edition. English scene readings are editorial paraphrases.'}</p>
          <p><a href={sourceUrl(excerpt.line)}>Open the passage at BORI {locator(excerpt.line)} ↗</a></p>
          <ul>{excerpt.chapters.map((chapter) => <li key={chapter}><a href={`${parvaUrl(book.number)}#chapter-${chapter}`}>Chapter {scene.book}.{chapter} →</a></li>)}</ul>
          {scene.deepLink && <a href={scene.deepLink}>Read the edition comparison →</a>}
        </>}
      </dialog>
    </>
  );
}
