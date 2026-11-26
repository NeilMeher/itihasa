import graphData from '../../../../content/explorer-catalog.json';
import library from '../../../../content/library.json';
import atlas from '../../../../content/mahabharata-atlas.json';
import history from '../../../../content/maratha-history.json';
import dating from '../../../../content/mahabharata-evidence.json';
import { locator, parvaUrl, readings, scenes, sourceUrl, warDays } from './mahabharata';
import { kandaUrl, ramaPassageUrl, ramayana, ramayanaReadings, ramayanaSceneUrl } from './ramayana';
import type { Episode } from './library';
import type { GraphNode, GraphSource } from './project-graph';
import type { Lane } from './explorer';

export type ReadingLink = { label: string; href: string };
export type ExplorerItem = {
  id: string;
  lane: Lane;
  scope: string;
  section: string;
  title: string;
  label: string;
  summary: string;
  body: string[];
  href: string;
  places: string[];
  people: string[];
  sources: ReadingLink[];
  links: ReadingLink[];
  day?: number;
  parent?: string;
  clue?: string;
};

export type ExplorerPlace = {
  id: string; lane: Lane; name: string; summary: string; precision: string;
  lat: number | null; lon: number | null; source: ReadingLink;
};

export const nodes = new Map<string, GraphNode>(graphData.nodes.map((node) => [node.id, node]));
export const sources: Record<string, GraphSource> = graphData.sources;
export const neighbors: Record<string, string[]> = graphData.neighbors;
export const appearances: Record<string, string[]> = graphData.appearances;
export const relations: string[] = graphData.relations;
const episodes: Episode[] = library.episodes;
const maId = (id: string) => `ma-episode-${id}`;
const raId = (id: string) => `ra-episode-${id}`;
const maChapter = (line: string) => `${parvaUrl(Number(line.slice(0, 2)))}#chapter-${Number(line.slice(2, 5))}`;
const maSource = (line: string, prefix = 'BORI'): ReadingLink => ({ label: `${prefix} ${locator(line)}`, href: sourceUrl(line) });

function maScene(scene: (typeof scenes)[number]): ExplorerItem {
  const reading = readings[scene.id];
  const book = atlas.books[scene.book - 1];
  return {
    id: maId(scene.id), lane: 'mahabharata', scope: `parva-${scene.book}`, section: book.name, title: scene.title,
    label: `BORI ${locator(reading.line)}`, summary: scene.summary, body: reading.notes, href: `/mahabharata/?scene=${scene.id}`,
    places: scene.place ? [`ma-place-${scene.place}`] : [], people: reading.people.map((id) => `ma-person-${id}`),
    sources: [maSource(reading.line)], links: [{ label: 'Chapter and primary text', href: maChapter(reading.line) }],
    parent: reading.nestedUnder ? maId(reading.nestedUnder) : undefined, clue: scene.clue,
  };
}

function battleDay(day: (typeof warDays)[number]): ExplorerItem {
  const scene = day.scene ? scenes.find((item) => item.id === day.scene) : undefined;
  const book = atlas.books[Number(day.line.slice(0, 2)) - 1];
  const shared = scene ? maScene(scene) : undefined;
  return {
    id: shared?.id ?? `ma-day-${day.day}`, lane: 'mahabharata', scope: `parva-${book.number}`, section: book.name,
    title: shared?.title ?? `War day ${day.day}`, label: `War day ${day.day} · BORI ${locator(day.line)}`,
    summary: day.event, body: [day.boundary, ...shared?.body ?? []],
    href: `/mahabharata/?day=${day.day}${day.scene ? `&scene=${day.scene}` : ''}`,
    places: ['ma-place-kurukshetra'], people: shared?.people ?? [], day: day.day, clue: shared?.clue,
    sources: [maSource(day.line), ...(day.line === day.marker ? [] : [maSource(day.marker, 'Boundary passage')])],
    links: [{ label: 'Chapter and primary text', href: maChapter(day.line) },
      ...(maChapter(day.marker) === maChapter(day.line) ? [] : [{ label: 'Chapter with the boundary passage', href: maChapter(day.marker) }])],
  };
}

const warSceneIds = new Set(warDays.flatMap((day) => day.scene ? [day.scene] : []));
const maTimeline = scenes.flatMap((scene) => {
  if (scene.id === 'gita') return warDays.map(battleDay);
  return warSceneIds.has(scene.id) ? [] : [maScene(scene)];
});

