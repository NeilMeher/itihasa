import { useState } from 'react';
import conventions from '../../../../content/conventions.json';

const { revolutions, civil_days: civilDays, modern_sidereal_year_days: modernYearDays } = conventions.lessons['mean-sun'];

export default function MeanSun() {
  const [elapsed, setElapsed] = useState(1);
  const turns = elapsed * revolutions / civilDays;
  const traditional = turns * 360;
  const modern = elapsed * 360 / modernYearDays;
  return <section aria-labelledby="calculation-title">
    <h2 id="calculation-title">Calculate the advance</h2>
    <div className="workshop-slider">
      <label htmlFor="elapsed">Elapsed civil days · {elapsed}</label>
      <input id="elapsed" type="range" min={1} max={365} value={elapsed}
        onChange={(event) => setElapsed(event.currentTarget.valueAsNumber)} />
    </div>
    <ol className="reading-list">
      <li>Multiply {elapsed} by 4,320,000 solar revolutions.</li>
      <li>Divide by 1,577,917,828 civil days to get {turns.toFixed(9)} turns.</li>
      <li>Multiply by 360° to get <strong>{traditional.toFixed(6)}°</strong>.</li>
    </ol>
    <p role="status">Modern mean advance over the same elapsed days is {modern.toFixed(6)}°. Traditional minus modern is {((traditional - modern) * 3600).toFixed(3)} arcseconds.</p>
  </section>;
}
