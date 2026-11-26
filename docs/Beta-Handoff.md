# Itihāsa beta handoff

## Coverage in this build

| Route | Working feature and current coverage |
| --- | --- |
| `/`, `/search/`, `/coverage/` | Homepage with all six product paths, fast local search by question, person, place, term or passage, and counts derived from the content records |
| `/epics/` and four collection pages | Navigate nine annotated episodes across the Mahābhārata, Vālmīki Rāmāyaṇa, Bhāgavata Purāṇa and Harivaṃśa |
| `/arundhati/` | BORI Bhīṣmaparvan 6.2.31, separate working translation and Oak interpretation, six illustrative frames, keyboard and reduced-motion controls, static position table, historical result unavailable |
| `/stories/jayadratha/` | Ganguli Drona Parva CXLV, a source-linked checklist for evaluating an eclipse claim, and its contrast with the pilgrimage episode |
| `/stories/rama-birth/` | Edition comparison for Baroda Bālakāṇḍa 1.17.6 and the Southern Recension 1.18.8–10, including excerpts and exact locators |
| `/stories/krishna-birth/`, `krishna-gokula`, `krishna-mathura`, `krishna-dvaraka`, `krishna-kurukshetra` | Five chronological readings from Bhāgavata 10.3, 10.5, 10.41, 10.44, 10.50 and 10.82, with episode sources and named literary places |
| `/stories/harivamsa-kamsa/` | One parallel reading from Vaidya Harivaṃśa 76.40–43 |
| `/panchang/`, `/festivals/janmashtami/`, `/festivals/rama-navami/` | City/date calculator for five limbs and change times, daylight subdivisions, lunar phase, amānta and pūrṇimānta names, and two worked festival lessons |
| `/birth-sky/` | Fictional example, Moon’s rāshi and nakshatra, eastern-horizon lagna, and possibilities across the local civil day when time is blank |
| `/workshop/` | One worked civil-day advance of the mean Sun, using the Burgess edition and a separate JPL mean sidereal-period comparison |
| `/research/` | Passage and original author claims, working modern benchmark, public historical review status |
| `/swarajya/` | Two dated events, four coordinate markers, two source views of the Agra escape, seven Raigad elevation samples, text alternatives and a route left uncertain |

Episode counts are 2 Mahābhārata, 1 Rāmāyaṇa, 5 Bhāgavata and 1 Harivaṃśa. That is selected passage and chapter coverage. Textual excerpts are short, English elsewhere is editorial paraphrase, and the VedaBase translation is linked. Before a public release, review the existing local Sanskrit display permissions and independently check the Sanskrit translation and edition comparison.

## Modern calculations and reference checks

