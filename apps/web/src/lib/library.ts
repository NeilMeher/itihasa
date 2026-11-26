import raw from '../../../../content/library.json';
import chapterNotes from '../../../../content/mahabharata-annotations.json';

type Source = { title: string; edition: string; attribution: string; url: string };
type Passage = { id: string; source: string; chapter: string; locator: string; reading: string; url?: string; excerpt?: string };
type Episode = {
  id: string; collection: string; path: string; title: string; question: string; summary: string;
  people: string[]; places: string[]; aliases: string[]; passages: Passage[]; related: string[];
};

export const collections = raw.collections;
export const episodes: Episode[] = raw.episodes;
export const sources: Record<string, Source> = raw.sources;
export const journey = raw.journey.map((id) => episodes.find((episode) => episode.id === id)!);

export const areas = [
  { url: '/mahabharata/', title: 'Mahābhārata Atlas', text: 'Explore all eighteen parvas, geography, the sky and dating evidence.', aliases: 'Mahabharata atlas timeline map Oak' },
  { url: '/epics/', title: 'Epics & Purāṇas', text: 'Follow stories across editions and open the passages behind them.', aliases: 'Mahabharata Ramayana Puranas epic' },
  { url: '/panchang/', title: 'Today’s Pañchāṅga', text: 'See the five limbs of the calendar and when they change.', aliases: 'panchang panchanga पंचांग tithi योग nakshatra पक्ष rahu kala' },
  { url: '/birth-sky/', title: 'My Birth Sky', text: 'Read the Moon’s rāshi and nakshatra, and find what needs a birth time.', aliases: 'rashi rāshi राशि nakshatra नक्षत्र lagna लग्न' },
  { url: '/workshop/', title: 'Sūrya Siddhānta', text: 'Work through a traditional calculation of the mean Sun.', aliases: 'Surya Siddhanta सूर्य सिद्धान्त astronomy workshop' },
  { url: '/research/', title: 'Research notebook', text: 'Follow Oak’s argument from the exact verse to the numerical method.', aliases: 'Oak Rupa Bhaty Alcor Mizar precession 5561 12209' },
  { url: '/swarajya/', title: 'Maratha Swarajya', text: 'Explore Raigad’s terrain and the evidence for the escape from Agra.', aliases: 'Raigad Agra Shivaji Sambhaji स्वराज्य शिवाजी रायगड' },
];

export const lessons = [
  { url: '/festivals/janmashtami/', title: 'Janmāṣṭamī', text: 'Compare waning Aṣṭamī in two month conventions.', aliases: 'Janmashtami Krishna जन्माष्टमी Ashtami Shravana Bhadrapada' },
  { url: '/festivals/rama-navami/', title: 'Rāma Navamī', text: 'See why the midday window matters for Caitra Navamī.', aliases: 'Rama Navami राम नवमी Chaitra Ayodhya' },
];

export const searchEntries = [
  ...areas, ...lessons,
  ...episodes.flatMap((e) => [
    { url: e.path, title: e.title, text: e.question, aliases: [...e.aliases, ...e.people, ...e.places].join(' ') },
    ...e.passages.map((p) => ({ url: `${e.path}#${p.id}`, title: p.locator, text: e.title, aliases: p.chapter })),
  ]),
  ...chapterNotes.map((chapter) => ({
    url: `/mahabharata/parva/${String(chapter.book).padStart(2, '0')}/#chapter-${chapter.chapter}`,
    title: chapter.title, text: chapter.summary, aliases: `${chapter.book}.${chapter.chapter} ${chapter.aliases.join(' ')}`,
  })),
];
