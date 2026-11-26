# Homepage Mind Map

## Baseline and delivery

The work started from `aec89ee1701b2e930665901b05561a715e5c2862` on `codex/connected-explorer`. That build had an editorial Home with an Explorer link and three story links. Its Timeline and Mind Map already shared a typed selection, a catalogue, and source-backed readings. The baseline stayed available on port 4325 for direct comparison. The Cursor and Arundhatī research worktrees remained in their assigned checkouts.

In the baseline, the first Home action was at y=312, 294, and 389 CSS pixels at widths 360, 390, and 1280. The Explorer Timeline’s first event was at y=868 on both mobile widths and y=747 on desktop. Its story heading started at y=1,184 on mobile and y=514 on desktop. The connected Mind Map’s first relationship button started at y=746 on both phones and y=561 on desktop. Its attached story heading started at y=1,858, 1,833, and 1,338. These are first-load positions before scrolling.

`/` now renders the six project branches and search form as HTML. The branch links lead to focused lists on `/map/<branch>/` with category labels, starter readings and journeys. A curated item opens at `/map/reading/<node>/` and includes its story in the static HTML. From there the existing Explorer owns the selection, sourced graph, Timeline, Geography and Sources. It serializes deliberate selections at `/explorer/` with the existing query fields, plus `trail`, `journey` and `step`. The visible category link and the reader’s traversal serve separate purposes. Browser Back and Forward use the same selection resolver. The “Continue exploring” link stores only the last public node, lane, view, scope, person, place and panel in browser storage. Birth Sky has no link to that storage code.

Search loads its index after input. Selecting an item keeps its typed catalogue ID or opens the exact edition locator. Dedicated branch, preview and primary reading links work with JavaScript disabled. The Explorer loads incident relationship data for the current work and loads rendered geography and dating comparisons on demand. The episode explorer no longer includes full BORI or Baroda chapter indices in its startup bundle. The existing library index and search continue to use them.

## Editorial wiring

Coverage remains 1,995 BORI indexed chapters with 47 dedicated annotations and 40 more scene-linked entries, and 606 Baroda indexed sargas with 36 dedicated annotations. Maratha coverage stays at nine periods, 22 dated records and 14 geographic references. The map has 340 nodes and now has 500 sourced relationships, up from 498.

