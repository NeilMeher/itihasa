# Itihāsa

The local foundation serves one static investigation at `/`. Readers can open Bhīṣmaparvan 6.2.31, compare Oak’s interpretation with the verse, and step through a six-frame illustrative sky. The positions are invented schematic offsets. Historical dates remain unavailable while calculation and independent review are pending.

## Local setup

Use Node 24.12.0, npm 11.6.2, CPython 3.14.0, and uv 0.13.10. The npm and uv lockfiles pin the resolved dependencies. Run these commands from the repository root in PowerShell. In other shells, use `npm` and `npx` and set the environment variable using the shell’s syntax.

```powershell
npm.cmd ci
python -m pip install uv==0.13.10
uv sync --locked --project research
$env:ASTRO_TELEMETRY_DISABLED = '1'
npm.cmd run dev
```

Open [the local investigation](http://localhost:4321/). For the production static output, run `npm.cmd run build`. The generated site is in `apps/web/dist/`. Run `npm.cmd run preview` to serve that output locally.

## Checks

Run these from the repository root. Stop the dev or preview server before the browser suite, which starts its own preview on port 4321.

```powershell
uv run --locked --project research python research/check_evidence.py
uv run --locked --project research python -m unittest discover -s research -v
npm.cmd run contracts:generate
git diff --exit-code -- packages/contracts
npm.cmd run check
npm.cmd run build
npx.cmd playwright install chromium --only-shell
npm.cmd run test:browser
```

The [Foundation checks workflow](.github/workflows/foundation.yml) runs the same checks on pushes and pull requests. It validates citation URLs and references within the fixture offline. The cited pages were checked directly during implementation.

### Local verification on 26 November 2026

| Check | Result |
| --- | --- |
| Clean `npm ci` and `uv sync --locked` | Passed on Windows |
| Evidence fixture, schema and generated TypeScript declarations | Passed |
| Python evidence tests | 6 passed |
| Astro and TypeScript checks | 0 errors, warnings or hints |
| Static build | 1 page generated |
| Playwright Chromium | 5 passed, including 360 px, 390 px, desktop, keyboard, reduced motion and JavaScript-disabled scenarios |
| Static output size | 70,785 gzipped JavaScript bytes and 77,918 gzipped bytes across all build files |

The initial branch was `codex/foundation` at `b60e101`. GitHub-hosted CI, real-device testing, and independent editorial and astronomy review remain pending.

## Evidence and Cursor handoff

- `content/arundhati-evidence.json` is the source register, passage, interpretation, and illustration for the first route. The source text is BORI Bhīṣmaparvan 6.2.31, electronic lines `06002031a` and `06002031c`. The working translation and public display rights still need review. [BORI electronic text](https://indology.info/bombay/mahabharata/text/UR/MBh06.txt#:~:text=06002031a)
- The interpretation links to Nilesh Nilkanth Oak’s original meridian-crossing figures. A historical test still needs a declared Mizar component, star catalogue and precession model, transit definition, search window, and review. [Oak’s original explanation](https://nileshoak.wordpress.com/2016/02/08/arundhati-vasistha/)
- `research/evidence.py` defines v1. The `illustrative` fixture carries frame numbers and signed schematic offsets. Positive is east, zero is the meridian, and negative is west. Every historical finding requires a run record, output checksum, and review. The initial seed is `unavailable`.
- After changing a Python model, run `uv run --locked --project research python research/check_evidence.py --write-schema` and `npm.cmd run contracts:generate`. Commit the generated schema and types together. The Python validator also checks cross-record and frame-sequence rules that JSON Schema alone does not express.
- Cursor can use the generated types from `packages/contracts/evidence.d.ts` and the fixture as read-only inputs. The page anchors are `/#sky`, `/#sources`, and `/#passage-source`. The separate visual-direction worktree owns `design/`.
