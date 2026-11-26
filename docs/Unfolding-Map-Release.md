# Unfolding map release

## Design and baseline

The baseline is `e72c424f27f5e39f5bc82aecbca1d5d7ec814f4d`. On the existing port 4327 build, Chromium opened `/`, then `/map/mahabharata/`, then `/map/reading/ma-episode-dice/`. Each was a separate document. The branch was a list, and the connected graph and reader repeated the selected title and summary. Baseline captures are in `.tools/unfold-baseline/`. The previous worktrees and previews remain available.

The homepage now uses the same static branch entries as the standalone branch pages. The selected branch appears beneath the collapsed overview. Sibling labels remain visible on desktop, and the phone overview reduces to the active branch. A selected reading opens beside the branch on desktop and above its entries on a phone. An HTML preview shows the first paragraph and ordinary source or reading links while React and the work-scoped relationships load. The Explorer resolves the same public IDs at the Home URL as it does on its own route. The branch state lives in `branch`, and `node`, `view`, `person`, `scope`, `panel`, `trail`, `journey` and `step` use the existing resolver. The browser history entry remembers the originating tile. The standalone branch, reading, Library, and source links remain the fallback.

The new branch entrances use existing records for Panipat, Shivaji Maharaj, Tarabai and Kṛṣṇa in the Mahābhārata. All eighteen war-day readings and the two edition book directories can be opened from their branches. The catalogue still holds 340 nodes with 500 sourced relationships, 47 dedicated BORI annotations, 40 additional scene-linked BORI chapters, 36 Baroda annotations and 22 dated Maratha records. The tithi practice wheel uses the calculated sunrise angle as its starting point, then moves through the learner’s labelled practice offset. The named sunrise tithi and its calculated boundary remain visible.

## Read-only Antigravity review

