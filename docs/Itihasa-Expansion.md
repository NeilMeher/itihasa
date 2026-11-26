# Itihāsa expansion progress

## Baseline

Work began at `09f542fa0e487df40cc5cdf3f236ef03c7b8857d` on `codex/mahabharata-atlas`. The clean checkout moved to `codex/itihasa-expansion`. The Cursor visual worktree, Arundhatī research worktree and local atlas preview on port 4321 were already present.

| Area | Baseline |
| --- | --- |
| Mahābhārata | 18 parva guides, 1,995 BORI index entries, 72 chapter links to 34 scene readings, zero dedicated chapter annotations, 18 battle-day entries, 20 profiles, nine literary places and 11 dating evidence records |
| Rāmāyaṇa | One Rāma birth comparison in the wider library. No sarga index or atlas |
| Other readings | Nine companion episodes in total, including two Mahābhārata, one Rāmāyaṇa, five Bhāgavata and one Harivaṃśa |
| Swarajya | Two dated events, four modern place markers and seven elevation samples in the Raigad transect |
| Calendar and sky | Pañchāṅga and Birth Sky for Delhi, Mumbai and Pune, 2024–2027. Modern observer positions for 19 objects, 588 times across three sites and four dates. Six illustrative Arundhatī frames |
| Research | Astronomy Engine 2.1.19, ERFA 2.0.1 via pyerfa 2.0.1.5, Hipparcos ICRS astrometry, linear Lahiri approximation for the current calendar. The historical Arundhatī stellar comparison remains prereview |

The core routes were `/`, `/mahabharata/` and its 18 parva guides, `/epics/` plus four collections, `/arundhati/`, eight other story pages, two festival pages, search, coverage, research, Pañchāṅga, Birth Sky, workshop and Swarajya. The previous static build produced 43 pages.

Baseline source, coverage, model replay and reference checks passed. Python discovered 17 passing unit tests. All 18 Playwright tests passed against the running baseline, including its same-origin calculator routes. The modern Greenwich mean-transit benchmark returned Mizar A first by 77.498362881 seconds, within the 0.02-second reference tolerance. The six-scenario prereview scan replayed 60,097 quarterly samples.

The baseline cold/warm visit used locally installed Playwright Chromium at 360×640 and 1280×900. Mobile used a 150 ms latency, 1.6 Mb/s down, 0.75 Mb/s up and 4× CPU slowdown. Each pair used the same fresh context after its first navigation. Usability was measured until the Next Scene button was enabled. These are single local observations.

| Visit | DOM ready | Next Scene enabled | Browser transfer |
| --- | ---: | ---: | ---: |
| 360px cold | 1,274 ms | 3,795 ms | 463,332 B |
| 360px warm | 152 ms | 403 ms | 0 B |
| Desktop cold | 24 ms | 231 ms | 463,332 B |
| Desktop warm | 18 ms | 55 ms | 0 B |

The 360px screenshot showed the first action on the first screen. At desktop width the story tools and map shared the reading area. A target for the expansion is loading the evidence and observer modules on demand.

## Windows checks and isolation

For a fresh checkout, use the versions in `.node-version` and `research/.python-version`, then run `npm.cmd ci`, `uv sync --locked --project research` and `npx.cmd playwright install chromium --only-shell`. Set `PLAYWRIGHT_BROWSERS_PATH=0` before installing Chromium if using the project-local browser cache below. The current checkout already has the locked dependencies and Chromium installed.

```powershell
$env:ASTRO_TELEMETRY_DISABLED = '1'
$expansionDist = Join-Path (Get-Location).Path '.tools/expansion-dist'
npm.cmd run check
npm.cmd run build --workspace @itihasa/web -- --outDir $expansionDist
./research/.venv/Scripts/python.exe research/build_coverage_registry.py --check
$env:PLAYWRIGHT_BROWSERS_PATH = '0'
$env:ITIHASA_PYTHON = (Resolve-Path research/.venv/Scripts/python.exe).Path
$env:ITIHASA_QA_PORT = '4322'
$env:ITIHASA_QA_DIST = $expansionDist
npm.cmd run test:browser
```

