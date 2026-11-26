import { withQuery } from './selection';

export const lanes = {
  mahabharata: { name: 'Mahābhārata', time: 'Story order', description: 'Follow the parvas, stories within stories, and all eighteen battle days.' },
  ramayana: { name: 'Rāmāyaṇa', time: 'Story order', description: 'Follow the seven kāṇḍas or trace a character’s journey.' },
  maratha: { name: 'Swarajya', time: 'Documented chronology', description: 'Follow dated changes in authority, from the Deccan to the 1818 settlement.' },
  purana: { name: 'Kṛṣṇa and related texts', time: 'Reading order', description: 'Read parallel episodes with their editions and traditions identified.' },
  research: { name: 'Dating investigations', time: 'Research evidence', description: 'Inspect attributed proposals, model epochs and dated archaeological contexts.' },
  sky: { name: 'Sky and Calendar', time: 'Modern calculations and lessons', description: 'Start with a named date, place, calendar rule or sky lesson.' },
} as const;

export type Lane = keyof typeof lanes;
export type View = 'timeline' | 'map';
export type ReadingPanel = 'story' | 'geography' | 'sources' | 'investigation';
export type WorkspaceState = {
  node: string;
  lane: Lane;
  view: View;
  scope: string;
  person: string;
  place: string;
  query: string;
  work: string;
  relation: string;
  edge: string;
  context: string;
  bounds: string;
  ahead: string;
  panel: ReadingPanel;
  trail: string;
  journey: string;
  step: string;
};

export function explorerHref(fields: Partial<WorkspaceState> = {}) {
  return withQuery('/explorer/', {
    ...fields,
    scope: fields.scope === 'all' ? '' : fields.scope,
    view: fields.view === 'timeline' ? '' : fields.view,
    work: fields.work === 'all' ? '' : fields.work,
    relation: fields.relation === 'all' ? '' : fields.relation,
    panel: fields.panel === 'story' ? '' : fields.panel,
  });
}
