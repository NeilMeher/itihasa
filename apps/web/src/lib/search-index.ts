import maIndex from '../../../../content/mahabharata-chapters.json';
import raIndex from '../../../../content/ramayana-chapters.json';
import maNotes from '../../../../content/mahabharata-annotations.json';
import raNotes from '../../../../content/ramayana-annotations.json';
import readerGraph from '../../../../content/project-graph.json';
import { searchEntries } from './library';
import { explorerHref } from './explorer';

export type SearchEntry = { url: string; title: string; text: string; aliases: string; context: string };

const workLabels: Record<string, string> = {
  mahabharata: 'Mahābhārata', ramayana: 'Rāmāyaṇa', maratha: 'Maratha history',
  purana: 'Purāṇa and Harivaṃśa', sky: 'Sky and Calendar', sources: 'Research',
};
const kinds: Record<string, string> = {
  chapter: 'Chapter reading', episode: 'Event', person: 'Person', place: 'Place', work: 'Work',
  source: 'Source', concept: 'Concept or tool', period: 'Period', claim: 'Research claim',
  tradition: 'Tradition', institution: 'Institution',
};

function legacyContext(url: string) {
  if (url.startsWith('/mahabharata/') || url.startsWith('/arundhati/')) return 'Mahābhārata · Reading';
  if (url.startsWith('/ramayana/')) return 'Rāmāyaṇa · Reading';
  if (url.startsWith('/swarajya/')) return 'Maratha history · Record';
  if (url.startsWith('/stories/')) return 'Library · Passage or story';
  return 'Itihāsa · Section or lesson';
}

export const entries: SearchEntry[] = [
  { url: '/explorer/', title: 'Itihāsa Explorer', text: 'Open the Timeline and Mind Map.', aliases: 'Story events', context: 'Explorer · Workspace' },
  { url: '/library/', title: 'Library', text: 'Browse editions, books and reading coverage.', aliases: 'parva kanda sarga', context: 'Library · Contents' },
  { url: '/sky-calendar/', title: 'Sky and Calendar', text: 'Browse calculators, festivals, and observer tools.', aliases: 'tithi Rahu Kāla ऋतु', context: 'Sky and Calendar · Tools' },
  ...searchEntries.map((entry) => ({ ...entry, context: legacyContext(entry.url) })),
  ...readerGraph.nodes.map((node) => ({
    url: explorerHref({ node: node.id, view: 'map' }), title: node.title, text: node.summary,
    aliases: node.aliases.join(' '), context: workLabels[node.work] + ' · ' + kinds[node.kind],
  })),
];
const exact = new Map<number, Set<number>>();
for (const note of maNotes) {
  const book = exact.get(note.book) ?? new Set<number>();
  book.add(note.chapter);
  exact.set(note.book, book);
}
const raExact = new Set(raNotes.map((note) => note.book + '.' + note.chapter));

export function indexedMatches(query: string): SearchEntry[] {
  const match = query.trim().match(/^(?:(bori|baroda|mahabharata|ramayana)\s+)?(\d{1,2})[.]([1-9]\d{0,2})$/i);
  if (!match) return [];
  const [, work, rawBook, rawChapter] = match;
  const book = Number(rawBook);
  const chapter = Number(rawChapter);
  const padded = String(book).padStart(2, '0');
  const requestedWork = work?.toLowerCase();
  const entries: SearchEntry[] = [];
  if ((!requestedWork || ['bori', 'mahabharata'].includes(requestedWork)) && maIndex.parvas[book - 1]?.chapterStarts[chapter - 1]) {
    entries.push({ title: 'BORI chapter ' + book + '.' + chapter, text: 'Open its exact reference and the closest available readings.',
      aliases: '', context: 'Mahābhārata · ' + (exact.get(book)?.has(chapter) ? 'Annotated chapter' : 'Chapter locator'),
      url: '/mahabharata/parva/' + padded + '/#chapter-' + chapter });
  }
  if ((!requestedWork || ['baroda', 'ramayana'].includes(requestedWork)) && raIndex.books[book - 1]?.chapterStarts[chapter - 1]) {
    entries.push({ title: 'Baroda sarga ' + book + '.' + chapter, text: 'Open its exact reference and the closest available readings.',
      aliases: '', context: 'Rāmāyaṇa · ' + (raExact.has(book + '.' + chapter) ? 'Annotated sarga' : 'Sarga locator'),
      url: '/ramayana/' + padded + '/#sarga-' + chapter });
  }
  return entries;
}
