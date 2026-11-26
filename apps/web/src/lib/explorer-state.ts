import { lanes, type Lane, type WorkspaceState } from './explorer';
import { appearances, items, laneFor, nodes, placeById, relations, timeline, type ExplorerItem } from './explorer-content';
import { withQuery } from './selection';
import { journeyFor } from './map-journeys';

export const initial: WorkspaceState = {
  lane: 'mahabharata', node: 'ma-episode-frame', view: 'timeline', scope: 'all', person: '', place: '', query: '',
  work: 'all', relation: 'all', edge: '', context: '', bounds: '', ahead: '', panel: 'story', trail: '', journey: '', step: '',
};
export function resolve(params: URLSearchParams, start?: string): { state: WorkspaceState; invalid: string } {
  const laneKey = params.get('lane');
  const requestedLane = laneKey && Object.hasOwn(lanes, laneKey) ? laneKey as Lane : initial.lane;
  const scope = params.get('scope') ?? 'all';
  const defaultNode = timeline[requestedLane].find((item) => item.scope === scope || scope === 'war' && item.day)?.id
    ?? timeline[requestedLane][0].id;
  const legacyScene = params.get('scene');
  const legacyDay = Number(params.get('day'));
  const legacyEvent = params.get('event');
  const rawPlace = params.get('place') ?? '';
  const scopePrefix = ({ mahabharata: 'ma-place-', ramayana: 'ra-place-', maratha: 'maratha-place-' } as Partial<Record<Lane, string>>)[requestedLane] ?? '';
  const scopedPlace = scopePrefix + rawPlace;
  const legacyPlace = !params.has('node') && placeById.has(scopedPlace) ? scopedPlace : '';
  const legacyContext = legacyEvent ? 'maratha-event-' + legacyEvent
    : legacyScene ? (requestedLane === 'ramayana' ? 'ra' : 'ma') + '-episode-' + legacyScene : '';
  const requested = params.get('node')
    ?? (legacyPlace || null)
    ?? (legacyDay ? timeline.mahabharata.find((entry) => entry.day === legacyDay)?.id ?? 'unknown-day' : null)
    ?? (legacyContext || null)
    ?? start
    ?? defaultNode;
  const invalid = !nodes.has(requested) ? 'item' : laneKey && !Object.hasOwn(lanes, laneKey) ? 'lane' : '';
  const node = invalid === 'item' ? defaultNode : requested;
  const lane = items.get(node)?.lane ?? laneFor(nodes.get(node)) ?? requestedLane;
  const rawPerson = params.get('person') ?? '';
  const person = nodes.get(rawPerson)?.kind === 'person' ? rawPerson :
    lane === 'ramayana' && nodes.has('ra-person-' + rawPerson) ? 'ra-person-' + rawPerson : '';
  const place = placeById.has(rawPlace) ? rawPlace : '';
  const context = params.get('context') ?? (legacyPlace ? legacyContext : '');
  const relation = params.get('relation') ?? 'all';
  const work = params.get('work') ?? 'all';
  const panel = params.get('panel');
  const journey = journeyFor(params.get('journey') ?? '');
  const step = Number(params.get('step'));
  return {
    invalid,
    state: {
      ...initial, node, lane, person, place,
      view: params.get('view') === 'map' || (start && !params.has('view')) ? 'map' : 'timeline',
      scope: (scope === 'war' && lane === 'mahabharata') || timeline[lane].some((item) => item.scope === scope) ? scope : 'all',
      query: params.get('query')?.slice(0, 120) ?? '',
      relation: relations.includes(relation) ? relation : 'all',
      work: [...nodes.values()].some((item) => item.work === work) ? work : 'all',
      edge: params.get('edge') ?? '', context: items.has(context) ? context : '',
      bounds: (params.get('bounds') ?? '').split(',').filter((entry) => ['stars', 'season', 'moon'].includes(entry)).join(','),
      ahead: params.get('ahead') === 'relative' ? 'relative' : '',
      panel: panel === 'sources' || panel === 'geography' || panel === 'investigation' ? panel : nodes.get(node)?.kind === 'place' ? 'geography' : 'story',
      trail: (params.get('trail') ?? '').split(',').filter((id) => nodes.has(id)).slice(-5).join(','),
      journey: journey?.id ?? '', step: journey && Number.isInteger(step) && step >= 1 && step <= journey.steps.length ? String(step) : '',
    },
  };
}

export function readingHref(href: string, person: string) {
  return href.startsWith('/ramayana/?scene=') && person.startsWith('ra-person-') ?
    withQuery(href, { person: person.slice('ra-person-'.length) }) : href;
}

export function includesPerson(item: ExplorerItem, person: string) {
  return !person || item.people.includes(person) || Boolean(appearances[person]?.includes(item.id));
}
