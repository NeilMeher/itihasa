import { useEffect, useState } from 'react';
import pole from '../../../../content/ramayana-pole.json';

export default function RamayanaPole() {
  const [position, setPosition] = useState(pole.samples.findIndex((row) => row.epoch === -12208));
  const [threshold, setThreshold] = useState(5);
  const [apply, setApply] = useState(true);
  const [ready, setReady] = useState(false);
  const row = pole.samples[position];
  useEffect(() => setReady(true), []);
  const epochLabel = row.epoch < 1 ? `about ${(1 - row.epoch).toLocaleString('en')} BCE` : `about ${row.epoch} CE`;
  return <section className="beta-band pole-reader" aria-labelledby="pole-title">
    <h2 id="pole-title">How close was Vega to the north pole?</h2>
    <p><strong>Prereview geometry.</strong> Test one possible identification by choosing a distance threshold and an epoch. These thresholds are reader-selected. The verse supplies no angle.</p>
    <div className="route-controls">
      <label>Tested identity<select disabled={!ready} value={apply ? 'vega' : 'unknown'} onChange={(event) => setApply(event.target.value === 'vega')}>
        <option value="vega">Oak’s identification with Vega</option><option value="unknown">Identity left open</option>
      </select></label>
      <label>Distance threshold<select disabled={!ready || !apply} value={threshold} onChange={(event) => setThreshold(Number(event.target.value))}>
        <option value={2}>2°</option><option value={5}>5°</option><option value={10}>10°</option>
      </select></label>
    </div>
    <label className="route-scrub">Model sample J{row.epoch} TT · {epochLabel}
      <input disabled={!ready} type="range" min="0" max={pole.samples.length - 1} value={position}
        aria-valuetext={`Julian epoch ${row.epoch} terrestrial time`} onChange={(event) => setPosition(Number(event.target.value))} />
    </label>
    <div className="pole-distance" aria-hidden="true">
      {apply && <><span style={{left: `${threshold / 60 * 100}%`}} /><b style={{ left: `${row.offsetDegrees / 60 * 100}%` }} /></>}
    </div>
    <p role="status">{apply ? `Vega is ${row.offsetDegrees.toFixed(2)}° from the mean pole. That is ${row.offsetDegrees <= threshold ? 'inside' : 'outside'} the selected ${threshold}° threshold.` :
      'An unidentified marker supplies no Vega constraint. The observation can still be discussed with the original passage.'}</p>
    <details>
      <summary>Catalogue, frame and model check</summary>
      <p>Vega is Hipparcos {pole.hip}, with {pole.catalogueFrame} astrometry at J{pole.catalogueEpoch}. {pole.model}. {pole.frame}. {pole.scale}. Radial velocity is set to zero for this sample. No observer’s horizon, extinction, clock time or visibility is calculated.</p>
      <p>The January-era modern control uses J{pole.modernReference.epoch}: IAU 2006 gives {pole.modernReference.expectedDegrees.toFixed(6)}°, against {pole.samples.at(-1)!.offsetDegrees.toFixed(6)}° from the longer-term model. Acceptance is within {pole.modernReference.toleranceDegrees}°.</p>
      <p><a href={pole.catalogue}>Hipparcos inputs ↗</a> · <a href={pole.modelSource}>Long-term precession model ↗</a></p>
    </details>
  </section>;
}
