# Mahābhārata atlas progress

## Source and coverage

The atlas continues the local beta at `54a2d52` on `codex/mahabharata-atlas`. The chapter index uses the Tokunaga–Smith Unicode Roman e-text of the constituted BORI Critical Edition. The index stores chapter starts and SHA-256 hashes for all 18 files. The Sanskrit files remain at the source. The atlas uses text-fragment links with visible passage locators, and readers can search the e-text for the line identifier in a browser without text-fragment support. [BORI Mahābhārata project](https://bori.ac.in/department/mahabharata/) · [E-text edition statement](https://indology.info/bombay/mahabharata/statement.html)

| Parva | Indexed chapters | Chapters linked to an atlas reading |
| --- | ---: | ---: |
| Ādi | 225 | 9 |
| Sabhā | 72 | 9 |
| Āraṇyaka | 299 | 4 |
| Virāṭa | 67 | 4 |
| Udyoga | 197 | 3 |
| Bhīṣma | 117 | 7 |
| Droṇa | 173 | 9 |
| Karṇa | 69 | 4 |
| Śalya | 64 | 2 |
| Sauptika | 18 | 1 |
| Strī | 27 | 2 |
| Śānti | 353 | 6 |
| Anuśāsana | 154 | 3 |
| Āśvamedhika | 96 | 1 |
| Āśramavāsika | 47 | 1 |
| Mausala | 9 | 2 |
| Mahāprasthānika | 3 | 3 |
| Svargārohaṇa | 5 | 2 |
| **Total** | **1,995** | **72** |

The 34 scene readings are editorial paraphrases. 1,923 chapters offer an index entry and primary text link. “Selected scene reading” means a written scene uses a passage in that chapter. Whole-chapter commentary and independent textual review are pending.

### Battle-day coverage

The command sequence comes from BORI Ādi 1.2.26–28. Each of the 18 positions has a selected event, consequence and passage. The early Bhīṣma days use dawn and withdrawal transitions, checked against Cherniak’s chapter groupings. Day assignments are story positions. The separate night actions around days 14–15 and after day 18 stay explicit. Chapter numbers in Cherniak and Ganguli differ from BORI. A fuller recension-level comparison remains open. [BORI 1.2.26–28](https://indology.info/bombay/mahabharata/text/UR/MBh01.txt#:~:text=01002026a) · [Cherniak I](https://claysanskritlibrary.org/wp-content/uploads/2021/05/CSLMBhBhishma1Gita.pdf) · [Cherniak II](https://claysanskritlibrary.org/wp-content/uploads/2021/05/CSLMahabharata6Bhishma2KauravasConsultation.pdf)

| Days | Commander | Principal anchors in day order |
| --- | --- | --- |
| 1–10 | Bhīṣma | 6.23.21, 6.46.1, 6.55.86, 6.59.1, 6.68.1, 6.73.10, 6.77.11, 6.83.5, 6.95.1, 6.113.21 |
| 11–15 | Droṇa | 7.5.7, 7.26.2, 7.35.15, 7.121.16, 7.165.33 |
| 16–17 | Karṇa | 8.7.1, 8.51.2 |
| 18 | Śalya, followed by the duel | 9.23.16; see 9.57.44 for the blow and 1.2.28 for the raid after the battle |

### Evidence coverage

| Record | What the atlas can show |
| --- | --- |
| Arundhatī–Vasiṣṭha | BORI 6.2.31 and Oak’s 2016 meridian figures. Oak’s reported range is a filter. Modern transit benchmark ran and the historical stellar scenarios remain under review. |
| Bhīṣma’s death | BORI 6.114 and 13.153, and Oak’s reported approximate range. Start of the count, lunar month convention and seasonal calculation await review and reproduction. |
| War month and Moon | Oak’s approximate one-sided threshold and noon table. Modern phases are calculated. Exact historical passage-to-day concordance, month assumptions and candidate check remain open. |
| Planets | BORI 6.43.38 and 54, Oak’s public examples, and the Mars versus Venus discrepancy in item 1. The listed measurements require a historical run and passage review. |
| Eclipse language | BORI 6.2.23, 6.3.28–29 and 7.121, with Ganguli kept separate. Oak’s candidate pair and day-count convention are recorded. Local visibility and historical timing have yet to be tested. |
| Dvārakā | BORI 16.8.40, Oak’s project summary item 10, and Rao’s marine survey. The context track shows his 1400–1300 BCE ceramic comparison. The link to a dated inundation remains open. |
| Rakhigarhi | Shinde et al.’s I6113 ancestry analysis and 2800–2300 BCE radiocarbon dates on habitation charcoal. The burial lacks a direct date. |
| South and Central Asian ancient DNA | Narasimhan et al.’s 523 ancient individuals and population model. No named epic figure or battle association is established. |
| Rivers | Singh et al.’s sediment provenance and OSL results for the Ghaggar–Hakra palaeochannel. The context track shows the approximate 15–8 ka sequence of channel abandonment. The historical referent of the text remains open. |
| Hastināpura | Lal’s stratigraphy and Painted Grey Ware sequence. The context track shows his approximate 1100–800 BCE assignment for Period II. Independent absolute dating and any connection to a narrated event remain open. |
| Proposed opening date | Oak’s 16 October 5561 BCE, proleptic Julian. Compatibility with the three reported bands is arithmetic. Uniqueness and the additional historical observation tests remain open. |

The evidence entries link directly to Oak’s public work, the relevant primary text and study sources. The full edition of Oak’s 2011 *When Did the Mahabharata War Happen?* has not been consulted. The exact book pages and figures for each passage, measurements and rejected candidates are the remaining material needed for a comprehensive catalogue. The browser keeps the reviewed historical date explicitly unavailable.

## Local verification

Run from the repository root. The Python environment is defined in `research/pyproject.toml` and `research/uv.lock`.

```powershell
npm.cmd ci
uv sync --locked --project research
npm.cmd run build
uv run --locked --project research python research/serve_beta.py --port 4321
```

[Mahābhārata atlas on loopback](http://127.0.0.1:4321/mahabharata/)

On the current Windows checkout, the locked interpreter is available at `research\.venv\Scripts\python.exe`. The working launch and QA commands are:

```powershell
npm.cmd run build
.\research\.venv\Scripts\python.exe research/serve_beta.py --port 4321
```

Stop the manual preview before running the browser suite. The suite starts a fresh server on the same port.

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = '0'
$env:ITIHASA_PYTHON = (Resolve-Path research/.venv/Scripts/python.exe).Path
npm.cmd run test:browser
```

```powershell
npm.cmd run check
uv run --locked --project research python research/check_mahabharata.py
uv run --locked --project research python research/build_mahabharata_sky.py --check
uv run --locked --project research python research/check_arundhati.py
uv run --locked --project research python research/run_arundhati_history.py --check
uv run --locked --project research python -m unittest discover -s research
npx.cmd playwright install chromium --only-shell
npm.cmd run test:browser
```

For a source-backed index check, place the 18 files named `MBh01.txt` through `MBh18.txt` from the edition linked above in a local folder, then pass it to `research/check_mahabharata.py --source-dir`. The development check located all 75 passage anchors examined by that command. The observer generator calculated 588 airless horizontal frames for 19 targets (three sites, four dates, 49 times), 196 lunar longitude differences and four ERFA precession epochs. The prereview stellar run regenerated 60,097 model samples in six scenarios. The Greenwich benchmark returned Mizar first by 77.498362881 seconds, within 0.02 seconds of its pinned comparison. All 17 Python unit tests passed.

The observer uses Astronomy Engine 2.1.19 and ERFA 2.0.1 through pyerfa 2.0.1.5. The 12 Hipparcos stars have catalogue IDs and astrometry at ICRS J1991.25 in the locked research fixtures. Stellar radial velocity, local parallax and annual aberration are omitted in the observer lesson, and the altitude and azimuth update by interpolation at times between samples. The Greenwich transit benchmark uses its original model, separate from the sky lesson. For that benchmark and the long-range scenarios, see [the benchmark and method](Arundhati-Method.md). The regional map’s three river courses are extracted from [Natural Earth](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/) and can be checked with `research/build_mahabharata_rivers.py <geojson> --check` using the linked source in the generated dataset.

## Walkthrough

1. In Story & Map, search `2.60`, open the chapter, and select **The dice match**. Read the wager order and Draupadī’s question, then use **Follow the consequence into exile** and **Enter Bṛhadaśva’s story**. Return to the forest exile.
2. Jump to **Udyoga** and use **Go to battle day 1**. Choose day 13, zoom from the wide map into the Kuru region, open Abhimanyu’s profile, and inspect the BORI day passage or the scene sources. Return from the source to the same scene.
3. Search **Vyāsa reads the omens** and open the observer sky. Choose Dwarka, set another date, and use the left/right arrows on the local time slider. Pick an object, expand **Read the positions**, and use the return link to resume the omen scene.
4. In Dating Evidence, apply the star, death-season and war-month bounds in that order. The last one leaves the overlap unchanged. Open **DNA**, inspect I6113 and what the charcoal dates, and compare the date bands with the proposal’s Julian calendar label.
5. Jump to **Strī**, read Kuntī’s disclosure and Bhīṣma’s teachings, then choose **The last journeys**. Use the scrubber to reach the dog’s test and the final parva.

## Progress log

| Slice | Coverage and checks | Next work |
| --- | --- | --- |
| Atlas and reading foundations | Indexed all 18 parvas. Connected timeline, guides, the BORI dice sequence and exile, battle days, people, places, observer sky and evidence. The first browser pass exposed label and hydration bugs. | Expand postwar readings, strengthen regional geography and star selection, and retest with the fresh build. |
| Deeper readings and field instruments | Added Karṇa’s decision and its disclosure, Bhīṣma on distress, liberation and gifts, modern river lines and ten more catalogue stars. Added separate context tracks. Type check passed with zero diagnostics, 43 static pages built, and 18 Playwright tests passed on the local preview. | Obtain a lawful copy of Oak’s book for page-level mapping. Expand independent passage review, then test historical lunar and eclipse claims with a reviewed method. |

The browser suite exercised all five walkthroughs, timed playback and restart, keyboard navigation, reduced motion, focus restoration, 200% layout zoom, and no-JavaScript reading. It captured the 360×640 opening and dice question, the 390px sky, and the desktop battle, evidence and final journey. The local copies for review are in `.tools/mahabharata-handoff/`. An initial parallel run hit transient static asset connection refusals. The loopback preview queue was increased from 5 to 32, and the same three-worker suite passed afterward.
