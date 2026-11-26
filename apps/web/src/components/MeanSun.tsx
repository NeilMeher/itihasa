import { useEffect, useState } from 'react';
import conventions from '../../../../content/conventions.json';

const { revolutions, civil_days: civilDays, modern_sidereal_year_days: modernYearDays } = conventions.lessons['mean-sun'];

export default function MeanSun() {
  const [elapsed, setElapsed] = useState(1);
  const [origin, setOrigin] = useState('359');
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const turns = elapsed * revolutions / civilDays;
  const traditional = turns * 360;
  const modern = elapsed * 360 / modernYearDays;
  const start = Number(origin);
  const validOrigin = origin !== '' && Number.isFinite(start) && start >= 0 && start < 360;
  return <section aria-labelledby="calculation-title">
    <h2 id="calculation-title">Calculate the advance</h2>
    <div className="workshop-slider">
      <label htmlFor="elapsed">Elapsed civil days · {elapsed}</label>
      <input id="elapsed" type="range" min={1} max={365} value={elapsed} disabled={!ready}
        onChange={(event) => setElapsed(event.currentTarget.valueAsNumber)} />
    </div>
    <ol className="reading-list">
      <li>Multiply {elapsed} by 4,320,000 solar revolutions.</li>
      <li>Divide by 1,577,917,828 civil days to get {turns.toFixed(9)} turns.</li>
      <li>Multiply by 360° to get <strong>{traditional.toFixed(6)}°</strong>.</li>
    </ol>
    <p role="status">Modern mean advance over the same elapsed days is {modern.toFixed(6)}°. Traditional minus modern is {((traditional - modern) * 3600).toFixed(3)} arcseconds.</p>
    <details className="source-card" id="mean-longitude">
      <summary>Carry the longitude through a full turn</summary>
      <p>Choose a starting longitude from 0° up to 360°. Add the advance from the same elapsed days above, then subtract 360° for each complete turn.</p>
      <label className="beta-form">Starting longitude (degrees)
        <input type="number" value={origin} min={0} max={359.999999} step="any" disabled={!ready}
          onChange={(event) => setOrigin(event.currentTarget.value)} />
      </label>
      {validOrigin ? <dl className="fact-line">
        <div><dt>Traditional sum</dt><dd>{(start + traditional).toFixed(6)}°</dd></div>
        <div><dt>Full turns removed</dt><dd>{Math.floor((start + traditional) / 360)}</dd></div>
        <div><dt>Traditional longitude</dt><dd>{((start + traditional) % 360).toFixed(6)}°</dd></div>
        <div><dt>Modern mean longitude</dt><dd>{((start + modern) % 360).toFixed(6)}°</dd></div>
      </dl> : <p>Enter a longitude from 0° inclusive to 360° exclusive.</p>}
      <p><a href="https://www.swaveda.com/texts/surya-siddhanta/1/">Sūrya Siddhānta I.53 · Mean place in Burgess’s edition</a></p>
    </details>
  </section>;
}
