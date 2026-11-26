export type ChapterAnnotation = {
  book: number;
  chapter: number;
  title: string;
  anchors: string[];
  voice: string;
  summary: string;
  aftermath: string;
  scene: string;
  aliases: string[];
};

export function passagePart(line: string) {
  return [Number(line.slice(0, -7)), Number(line.slice(-7, -4)), Number(line.slice(-4, -1))].join('.');
}