- Supported Gregorian dates run from 1 January 2024 through 31 December 2027. The supported city coordinates are New Delhi, Mumbai and Pune, with a fixed modern IST offset of +05:30. Site elevation for the rise/set model is zero. Arbitrary locations, foreign time zones and historical civil times have no beta input path.
- Astronomy Engine 2.1.19 supplies Sun, Moon, and sunrise/sunset. The named linear Lahiri approximation uses the mean 1956 anchor and a 50.29 arcsec per Julian year drift. The single-day limbs are sampled at sunrise and their next transitions are bracketed on half-hour steps. Month names use new-moon ingress, with a simple intercalary-month rule. Leap-month and external city comparisons need further review. Daylight windows are named weekday subdivisions under the chosen convention.
- The New Delhi 1 January 2025 comparison gives sunrise 07:13:56 vs 07:14 and sunset 17:35:38 vs 17:36. The computed Dvitīyā transition is 02:25:12 the next morning vs 02:24. Other tested limbs match the published names, with end times within 101 seconds on that day. The 19 January check finds sunrise at 07:14:16 with Pañcamī ending at 07:31:56, compared with the reference end of 07:31:03. For 6 April the computed Navamī end is 19:24:12 vs 19:22. The acceptance limits are 120 seconds for rise/set and 180 seconds for boundaries. The tests check the tithis across the computed boundaries as well as at sunrise. [Daily calendar](https://www.drikpanchang.com/panchang/day-panchang.html?date=01%2F01%2F2025&lang=en) · [Near-sunrise case](https://www.mypanchang.com/phppanchang.php?cityhead=&cityname=NewDelhi-India&mn=00&monthtype=0&yr=2025) · [Published Navamī boundary](https://www.drikpanchang.com/panchang/tithi/daily/shukla-navami-date-time.html?year=2025)
- The fictional 1 January 2025 08:00 example reports Makara, Uttara Āṣāḍhā and Dhanu, consistent with the daily Moon and rising-sign tables. Birth fields stay in browser memory and pass in a same-origin POST. The server keeps no calculation logs or persistence and sends `Cache-Control: no-store`. Date only yields the local-day Moon intervals. [Published Moon and Udaya Lagna table](https://www.drikpanchang.com/panchang/day-panchang.html?date=01%2F01%2F2025&lang=en)
- The traditional exercise gives 3548.16956 arcseconds per day. Burgess’s worked proportion uses 3548 + 10/60 arcseconds. The difference is about 0.003 arcsec. The JPL comparison uses an identical elapsed interval and 365.25636 days per mean sidereal year. [Burgess, printed p. 358](https://classicalastrologer.com/wp-content/uploads/2018/04/surya_siddhanta_english.pdf) · [JPL constants](https://ssd.jpl.nasa.gov/astro_par.html)

## Research and release status

The modern Arundhatī check was re-run after integrating the method commit. At Greenwich on 1 January 2025 UT1, the candidate mean upper transit puts Mizar A first by 77.498 seconds, agreeing with the pinned IAU 2006 path within 1.06 ms per crossing. The historical workflow uses the same HIP identifiers and frame conventions with ERFA space motion and Vondrák precession. It compares an annual grid with the 60,097-point quarterly grid and refines numerically bracketed changes of sign. Its six scenarios include the two Hipparcos reductions, two radial-velocity stress settings and two pole-tilt stress settings. A minimum order margin and pole mask mark unresolved samples. The stress settings are numerical sensitivity checks. A component-specific covariance and orbit model, an independent long-term model comparison, and an independent scientific review of the full historical search remain open.

The manifest records normalized civil-date labeling separately from Oak’s original proleptic Julian label and the TT search grid. It includes model versions, per-scenario brackets and raw-data checksums. The compressed samples, manifest, catalogue inputs and scripts live in `research/`. Nothing from this prereview dataset is presented as a historical result on the website.

The exploratory scenarios each have two numerically bracketed sign changes, but disagree near both boundaries. The conservative sample labels contain two unresolved spans, J−11109.25 through J−10103.00 and J−4652.25 through J−4504.00, on the Julian-epoch TT grid. The manifest records the neighboring unanimous samples and the individual brackets. These are sensitivity results from this specified scan. They await independent scientific review.

Swarajya has two historical entries. The geographic markers use sourced modern coordinates. The Natural Earth outlines are clipped from its public-domain land file, and the slope comes from sampled Copernicus elevation data. The intermediate route after the Agra escape remains uncertain. Other forts, governance, trade, regional tellings and deeper chapter coverage are content backlog items. Current primary sources are listed inline. The local Cursor prototype supplied the visual reference. The available Antigravity material was the prior UI correction and QA checklist. A new independent Antigravity review is pending. [Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/)

## Progress log

- `416f7ab` supplies the polished pilot, mobile citation, responsive arrow and expanded-state regression.
- `f57db78` integrates the modern transit method from `f702402`.
- `8cfc397` records the full prereview scan and its locked research dependencies.
- The local beta implementation adds the home, library, calculators, interactive lessons and map. The remaining release work is listed above.

## Local checks

The Windows checks used Node 24.12.0, CPython 3.14.0, uv 0.13.10 and the locked dependencies. The [README verification section](../README.md#verify) lists the commands.

| Check | Result |
| --- | --- |
| Locked uv sync, inherited evidence schema, new beta content records | Passed |
| Generated TypeScript evidence declarations | No diff |
| Modern Arundhatī reference, historical artifact replay | Passed |
| Python unittest discovery | 17 passed |
| Astro and TypeScript diagnostics | 0 errors, warnings or hints |
| Static build | 24 pages |
| Playwright Chromium | 11 tests covering the 360 px, 390 px and desktop flows, including live local API requests |

GitHub-hosted CI and real-device testing remain pending. Natural Earth geometry can be rebuilt from the pinned download URL in `content/swarajya-land.json` with `python research/build_land_outline.py <land.geojson>`. This data preparation happens separately from the offline site build.

## Antigravity QA prompt

> Review the local Itihāsa beta on `codex/full-build`. Record `git rev-parse HEAD`, run the production build, then run the existing Playwright suite against that build from the repository root. Keep review read-only. Inspect 360×640, 390×844 and 1280×900. Start at the homepage and follow the first sky action. Open both the demo positions and Oak’s interpretation at each viewport. Check keyboard and reduced-motion operation, Sanskrit punctuation, source access, and the unavailable historical status. Search for 6.2.31, rāshi, राशि, Yaśodā and Dvārakā. Compare Rāma’s editions, try the New Delhi calendar example and both Janmāṣṭamī month names, and run the fictional birth with and without a time. Inspect the workshop slider and Agra uncertainty. Return pass/fail steps, screenshots, and any console or network issues. Distinguish a calculated modern check from the prereview historical run.

```powershell
$env:ASTRO_TELEMETRY_DISABLED = '1'
npm.cmd run build
if ($LASTEXITCODE -eq 0) { npm.cmd run test:browser }
```

For a manual preview after the build, run `uv run --locked --project research python research/serve_beta.py` and open [the beta](http://127.0.0.1:4321/). Stop that manual server before running Playwright on the same port.