const ramaTimeline: ExplorerItem[] = ramayana.episodes.map((scene) => {
  const note = ramayanaReadings.get(scene.id)!;
  return {
    id: raId(scene.id), lane: 'ramayana', scope: `kanda-${scene.book}`, section: ramayana.books[scene.book - 1].name,
    title: scene.title, label: `Baroda ${scene.book}.${scene.chapter}`, summary: note.summary, body: [note.aftermath, note.voice],
    href: ramayanaSceneUrl(scene.id), places: scene.place ? [`ra-place-${scene.place}`] : [],
    people: scene.people.map((id) => `ra-person-${id}`),
    sources: note.anchors.map((line) => ({ label: `Baroda line ${line}`, href: ramaPassageUrl(scene.book, line) })),
    links: [{ label: 'Read the annotated sarga', href: `${kandaUrl(scene.book)}#sarga-${scene.chapter}` },
      ...(scene.related ? [{ label: 'Open the related investigation', href: scene.related }] : [])],
  };
});

const marathaTimeline: ExplorerItem[] = history.events.map((event) => {
  const record = sources[event.source];
  return {
    id: `maratha-event-${event.id}`, lane: 'maratha', scope: event.period,
    section: history.periods.find((period) => period.id === event.period)!.title,
    title: event.title, label: `${event.date} · ${event.precision}`,
    summary: event.summary, body: [event.authority, event.consequence], href: `/swarajya/history/?event=${event.id}`,
    places: [`maratha-place-${event.place}`],
    people: (neighbors[`maratha-event-${event.id}`] ?? []).filter((id) => nodes.get(id)?.kind === 'person'),
    sources: [{ label: `${record.work} · ${record.locator}`, href: record.url }],
    links: [{ label: 'Evidence and review record', href: `/explorer/?lane=research&node=source-${event.source}&view=map` }],
  };
});

const puranaTimeline: ExplorerItem[] = episodes.filter((episode) => ['bhagavata', 'harivamsa'].includes(episode.collection)).map((episode) => ({
  id: `purana-episode-${episode.id}`, lane: 'purana', scope: episode.collection,
  section: episode.collection === 'bhagavata' ? 'Bhāgavata Purāṇa' : 'Harivaṃśa',
  title: episode.title, label: episode.passages[0].locator, summary: episode.summary, body: episode.passages.map((passage) => passage.reading),
  href: episode.path, places: [], people: ['purana-person-krishna'],
  sources: episode.passages.map((passage) => ({ label: passage.locator, href: passage.url ?? sources[passage.source].url })),
  links: [{ label: 'Compare the three texts', href: '/krishna/' },
    ...(episode.id === 'krishna-birth' ? [{ label: 'Janmāṣṭamī observance', href: '/festivals/janmashtami/' }] : [])],
}));

const researchTimeline: ExplorerItem[] = dating.map((item) => ({
  id: item.id === 'stars' ? 'claim-oak-ahead' : `research-${item.id}`,
  lane: 'research', scope: item.group, section: item.group === 'DNA' ? 'Population genetics' : item.group,
  title: item.title, label: item.status, summary: item.claim, body: [item.limit],
  href: `/mahabharata/?scene=${item.id === 'eclipse' ? 'jayadratha' : 'omens'}&view=evidence&clue=${item.id}`,
  places: [], people: [], clue: item.id,
  sources: [{ label: item.locator, href: item.url }, ...(item.primary ? [{ label: 'Underlying passage or study', href: item.primary }] : [])],
  links: [{ label: 'Modern transit check and historical review status', href: '/research/' }],
}));

researchTimeline.push({
  id: 'claim-oak-vega', lane: 'research', scope: 'Sky', section: 'Sky', title: 'Oak’s identification of Brahmarāśi',
  label: 'Attributed interpretation · Historical date unavailable', summary: nodes.get('claim-oak-vega')!.summary,
  body: ['The project compares Vega’s angular distance from the mean north celestial pole under the proposed identification. The identification and the ancient result await independent review.'],
  href: '/ramayana/research/', places: [], people: [], links: [],
  sources: [{ label: 'Baroda 6.4.43', href: ramaPassageUrl(6, '6004043a') },
    { label: 'Oak’s published identification', href: sources['oak-vega'].url }],
});

