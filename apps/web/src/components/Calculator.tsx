import { useEffect, useState, type SubmitEvent } from 'react';
import places from '../../../../content/cities.json';

type Calendar = {
  city: string; date: string; sunrise: string; sunset: string; phase_degrees: number; illuminated: number;
  weekday_index: number; angles_degrees: { sun: number; moon: number; phase: number };
  paksha: string; month: { amanta: string; purnimanta: string };
  limbs: { label: string; value: string; rule: string; until: string | null }[];
  windows: { label: string; start: string; end: string; part: string }[];
};
type Span = { value: string; start: string; end: string };
type Birth = { city: string; date: string } & (
  { kind: 'instant'; time: string; rashi: string; nakshatra: string; lagna: string; moon_longitude: number; lagna_longitude: number;
    sun_rashi: string; sun_longitude: number; tropical_sun_sign: string; tropical_sun_longitude: number;
    ayanamsha_degrees: number; boundary_distances: { moon_rashi: number; lagna: number } }
  | { kind: 'civil-day'; rashi: Span[]; nakshatra: Span[] }
);

function clock(iso: string, base: string) {
  return iso.slice(0, 10) === base ? iso.slice(11, 16) : `${iso.slice(11, 16)} · ${iso.slice(0, 10)}`;
}

function Wheel({ markers, label }: { markers: { name: string; angle: number }[]; label: string }) {
  return <figure className="angle-figure" aria-label={label}>
    <div className="angle-wheel" aria-hidden="true">
      {markers.map(({ name, angle }, index) => {
        const radians = angle * Math.PI / 180;
        return <span key={name} className={`wheel-dot ${index ? 'wheel-secondary' : 'wheel-primary'}`}
          style={{ left: `${50 + 37 * Math.sin(radians)}%`, top: `${50 - 37 * Math.cos(radians)}%` }} />;
      })}
      <span className="wheel-origin">0°</span>
    </div>
    <figcaption>
      <span className="wheel-key" aria-hidden="true">{markers.map(({ name }, index) =>
        <span key={name} className={index ? 'wheel-secondary' : 'wheel-primary'}>{name}</span>)}</span>
      {label}
    </figcaption>
  </figure>;
}

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function LimbExercise({ result }: { result: Calendar }) {
  const [limbIndex, setLimbIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const { sun, moon, phase } = result.angles_degrees;
  const limb = result.limbs[limbIndex];
  const angularRules = [
    { angle: phase, sectors: 30, operation: 'Moon − Sun' },
    { angle: moon, sectors: 27, operation: 'Sidereal Moon' },
    { angle: sun + moon, sectors: 27, operation: 'Sidereal Moon + sidereal Sun' },
    { angle: phase, sectors: 60, operation: 'Moon − Sun' },
  ];
  const angular = angularRules[limbIndex - 1];
  const normalize = (angle: number) => (angle % 360 + 360) % 360;
  const startingAngle = angular ? normalize(angular.angle) : 0;
  const position = angular ? normalize(startingAngle + offset) : 0;
  const sectorWidth = angular ? 360 / angular.sectors : 0;
  const nextWeekday = weekdays[(result.weekday_index + offset) % 7];
  return <details className="source-card" id="limb-exercise">
    <summary>Try the five calculation rules</summary>
    <div className="beta-form">
      <label>Limb<select value={limbIndex} onChange={(event) => {
        setLimbIndex(Number(event.currentTarget.value));
        setOffset(0);
      }}>{result.limbs.map(({ label }, index) => <option value={index} key={label}>{label}</option>)}</select></label>
      <label>{angular ? 'Practice angle offset (degrees)' : 'Days after this sunrise'}
        <input type="range" min={0} max={angular ? 30 : 6} value={offset}
          onChange={(event) => setOffset(event.currentTarget.valueAsNumber)} />
      </label>
    </div>
    <p>{result.city} at sunrise on {result.date} · {limb.label} is {limb.value}.
      {limb.until && <> Next change {clock(limb.until, result.date)} IST.</>}</p>
    {angular ? <>
      <p>{angular.operation} gives {startingAngle.toFixed(3)}°. Each of the {angular.sectors} sectors spans {sectorWidth.toFixed(3)}°.</p>
      <output aria-label="Practice result">{position.toFixed(3)}° with a +{offset}° practice offset is in sector {Math.floor(position * angular.sectors / 360) + 1} of {angular.sectors}.</output>
      <p className="small-note">The slider changes a practice angle. The next change above comes from the calculated sky.</p>
    </> : <output aria-label="Practice result">{offset === 0 ? 'At this sunrise' : `${offset} day${offset === 1 ? '' : 's'} later`} the weekday is {nextWeekday}.</output>}
  </details>;
}

function CalendarResult({ result, month }: { result: Calendar; month: 'amanta' | 'purnimanta' }) {
  return <section className="beta-result" aria-label="Pañchāṅga result">
    <h2>{result.city} · {result.date}</h2>
    <p>{result.paksha} · {result.month[month]}</p>
    <p>Sunrise {clock(result.sunrise, result.date)} · Sunset {clock(result.sunset, result.date)} IST</p>
    <table className="data-table">
      <caption>Five limbs at sunrise. Times are local.</caption>
      <thead><tr><th scope="col">Limb</th><th scope="col">At sunrise</th><th scope="col">Next change</th></tr></thead>
      <tbody>{result.limbs.map(({ label, value, until, rule }) => <tr key={label}>
        <th scope="row"><details><summary>{label}</summary><small>{rule}</small></details></th>
        <td>{value}</td><td>{until ? clock(until, result.date) : 'Unavailable'}</td>
      </tr>)}</tbody>
    </table>
    <LimbExercise result={result} />
    <Wheel markers={[{ name: 'Sun', angle: 0 }, { name: 'Moon', angle: result.phase_degrees }]}
      label={`Moon–Sun angle ${result.phase_degrees}°. The Moon is ${result.illuminated}% illuminated at sunrise.`} />
    <table className="data-table">
      <caption>Daylight windows under this convention</caption>
      <thead><tr><th scope="col">Window</th><th scope="col">Daylight segment</th><th scope="col">Local time</th></tr></thead>
      <tbody>{result.windows.map(({ label, part, start, end }) => <tr key={label}>
        <th scope="row">{label}</th><td>{part}</td><td>{clock(start, result.date)}–{clock(end, result.date)}</td>
      </tr>)}</tbody>
    </table>
  </section>;
}

function BirthResult({ result }: { result: Birth }) {
  return <section className="beta-result" aria-label="Birth sky result">
    <h2>{result.city} · {result.date}</h2>
    {result.kind === 'instant' ? <>
      <p>At {clock(result.time, result.date)} IST</p>
      <dl className="fact-line">
        <div><dt>Rāshi</dt><dd>{result.rashi}</dd></div>
        <div><dt>Nakshatra</dt><dd>{result.nakshatra}</dd></div>
        <div><dt>Lagna</dt><dd>{result.lagna}</dd></div>
      </dl>
      <Wheel markers={[{ name: 'Moon', angle: result.moon_longitude }, { name: 'Lagna', angle: result.lagna_longitude }]}
        label={`Sidereal ecliptic. Moon ${result.moon_longitude}°. Eastern horizon ${result.lagna_longitude}°.`} />
      <details className="source-card">
        <summary>Compare Moon rāshi, Sun sign and rising sign</summary>
        <dl className="fact-line">
          <div><dt>Sidereal Moon</dt><dd>{result.rashi} · {result.moon_longitude}°</dd></div>
          <div><dt>Sidereal Sun</dt><dd>{result.sun_rashi} · {result.sun_longitude}°</dd></div>
          <div><dt>Tropical Sun</dt><dd>{result.tropical_sun_sign} · {result.tropical_sun_longitude}°</dd></div>
          <div><dt>Sidereal ascendant</dt><dd>{result.lagna} · {result.lagna_longitude}°</dd></div>
        </dl>
        <p>The tropical zodiac starts at the March equinox. This sidereal convention subtracts the linear Lahiri ayanāṃśa of {result.ayanamsha_degrees}° at the entered time.</p>
        <p>The Moon is {result.boundary_distances.moon_rashi}° from its nearest rāshi boundary and the ascendant is {result.boundary_distances.lagna}° from its nearest boundary. Change the local time by a few minutes to see whether either crosses.</p>
      </details>
    </> : <>
      <p>These possibilities span the local civil day. Lagna needs a birth time.</p>
      <table className="data-table">
        <caption>Moon placements through the day</caption>
        <thead><tr><th scope="col">Field</th><th scope="col">Placement</th><th scope="col">Local interval</th></tr></thead>
        <tbody>{(['rashi', 'nakshatra'] as const).flatMap((field) => result[field].map(({ value, start, end }) =>
          <tr key={`${field}-${start}`}><th scope="row">{field === 'rashi' ? 'Rāshi' : 'Nakshatra'}</th>
            <td>{value}</td><td>{clock(start, result.date)}–{clock(end, result.date)}</td></tr>
        ))}</tbody>
      </table>
    </>}
  </section>;
}

export default function Calculator({ mode }: { mode: 'panchang' | 'birth-sky' }) {
  const calendar = mode === 'panchang';
  const [ready, setReady] = useState(false);
  const [city, setCity] = useState(calendar ? 'delhi' : '');
  const [date, setDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [month, setMonth] = useState<'amanta' | 'purnimanta'>('amanta');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Calendar | Birth | null>(null);

  useEffect(() => {
    if (calendar) {
      const today = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
      setDate(new URLSearchParams(location.search).get('date') ?? today);
    }
    setReady(true);
  }, [calendar]);

  async function calculate(input: { city: string; date: string; time?: string }) {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch(`/api/v1/${mode}`, {
        method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
      });
      if (!response.headers.get('Content-Type')?.includes('application/json')) throw new Error();
      const body = await response.json();
      if (!response.ok) setError(body.error);
      else setResult(body);
    } catch {
      setError('Start the local beta server to run this calculation.');
    } finally {
      setBusy(false);
    }
  }

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    void calculate(calendar ? { city, date } : { city, date, time: birthTime });
  }

  function example() {
    const demo = { city: 'delhi', date: '2025-01-01', time: '08:00' };
    setCity(demo.city);
    setDate(demo.date);
    setBirthTime(demo.time);
    void calculate(calendar ? { city: demo.city, date: demo.date } : demo);
  }

  return <>
    <form className="beta-form" method="post" onSubmit={submit} noValidate>
      <label>City<select value={city} onChange={(event) => setCity(event.currentTarget.value)}>
        <option value="">Choose a city</option>
        {places.cities.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
      </select></label>
      <label>{calendar ? 'Date' : 'Birth date'}<input type="date" min={places.first_date} max={places.last_date}
        value={date} onChange={(event) => setDate(event.currentTarget.value)} /></label>
      {calendar ? <label>Lunar month convention<select value={month} onChange={(event) => setMonth(event.currentTarget.value === 'amanta' ? 'amanta' : 'purnimanta')}>
        <option value="amanta">Amānta</option><option value="purnimanta">Pūrṇimānta</option>
      </select></label> : <label>Local birth time (optional)<input type="time" value={birthTime} onChange={(event) => setBirthTime(event.currentTarget.value)} /></label>}
      <button type="submit" disabled={!ready || busy}>{calendar ? 'Calculate day' : 'Calculate birth sky'}</button>
      <button type="button" disabled={!ready || busy} onClick={example}>Try an example</button>
    </form>
    {busy && <p role="status">Calculating…</p>}
    {error && <p role="alert">{error}</p>}
    {result && ('kind' in result ? <BirthResult result={result} /> : <CalendarResult result={result} month={month} />)}
  </>;
}
