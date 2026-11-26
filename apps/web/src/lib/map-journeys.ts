import { mapReadingHref } from './map-branches';
import { withQuery } from './selection';
import type { Lane, ReadingPanel, WorkspaceState } from './explorer';

type Step = { node: string; title: string; action: string; panel?: ReadingPanel; person?: string; bounds?: string };
type Journey = { id: string; branch: Lane; title: string; steps: Step[] };

export const journeys: Journey[] = [
  { id: 'dice-to-exile', branch: 'mahabharata', title: 'How did the dice match lead to exile?', steps: [
    { node: 'ma-person-draupadi', title: 'Meet Draupadī', action: 'Open Draupadī’s story trail and find the dice match among the events in which she appears.' },
    { node: 'ma-episode-dice', title: 'Read the court scene', action: 'Read what Draupadī asks about the wager. Open Sources for the BORI court passage.' },
    { node: 'ma-chapter-2-60', title: 'Open her question in the edition', action: 'Use the chapter link to read the passage and return to this step.' },
    { node: 'ma-episode-exile-start', title: 'Follow the consequences', action: 'Open Timeline to see how the second game leads into the forest years.' },
  ] },
  { id: 'sita-to-the-ring', branch: 'ramayana', title: 'Follow Sītā from her decision to the ring', steps: [
    { node: 'ra-episode-sita-exile', title: 'Sītā chooses to go', action: 'Read Sītā’s choice, then look for her among the people in this scene.', person: 'ra-person-sita' },
    { node: 'ra-person-sita', title: 'Follow her story', action: 'Open her story trail and compare her appearances before and after the abduction.', person: 'ra-person-sita' },
    { node: 'ra-episode-ring', title: 'Recognize the ring', action: 'Open the annotated Baroda sarga and look at what Sītā asks Hanumān.', person: 'ra-person-sita' },
    { node: 'ra-place-lanka', title: 'Locate the literary grove', action: 'Read why the text gives a setting while the map leaves the exact location open.', panel: 'geography', person: 'ra-person-sita' },
  ] },
  { id: 'forts-and-supply', branch: 'maratha', title: 'What did a Maratha fort need to function?', steps: [
    { node: 'maratha-place-raigad', title: 'Look at Raigad', action: 'Inspect the modern pin and its source. The overview locates the fort while the terrain case explains the approaches.', panel: 'geography' },
    { node: 'maratha-event-capital', title: 'Read the capital record', action: 'Follow the fort case to the elevation profile and the evaluated record on rainwater storage and access.' },
    { node: 'maratha-event-panipat-supply', title: 'Compare a later supply problem', action: 'Inspect the supply record. Panipat is a thematic comparison about access and provisions in a later campaign.', panel: 'sources' },
  ] },
  { id: 'read-the-omen', branch: 'research', title: 'Why does Oak read Vyāsa’s omen as a sky clue?', steps: [
    { node: 'ma-chapter-6-2', title: 'Read the omen in BORI', action: 'Open Bhīṣmaparvan 6.2 and locate verse 31 on Arundhatī and Vasiṣṭha.' },
    { node: 'source-oak-meridian', title: 'Read Oak’s interpretation', action: 'Open Oak’s explanation of “ahead” as an order of transit.', panel: 'sources' },
    { node: 'claim-oak-ahead', title: 'Change the assumption', action: 'Switch to the relative-position reading. Check which reported bound drops out and whether the historical review status changes.', panel: 'investigation', bounds: 'stars,season' },
  ] },
  { id: 'nakshatra-at-sunrise', branch: 'sky', title: 'How does nakshatra enter a daily Pañchāṅga?', steps: [
    { node: 'concept-nakshatra', title: 'Find the Moon’s sector', action: 'Read how a named sky group relates to a sector used in the daily calculation.' },
    { node: 'story-rama-birth', title: 'Compare two birth passages', action: 'Find Punarvasu in the fuller recension and compare the corresponding Baroda passage.' },
    { node: 'tool-panchang', title: 'Try the Delhi example', action: 'Open the tool for 1 January 2025. Run the calculation and move the nakshatra exercise to the next sector boundary.' },
  ] },
];

export function journeySelection(journey: Journey, index: number): Partial<WorkspaceState> {
  const step = journey.steps[index];
  return { node: step.node, journey: journey.id, step: String(index + 1), panel: step.panel ?? 'story',
    person: step.person ?? '', bounds: step.bounds ?? '', view: 'map' };
}

export function journeyHref(journey: Journey, index: number) {
  const selection = journeySelection(journey, index);
  return withQuery(mapReadingHref(selection.node!), { journey: selection.journey, step: selection.step,
    panel: selection.panel === 'story' ? '' : selection.panel, person: selection.person, bounds: selection.bounds });
}

export const journeyFor = (id: string) => journeys.find((journey) => journey.id === id);
