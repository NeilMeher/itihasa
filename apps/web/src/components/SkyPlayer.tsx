import { useEffect, useRef, useState } from 'react';
import type { IllustrativeSky } from '../../../../packages/contracts/evidence';

const stars = [
  { key: 'alcor', label: 'Alcor', name: 'Arundhatī' },
  { key: 'mizar', label: 'Mizar', name: 'Vasiṣṭha' },
] as const;

function describeOffset(offset: number): string {
  if (offset === 0) return 'On the meridian';
  return `${Math.abs(offset)} ${offset > 0 ? 'east' : 'west'}`;
}

function drawGrid(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) return;

  const { width, height } = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio;
  canvas.width = width * scale;
  canvas.height = height * scale;
  context.scale(scale, scale);
  context.strokeStyle = '#66708e55';

  for (const y of [0.25, 0.5, 0.75]) {
    context.beginPath();
    context.moveTo(0, height * y);
    context.quadraticCurveTo(width / 2, height * (y - 0.3), width, height * y);
    context.stroke();
  }
  for (const x of [0.25, 0.75]) {
    context.beginPath();
    context.ellipse(width * x, height / 2, width * 0.05, height * 0.8, 0, 0, Math.PI * 2);
    context.stroke();
  }
}

export default function SkyPlayer({ fixture }: { fixture: IllustrativeSky }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const lastStep = fixture.frames.length - 1;
  const frame = fixture.frames[step];
  const crossing = stars.map(({ key }) => fixture.frames.findIndex(({ offset }) => offset[key] === 0));
  const nextStar = Math.min(...crossing);
  const transitLabel = crossing[0] === crossing[1]
    ? 'Both stars reach the meridian together.'
    : `${stars[crossing.indexOf(nextStar)].label} reaches the meridian first in this illustration.`;

  useEffect(() => {
    setReady(true);
    const grid = canvas.current;
    if (!grid) return;

    drawGrid(grid);
    const resize = new ResizeObserver(() => drawGrid(grid));
    resize.observe(grid);
    return () => resize.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      setStep(step + 1);
      if (step + 1 === lastStep) setPlaying(false);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [step, playing, lastStep]);

  function moveTo(nextStep: number) {
    setPlaying(false);
    setStep(nextStep);
  }

  function togglePlayback() {
    if (!playing && step === lastStep) setStep(0);
    setPlaying(!playing);
  }

  return (
    <section id="sky" className="sky" aria-labelledby="sky-title">
      <div className="sky-header">
        <p className="data-label">{fixture.kind} sky</p>
        <h2 id="sky-title">Who crosses first?</h2>
        <p>{fixture.description}</p>
      </div>
      <div className="plot" aria-hidden="true">
        <canvas ref={canvas} className="plot-grid" />
        <span className="meridian">Meridian</span>
        <span className="west">W · West</span>
        <span className="east">East · E</span>
        <span className="motion">← Apparent motion</span>
        {stars.map(({ key, label }) => (
          <span key={key} className={`star ${key}`} style={{ left: `${50 + frame.offset[key] * 0.38}%` }}>
            <span className="star-dot" />
            {label}
          </span>
        ))}
      </div>
      <div className="sky-controls">
        <div className="legend">
          {stars.map(({ key, name, label }) => (
            <span key={key}><span className={`legend-dot ${key}`} aria-hidden="true" />{label} · {name}</span>
          ))}
        </div>
        <div className="range-label">
          <label htmlFor="sky-step">Demo step</label>
          <output htmlFor="sky-step" aria-live="off">{step + 1} / {lastStep + 1}</output>
        </div>
        <input id="sky-step" type="range" min={0} max={lastStep} value={step}
          aria-valuetext={`Step ${step + 1} of ${lastStep + 1}`}
          onChange={(event) => moveTo(event.currentTarget.valueAsNumber)} disabled={!ready} />
        <div className="actions">
          <button type="button" onClick={() => moveTo(step - 1)} disabled={!ready || step === 0}>Previous</button>
          <button type="button" className="play" onClick={togglePlayback} disabled={!ready}>
            {playing ? 'Pause' : step === lastStep ? 'Replay' : 'Play'}
          </button>
          <button type="button" onClick={() => moveTo(step + 1)} disabled={!ready || step === lastStep}>Next</button>
        </div>
        <div className="readout" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
          <p>{stars.map(({ key, label }) => `${label} · ${describeOffset(frame.offset[key])}`).join('  /  ')}</p>
          {step >= nextStar && <p>{transitLabel}</p>}
        </div>
        <details className="positions">
          <summary>All demo positions</summary>
          <table>
            <caption>Meridian offsets in {fixture.units}</caption>
            <thead><tr><th scope="col">Step</th><th scope="col">Alcor</th><th scope="col">Mizar</th></tr></thead>
            <tbody>
              {fixture.frames.map(({ step: index, offset }) => (
                <tr key={index}>
                  <th scope="row">{index + 1}</th>
                  <td>{describeOffset(offset.alcor)}</td>
                  <td>{describeOffset(offset.mizar)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </section>
  );
}
