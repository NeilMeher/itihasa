import atlas from '../../../../content/ramayana-atlas.json';
import notes from '../../../../content/ramayana-annotations.json';
import index from '../../../../content/ramayana-chapters.json';

export const ramayana = atlas;
export const ramayanaIndex = index;
export const ramayanaReadings = new Map(notes.map((note) => [note.scene, note]));
export const kandaUrl = (book: number) => `/ramayana/${String(book).padStart(2, '0')}/`;
export const ramayanaSceneUrl = (id: string) => `/ramayana/?scene=${encodeURIComponent(id)}`;
export const ramaPassageUrl = (book: number, line: string) => `${index.books[book - 1].url}#:~:text=${line}`;
