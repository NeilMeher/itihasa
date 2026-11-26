# Connected Explorer

## Baseline

Branch `codex/connected-explorer` starts at `44d6a12733810e8a44339afa8d1e4053f4f2f825`. The production baseline has 55 static pages, 283 graph nodes and 414 sourced relationships. The coverage registry records 1,995 BORI chapters with 42 individual annotations, 606 Baroda sargas with 29 annotations, and nine Maratha periods with 20 dated records.

Installed Playwright Chromium reproduced the following at 360×640 against the running production build on port 4323.

| Action | Observed |
| --- | --- |
| Select war day 12 from Jayadratha on day 14 | The story remained “The vow and the darkening sky.” The URL contained `scene=jayadratha&day=12` and `clue=eclipse`. |
| Follow Sītā, choose the ring scene, then open the graph and reading | The reading URL contained only `scene=ring`. Returning through the graph skipped the earlier exile selection. |
| Inspect Panipat from the Raigad coronation | The two panels displayed Panipat and the coronation with equal visual emphasis. |
| Open Draupadī’s node | The summary was present with zero direct profile reading links. |
| Open the homepage | Main navigation offered Epics, Calendar and Search. The page began inside the Mahābhārata atlas. |
