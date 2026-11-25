# Itihāsa — build plan

**26 November 2026 · Architecture and execution plan**

## 1. Decisions

Build **one GitHub monorepo** with a **static-first Astro site**, **React and TypeScript for interactive components**, and **Python for astronomy and published research runs**. Add a small FastAPI service once the modern calendar and birth-sky calculations pass reference checks. Host the static site on **Cloudflare Pages**. Use **Google Cloud Run** for the eventual API if billing is approved and a launch budget is set. The first release has an example birth sky and a guided epic investigation. It runs on static files.

**First release:** a phone-first Arundhatī–Vasiṣṭha investigation with the exact Sanskrit verse, a 2D sky interaction, an explanation of Oak’s reading, and a published result only after the calculation passes review. Pair it with a short Janmāṣṭamī lesson. The full Pañchāṅga, personal birth sky, Rāmāyaṇa chronology, and Swarajya chapters follow in stages.

**Authoritative records:** the GitHub repository carries the code, verified content, contracts and decisions. GitHub issues carry work in progress. The existing [Itihāsa research foundation](https://chatgpt.com/library?file_id=libfile_28719fea308481918529ba119880b5be&account_id=personal) provides the source register and research scope.

## 2. What I checked in Cursor and Antigravity

| Tool | Local check | Documentation and planning consequence |
|---|---|---|
| Cursor | Installed Windows executable reports 2.3.34. Its CLI printed the version but hit a sandbox restriction when attempting to change to its Program Files directory. | Cursor’s Free tier lists limited agent and chat requests. Current documentation describes isolated worktrees and repository instructions. Use plain Git worktrees so the plan works on the installed version regardless of what its Agent UI exposes. |
| Google Antigravity App | The installed executable is 2.35.1.0. | Google documents weekly quota on Free and a gradual rollout of its built-in browser agent on eligible personal accounts with App 2.30.0 or later. Use this App for visual QA if the browser feature is active. |
| Google Antigravity IDE | A separate installed executable reports 2.1.1. | Google documents the Chrome DevTools browser subagent for IDE 2.6.0 or later. Use the standalone App first for browser QA on this machine. Local Playwright gives the same test suite a route that is independent of either agent. |
| Git and Node | Git 2.52 and Node 24.12.0 are available locally. The current planning folder is not a Git checkout. | Pin the chosen Node 24 LTS release and package-manager version when the repo begins. Create or select one working repo when implementation is authorised. |

I verified local binaries and public documentation. Your reported GitHub connections and available quota are the starting inputs for the workflow. Account-level entitlements, authorisation scopes and Antigravity’s browser rollout status still need to be checked in the signed-in apps before relying on them. Current Cursor docs may describe newer features than the installed version.

[Cursor pricing](https://cursor.com/pricing) · [Cursor worktrees](https://cursor.com/docs/configuration/worktrees) · [Cursor project rules](https://cursor.com/docs/rules) · [Antigravity plans](https://antigravity.google/docs/plans?hl=en) · [Antigravity browser availability](https://antigravity.google/docs/browser) · [Node releases](https://nodejs.org/en/about/previous-releases)

## 3. Stack and boundaries

| Layer | Decision | Purpose and upgrade path |
|---|---|---|
| Web | Astro static output, React islands, TypeScript, CSS design tokens and component styles. Pin mutually compatible versions and commit the package lockfile. | Build the article, citation and glossary HTML ahead of time. Hydrate the sky player and other controls only when needed. Use Astro content collections for validated lesson metadata. |
| Interactions | DOM controls and accessible data tables around a Canvas 2D sky view. Reuse the same controls for time, star selection and evidence filters. | A deliberately small first renderer. Add lazy-loaded MapLibre GL JS for terrain and historical maps in the Swarajya phase. |
| Editorial content | Markdown for prose, structured records for verses, sources, interpretations and cultural conventions, and small JSON datasets for published results. | Version history stays visible in Git. Add search from a small static index when the collection grows, with support for transliteration aliases and Devanagari. |
| Data contracts | Pydantic models define calculation and evidence payloads and export JSON Schema. Generate or check TypeScript types from the exported schema. | Both producers and consumers validate the same versioned contract. Diff the checked-in schema in CI when it changes. |
| Science | Python with a locked uv environment, NumPy where needed, and Skyfield as the first candidate for reading JPL kernels. Pin the kernel, the star catalogue inputs, and the reference time/precession method. | Benchmark the exact operations used. Keep the traditional Sūrya Siddhānta and modern reference calculations independently callable, with their own method IDs. |
| API | FastAPI in a container for verified modern calculations, deployed to Cloud Run after the static pilot. | One small service. Expose endpoints only when a lesson or daily feature needs computation beyond the signed-off static dataset. |
| Hosting and CI | Cloudflare Pages for static HTML and assets, GitHub Actions for checks, branch preview links for review. | Main is the release source. Small immutable datasets can ship with the site. Heavy research runs live locally or run explicitly when a dataset is rebuilt. |
| Persistence | Git for public research and content, anonymous use, browser-local preferences. | Add a managed PostgreSQL database only after a feature needs shared persistence, such as accounts or editorial workflows. Birth details are handled transiently. |

[Astro islands](https://docs.astro.build/en/concepts/islands/) · [React integration](https://docs.astro.build/en/guides/integrations-guide/react/) · [Astro content collections](https://docs.astro.build/en/guides/content-collections/) · [Pydantic JSON Schema](https://pydantic.dev/docs/validation/latest/concepts/json_schema/) · [uv lock and sync](https://docs.astral.sh/uv/concepts/projects/sync/) · [Cloudflare Astro setup](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/) · [FastAPI containers](https://fastapi.tiangolo.com/deployment/docker/) · [MapLibre GL JS](https://maplibre.org/projects/gl-js/)

### How the two systems fit together

The public website loads an investigation as HTML and a small data manifest. The sky component loads that lesson’s reviewed dataset and plays it locally. The Python research pipeline computes the data, runs checks, and exports a release bundle. The frontend interpolates verified positions for smooth visuals only where the experiment permits it. Displayed event boundaries and match results come from the reviewed calculation.

An API later runs modern date and location queries using a smaller model and named calendar conventions. Historical full-window searches remain offline research jobs. This avoids charging for repeated ancient simulations and lets viewers cite a particular frozen result.


## 4. Visual direction and public experience

Make Itihāsa feel like a contemporary editorial publication with an instrument for exploring the sky. Use warm paper, near-black ink, deep indigo for sky panels, and one warm saffron accent for a selected clue. Use a display serif such as Instrument Serif for Latin titles, Instrument Sans for interface copy, and a tested Devanagari typeface with matching line height. Start with two font families where possible, load Devanagari on relevant pages, and use genuinely readable sizes on phones. Use credited original diagrams or properly licensed image details where they help explain a specific question.

### Design three screens before expanding

| Screen | Layout and interaction |
|---|---|
| Home | Lead with one substantial question, “What did Vyāsa mean by ‘ahead’?” The sky image and that question get most of the first screen. Offer three useful entry points beneath it, Birth Sky, Today’s Pañchāṅga, and Investigations. The home page should read in order on a narrow screen. |
| Investigation | Start with a short scene and the passage number. Show a full-width sky animation on phones. Put Previous and Next controls around one labelled clue at a time. On desktop use a reading column and an aligned sky panel. Offer a manual Step control, time slider and keyboard interaction, with a readable table as a fallback. |
| Source and method | One tap opens the Sanskrit, translation, editor, edition, work and section. The details view shows the researched claim, what inputs went into the model, and whether the result is published, inconclusive, or still under review. A link can open a specific clue or published run. |

Set up a tiny component set around the actual lesson. Start with an episode header, a source note, a labelled time control, an evidence row, and a result view. Avoid generic card grids, decorative labels, undifferentiated icon sets, and ambient motion. Use the analytical animation to explain an observed change. Respect reduced-motion preferences, restore focus when closing the source drawer, and keep everything readable with zoom or keyboard use. Check at 360px and 390px widths and on a real Android phone. Use Marathi and Hindi to pressure-test the layout from the beginning, then ship translated lessons only after review.

### Interaction sequence for the first investigation

1. Read a brief setup and a reviewed translation of the verse.
2. Press **Show the two stars** and play or step through the meridian crossing. Label the stars and the direction of apparent motion.
3. Change the interpretation or time range where the released dataset supports it. Show the candidate count and graph, with the range and assumptions visible.
4. Add the next reviewed clue. Show what it changes and what remains uncertain. A fixed year in an editorial example is clearly labelled as Oak’s candidate.
5. Open **Sources and method** or download the published run metadata. Offer Janmāṣṭamī and Birth Sky nearby as related lessons.

### Performance and accessibility budgets

These are initial engineering budgets to measure, not speed claims. On a midrange Android device under a recorded mobile network preset, target good Core Web Vitals once field data are available. That means p75 LCP at or below 2.5 seconds, INP at or below 200 milliseconds, and CLS at or below 0.1. Before launch use lab traces as a proxy and record device and network conditions. Start with **at most 150 KB compressed JavaScript at first view** and **at most 500 KB compressed first-view transfers**, then measure whether those figures deliver a good experience. Load the sky renderer, near-term lesson data and later MapLibre on demand. Cache immutable assets by content version, reserve space for media and data, and keep transit time labels readable while the sky animates. [Core Web Vitals guidance](https://web.dev/articles/vitals) · [Playwright trace viewer](https://playwright.dev/docs/trace-viewer-intro)

## 5. Backend, evidence model and accuracy

### Three distinct calculation paths

1. **Modern calendar and birth data.** Choose a public support range of 1900–2100 only after tests pass. DE440s covers a wider interval and is far smaller than DE441. Use a named sidereal convention, time zone database, coordinates and local sunrise rule. Pin those choices and display them with the result. If birth time is unknown, scan the local civil day for the relevant changes and show the possible rāshi and nakshatra. If location or date is outside the supported range, return an explicit unavailable result.
2. **Traditional workshop.** Independently implement one sourced Sūrya Siddhānta calculation at a time. Store the edition and verse number, old constants, computed intermediates, and any use of modern arithmetic. Display differences from the modern calculation without blending the two outputs.
3. **Ancient investigations.** Execute offline against pinned DE441 data for supported solar-system dates, plus separate stellar catalogues and long-term precession for star positions. Verify coverage at the chosen time and explicitly model local horizon conditions and Earth-rotation uncertainty when calculating ancient visibility. Scope search windows to available models. Store the same run inputs a reader would need to reproduce the published result.

[Skyfield ephemeris coverage](https://rhodesmill.org/skyfield/planets.html) · [JPL DE440/DE441](https://ssd.jpl.nasa.gov/doc/de440_de441.html) · [JPL kernel index](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/) · [IMD pañchāṅga conventions](https://packolkata.imd.gov.in/panchang/en/explanation) · [Ancient Earth-rotation evidence](https://pmc.ncbi.nlm.nih.gov/articles/PMC5247521/)

### What every result should carry

| Record | Minimum fields |
|---|---|
| Source and passage | Stable source and passage IDs, title, edition, language, exact locator, translation author, link or scan reference, display permission and reviewer. |
| Clue | Passage ID, author and source page for the argument, original wording, interpretation, object identification, what is being measured, units, tolerance, uncertainty and relationship to other clues. |
| Run | Run ID, schema and calculation version, Git revision, source and kernel hashes, calendar and time scale, coordinate frame or observer, search window, sampling and refinement method, assumptions and expiry where relevant. |
| Published result | Candidate counts and ranges, match or mismatch by clue, ambiguous or unavailable entries with reasons, uncertainty, output dataset checksum and review status. |

On screen, show whether a reader is looking at the passage, an interpretation, an illustrative animation, or a reviewed run. Preserve the original date label. For Oak’s timeline, explicitly mark proleptic Julian dates and store a canonical astronomical time and calendar convention alongside them. Capture geocentric versus local quantities so the UI cannot silently substitute one for the other. Publish the same input contract and run version with each shareable result. Use source-backed assumptions and compare the full declared search window, including contradictions. [Oak’s calendar discussion](https://nileshoak.wordpress.com/2015/08/16/16-october-5561-bce-julian-or-gregorian/) · [JPL time conventions](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/IDL/req/time.html)

### Proposed interfaces when live computation is ready

- GET /v1/panchang/{cityId}/{date} returns supported modern calendar data and its convention and calculation IDs. Cache public results using city, date and method version.
- POST /v1/birth-sky accepts a date, optional local time, and a supported city or explicit coordinates and time zone. Treat ambiguous local times explicitly. Return placements or ranges and discard the input after calculation. Keep raw birth details out of logs, telemetry and shared URLs.
- Historical investigations use versioned files, such as /data/investigations/arundhati/{runId}/manifest.json. Keep full scientific outputs in an appropriate downloadable package when a visualisation only needs a small subset.

Serve the static release with measured asset sizes. When the API is enabled, validate inputs, cap allowed date ranges and work per request, allow only approved site origins and add application or platform rate controls appropriate to measured usage. Use a region selected for Indian audience latency and pricing. Measure cold and warm performance before widening access. Keep the previous static release and API revision available for rollback. Cloudflare documents a 25 MiB per-asset ceiling on Pages. Cloud Run charges beyond its free allowances, and supporting services may have charges. Use spend alerts and explicit runtime limits before enabling it. [Cloudflare limits](https://developers.cloudflare.com/pages/platform/limits/) · [Cloud Run pricing](https://cloud.google.com/run/pricing)


## 6. How Codex, Cursor and Antigravity work together

Three assistants can work from the same repo. They do not share chat history. The workflow uses GitHub issues, branch history, a common AGENTS.md and short decision records to keep them aligned. Codex can implement and review work within its workspace when authorised. Cursor and Antigravity tasks are pasted into their respective apps by the user. Published tool quotas can change, so keep each task small enough to transfer.

| Owner | Default work | Evidence required at handoff |
|---|---|---|
| Codex | Technical lead. Bootstrap, architecture decisions, research data contracts, Python astronomy, reference tests, CI and integration. Review externally generated PRs against the same acceptance criteria. | Branch and base commit, relevant source links, schema diff, passing commands, unresolved scientific decisions and review notes. |
| Cursor | Implementation on a focused frontend branch. Build the editorial layout, CSS and React interactions using reviewed fixtures and contracts. Fix narrowly scoped UI issues. | Desktop and mobile screenshots, keyboard and reduced-motion checks, files changed, and measured asset or interaction impact where relevant. |
| Antigravity App | Independent browser QA. Open a local folder or preview, run a short set of user journeys, capture screenshots and console/network issues. Later take narrowly scoped visual fixes in its own branch. | Browser and viewport, exact steps, expected versus actual result, severity, screenshot or trace, and PR or issue references if available. |
| You | Product and editorial owner. Approve the look, settle wording or scope decisions, and ensure a qualified reader checks public scientific and historical claims. Control final release and billing decisions. | Clear decisions recorded on the issue or PR so each assistant follows the same direction. |

### Repo layout after build authorisation

| Location | Owner and purpose |
|---|---|
| apps/web | Cursor leads UI implementation. Astro routes, styles and interaction components. |
| apps/api | Codex leads API work. FastAPI modern calculations and integration. |
| packages/contracts | Codex owns the canonical schema and contract releases. Cursor consumes approved types and fixtures. |
| research | Codex leads calculation methods, benchmarks and research runs. Keep kernel binaries out of Git and record verified hashes and acquisition sources. |
| content | Editorial and research owner. Reviewed lessons, passage references, source register and translations. |
| docs | Decisions, visual brief, review checklist and how to run the project. |
| .github | Issue and PR templates and workflows. |
| AGENTS.md | Shared rules. Start every task by reading this file and the scoped issue. |

### The sequence for one iteration

1. Start with one private repo when authorised. Codex lands the bootstrap and publishes the approved visual brief, schema and fixture example on main. Use repository settings available to your plan and make a passing PR a release condition even where a setting cannot enforce it.
2. Create one issue per output with branch name, base revision, owned files, acceptance tests, source constraints and expected handoff. Every agent starts from the same merged base. Use one Git worktree or independent checkout per active implementation task.
3. Run Cursor UI and Codex research in parallel after their data contract is merged. UI fixtures carry an explicit illustrative label. Stable contract changes are merged before a consumer implements against them.
4. Open one PR per task and let GitHub Actions run the checks. Use a branch preview for UI review. Ask Antigravity to test that exact commit or preview. Assign any fixes back to the owner or create a separate subtask with non-overlapping files.
5. Codex performs integration review, verifies tests and data status, and prepares the release. The user gives the final editorial sign-off. Squash-merge small passing PRs and update the issue. Avoid using the production branch as any agent’s scratch space.

If one AI quota runs out, another tool opens the same issue and receives the recorded handoff. Browser QA can run with the project's Playwright script while the App’s browser feature is unavailable. Keep all initial work local or on authorised GitHub branches. Chat transcripts are optional, and a task should be understandable without them.

[GitHub Actions usage and billing](https://docs.github.com/en/actions/concepts/billing-and-usage) · [Cloudflare previews](https://developers.cloudflare.com/pages/configuration/preview-deployments/) · [Cursor first project](https://cursor.com/help/getting-started/first-project) · [Antigravity Projects](https://antigravity.google/docs/projects) · [Antigravity browser feature](https://antigravity.google/docs/browser)

## 7. Roadmap and release gates

Weeks below are approximate build windows for one human reviewer and the three tools. The calendar starts after the repo and authoritative product notes are agreed. Research and editorial review can extend the schedule.

| Window | Output | Release condition |
|---|---|---|
| Week 1 | Repo foundation, GitHub Actions, Astro shell, source registry and first shared evidence contract. Design the three screens using an explicitly illustrative data sample. | A clean checkout runs on Windows and in CI. Build preview works. A 390px mock interaction, source view and typography are approved. |
| Weeks 2–3 | Two-star animation, deterministic first fixture, and an independently checked Arundhatī–Vasiṣṭha calculation for an agreed range and definition. Draft the short Janmāṣṭamī companion. | Exact passage, calendar and computation are reviewed. Any scientific figure derived from a test run has a versioned method and data source. |
| Weeks 4–5 | Static public pilot. Candidate views and a source drawer, documented results and uncertainty where supported, short links to evidence. Run Antigravity and human mobile QA. | Accessibility and performance checks pass. A small group of Gen Z testers can locate the verse, explain what was tested, and tell an interpretation from a calculation. |
| Weeks 6–8, subject to benchmarks | Today's Pañchāṅga and personal Birth Sky. Validate the initial cities and dates, then add the FastAPI container if actual usage requires live queries. Extend to Rahu Kāla and festival comparisons. | IMD comparison, local time boundary tests, ephemeral birth input and recorded service limits. Measure response speed and actual cost before widening support. |
| Next research releases | Sūrya Siddhānta calculation workshop, Rāmāyaṇa passage crosswalk and Oak’s related arguments. More Mahābhārata, Purāṇa and Harivaṃśa lessons. | Independent source review and exact published run manifests. Progress is measured in reviewed lessons, full texts and evidence coverage. |
| Later chapter | Swarajya, starting with Raigad as a working capital, then the Agra evidence question, institutions, trade and other journeys and places. | Each historical point is backed by records or clearly marked reconstruction. Geographic data and images have permission for display. |

Minimum CI checks include TypeScript and Astro type checking, a static build, schema and source-link integrity for checked-in references, and deterministic science fixtures. Verify network links in a separate periodic job or human review so transient third-party failures do not block unrelated edits. Run Playwright journeys for the narrative, slider, source view, and unavailable-data states, including mobile widths and keyboard and reduced-motion scenarios. Use reference checks near tithi, time-zone and calendar boundaries. Require exact reporting of any unrun test. Store release visuals and trace links as QA evidence.

Initial research deliverables are the passage/edition register, the confirmed Mizar and Alcor input set, a predeclared interpretation and range, a tested model pipeline, and source sign-off. A scientific result stays in review until the numerical calculation and its description have both been checked.


## 8. Exactly where to paste the first three prompts

Run these in order after approving implementation. Each prompt assumes the designated folder or commit is already open. Keep their handoffs in the corresponding GitHub issue.

### Prompt 1 · Codex in this chat, with the project folder active

Open the new project checkout in Codex Work or use this conversation with that workspace active. Paste the whole block in the chat composer. This is the first task.

~~~text
Start Itihāsa issue 001, the project foundation. Read Itihasa-Build-Plan.md and Itihasa-Research-Foundation.md first. Use the approved project folder and inspect its Git status before editing. If there is an existing repo, preserve its work.

Set up a static Astro site with React islands and TypeScript, a Python research workspace with uv, and shared schemas. Create AGENTS.md, the source register structure, one illustrative Arundhatī–Vasiṣṭha fixture, and a small CI workflow. Record the commands and chosen versions. Keep the fixture clearly labelled as illustrative and link the exact verse in its metadata. Supply one working example route and short handoff notes for Cursor.

Run the relevant Windows-friendly commands and the build. Report the branch, base commit, test results, decisions and open evidence questions. Work on the task branch. Leave production deployment, paid cloud services and full chronology results outside this task.
~~~

### Prompt 2 · Cursor desktop, Agent chat inside its frontend worktree

After issue 001 is merged, open the frontend task’s separate worktree with **File → Open Folder**, find **Agent** in Cursor’s chat panel, and paste the block there. Include the agreed issue number and actual commit in the placeholders.

~~~text
Implement Itihāsa issue [UI ISSUE] from base commit [BASE SHA]. Read AGENTS.md, the visual brief and the approved contract and fixture. You own the Astro pages and related styles and React components for the first investigation. Use the existing contracts as read-only inputs.

Build the home opening and Arundhatī–Vasiṣṭha page with warm paper, deep indigo, restrained saffron and strong editorial typography. For mobile, put the question, passage and one clear sky interaction in reading order. Make the sky playable with keyboard-accessible step and slider controls. Provide the verse source view, text alternative and illustrative-data status. Use the provided fixture only. If a field is missing, report it in the issue and keep its UI state explicit.

Check 360px and 390px layouts, desktop, keyboard use, reduced motion and initial bytes. Run the project checks. Return the changes, screenshots, unrun checks and remaining issues. Leave shared schemas, scientific calculations and source text to their owners.
~~~

### Prompt 3 · Antigravity App, new conversation inside the project

Use the standalone **Antigravity** app on this machine. Open or add the repo as a project, start a new conversation and paste the block into its prompt box. Provide the exact preview URL or localhost URL and commit. Run this after the Cursor preview exists.

~~~text
QA Itihāsa issue [QA ISSUE] at [PREVIEW OR LOCAL URL], commit [SHA], as a first-time Gen Z visitor. Test in the browser at 360px, 390px and desktop. Keep this pass read-only.

Start at the home screen, open Arundhatī–Vasiṣṭha, step the sky, use the slider with a keyboard, open and close the Sanskrit and sources panel, and test reduced motion. Check whether an illustrative animation is clearly identified and whether missing evidence is described without implying a historical result. Capture screenshots and note console or network errors. If in-app browser control is unavailable, use the repo's existing Playwright test command if available and say which visual checks need a manual pass.

Return one concise finding per item with viewport, exact reproduction steps, expected versus actual behaviour, severity and a screenshot or trace if available. Say which checks pass and which you could not run. Record findings for the issue without changing project files or deploying.
~~~

[Cursor local project and Agent chat](https://prod.cursor.com/help/getting-started/first-project) · [Antigravity App prompt entry](https://antigravity.google/docs/cli-tutorial?app=antigravity) · [Antigravity Projects](https://antigravity.google/docs/projects?app=cli)

### Reuse this format after the first three tasks

Start every new agent prompt with **issue ID, base commit, role, goal, allowed paths, acceptance checks, and handoff**. Include links to approved evidence and any fixed technical decision. If the previous agent stops midway, paste its branch or PR, the test output and the open question. Another assistant should be able to resume in one message.

## Recommendation

Approve the shared contract and the first lesson before spending quota on three simultaneous builds. The first public release should feel complete because it answers one question clearly, loads quickly and invites readers to check an original source. Expand from that into the full calendar, the other epic investigations and Swarajya as each evidence trail becomes ready.

