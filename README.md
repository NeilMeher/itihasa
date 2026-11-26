# Itihāsa local beta

The beta opens with the Mahābhārata atlas. It connects the narrative, the 18 BORI parva guides, geographic references, a calculated modern sky, and the published dating argument. The wider library also includes other epic readings, festival lessons, calendar and birth-sky tools, a Sūrya Siddhānta exercise, and the Swarajya timeline.

## Launch on Windows

Use Node 24.12.0, npm 11.6.2, CPython 3.14.0 and uv 0.13.10. From the repository root in PowerShell:

```powershell
npm.cmd ci
python -m pip install uv==0.13.10
uv sync --locked --project research
$env:ASTRO_TELEMETRY_DISABLED = '1'
npm.cmd run build
uv run --locked --project research python research/serve_beta.py
```

Open [the local beta](http://127.0.0.1:4321/). The Python process serves the static Astro build and its same-origin calculation API. It listens on loopback. The calendar and birth-sky forms use this process. In a different shell use `npm` and that shell’s environment syntax.

The public research page reports the modern mean-transit benchmark. Historical dates remain unavailable in the pilot while the historical method and results await independent review.

## Verify

Run from the repository root. The browser suite starts and stops its own copy of the beta server.

```powershell
uv run --locked --project research python research/check_evidence.py
uv run --locked --project research python research/check_beta_content.py
uv run --locked --project research python research/check_mahabharata.py
uv run --locked --project research python research/build_mahabharata_sky.py --check
uv run --locked --project research python research/check_arundhati.py
uv run --locked --project research python research/run_arundhati_history.py --check
uv run --locked --project research python -m unittest discover -s research -v
npm.cmd run contracts:generate
git diff --exit-code -- packages/contracts
npm.cmd run check
npm.cmd run build
npx.cmd playwright install chromium --only-shell
npm.cmd run test:browser
```

Set `ITIHASA_PYTHON` to the full path of the locked environment’s Python executable if the QA shell cannot find uv. The browser screenshots are stored in `test-results/`.

- [Beta coverage, check results and Antigravity prompt](docs/Beta-Handoff.md)
- [Mahābhārata atlas coverage, check results and walkthrough](docs/Mahabharata-Atlas.md)
- [Arundhatī–Vasiṣṭha method and modern benchmark](docs/Arundhati-Method.md)
- [Research run manifest](research/runs/arundhati-prereview-v1/manifest.json)
