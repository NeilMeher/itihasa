export type GraphNode = {
  id: string; kind: string; work: string; title: string; summary: string; href: string; aliases: string[];
};
export type GraphEdge = {
  from: string; to: string; relation: string; scope: string; why: string; source: string; url?: string;
};
export type GraphSource = {
  creator: string; work: string; edition: string; locator: string;
  url: string; basis: string; use: string; review: string;
};
export type ReaderGraph = { nodes: GraphNode[]; edges: GraphEdge[]; sources: Record<string, GraphSource> };

export function foldSearch(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/(\p{Script=Latin})\p{M}+/gu, '$1').normalize('NFC');
}

export const mapFor = (node: string) => `/mind-map/?node=${encodeURIComponent(node)}`;