The release preview is [on port 4329](http://127.0.0.1:4329/). Use the tested SHA in the delivery message. Keep QA findings outside tracked files.

1. At 360×640 and 1280×900, choose Mahābhārata, then the dice match. Confirm the branch and story open on the same document, one reading title is visible, and Timeline keeps the dice match selected. Open Sources, follow the BORI chapter link and go Back. Close the reading and check focus returns to the dice tile. Use **All Itihāsa** to restore the overview.
2. At 390×844, open [Sītā’s ring](http://127.0.0.1:4329/?branch=ramayana&node=ra-episode-ring&view=map&person=ra-person-sita). Switch views and inspect Geography. Confirm the person trail persists and Laṅkā’s literary location remains unplotted. Search for `BORI 2.57`, `रायगड`, `द्रौपदी` and `Nakshatra` from Home and check the branch and exact result.
3. Open [Raigad](http://127.0.0.1:4329/?branch=maratha&node=maratha-place-raigad&view=map), then select Panipat. Confirm the correct dated events and sources accompany Panipat. At 390px confirm long branch labels, story controls, and Geography stay within the viewport.
4. Open [the omen assumption step](http://127.0.0.1:4329/?branch=research&node=claim-oak-ahead&view=map&journey=read-the-omen&step=3&panel=investigation&bounds=stars%2Cseason). Change “ahead” to the relative-position reading. The attributed window changes and the historical result remains unavailable. The pilot stays illustrative and cites BORI Bhīṣmaparvan 6.2.31.
5. Delay or fail `/map/edges/mahabharata.json`. The dice reading, source and way back to the branch should still work. Check keyboard focus, rapid selection, reduced motion and the JavaScript-disabled branch and reading route. Use the Delhi Pañchāṅga example and the synthetic Birth Sky example against the same-origin service.

Use the README’s isolated Playwright settings for the full suite. Run the focused release smoke check on the local preview or an authorized protected or public deployment.

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = '0'
node research/verify_release.mjs http://127.0.0.1:4329
node research/profile_unfold.mjs http://127.0.0.1:4327 http://127.0.0.1:4329 .tools/unfold-qa
```

## Observed local results

Astro checked 77 files with no diagnostics and built 120 pages. The link auditor checked 3,384 paths and fragments and the six work relationship files with no violations. The Python suite passed 22 tests. This includes both hosted-style handlers over local HTTP, synthetic inputs and response parity with the shared engine, cross-origin rejection, `no-store`, malformed input and unsupported dates. The edition checks found 174 distinct BORI anchors and 91 Baroda passage references. The coverage, evidence contracts, observer and Vega replays, and the six-scenario historical prereview manifest also passed.

All 49 Playwright tests passed after correcting legacy assertions that looked for the removed duplicate heading. Checks included the 360px and desktop unfolded branch, BORI 2.60 return, a delayed and failed relationship response, the 390px index and war-day flow, and the tithi exercise. The local release smoke check passed after removing the leftover cross-document animation rule. It checks the map, chapter return, three direct readings, two calculator fixtures, malformed and unsupported requests, and same-origin console and HTTP errors. The Delhi reference run returned Dvitīyā and Uttara Āṣāḍhā. The synthetic Birth Sky example returned Makara, Uttara Āṣāḍhā and Dhanu.

### Three warm 360×640 browser samples

Both builds were opened in the same unthrottled in-app Chromium browser. Each build received one warm-up followed by three alternating observations, timed by browser automation. The first action on the release includes waiting for branch enhancement. The story timing stops at the first readable preview or full heading. Graph timing starts with the dice tap and ends when the first relationship button is usable.

| Action | Baseline median | In-place median |
| --- | ---: | ---: |
| Home to first actionable branch | 111 ms | 122 ms |
| Mahābhārata tap to the dice tile | 153 ms | 121 ms |
| Dice tap to first readable story | 211 ms | 133 ms |
| Dice tap to usable graph | 451 ms | 505 ms |

These are browser-observed warm timings. The 360px browser snapshot showed the document within its viewport width.

### Matched Playwright samples

The paired profiler ran three cold visits and three warm visits for each build at 360×640, with 150 ms latency, 1.6 Mb/s down, 0.75 Mb/s up and 4× CPU slowdown. It repeated the same comparison on unthrottled 1280×900 desktop. The samples below used the in-place build before removal of its leftover cross-document animation rule. That rule affected chapter navigation. Timings end at actual visible or usable controls and transfer covers Home through the usable graph.

| 360px milestone | Cold before → after | Warm before → after |
| --- | ---: | ---: |
| First ordinary branch link | 1,150 → 596 ms | 229 → 261 ms |
| In-place control attached or baseline link ready | 1,150 → 1,831 ms | 229 → 279 ms |
| Branch tap to usable entries | 477 → 230 ms | 301 → 163 ms |
| Dice tap to visible first story | 866 → 199 ms | 309 → 190 ms |
| Dice tap to usable extended graph | 4,775 → 4,200 ms | 590 → 1,049 ms |
| Transfer through the extended graph | 672,620 → 699,566 B | 0 → 0 B |
| Median layout shift | 0 → 0 | 0 → 0 |

The first story arrives faster when the branch stays in place. The current route transfers 26,946 more bytes through the final graph in the cold sample, and its warm graph controls take longer to become usable after the dice tap. On desktop, the cold branch and story medians were 113 → 51 ms and 141 → 62 ms, while cold graph readiness was 448 → 893 ms. The profiler saves each observation in `.tools/unfold-qa/unfold-timings.json`.

## Vercel Hobby deployment

Use the verified commit from the repository root. `vercel.json` uses the Other framework preset, `npm ci`, `npm run build --workspace @itihasa/web`, and `apps/web/dist`. Under `api/v1/`, Vercel’s file-based Python runtime loads two `BaseHTTPRequestHandler` subclasses. The pinned runtime requirement is `astronomy-engine==2.1.19`. The handlers reuse the local engine, city file and calendar convention. Vercel bundles those files with the functions. Historical runs stay offline. [Vercel Python file-based functions](https://vercel.com/docs/functions/runtimes/python/api-directory) · [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json)

1. Verify the personal project scope, Hobby plan and repository link. Set Vercel Authentication to Standard Protection so the preview requires authentication. Keep production assignment separate from the first protected preview. [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection)
2. Deploy the checked commit to Preview using `vercel deploy` in the linked repository. Inspect the build output for both functions and the static assets. Run `node research/verify_release.mjs "<preview-url>"` with authorized preview access. Set `ITIHASA_PREVIEW_ACCESS_URL` to an authorized Vercel share URL, or use `VERCEL_AUTOMATION_BYPASS_SECRET` from the shell. Keep access credentials outside Git.
3. After preview QA and production approval, run `vercel deploy --prod --skip-domain` from the same SHA. Inspect and verify that candidate URL before assigning its domain with `vercel promote <candidate-url>`. Repeat the smoke check at the public `vercel.app` alias and record the observed deployment IDs and SHA. A direct promotion of a Preview triggers a new Production build. [Vercel deploy options](https://vercel.com/docs/cli/deploy#skip-domain) · [Vercel promote](https://vercel.com/docs/cli/promote)
4. Redeploy from a checked commit using the same procedure. If a previous production deployment exists, inspect it and use `vercel rollback <previous-production-url>` for a supported rollback. Record the first release as the starting rollback point. [Vercel rollback](https://vercel.com/docs/cli/rollback)

### Hosted release record

The public repository is [`NeilMeher/itihasa`](https://github.com/NeilMeher/itihasa), on [`codex/expand-home-map`](https://github.com/NeilMeher/itihasa/tree/codex/expand-home-map). The deployed revision is [`6423dca688ba73b6a4b8249c30e08d38d05d8c50`](https://github.com/NeilMeher/itihasa/commit/6423dca688ba73b6a4b8249c30e08d38d05d8c50). The [GitHub Actions run for that revision](https://github.com/NeilMeher/itihasa/actions/runs/45869555047) passed on Ubuntu 24.04. The earlier `ubuntu-latest` runner could not install the project's pinned Python 3.14.0 on Ubuntu 26.04.

The authenticated Vercel API built the static site and two functions from 119 source files read from that commit. The staging build `dpl_3G4pYKaHDgnmnWPVnLmEKxGy7sd7` produced 120 static pages. Anonymous access to its URL returned a sign-in redirect. An authorized Playwright session passed the smoke check over HTTPS. The production candidate `dpl_7sFpWfkL7b72TTamdfA5sKfnnxCM` separately passed with its generated deployment URL before the domain was assigned. The public alias then passed with a fresh browser session and anonymous access. This was the first production deployment on the personal Hobby account. [Protected staging](https://itihasa-2sj1l6gp7-punters-projects-20d6c57c.vercel.app/) · [Public production](https://itihasa-phi.vercel.app/)

On production the smoke check opened the dice reading at 360×640 and 1280×900, selected its Timeline event, followed the BORI chapter link and restored Sources with Back. It also reached the six branch routes, Explorer, a relationship JSON file, the BORI 2.57 search result and the Sītā, Raigad and research deep links. The Delhi fixture returned Dvitīyā and Uttara Āṣāḍhā. Sunrise and sunset were 4 and 22 seconds early against the reference, within the 120-second tolerance. The four named limb boundaries differed by 72, 11, 40 and 101 seconds, within 180 seconds. The synthetic Birth Sky request returned Makara, Uttara Āṣāḍhā and Dhanu without placing input in the URL. The test confirmed `no-store`, 400 responses for malformed and unsupported calculator input, and zero unexpected same-origin HTTP or page errors.

## Publication scope

The project has no declared project-wide license. The generated maps credit Natural Earth and source notes link the published editions. The branch uses passage locators, short passage excerpts where the commentary discusses them, and editorial English readings. Downloaded Sanskrit e-texts, private data, preview logs, and caches remain local. The BORI electronic edition identifies its copyright holder. The wider Sanskrit redistribution and recension work remains open. [Source rights notes](briefs/Itihasa-Research-Foundation.md) · [Natural Earth data terms](https://www.naturalearthdata.com/about/terms-of-use/)
