import { branches } from './map-branches';
import { journeys } from './map-journeys';

export const previewNodes = new Set([
  ...branches.flatMap((branch) => branch.groups.flatMap((group) => group.entries.flatMap((entry) => entry.node ?? []))),
  ...journeys.flatMap((journey) => journey.steps.map((step) => step.node)),
]);
