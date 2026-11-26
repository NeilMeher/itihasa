import { useEffect, useState, type SubmitEvent } from 'react';
import places from '../../../../content/cities.json';

type Calendar = {
  city: string; date: string; sunrise: string; sunset: string; phase_degrees: number; illuminated: number;
  paksha: string; month: { amanta: string; purnimanta: string };
  limbs: { label: string; value: string; rule: string; until: string | null }[];
  windows: { label: string; start: string; end: string; part: string }[];
};
type Span = { value: string; start: string; end: string };
type Birth = { city: string; date: string } & (
  { kind: 'instant'; time: string; rashi: string; nakshatra: string; lagna: string; moon_longitude: number; lagna_longitude: number }
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
        <td>{value}</td><td>{until ? clock(until, result.date) : 'Next sunrise'}</td>
      </tr>)}</tbody>
    </table>
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