- **Verse and interpretation.** The omen guide opens BORI Bhīṣmaparvan 6.2.31, then Oak’s 8 February 2016 figures, then the date comparison. The graph now directly connects the claim to Oak’s explanation. The pilot’s six positions are illustrative and historical dates remain unavailable pending independent review. [Oak’s figures](https://nileshoak.wordpress.com/2016/02/08/arundhati-vasistha/)
- **Capital and campaign supplies.** The Maratha guide links Raigad’s terrain and water evidence with loss of access to food at the later Panipat camp. The new edge labels the comparison thematic. Raigad’s evaluation, component part 02, describes rainwater harvesting and the market. The district synthesis documents food supply interruption at Panipat. [ICOMOS evaluation, PDF p. 3](https://whc.unesco.org/document/222061#page=3) · [Panipat district history](https://panipat.gov.in/third-battle/)
- **Birth passage comparison.** The Rāmāyaṇa guide and nakshatra journey open Baroda Bālakāṇḍa 1.17.6 and Southern Recension 1.18.8–10 side by side, with the edition labelled on each source. The comparison uses the existing edition records and links to the Rāma Navamī calculation.

## How the performance runs were measured

The original `profile_browser.mjs` ran three baseline cold and warm pairs per route. The release profiler adds screenshots, positions, story readiness and cumulative layout shift. It uses fresh Chromium contexts for cold runs and the same context for the warm repeat. The 360×640 mobile profile uses 150 ms latency, 1.6 Mb/s download, 0.75 Mb/s upload and 4× CPU slowdown. The 390×844 capture uses the same throttle. The 1280×900 desktop runs use an unthrottled connection. Reduced motion is enabled for the measurements.

Home timing ends when the first primary link is visible after DOM content load. Branch timing starts with the Mahābhārata click from Home. The old link opens the dice Timeline directly, so its first action is the enabled timeline search. The new link opens the branch, where the dice link is actionable immediately. Its first story is timed separately from the dice click. Timeline checks the enabled search and first reading. Mind Map checks the first enabled relationship button and the attached profile. Transfer includes the document and its resources. Layout shift excludes shifts attributed to recent input.

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = '0'
node research/profile_map_release.mjs before http://127.0.0.1:4325 .tools/map-home-qa
node research/profile_map_release.mjs after http://127.0.0.1:4327 .tools/map-home-qa
```

### Mobile medians at 360×640

| Journey | Usable action cold before → after | Usable action warm before → after | Cold bytes before → after | Cold first reading before → after |
| --- | ---: | ---: | ---: | ---: |
| Home | 475 → 1,491 ms | 172 → 254 ms | 22,797 → 38,665 | — |
| Mahābhārata from Home | 4,487 → 606 ms | 669 → 542 ms | 590,798 → 3,686 | 4,495 ms from branch click → 883 ms from dice click |
| Timeline direct | 4,682 → 4,395 ms | 438 → 419 ms | 610,625 → 596,783 | 1,236 → 1,405 ms |
| Mind Map direct | 5,749 → 5,283 ms | 1,155 → 1,133 ms | 767,911 → 662,337 | 4,164 → 4,428 ms |

All cells use the median of three samples. The new homepage adds about 16 KB and takes longer at the measured document-ready boundary than the editorial homepage. Its branches are ordinary HTML links. The focused branch loads about 4 KB after the home visit, and the next reading opens from a prerendered page. Direct Timeline and Mind Map controls improve in the cold comparison. Story readiness on those two legacy direct URLs is slightly slower. From the new Map entrance, the first story arrives separately from the relationship controls as soon as the dice reading opens.

The first event card is now at y=476 and y=451 on the 360 and 390 mobile captures. Draupadī’s attached Mind Map reading begins at y=373 and y=349. On the direct Mind Map visit, median cold and warm layout shifts at 360px fell from 0.221 and 0.360 to zero. The 390px branch capture recorded a 0.014 shift. The baseline and release screenshots and raw cold/warm timings are in `.tools/map-home-qa/`.

### Desktop medians at 1280×900

| Journey | Usable action cold before → after | Usable action warm before → after | Cold first reading before → after |
| --- | ---: | ---: | ---: |
| Home | 97 → 126 ms | 42 → 46 ms | — |
| Mahābhārata from Home | 297 → 99 ms | 146 → 92 ms | 298 ms from branch click → 132 ms from dice click |
| Timeline direct | 193 → 221 ms | 79 → 78 ms | 163 → 135 ms |
| Mind Map direct | 930 → 980 ms | 886 → 869 ms | 205 → 257 ms |

The cold transfer counts match the mobile table. The widest visual change on desktop is the profile at y=413 beside the graph instead of y=1,338 below it. The cold direct Mind Map’s median layout shift fell from 0.383 to zero. The first final screenshots are available for [mobile Home](images/map-home-mobile.png) and the [desktop map and reader](images/map-home-desktop.png).

## Verification results

On Windows with Node 24.12.0, npm 11.6.2, Python 3.14.0 and Playwright Chromium, Astro checked 73 files with zero diagnostics and built 116 static pages. The link audit checked 3,366 local paths and fragments and all six relationship files against the complete graph, with zero violations. The audit also inventoried 115 external destinations. The browser suite passed 44 tests against the new static build and the same-origin Python service. Checks included touch at 360×640, keyboard search at 390×844, the desktop map and attached reader at 1280×900, mobile close and focus restoration, reduced motion, reload and browser history, JavaScript-disabled reading, and public-only resume storage. A separate preview pass visited all 17 guided steps and verified rapid selection with motion enabled. The guided calendar test returned Uttara Āṣāḍhā at sunrise for New Delhi on 1 January 2025. The separate Birth Sky example exercised the real service and its transient input.

The 19 Python unit tests, edition index replays, coverage registry, graph regeneration, evidence schema, Maratha sources, modern observer and Vega controls, and historical transit prereview replay passed. The local editions matched 174 BORI anchors and 91 Baroda passage references. The observer replay verified 588 frames, and the historical transit replay matched its six-scenario prereview manifest across 60,097 quarterly samples.

## Read-only Antigravity review

Open the [homepage](http://127.0.0.1:4327/) in a fresh Chromium session at 360×640, 390×844 and 1280×900. Confirm the six branches and search appear in the first viewport. Verify the checked-out commit matches the delivery message. Leave worktree files and research statuses unchanged during review.

1. Touch **Mahābhārata**, then **The dice match**. The story should already be on screen. Select Draupadī and **Into the forest**. Switch to Timeline and confirm exile is selected. Open Sources, follow the chapter link and use Back. The active reading, trail and panel should return. **All Itihāsa** returns to the overview.
2. Search `रायगड` at 390px and choose the place result. Confirm the map label and the named source. Search `BORI 2.57` and check the indexed chapter label. Search for a missing name and use Escape to close results.
3. Follow the [Sītā guide](http://127.0.0.1:4327/map/reading/ra-episode-sita-exile/?journey=sita-to-the-ring&step=1&person=ra-person-sita) from her choice to the ring and the grove. The literary site should remain unplotted. Use Back and Forward across deliberate steps.
4. Open the [Raigad guide](http://127.0.0.1:4327/map/reading/maratha-place-raigad/?journey=forts-and-supply&step=1&panel=geography), then the capital and supply steps. In Mind Map, inspect the thematic relationship and check both source records against the guide. The terrain profile should open at the fort case.
5. Open the [omen guide](http://127.0.0.1:4327/map/reading/ma-chapter-6-2/?journey=read-the-omen&step=1) and verify the verse and the author’s explanation. At the assumption step, choose the relative-position reading and check that the stellar bound drops out while the historical result remains unavailable.
6. Open the [nakshatra guide](http://127.0.0.1:4327/map/reading/concept-nakshatra/?journey=nakshatra-at-sunrise&step=1) and use the two edition links at the middle step. Run New Delhi on 1 January 2025 and inspect the five calendar exercises. Open Birth Sky separately and confirm the calculator leaves its public route and resume link free of form data.
7. Use keyboard navigation and reduced motion. Select two connected events in succession. The last event should be the only active selection. In a fresh JavaScript-disabled context, open a branch, read its first story and follow its ordinary reading link.

For the manual preview after a build, run `./research/.venv/Scripts/python.exe research/serve_beta.py --port 4327 --dist .tools/map-home-dist` from the repository root. To run the regression suite separately in Windows PowerShell, use the locked dependencies and Chromium installation described in the README.

```powershell
$env:ASTRO_TELEMETRY_DISABLED = '1'
$env:PLAYWRIGHT_BROWSERS_PATH = '0'
$env:ITIHASA_PYTHON = (Resolve-Path research/.venv/Scripts/python.exe).Path
$env:ITIHASA_QA_PORT = '4326'
$env:ITIHASA_QA_DIST = Join-Path (Get-Location).Path '.tools/antigravity-map-dist'
npm.cmd run check
npm.cmd run build --workspace @itihasa/web -- --outDir $env:ITIHASA_QA_DIST
& $env:ITIHASA_PYTHON research/audit_expansion_links.py --dist $env:ITIHASA_QA_DIST
npm.cmd run test:browser -- --workers=3
```

## Outstanding research

The full indices still have 1,908 BORI chapters and 570 Baroda sargas without annotations or scene readings. Oak’s complete books and observation tables, further recension collation, the original Peshwa Daftar folio and independent historical review remain open. Local checks can validate accessibility and reproduce the stated numerical runs. Updating the historical evidence status requires independent review of method and result. Hosted CI requires authorization for an exact GitHub remote.