const skyTimeline: ExplorerItem[] = [
  ['tool-panchang', 'Calendar', 'Calculate the daily calendar', 'New Delhi · 1 January 2025 example', '/panchang/?date=2025-01-01', 'See sunrise, tithi, nakshatra, yoga, karaṇa and weekday, then move the practice controls.'],
  ['tool-birth-sky', 'Calendar', 'Compare the birth sky', 'New Delhi · 1 January 2025 at 08:00 IST example', '/birth-sky/', 'Compare the Moon’s rāśi, tropical Sun and sidereal ascendant. The local form keeps birth details transient.'],
  ['tradition-janmashtami', 'Festival', 'Janmāṣṭamī', 'New Delhi · 16 August 2025 example', '/festivals/janmashtami/', 'Compare the same observance in the amānta and pūrṇimānta month conventions.'],
  ['tool-rama-navami', 'Festival', 'Rāma Navamī', 'New Delhi · 6 April 2025 example', '/festivals/rama-navami/', 'See how the midday period and Śukla Navamī overlap.'],
  ['tool-observer', 'Sky', 'Explore the observer sky', 'Four modern sample dates · three sites', '/mahabharata/?scene=omens&view=sky', 'Choose a site and time and follow the Moon, planets or selected catalogue stars.'],
  ['tool-mean-sun', 'Sky', 'Calculate the mean Sun', 'Worked arithmetic · elapsed civil days', '/workshop/', 'Step through Burgess’s Sūrya Siddhānta values and compare the mean sidereal rate.'],
].map(([id, section, title, label, href, summary]) => ({
  id, lane: 'sky', scope: section, section, title, label, href, summary, body: [], places: [], people: [],
  sources: [{ label: 'Method and references', href }], links: [],
}));

export const timeline: Record<Lane, ExplorerItem[]> = {
  mahabharata: maTimeline, ramayana: ramaTimeline, maratha: marathaTimeline,
  purana: puranaTimeline, research: researchTimeline, sky: skyTimeline,
};
export const items = new Map(Object.values(timeline).flat().map((item) => [item.id, item]));
export const places: ExplorerPlace[] = [
  ...atlas.places.map((item): ExplorerPlace => ({
    id: `ma-place-${item.id}`, lane: 'mahabharata', name: item.name, summary: item.modern, precision: item.status,
    lat: item.lat, lon: item.lon, source: { label: 'Place reference', href: item.url },
  })),
  ...ramayana.places.map((item): ExplorerPlace => ({
    id: `ra-place-${item.id}`, lane: 'ramayana', name: item.name, summary: item.summary, precision: item.status,
    lat: item.lat, lon: item.lon, source: { label: 'Place reference', href: item.source },
  })),
  ...history.places.map((item): ExplorerPlace => ({
    id: `maratha-place-${item.id}`, lane: 'maratha', name: item.name, summary: item.summary, precision: item.precision,
    lat: item.lat, lon: item.lon, source: { label: sources[item.source].work, href: sources[item.source].url },
  })),
];
export const placeById = new Map(places.map((place) => [place.id, place]));

export function laneFor(node: GraphNode | undefined): Lane | undefined {
  switch (node?.work) {
    case 'mahabharata': case 'ramayana': case 'maratha': case 'purana': case 'sky': return node.work;
    case 'sources': return 'research';
  }
}

export function validateExplorerContent() {
  const entries = Object.values(timeline).flat();
  if (entries.length !== items.size) throw new Error('Duplicate Explorer event identifier');
  for (const item of entries) {
    const node = nodes.get(item.id);
    if (!node || !['episode', 'claim', 'concept', 'tradition'].includes(node.kind) || !item.sources.length || !item.summary) {
      throw new Error('Missing Explorer reading or source: ' + item.id);
    }
    if (item.places.some((id) => !placeById.has(id)) || item.people.some((id) => nodes.get(id)?.kind !== 'person')) {
      throw new Error('Unresolved Explorer place or person: ' + item.id);
    }
    if (item.parent && (!items.has(item.parent) || item.parent === item.id)) throw new Error('Invalid nested scene: ' + item.id);
  }
  if (places.some((place) => nodes.get(place.id)?.kind !== 'place' || !place.source.href)) throw new Error('An Explorer place needs a sourced graph node');
  const sequence = timeline.mahabharata.flatMap((item) => item.day ?? []);
  if (sequence.length !== 18 || sequence.some((day, index) => day !== index + 1)) throw new Error('Incomplete battle day sequence');
  for (const item of timeline.mahabharata.filter((entry) => entry.day)) {
    const day = warDays[item.day! - 1];
    const query = new URL(item.href, 'https://itihasa.invalid').searchParams;
    if (Number(query.get('day')) !== day.day || (query.get('scene') ?? '') !== (day.scene ?? '')) {
      throw new Error('Incompatible war day and reading: ' + item.id);
    }
  }
}
