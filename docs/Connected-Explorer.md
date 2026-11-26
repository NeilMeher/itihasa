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

## Implementation

The Explorer uses the same event ID in its Timeline, Mind Map and reading panel. Selecting a place makes the place the active reading and labels any previous event as context. Selecting an event at the place updates its story, date, location and source together. Person trails and scopes are URL state. The reading panel, graph neighbor filters, research assumptions and relationship inspection are also shareable. Deliberate event selection and settled scrubs add history entries. Pointer-drag previews stay transient.

The Timeline has separate lanes for epic story order, Maratha documented chronology, reading order, research evidence and modern calculations. The Timeline and Mind Map share `explorer-catalog.json` for nodes and sources. The Mind Map loads the full relationship evidence in `explorer-edges.json` when opened. The geography and dating panels also load their own rendering code on demand. The legacy atlas, chapter, graph and tool URLs remain usable. The Rāmāyaṇa’s legacy graph reading link carries its active person through to the route.

| Coverage | Baseline | Connected Explorer |
| --- | ---: | ---: |
| BORI index | 1,995 | 1,995 |
| BORI chapter annotations | 42 | 47 |
| BORI scene-linked only | 40 | 40 |
| BORI index-only | 1,913 | 1,908 |
| Baroda index | 606 | 606 |
| Baroda annotated sargas | 29 | 36 |
| Baroda index-only | 577 | 570 |
| Maratha periods | 9 | 9 |
| Maratha dated records | 20 | 22 |
| Maratha geographic references | 13 | 14 |
| Graph nodes | 283 | 340 |
| Sourced graph relationships | 414 | 498 |

### Added editorial batches