For a manual expansion preview, use `./research/.venv/Scripts/python.exe research/serve_beta.py --port 4323 --dist $expansionDist`. Playwright starts its own process on 4322. The earlier atlas preview uses 4321. Node 24.12.0, npm 11.6.2, CPython 3.14.0 and the repo’s uv lock were used. On this machine the locked interpreter is available directly even when uv is absent from the command path.

## Progress

| Milestone | Coverage and verification | Next |
| --- | --- | --- |
| Baseline and shared registry | Captured mobile and desktop visits. Added mutually exclusive index-only, scene-linked-only and chapter-annotation counts. The legacy episode counts remain a separate measure. Added separate build and port options for QA. | Write chapter batches and implement sourced graph traversal. |
| Mahābhārata reader and mind map | Added 42 dedicated chapter readings across all 18 parvas, with 40 chapters that still have scene links only and 1,913 index-only chapters. Verified 140 passage anchors locally. The graph has 126 nodes and 174 directed, sourced relationships. Readers can traverse Draupadī’s story or test Oak’s interpretation from the verse. The 44-page build and 21 browser tests passed. | Add the Baroda Rāmāyaṇa index, reading batch and journey map. Expand chapter commentary and day-level edition checks in later editorial batches. |
| Rāmāyaṇa atlas | Checked all 606 Baroda sarga starts against seven source files. Added 29 chapter annotations and 65 checked passage locators, literary journeys with modern reference points and source links, the birth comparison path, and a separate campaign research view. The 53-page build and 23 browser tests passed. | Develop the Maratha period, fort and documentary investigations. The Rāmāyaṇa still has 577 index-only sargas. Kampaṉ and Tulsīdās need edition-specific passage collation, and Oak’s full book pages and observation tables remain unavailable. |

### Baroda annotation batch and pole calculation

| Kāṇḍa | Sargas indexed | Annotated |
| --- | ---: | ---: |
| Bāla | 76 | 4 |
| Ayodhyā | 111 | 5 |
| Araṇya | 71 | 3 |
| Kiṣkindhā | 66 | 4 |
| Sundara | 66 | 3 |
| Yuddha | 116 | 7 |
| Uttara | 100 | 3 |

