# Arundhatī–Vasiṣṭha research method

The modern mean-transit check passed. The historical method is a proposal for review. The pilot’s six-frame sky remains illustrative and historical dates remain unavailable.

## From the verse to the claim

In the BORI Critical Edition of the Mahābhārata, Bhīṣmaparvan 6.2.31, Vyāsa is describing omens to Dhṛtarāṣṭra. In the Tokunaga–Smith electronic text, line `06002031a` names Arundhatī’s renown. Line `06002031c` reads *arundhatī tayāpy eṣa vasiṣṭhaḥ pr̥ṣṭhataḥ kr̥taḥ*. The pilot’s working rendering is that Arundhatī has put Vasiṣṭha behind her. The Sanskrit leaves the geometric criterion open. [BORI text, 06002031a and 06002031c](https://indology.info/bombay/mahabharata/text/UR/MBh06.txt#:~:text=06002031a)

Nilesh Nilkanth Oak identifies the pair with Alcor and Mizar and illustrates “ahead” as crossing the meridian first. His 8 February 2016 post compares figures labelled 16 October 5561 BCE and 8 February 2016 CE, with opposite orders. He identifies the former label as proleptic Julian in his calendar note. His FAQ gives 11091 BCE and 4508 BCE as the bounds of the interval he claims. These are Oak’s labels. A different reading of “behind,” including order of rising, would call for a different statistic and could give different intervals. The modern check below tests one geometry and does not date the narrated event. [Oak’s original meridian figures](https://nileshoak.wordpress.com/2016/02/08/arundhati-vasistha/) · [Oak’s calendar note](https://nileshoak.wordpress.com/2015/08/16/16-october-5561-bce-julian-or-gregorian/) · [Oak’s FAQ, question 3](https://nileshoak.wordpress.com/2019/08/02/faq-frequently-asked-questions/)

## Catalogue selections

Use van Leeuwen’s 2007 Hipparcos reduction, CDS VizieR `I/311/hip2`. These are ICRS positions at Julian epoch J1991.25. The VizieR query returns the two angular columns in degrees. The fixture preserves the tabulated values and formal errors. `pmRA` is `μα* = dα/dt × cos(δ)`, a tangent-plane rate. Dividing by `cos(δ)` is necessary when an API expects the RA coordinate derivative. [Catalogue query](https://vizier.cfa.harvard.edu/viz-bin/asu-tsv?-source=I%2F311%2Fhip2&-out=HIP,Sn,So,Nc,RArad,DErad,Plx,pmRA,pmDE,e_RArad,e_DErad,e_Plx,e_pmRA,e_pmDE&HIP=65378,65477) · [Catalogue documentation](https://vizier.cfa.harvard.edu/ftp/cats/I/311/ReadMe) · [van Leeuwen’s validation paper](https://arxiv.org/abs/0708.1752)

| Marker | Catalogue entry | RA (°) | Dec (°) | Parallax (mas) | μα* (mas/yr) | μδ (mas/yr) |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Arundhatī | Alcor, 80 UMa, HIP 65477, HD 116842 | 201.30589840 | +54.98799865 | 39.91 | +120.21 | −16.04 |
| Vasiṣṭha | Mizar A, ζ UMa A, HIP 65378, HD 116656 | 200.98091528 | +54.92541509 | 38.01 | +119.01 | −25.97 |

**Choose Mizar A.** The original Hipparcos main row has `AstroRef=A` for HIP 65378. The new reduction has `Sn=15` and `Nc=2`, meaning a five-parameter solution flagged as a double. The benchmark uses that astrometric direction for the brighter visual component A. It supplies no separate Aa or Ab orbit or system barycentre. Alcor’s row has `Sn=5` and `Nc=1`, a single-source solution, although imaging has resolved a faint companion. A different Mizar component, a light centroid, or orbital motion could shift the projected RA enough to move a historical sign-change boundary. Review the component crosswalk, alternative astrometry, and orbital systematics before fixing historical inputs. [Original Hipparcos component crosswalk](https://vizier.cfa.harvard.edu/viz-bin/asu-tsv?-source=I%2F239%2Fhip_main&-out=HIP,AstroRef,CCDM,Ncomp,MultFlag,m_HIP,rho,HD&HIP=65378,65477) · [Mamajek et al. on the multiple systems](https://arxiv.org/abs/0911.5028)

## Proposed historical experiment

Project the propagated ICRS directions onto the **mean equator and equinox of date**. At a common longitude, the mean hour angle is `H = LMST − α`. Pair the upper transits, `H = 0 mod 2π`, from the same sidereal passage. A lower transit has `H = π`. Compare the signed short difference `Δα = atan2(sin(αAlcor − αMizar), cos(αAlcor − αMizar))`. Negative means Alcor first, positive means Mizar first. Use a common unwrapped sidereal turn so a 0 h RA or civil-midnight wrap does not reverse the order. Treat half-turn ambiguities or undefined polar RA as unresolved. [USNO definition of sidereal time and transit](https://aa.usno.navy.mil/data/siderealtime)

| Choice | Effect to test before publishing |
| --- | --- |
| ICRS position at J1991.25 and proper motion | Using the catalogue positions as J2000 observations or mishandling the RA cosine term shifts the input direction. Over millennia, proper-motion error, radial-velocity perspective effects and orbital motion can move or erase a crossing. Propagate a sourced rectilinear space-motion solution with covariance, and compare plausible component and orbit choices. The modern check uses zero radial velocity. |
| Vondrák–Capitaine–Wallace long-term precession | Use the SOFA-derived ERFA `ltpb` rotation, including frame bias, with the 2012 corrigendum. It changes the pole and the equinox together. A static J2000 equator misses that change. Small pole differences can produce large RA differences near a pole or change the sign near a tie. Compare a separately implemented long-term model over the whole window. Use IAU 2006 as a near-modern control. |
| Mean transit and observer | The frame uses mean directions, excluding nutation, annual aberration, light deflection, and annual and topocentric parallax. Longitude shifts absolute transit times together in this convention. A visibility or apparent-transit claim needs a location, season, horizon, refraction and a ΔT treatment. Those choices can affect apparent order near a tie, whether the pair is observable, and its local clock or calendar label. |
| Search window and refinement | Scan J−12999.0 through J2025.0 in TT, in roughly 13,000 BCE through 2025 CE. These are Julian epochs, `JD(TT) = 2451545.0 + 365.25 × (epoch − 2000)`. The early bound gives roughly 1,900 years before Oak’s first claimed boundary. The later bound covers the claimed end and reaches a modern control epoch. A finite window can miss other intervals, and coarse sampling can miss short reversals. |

Start with one-Julian-year steps. Compare with a quarter-year pass, inspect extrema as well as sign changes, and refine resolved brackets to a numerical width of 0.01 Julian year. Record convergence and bracket limits if the sampling changes. Report every resolved interval in the declared window. Build an uncertainty envelope from the accepted astrometry and precession scenarios and mark periods unresolved where the envelope includes zero or the projected direction approaches the pole within its uncertainty. The bracket width measures numerical refinement. The uncertainty envelope governs how precisely a boundary can be stated. Choose the envelope inputs with the independent reviewer before evaluating Oak’s dates. [Vondrák et al. 2011](https://doi.org/10.1051/0004-6361/201117274) · [2012 corrigendum](https://doi.org/10.1051/0004-6361/201117274e) · [ERFA long-term rotation](https://github.com/liberfa/erfa/blob/v2.0.1/src/ltpb.c)

## Modern benchmark

At Greenwich longitude 0°, calculate the mean upper transits on **1 January 2025 UT1**. The anchor is `JD(UT1) = 2460676.5` with a fixed `TT − UT1 = 69.14 s` test input. Freeze both stars’ mean directions at anchor TT and find each crossing in 06:00–08:00 UT1. The candidate propagates the Hipparcos tangent-plane rates, rotates with `ltpb`, then inverts the USNO approximate mean sidereal time relation. This benchmark compares calculated values under a mean-geometry convention with a fixed time-scale offset. [USNO Circular 179, §2.6.2 algorithm](https://aa.usno.navy.mil/faq/GAST)

The pinned reference uses PyERFA 2.0.1.5, libERFA 2.0.1, SOFA 20231011 heritage. `pmsafe` advances the same catalogue directions with the measured parallaxes and zero radial velocities. `pmat06` rotates to the mean frame via IAU 2006, and bisection on `gmst06` locates the upper transits. The pathways share the catalogue and ERFA library, with different propagation, precession and timing routines. The reference values are numerical comparisons under the same geometry. Independent observations and historical validation are separate checks. [PyERFA release](https://github.com/liberfa/pyerfa/releases/tag/v2.0.1.5) · [ERFA proper motion](https://github.com/liberfa/erfa/blob/v2.0.1/src/pmsafe.c) · [ERFA bias and precession](https://github.com/liberfa/erfa/blob/v2.0.1/src/pmat06.c) · [ERFA sidereal time](https://github.com/liberfa/erfa/blob/v2.0.1/src/gmst06.c)

| Quantity | Expected from reference | Observed from candidate | Acceptance |
| --- | ---: | ---: | --- |
| Alcor mean RA (degrees) | 201.555766171 | 201.555766149 | ±0.20 arcsec |
| Mizar mean RA (degrees) | 201.231972231 | 201.231972209 | ±0.20 arcsec |
| Alcor upper transit (seconds after 00:00 UT1) | 24091.530810 | 24091.531866 | ±0.10 s |
| Mizar A upper transit (seconds after 00:00 UT1) | 24014.032447 | 24014.033503 | ±0.10 s |
| Alcor minus Mizar A (UT1 seconds) | +77.498362586 | +77.498362881 | ±0.02 s |
| First | Mizar A | Mizar A | Exact agreement |

The largest absolute timing difference was about 1.06 ms. The tolerance for each crossing allows for differences between the midnight sidereal approximation and the reference. The stricter separation tolerance checks the relative result because the common sidereal offset mostly cancels. These thresholds apply to this modern software check.

## Reproduce and review

From the research worktree root, use CPython 3.14 and uv. The fixture includes the catalogue query, both rows, the time inputs, the numerical reference and the tolerances. After installation, every check below runs offline.

```powershell
uv sync --locked --project research
uv run --locked --project research python research/check_arundhati.py --reference
uv run --locked --project research python research/check_arundhati.py
uv run --locked --project research python -m unittest discover -s research -v
uv run --locked --project research python research/check_evidence.py
```

Checks run on 26 November 2026 with Windows, CPython 3.14.0 and uv 0.13.10. The locked offline sync passed. The reference replay matched the snapshot and the candidate passed every tolerance. All nine Python tests passed, including the modern comparison, reference replay and right ascension wrap. The existing evidence fixture and JSON Schema validated. The live USNO sidereal-time endpoint reset the connection during an optional probe. The numerical comparison uses the pinned ERFA reference above.

Handoff for scientific review. Confirm the Sanskrit interpretation, the component crosswalk and covariance, the long-term precession comparison and the historical uncertainty rules. Then review an independent rerun of the full search and its results before exposing any historical dates in the pilot.