- BORI 3.32 completes a pair of readings on Draupadī’s question about suffering and Yudhiṣṭhira’s reply. BORI 5.72 adds Bhīma’s appeal for restraint. BORI 7.17 puts day 12’s opening passage in the chapter reader. BORI 11.16 and 12.57 add Gāndhārī’s view of the battlefield and Bhīṣma’s advice about opposing an ally.
- Baroda 1.16, 2.105, 3.15, 4.31, 5.35, 6.88, and 7.59 add one sarga in each kāṇḍa. They cover the allies, Bharata’s return journey, a forest season, Sugrīva’s obligation, Sītā’s deadline, the duel in Laṅkā, and a story within Śatrughna’s encounter.
- The Khed record attributes 12 October 1707 to the revised Satara Gazetteer and leaves the exact site unresolved. The Vasai record uses Apte’s published extract of the Peshwa Daftar account, Appendix C-2, extract 1, R. No. 1538/15234. The extract records how an order about friendly relations affected the goods taken from English ships. The archival folio awaits collation. [Satara Gazetteer, p. 47 onward](https://gazetteers.maharashtra.gov.in/Satara/english/SDGrevised/2%20HISTORY.pdf) · [Apte’s compilation](https://sahitya.marathi.gov.in/ebooks/A%20HISTORY%20OF%20THE%20MARATHA%20NAVY%20AND%20MERCHANTSHIPS.pdf)

## Read-only Antigravity review

Use the full commit SHA in the delivery message and verify it with `git rev-parse HEAD` on `codex/connected-explorer`. The shared manual preview is [on port 4325](http://127.0.0.1:4325/explorer/). Keep review notes and screenshots outside tracked files. The original previews have separate output directories.

To build and run a separate browser test server from the repository root in Windows PowerShell, use the locked environment already installed in this checkout.

```powershell
$env:ASTRO_TELEMETRY_DISABLED = '1'
$env:PLAYWRIGHT_BROWSERS_PATH = '0'
$env:ITIHASA_PYTHON = (Resolve-Path research/.venv/Scripts/python.exe).Path
$env:ITIHASA_QA_PORT = '4324'
$env:ITIHASA_QA_DIST = Join-Path (Get-Location).Path '.tools/antigravity-connected-dist'
npm.cmd run check
npm.cmd run build --workspace @itihasa/web -- --outDir $env:ITIHASA_QA_DIST
npm.cmd run test:browser -- --workers=3
```

1. At 360×640, open [Home](http://127.0.0.1:4325/), then [war day 12](http://127.0.0.1:4325/explorer/?node=ma-day-12&scope=war). Sources should show BORI 7.26.2 and the boundary at 7.17.1. Switch to Mind Map and go Back. Day 12 and the source panel should be restored. Day 14 should show Jayadratha’s story and its own eclipse evidence link.
2. At desktop width, open [Draupadī’s profile](http://127.0.0.1:4325/explorer/?node=ma-person-draupadi&view=map). Follow her trail to the dice match and on to exile. Open the chapter and return to the same graph node and panel.
3. At 390×844, [follow Sītā](http://127.0.0.1:4325/explorer/?lane=ramayana&node=ra-episode-sita-exile&person=ra-person-sita). Select the ring and open its reading from the Mind Map. Back and Forward should include both deliberate story selections. Reload on the ring and confirm the trail persists. Geography should describe the grove as a literary place.
4. At desktop width, open [the Raigad coronation](http://127.0.0.1:4325/explorer/?lane=maratha&node=maratha-event-capital). Open Geography and select Panipat. The coronation should be clearly marked as previous context. Choose the 14 January 1761 event, view its source and go Back twice to the place.
5. Open [Oak’s date comparison](http://127.0.0.1:4325/explorer/?node=claim-oak-ahead&panel=investigation&bounds=stars,season). Changing “ahead” to a relative position should remove the stellar bound and widen the reported overlap from 7,000–4,508 BCE to approximately 7,000–3,700 BCE. The historical result should stay unavailable after reload.
6. Open [nakshatra](http://127.0.0.1:4325/explorer/?node=concept-nakshatra&view=map) and follow it to the Pañchāṅga. Run the Delhi reference day and open its five exercises. Separately run Birth Sky and check that entering a date and time keeps the URL at `/birth-sky/`.
7. Search for BORI 2.57 and verify its indexed-only status. Open an [invalid graph ID](http://127.0.0.1:4325/explorer/?node=does-not-exist&view=map) and use search to recover. Try the pilot with reduced motion and JavaScript disabled in separate passes.

## Verification

The Windows build used Node 24.12.0, npm 11.6.2, Python 3.14.0, uv 0.13.10 and the Chromium installed by Playwright. Astro checked 62 files with zero errors, warnings or hints and generated 58 pages. The local audit checked 3,247 paths and fragments with zero violations. Of 115 external destinations, 101 responded successfully, three returned HTTP 403, and 11 could not be reached from this host, including the Satara and Apte PDFs. The browser suite passed 38 tests, including the journeys above at 360×640, 390×844 and 1280×900 as applicable. It exercised Back, Forward and reload, keyboard focus and playback, reduced motion, no-JavaScript reading access, and calculator responses from the local service. Screenshots, profiler data and the per-URL audit are in `.tools/connected-qa/`.

The locked Python environment passed 19 unit tests. Evidence, calculator content, edition indices, coverage, graph, Maratha records and contract generation passed. The local editions verified 174 distinct BORI anchors and 91 distinct Baroda anchors. The observer-sky replay checked 588 frames. The polar-star replay checked 12 samples, including its modern control within 0.001°. The modern transit benchmark measured Mizar ahead of Alcor by 77.49836 seconds against its [reference and 0.02 second tolerance](Arundhati-Method.md). The historical replay matched its prereview manifest for 60,097 quarterly samples and six scenarios. Independent historical review is still pending.

One cold load and one warm reload were measured in local Chromium with reduced motion. Mobile used 360×640, 150 ms latency, 1.6 Mb/s download, 0.75 Mb/s upload and 4× CPU slowdown. Desktop used 1280×900 without throttling. Usable time ends when the home action or the relevant search control responds.

| View | Mobile cold / warm | Desktop cold / warm | Cold bytes transferred |
| --- | ---: | ---: | ---: |
| Home | 726 / 160 ms | 79 / 39 ms | 22,797 |
| Timeline | 4,249 / 1,427 ms | 168 / 104 ms | 610,625 |
| Mind Map | 5,812 / 1,911 ms | 979 / 876 ms | 767,911 |

Sharing the catalogue reduced the Mind Map’s cold transfer from 874,199 to 767,911 bytes. Its cold mobile time dropped from 6,117 to 5,812 ms in the single-run comparison. The warm sample took longer than the first run. The cold mobile map and Timeline still have a measurable load delay.

## Remaining work

The full BORI and Baroda indices are present. The individual annotation counts in the table give the editorial work still ahead. Oak’s complete book editions, observation tables and page locators, additional recension collation, the original Peshwa Daftar folio and other Maratha archival materials, and independent scholarly review of the ancient calculations remain open. Hosted CI requires an authorized GitHub destination. The verification above ran locally.