The Vega prereview geometry uses HIP 91262, ICRS at J1991.25, zero radial velocity, ERFA proper motion and the Vondrák long-term precession rotation. It samples 12 Julian epochs in TT from J−14000 to J2025. At J−12208 the angle to the mean north pole is 3.610069°. The J2025 angle is 51.191730° from each model to six decimals, within 0.001° of the IAU 2006 control. An angle under a named assumption provides no event date. The identity of Brahmarāśi, the ancient model error and the relationship to a date in the narrative await independent review. [Baroda 6.4.43](https://indology.info/bombay/ramayana/text/UR/Ram06.txt#:~:text=6004043a) · [Oak’s identification](https://nileshoak.wordpress.com/2016/10/07/on-the-identification-of-brahmarashi-with-nakshatra-abhijit/)

### Maratha history

The nine periods run from the late Deccan sultanates through the 1818 settlement and its continuities. The explorer pins 20 dated records to documented locations and separates the geographic precision of a site from the scope of a claim. Thirteen places and four fort or port dossiers connect the timeline to terrain and documents. The Panipat reading follows four stages and the Vasai dossier links to B. K. Apte’s cited Portuguese account. The build produced 54 pages, and all 25 browser tests passed, including Raigad, Agra and Panipat. The catalogued IOR/H/242 papers, Kāśī Rāj’s account and Modi revenue records still need passage or folio-level collation. The site links to the records and identifies the extent consulted.

### Calendar, Birth Sky, workshop and Kṛṣṇa

The Pañchāṅga gives each of the five limbs a practice control tied to the selected sunrise. The New Delhi example for 1 January 2025 returns sunrise at 07:13:56 IST, Dvitīyā changing at about 02:25 IST on 2 January, and the next weekday at the next local sunrise. The Drik Panchang reference reports sunrise at 07:14 and the boundary at 02:24. The locked fixtures check sunrise within 120 seconds and limb boundaries within 180 seconds. The supported cities are Delhi, Mumbai and Pune, with Gregorian dates from 2024 through 2027.

Birth Sky displays the sidereal Moon and ascendant alongside the sidereal and tropical Sun. In the Delhi example, the two solar labels are Dhanu and Capricorn. The ascendant moves from Dhanu at 08:00 to Makara at 08:20 while the Moon rāshi stays Makara. The form uses a transient same-origin POST. The mean-Sun exercise adds a longitude origin and complete-turn reduction. Starting at 359° and advancing two days yields 0.971205° under the Burgess constants. The Kṛṣṇa companion adds six existing episodes to the graph, plus a Janmāṣṭamī observance node and two passage comparisons. Six epics and Purāṇa reading records are retained in this companion.

Type checks, the 55-page build, 19 Python unit tests and all 28 browser tests passed. The browser exercises use the real local calculator. [Bhāgavata 10.44](https://vedabase.io/en/library/sb/10/44/) · [Vaidya Harivaṃśa 76.40–43](https://gretil.sub.uni-goettingen.de/gretil/corpustei/transformations/html/sa_harivaMza.htm#:~:text=HV_76.40) · [Burgess Chapter I](https://www.swaveda.com/texts/surya-siddhanta/1/)

## Coverage before and after

The index count includes every chapter in the reference edition. Index-only, scene-linked only and annotated are exclusive states. A chapter annotation can also have a scene link. The Rāmāyaṇa started with a separate legacy birth comparison, and all seven sarga counts in the table above start from zero. The 29 story scenes each have a corresponding annotated sarga.

| BORI parva | Indexed | Index only | Scene-linked only | Chapter annotations |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 225 | 216 → 216 | 9 → 6 | 0 → 3 |
| 2 | 72 | 63 → 63 | 9 → 4 | 0 → 5 |
| 3 | 299 | 295 → 289 | 4 → 3 | 0 → 7 |
| 4 | 67 | 63 → 63 | 4 → 3 | 0 → 1 |
| 5 | 197 | 194 → 191 | 3 → 1 | 0 → 5 |
| 6 | 117 | 110 → 110 | 7 → 5 | 0 → 2 |
| 7 | 173 | 164 → 164 | 9 → 7 | 0 → 2 |
| 8 | 69 | 65 → 65 | 4 → 3 | 0 → 1 |
| 9 | 64 | 62 → 62 | 2 → 1 | 0 → 1 |
| 10 | 18 | 17 → 17 | 1 → 0 | 0 → 1 |
| 11 | 27 | 25 → 25 | 2 → 1 | 0 → 1 |
| 12 | 353 | 347 → 346 | 6 → 2 | 0 → 5 |
| 13 | 154 | 151 → 151 | 3 → 0 | 0 → 3 |
| 14 | 96 | 95 → 95 | 1 → 0 | 0 → 1 |
| 15 | 47 | 46 → 46 | 1 → 0 | 0 → 1 |
| 16 | 9 | 7 → 7 | 2 → 1 | 0 → 1 |
| 17 | 3 | 0 → 0 | 3 → 2 | 0 → 1 |
| 18 | 5 | 3 → 3 | 2 → 1 | 0 → 1 |
| Total | 1,995 | 1,923 → 1,913 | 72 → 40 | 0 → 42 |

| Coverage type | Baseline → expansion |
| --- | --- |
| Mahābhārata scene readings, people and literary places | 34 → 34 scenes, 20 → 20 people, 9 → 9 places. Added annotated chapters, relationship links and a shared reading graph. |
| Narrative battle days | 18 → 18 day entries, 0 → 18 dedicated boundary notes and cited BORI markers. The sequences around dawn or withdrawal are editorial readings. |
| Mahābhārata dating evidence | 11 → 11 records. Three sky, two calendar, two archaeological, two genetic, one landscape and one proposal. The alternate reading removes the stellar constraint and survives a shared URL. |
| Rāmāyaṇa | 0 → 606 indexed, 0 → 29 annotated, 577 still index-only. One existing birth comparison, 29 new atlas scenes and one new campaign research view. |
| Swarajya | 2 legacy events → 2 legacy events plus an explorer with nine periods and 20 dated records, including the existing cases. Four legacy markers → 13 locations in the history explorer. Seven terrain samples and four linked investigations. |
| Kṛṣṇa and companion episodes | Five Bhāgavata and one Harivaṃśa reading throughout. Added two episode comparisons, a route through the six readings and the Janmāṣṭamī graph connection. |
| Project mind map | 0 → 283 nodes and 414 directed, sourced relationships. |

## Integrated checks

Astro checked 50 files with zero errors, warnings or hints and emitted 55 static pages. All 29 Playwright tests passed against that build and the local Python service at 360×640, 390×844 and 1280×900. They include a blocked-script case for the observer, reduced motion, keyboard actions, 200% layout zoom, deep links, back navigation, multiple open disclosures, unsupported inputs and the JavaScript-free reading fallback. The offline audit resolved 3,106 distinct local paths and fragments. The output contains HTML, CSS and compiled JavaScript. The raw edition texts stay in the ignored source cache.

The Python lock check found no environment changes. All 19 unit tests and the evidence, beta content, atlas, graph, coverage and Maratha validation passed. The downloaded editions matched 1,995 BORI and 606 Baroda chapter starts, plus 159 BORI and 65 Baroda passage locators. The observed modern Greenwich transit difference was 77.498362881 seconds, within 0.02 seconds of the IAU 2006 reference. The observer fixture regenerated 588 frames, 196 phases and four precession samples. The 12 Vega samples and the six-scenario Arundhatī replay of 60,097 quarterly samples matched the stored outputs. The ancient calculations remain prereview. Regenerating the TypeScript evidence declaration produced no Git diff.

The final direct HTTP audit covered 115 unique external page targets. It received 104 successful responses, three 403 responses, one 404 and seven DNS or timeout errors. The historical Gazetteer chapter and the replacement publisher PDF for Satara both returned 404 from this machine. The indexed English revised edition supplies the text under “Maratha Rule,” p. 47 onward. The birth passage’s VedaBase 404 was repaired by linking to its combined verses 7–8. The direct 403s were the Vondrák DOI resolver, the Sanskrit Documents birth passage and the Britannica Pañcāla entry. The JSON report lists the seven transport errors individually. Its status checks cover connectivity. The local edition checks separately validated the passage anchors. [Satara 1963 catalogue](https://tufs.repo.nii.ac.jp/records/43374) · [Vondrák paper PDF](https://www.aanda.org/articles/aa/pdf/2011/10/aa17274-11.pdf) · [IIT Kanpur Bālakāṇḍa 1.18.8](https://heritage.iitk.ac.in/VRAM/1.18.8) · [Bhāgavata 10.3.7–8](https://vedabase.io/en/library/sb/10/3/7-8/)

Run these checks from the repository root on Windows. The first two edition checks take locally retrieved Unicode Roman source files from the Indology BORI and Baroda editions.

```powershell
$python = (Resolve-Path research/.venv/Scripts/python.exe).Path
& $python research/check_mahabharata.py --source-dir .tools/bori-source
& $python research/check_ramayana.py --source-dir .tools/baroda-source
& $python research/audit_expansion_links.py --dist .tools/expansion-dist
& $python research/audit_expansion_links.py --dist .tools/expansion-dist --external --output .tools/expansion-qa/source-link-audit.json
$env:PLAYWRIGHT_BROWSERS_PATH = '0'
node research/profile_browser.mjs final-ma http://127.0.0.1:4323 /mahabharata/
node research/profile_browser.mjs final-graph http://127.0.0.1:4323 /mind-map/
```

### Browser performance

Single cold/warm visits followed the baseline profile described above. The expansion visits were measured before the final Satara citation repair. The mind map measures the time until graph search is enabled. The production preview serves uncompressed files on loopback. Load time varies across runs.

| Visit | Baseline atlas usable | Expansion atlas usable | Expansion mind map usable |
| --- | ---: | ---: | ---: |
| 360px cold | 3,795 ms | 3,843 ms | 3,542 ms |
| 360px warm | 403 ms | 792 ms | 488 ms |
| Desktop cold | 231 ms | 261 ms | 206 ms |
| Desktop warm | 55 ms | 76 ms | 69 ms |

Cold atlas transfer fell from 463,332 B to 444,990 B. In this sample, Atlas mobile cold readiness was close to baseline and warm readiness took 389 ms longer. Moving graph data into its JavaScript chunk reduced the graph’s cold transfer from 600,346 B to 467,121 B and page HTML from 357,093 B to 15,405 B. The graph’s mobile cold readiness moved from 4,321 to 3,542 ms in the recorded visits. The current screenshots and JSON measurements are in the ignored `.tools/expansion-qa` directory.

## Read-only Antigravity walkthrough

Use the SHA provided in the handoff and compare it with `git rev-parse HEAD` on `codex/itihasa-expansion`. The running expansion preview uses port 4323. The Windows build and browser commands above use an isolated output directory and test port. Keep source and release status unchanged during independent review.

1. [Draupadī and the dice match](http://127.0.0.1:4323/mind-map/?node=ma-person-draupadi). At 360×640, use Enter to follow the dice match, filter to “leads to,” and inspect the line that sends the Pāṇḍavas into exile. Open the forest story and trace Nala as a story within it. Use Back to confirm the graph restores the inspected connection.
2. [Vyāsa’s omen](http://127.0.0.1:4323/mind-map/?node=ma-chapter-6-2). Open Oak’s meridian reading and the research method. Review the 77.498-second modern transit benchmark and the unavailable historical result. In the [dating explorer](http://127.0.0.1:4323/mahabharata/?scene=omens&view=evidence&bounds=stars,season), change the reading of “ahead,” verify the overlap moves from 7,000–4,508 BCE to approximately 7,000–3,700 BCE under the selected reported bounds, and reload.
3. [Sītā chooses to go](http://127.0.0.1:4323/ramayana/?scene=sita-exile&person=sita). At 390×844, follow Sītā to the ring scene, inspect Laṅkā’s literary location and the Baroda passage, then go back. In the [campaign investigation](http://127.0.0.1:4323/ramayana/research/), change the pole-distance threshold and disable the proposed Vega identification. Check that the historical date remains unavailable.
4. [Raigad and the coronation](http://127.0.0.1:4323/swarajya/history/?event=capital&place=raigad). Open the terrain case and compare what the modern elevation transect, fort documentation and dated successor record establish. Return to the atlas, then [scrub the Panipat campaign](http://127.0.0.1:4323/swarajya/history/?event=kunjpura) from Kunjpura through the supply crisis, battle and later northern campaign.
5. [Nakshatra and the observed sky](http://127.0.0.1:4323/mind-map/?node=concept-nakshatra). Inspect the route from the Southern Recension birth passage to the calendar. Run the Delhi reference day, open the named limb exercises and compare the date-based boundary with the practice angle. Continue to [Janmāṣṭamī](http://127.0.0.1:4323/krishna/#observance) and compare the same observance in the two lunar month conventions.

Also check the [night fighting and dawn transition](http://127.0.0.1:4323/mahabharata/?scene=jayadratha&day=14) with both disclosures open at 360px. At desktop width, inspect selected sources at 200% layout zoom. With reduced motion and JavaScript disabled in separate passes, verify the [Arundhatī pilot](http://127.0.0.1:4323/arundhati/) still labels all six demo positions illustrative and keeps the verse and source legible. Record browser, viewport, URL, expected and observed behavior and screenshot for each issue. Scholarly review requires its own review record under the evidence contract.

## Remaining editorial and research work

- The Mahābhārata still has 1,913 index-only chapters and 40 scene-linked chapters awaiting individual annotations. The Rāmāyaṇa has 577 index-only sargas. Continue named batches through Āraṇyaka, Udyoga, Śānti, Anuśāsana and Uttara. The war track cites a boundary and a selected event for each day. Full accounts of movements, outcomes and figures need additional scene-level collation.
- Verify Oak’s edition-specific page locators and observation tables in *When Did the Mahabharata War Happen? The Mystery of Arundhati* and *The Historic Rama*. Current comparisons attribute the accessible public explanations. Independently review the identity of Brahmarāśi in Baroda 6.4.43, Mizar’s component and astrometry, ancient pole model error, the reported calendar conventions and what an observer could see at the proposed epochs. ΔT affects conversion to Earth-rotation and local-clock claims. No historical event date is established by the current model runs.
- The birth comparison covers Baroda and the IIT Kanpur Southern Recension. Kampaṉ and Tulsīdās still need edition, passage and rights checks. The Setu map separates the named literary passage from modern bathymetry. It assigns no surveyed route to the unlocated Laṅkā palace or grove.
- The Maratha explorer uses site surveys, published histories and catalogue entries at the scopes displayed. Expand original-document quotation and collation from the British Library IOR/H/242 folios, BISM and state archive Modi material, and Kāśī Rāj Paṇḍit’s Panipat account. Exact campaign supply quantities, control boundaries and disputed Agra details remain open.
