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

For a manual expansion preview, use `./research/.venv/Scripts/python.exe research/serve_beta.py --port 4322 --dist $expansionDist`. Playwright starts its own process, so use a different free port for a concurrent manual preview. Keep port 4321 for the existing atlas. Node 24.12.0, npm 11.6.2, CPython 3.14.0 and the repo’s uv lock were used. On this machine the locked interpreter is available directly even when uv is absent from the command path.

## Progress

| Milestone | Coverage and verification | Next |
| --- | --- | --- |
| Baseline and shared registry | Captured mobile and desktop visits. Added mutually exclusive index-only, scene-linked-only and chapter-annotation counts. The legacy episode counts remain a separate measure. Added separate build and port options for QA. | Write chapter batches and implement sourced graph traversal. |
| Mahābhārata reader and mind map | Added 42 dedicated chapter readings across all 18 parvas, with 40 chapters that still have scene links only and 1,913 index-only chapters. Verified 140 passage anchors locally. The graph has 126 nodes and 174 directed, sourced relationships. Readers can traverse Draupadī’s story or test Oak’s interpretation from the verse. The 44-page build and 21 browser tests passed. | Add the Baroda Rāmāyaṇa index, reading batch and journey map. Expand chapter commentary and day-level edition checks in later editorial batches. |
