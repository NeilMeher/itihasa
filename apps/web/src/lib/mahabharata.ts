import atlas from '../../../../content/mahabharata-atlas.json';
import index from '../../../../content/mahabharata-chapters.json';
import reading from '../../../../content/mahabharata-reading.json';

export type Scene = (typeof atlas.episodes)[number];
type Reading = { line: string; chapters: number[]; speaker: string; people: string[]; notes: string[]; nestedUnder?: string; edition?: string };
type Person = { name: string; bio: string; links: string[][] };
export const readings: Record<string, Reading> = reading.scenes;
export const people: Record<string, Person> = reading.people;
export const warDays = reading.warDays;
export const battleScene = (day: (typeof warDays)[number]) =>
  day.scene ?? (day.day < 11 ? 'gita' : day.day < 16 ? 'drona-commands' : 'karna-commands');
export const scenes: Scene[] = [
  { ...atlas.episodes[0], id: 'frame', place: '', title: 'Who tells the Mahābhārata?', summary: 'A storyteller arrives at a forest gathering and recounts what he heard at a king’s sacrifice.' },
  ...atlas.episodes,
];

export function parvaUrl(book: number) {
  return `/mahabharata/parva/${String(book).padStart(2, '0')}/`;
}

export function sourceUrl(line: string) {
  return `${index.parvas[Number(line.slice(0, 2)) - 1].url}#:~:text=${line}`;
}

export function locator(line: string) {
  return [line.slice(0, 2), line.slice(2, 5), line.slice(5, 8)].map(Number).join('.');
}

export const chapterCount = index.parvas.reduce((total, parva) => total + parva.chapterStarts.length, 0);

export function chaptersFor(book: number) {
  return index.parvas[book - 1].chapterStarts.map((line, offset) => {
    const chapter = offset + 1;
    return { chapter, line, readings: scenes.filter((scene) => scene.book === book && readings[scene.id].chapters.includes(chapter)) };
  });
}

export const annotatedChapterCount = atlas.books.reduce(
  (total, book) => total + chaptersFor(book.number).filter((chapter) => chapter.readings.length).length, 0,
);
