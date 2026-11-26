import { useEffect, useRef, useState } from 'react';
import type reference from '../../../../content/mahabharata-sky.json';
import MahabharataSkyLessons from './MahabharataSkyLessons';

type Reference = typeof reference;
type Site = keyof Reference['samples'];

const colors = ['#ffd380', '#e6ebfc', '#c5b6ff', '#fbd1b7', '#f38a68', '#ffcfad', '#b2cbff', '#b4e6d2', '#e0aeff'];
const size = 720;
const centre = size / 2;
const rim = 296;
const radians = Math.PI / 180;

function interpolate(left: number[], right: number[], fraction: number) {
  const azimuth = ((right[1] - left[1] + 540) % 360) - 180;
  return [left[0] + (right[0] - left[0]) * fraction, (left[1] + azimuth * fraction + 360) % 360];
}

function timeLabel(frame: number) {
  const minutes = Math.round(frame * 30);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')} IST`;
}

function compass(azimuth: number) {
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(azimuth / 45) % 8];
}

export default function MahabharataSky({ place, clue }: { place: string; clue: string }) {
  const [data, setData] = useState<Reference>();
  const [failed, setFailed] = useState(false);
  const [site, setSite] = useState<Site>(
    place === 'indraprastha' || place === 'dvaraka' ? place : 'kurukshetra',
  );
  const [day, setDay] = useState(0);
  const [time, setTime] = useState(39);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState(1);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let mounted = true;
    import('../../../../content/mahabharata-sky.json')
      .then((module) => { if (mounted) setData(module.default); })
      .catch(() => { if (mounted) setFailed(true); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let previous = 0;
    let frame = 0;
    function advance(now: number) {
      if (preference.matches) {
        setPlaying(false);
        return;
      }
      if (previous) setTime((value) => (value + Math.min(now - previous, 100) * 0.005) % 48);
      previous = now;
      frame = requestAnimationFrame(advance);
    }
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const frames = data?.samples[site][day];
  const index = Math.floor(time);
  const objects = frames?.[index].map((value, body) =>
    interpolate(value, frames[Math.min(index + 1, 48)][body], time - index),
  );

  useEffect(() => {
    if (!data || !canvas.current) return;
    const ctx = canvas.current.getContext('2d');
    if (!ctx) return;
    const interval = data.samples[site][day];
    const points = interval[index].map((value, body) =>
      interpolate(value, interval[Math.min(index + 1, 48)][body], time - index));
    const sunAltitude = points[0][0];
    const light = Math.max(0, Math.min(1, (sunAltitude + 12) / 32));
    const fill = ctx.createRadialGradient(centre, centre, 10, centre, centre, rim);
    fill.addColorStop(0, `rgb(${Math.round(22 + 60 * light)},${Math.round(34 + 89 * light)},${Math.round(61 + 109 * light)})`);
    fill.addColorStop(1, `rgb(${Math.round(10 + 32 * light)},${Math.round(18 + 66 * light)},${Math.round(33 + 96 * light)})`);
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath(); ctx.arc(centre, centre, rim, 0, 2 * Math.PI);
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#f4eee14b'; ctx.fillStyle = '#d6e0eb';
    ctx.font = '15px system-ui'; ctx.textAlign = 'center';
    for (const alt of [0, 30, 60]) {
      const radius = rim * (1 - alt / 90);
      ctx.beginPath(); ctx.arc(centre, centre, radius, 0, 2 * Math.PI); ctx.stroke();
      if (alt) ctx.fillText(`${alt}°`, centre + 16, centre + radius - 7);
    }
    for (const [i, value] of ['N', 'E', 'S', 'W'].entries()) {
      const angle = i * Math.PI / 2;
      ctx.beginPath(); ctx.moveTo(centre, centre);
      ctx.lineTo(centre + Math.sin(angle) * rim, centre - Math.cos(angle) * rim); ctx.stroke();
      ctx.fillText(value, centre + Math.sin(angle) * (rim + 25), centre - Math.cos(angle) * (rim + 25) + 5);
    }
    ctx.fillText('Zenith', centre, centre + 20);
    points.forEach(([altitude, azimuth], body) => {
      if (altitude < 0) return;
      const distance = rim * (1 - altitude / 90);
      const x = centre + Math.sin(azimuth * radians) * distance;
      const y = centre - Math.cos(azimuth * radians) * distance;
      const radius = body < 2 ? 9 : 5;
      ctx.fillStyle = colors[body]; ctx.beginPath(); ctx.arc(x, y, radius, 0, 2 * Math.PI); ctx.fill();
      if (body === selected) {
        ctx.strokeStyle = '#fff8da'; ctx.beginPath(); ctx.arc(x, y, radius + 6, 0, 2 * Math.PI); ctx.stroke();
        ctx.strokeStyle = '#f4eee14b';
      }
      if (body < 2 || body === selected) ctx.fillText(data.objects[body], x, y - radius - 10);
    });
  }, [data, site, day, time, index, selected]);

  return (
    <section className="ma-lab ma-sky-lab" aria-labelledby="ma-sky-title">
      <div className="ma-lab-heading"><div><p className="ma-kicker">Calculated modern example</p><h2 id="ma-sky-title">Read the sky from the ground</h2></div></div>
      <p>Move through the day or change the observing site. Where does the Moon appear at the same time on a different evening?</p>
      {failed ? <p role="alert">The sky samples could not load. Open the method below for the calculation sources.</p>
        : !data || !objects ? <p role="status">Loading sky samples…</p> : (
        <>
        <div className="ma-observatory">
          <div className="ma-sky-disc">
            <canvas ref={canvas} width={size} height={size} role="img" aria-label="All-sky map with the zenith at its centre and the horizon at the rim" />
            <p>Zenith at the centre · Horizon at the edge · Meridian runs north to south through the zenith</p>
          </div>
          <div className="ma-sky-settings">
            <div className="ma-selects">
              <label>Observing site<select value={site} onChange={(event) => setSite(event.target.value as Site)}>
                {data.sites.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select></label>
              <label>Sample date<select value={day} onChange={(event) => setDay(Number(event.target.value))}>
                {data.days.map((date, i) => <option key={date} value={i}>{date}</option>)}
              </select></label>
            </div>
            <label className="ma-time-label" htmlFor="ma-sky-time">Local time <output>{timeLabel(time)}</output></label>
            <input id="ma-sky-time" type="range" min="0" max="48" step="0.25" value={time}
              aria-valuetext={timeLabel(time)} onChange={(event) => { setPlaying(false); setTime(Number(event.target.value)); }} />
            <div className="ma-playback">
              <button aria-label="Sky back thirty minutes" onClick={() => { setPlaying(false); setTime(Math.max(0, time - 1)); }}>−30 min</button>
              <button onClick={() => {
                if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setTime(Math.min(48, time + 1));
                else setPlaying(!playing);
              }}>{playing ? 'Pause sky' : 'Play sky'}</button>
              <button aria-label="Sky forward thirty minutes" onClick={() => { setPlaying(false); setTime(Math.min(48, time + 1)); }}>+30 min</button>
            </div>
            <div className="ma-sky-objects" aria-label="Sky objects">{data.objects.map((name, body) => (
              <button key={name} aria-pressed={selected === body} onClick={() => setSelected(body)}>
                <span aria-hidden="true" style={{background: colors[body]}} />{name}
              </button>
            ))}</div>
            <div className="ma-object-readout"><strong>{data.objects[selected]}</strong>
              <span>{objects[selected][0] >= 0 ? 'Above horizon' : 'Below horizon'} · Alt {objects[selected][0].toFixed(1)}° · Az {objects[selected][1].toFixed(1)}° {compass(objects[selected][1])}</span>
            </div>
            <details className="ma-sky-method"><summary>Read the positions</summary>
              <table><caption>Local positions at {timeLabel(time)}</caption><thead><tr><th>Object</th><th>Altitude</th><th>Azimuth</th><th>Horizon</th></tr></thead>
                <tbody>{objects.map(([alt, az], i) => <tr key={data.objects[i]}><th>{data.objects[i]}</th><td>{alt.toFixed(1)}°</td><td>{az.toFixed(1)}°</td><td>{alt >= 0 ? 'Above' : 'Below'}</td></tr>)}</tbody>
              </table>
              <p>{data.method} The chart shows geometric positions, including objects that daylight can conceal.</p>
              <p><a href={data.source}>Astronomy Engine</a> · <a href={data.catalogue}>Hipparcos catalogue</a></p>
            </details>
          </div>
        </div>
        <MahabharataSkyLessons data={data} site={site} objects={objects} selected={selected} clue={clue} />
        </>
      )}
      <p className="ma-below-note">These runs use dates in January 2025. A reconstruction for an epic-era date requires a separately reviewed ephemeris and visibility model.</p>
    </section>
  );
}
