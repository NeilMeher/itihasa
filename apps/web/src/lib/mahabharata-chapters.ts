import index from '../../../../content/mahabharata-chapters.json';
import { readings, scenes } from './mahabharata';

export const chapterCount = index.parvas.reduce((total, parva) => total + parva.chapterStarts.length, 0);

export function chaptersFor(book: number) {
  return index.parvas[book - 1].chapterStarts.map((line, offset) => {
    const chapter = offset + 1;
    return { chapter, line, readings: scenes.filter((scene) => scene.book === book && readings[scene.id].chapters.includes(chapter)) };
  });
}
