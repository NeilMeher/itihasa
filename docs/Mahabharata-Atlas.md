# Mahābhārata atlas progress

## Source and coverage

The atlas continues the local beta at `54a2d52` on `codex/mahabharata-atlas`. The chapter index uses the Tokunaga–Smith Unicode Roman e-text of the constituted BORI Critical Edition. The index stores chapter starts and SHA-256 hashes for all 18 files. The Sanskrit files remain at the source. The atlas uses text-fragment links with visible passage locators, and readers can search the e-text for the line identifier in a browser without text-fragment support. [BORI Mahābhārata project](https://bori.ac.in/department/mahabharata/) · [E-text edition statement](https://indology.info/bombay/mahabharata/statement.html)

| Parva | Indexed chapters | Chapters linked to an atlas reading |
| --- | ---: | ---: |
| Ādi | 225 | 9 |
| Sabhā | 72 | 9 |
| Āraṇyaka | 299 | 4 |
| Virāṭa | 67 | 4 |
| Udyoga | 197 | 1 |
| Bhīṣma | 117 | 7 |
| Droṇa | 173 | 9 |
| Karṇa | 69 | 4 |
| Śalya | 64 | 2 |
| Sauptika | 18 | 1 |
| Strī | 27 | 1 |
| Śānti | 353 | 2 |
| Anuśāsana | 154 | 1 |
| Āśvamedhika | 96 | 1 |
| Āśramavāsika | 47 | 1 |
| Mausala | 9 | 2 |
| Mahāprasthānika | 3 | 3 |
| Svargārohaṇa | 5 | 2 |
| **Total** | **1,995** | **63** |

The 29 scene readings are editorial paraphrases. 1,932 chapters offer an index entry and primary text link. “Selected scene reading” means a written scene uses a passage in that chapter. A whole-chapter commentary and independent textual review are pending.

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
| Eclipse language | BORI 6.3.28–29 and 7.121, with Ganguli kept separate. Local visibility and historical timing have yet to be tested. |
| Dvārakā | BORI 16.8.40, Oak’s project summary item 10, and Rao et al.’s marine survey. The link from dated finds to the proposed inundation remains open. |
| Rakhigarhi | Shinde et al.’s I6113 ancestry analysis and 2800–2300 BCE radiocarbon dates on habitation charcoal. The burial lacks a direct date. |
| South and Central Asian ancient DNA | Narasimhan et al.’s 523 ancient individuals and population model. No named epic figure or battle association is established. |
| Rivers | Singh et al.’s sediment provenance and OSL results for the Ghaggar–Hakra palaeochannel. The historical referent of the text remains open. |
| Hastināpura | Lal’s stratigraphy and Painted Grey Ware sequence. Absolute dating of the relevant context and any connection to a narrated event remain open. |
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

For a source-backed index check, place the 18 files named `MBh01.txt` through `MBh18.txt` from the edition linked above in a local folder, then pass it to `research/check_mahabharata.py --source-dir`. The development check located all 66 passage anchors examined by that command. The observer generator reproduced 588 airless horizontal frames (three sites, four dates, 49 times), 196 lunar longitude differences and four ERFA precession epochs. The prereview stellar run regenerated 60,097 model samples in six scenarios. The Greenwich benchmark returned Mizar first by 77.498362881 seconds, within 0.02 seconds of its pinned comparison, and all 17 Python unit tests passed.

## Progress log

| Slice | Coverage and checks | Next work |
| --- | --- | --- |
| Atlas and reading foundations | Indexed all 18 parvas. Connected timeline, guides, the BORI dice sequence and exile, battle days, people, places, observer sky and evidence. Validated source locators, generated the site, ran the type and research checks, and started browser walkthroughs. | Expand postwar readings, strengthen the regional geography and star selection, and review screenshots from the fresh build. |
