import { useState } from 'react';
import clues from '../../../../content/mahabharata-evidence.json';
import details from '../../../../content/mahabharata-evidence-details.json';
import model from '../../../../research/runs/arundhati-prereview-v1/manifest.json';

const limit = 12000;
const candidate = 5561;
const groups = ['All', 'Sky', 'Calendar', 'Archaeology', 'DNA', 'Landscape', 'Proposal'];
const number = new Intl.NumberFormat('en');
const axis = [12000, 9000, 6000, 3000, 0];

function left(year: number) {
  return ((limit - year) / limit) * 100;
}

function band(oldest: number, youngest: number) {
  return { left: `${left(oldest)}%`, width: `${left(youngest) - left(oldest)}%` };
}

function label(oldest: number | null, youngest: number) {
  return oldest === null
    ? `No later than ~${number.format(youngest)} BCE`
    : `${number.format(oldest)}–${number.format(youngest)} BCE`;
}

type Detail = { text: string; method: string; dependencies: string; links?: string[][]; track?: { older: number; younger: number; unit: string; label: string } };
const catalogue: Record<string, Detail> = details;

function windowFor(ids: string[]) {
  const selected = clues.filter((item) => ids.includes(item.id));
  return {
    oldest: Math.min(limit, ...selected.map((item) => item.older ?? limit)),
    youngest: Math.max(1, ...selected.map((item) => item.younger ?? 1)),
  };
}

function windowLabel({ oldest, youngest }: ReturnType<typeof windowFor>, approximate = false) {
  return oldest < youngest ? 'No common span' : `${approximate ? 'Approx. ' : ''}${label(oldest, youngest)}`;
}

export default function MahabharataEvidence({ initial, filters, onClue }: {
  initial: string; filters: string[]; onClue: (id: string, bounds?: string[]) => void;
}) {
  const [group, setGroup] = useState('All');
  const [showRun, setShowRun] = useState(false);
  const [last, setLast] = useState<{ id: string; before: ReturnType<typeof windowFor>; approximate: boolean; removed: boolean }>();

  const focus = clues.find((item) => item.id === initial) ?? clues[0];
  const detail = catalogue[focus.id];
  const selected = clues.filter((item) => filters.includes(item.id) && item.younger !== null);
  const combined = windowFor(filters);
  const { oldest, youngest } = combined;
  const candidateFits = candidate <= oldest && candidate >= youngest;
  const available = clues.filter((item) => group === 'All' || item.group === group);
  const plotted = model.labeled_intervals.filter((item) => item.label !== 'mizar-first');
  const bandClue = clues.find((item) => item.id === last?.id);
  const approximate = filters.some((id) => id !== 'stars');
  const contextScale = detail.track?.unit === 'bce' ? 3500 : 16000;

  function toggle(id: string) {
    const removed = filters.includes(id);
    setLast({ id, before: combined, approximate, removed });
    setGroup('All');
    onClue(id, removed ? filters.filter((item) => item !== id) : [...filters, id]);
  }

  return (
    <section className="ma-lab ma-evidence" aria-labelledby="ma-evidence-title">
      <div className="ma-lab-heading">
        <div><p className="ma-kicker">HISTORICAL CHRONOLOGY</p><h2 id="ma-evidence-title">How does a proposed date narrow?</h2></div>
        <button className="ma-flat" onClick={() => { onClue(focus.id, []); setLast(undefined); setShowRun(false); }}>Reset ranges</button>
      </div>
      <p>Apply Oak’s published bounds one at a time. Approximate assumptions stay approximate when combined.</p>
      <p><strong>Historical result · Unavailable.</strong> The date comparison below retraces the author’s argument pending independent review.</p>
      <div className="ma-graph">
        <div className="ma-graph-axis" aria-hidden="true">{axis.map((year) => <span key={year}>{year === 0 ? 'CE' : `${number.format(year)} BCE`}</span>)}</div>
        {clues.filter((clue) => clue.younger !== null).map((clue) => (
          <div className="ma-graph-row" key={clue.id}>
            <label><input type="checkbox" checked={filters.includes(clue.id)} onChange={() => toggle(clue.id)} /><span>{clue.title}</span></label>
            <div className="ma-range" aria-hidden="true">
              <span className={filters.includes(clue.id) ? 'selected' : ''} style={band(clue.older ?? limit, clue.younger!)} />
              <i style={{left: `${left(candidate)}%`}}/>
            </div>
            <span className="ma-range-label">{clue.older !== null && clue.id === 'season' ? 'Approx. ' : ''}{label(clue.older, clue.younger!)}</span>
          </div>
        ))}
        <div className="ma-graph-row ma-combined">
          <strong>Combined window</strong>
          <div className="ma-range" aria-hidden="true">
            {selected.length > 0 && oldest >= youngest && <span className="selected" style={band(oldest, youngest)} />}
            <i style={{left: `${left(candidate)}%`}} />
          </div>
          <span className="ma-range-label">{!selected.length ? 'Choose one or more clues' : windowLabel(combined, approximate)}</span>
        </div>
        {last && bandClue?.younger != null && <div className="ma-range-change" role="status">
          <strong>{last.removed ? 'Removed' : 'Applied'} {bandClue.title}</strong>
          <dl><div><dt>Before</dt><dd>{windowLabel(last.before, last.approximate)}</dd></div>
            <div><dt>Clue range</dt><dd>{bandClue.id === 'season' ? 'Approx. ' : ''}{label(bandClue.older, bandClue.younger)}</dd></div>
            <div><dt>After</dt><dd>{windowLabel(combined, approximate)}</dd></div></dl>
          <p>{last.before.oldest === oldest && last.before.youngest === youngest
            ? 'No change. The other selected bounds already give this overlap.'
            : last.removed ? 'The overlap is computed from the remaining clues.' : 'The overlap keeps the years allowed by every selected bound.'}</p>
        </div>}
        <p className="ma-candidate"><strong>16 October 5561 BCE</strong> · Oak’s proposed opening date, proleptic Julian. {selected.length
          ? (candidateFits ? `Inside the selected bounds, which span approximately ${number.format(oldest - youngest)} years.` : 'Outside the selected overlap.')
          : 'Choose a clue to compare its range.'} <a href={clues.find((clue) => clue.id === 'candidate')!.url}>Oak’s calendar note ↗</a></p>
        {selected.length > 0 && <ul className="ma-candidate-checks">{selected.map((clue) =>
          <li key={clue.id}>{clue.title} · {candidate <= (clue.older ?? limit) && candidate >= clue.younger! ? 'Within the author’s bound' : 'Outside the author’s bound'}</li>)}</ul>}
        <label className="ma-model-toggle"><input type="checkbox" checked={showRun} onChange={(event) => setShowRun(event.target.checked)} /> Show the local prereview star-transit comparison</label>
        {showRun && <div className="ma-prereview">
          <strong>Julian epochs in Terrestrial Time · prereview</strong>
          <ul>{plotted.map((interval) => <li key={interval.first_sample}>
            {interval.label === 'unresolved' ? 'Unresolved' : 'Alcor first'} · {interval.first_sample} to {interval.last_sample}
          </li>)}</ul>
          <p>These are model sample epochs in TT. The range chart above uses reported BCE calendar labels.</p>
          <a href="/research/">Open the research method</a>
        </div>}
      </div>
      <div className="ma-filters" aria-label="Filter the evidence catalogue">
        {groups.map((name) => <button key={name} aria-pressed={group === name} onClick={() => {
          setGroup(name);
          if (name !== 'All' && focus.group !== name) onClue(clues.find((item) => item.group === name)!.id);
        }}>{name}</button>)}
      </div>
      <div className="ma-evidence-index">
        <ul aria-label="Evidence records">{available.map((item) =>
          <li key={item.id}><button aria-pressed={focus.id === item.id} onClick={() => onClue(item.id)}>{item.title}</button></li>)}</ul>
        <article aria-live="polite">
          <p className="ma-kicker">{focus.status}</p>
          <h3>{focus.title}</h3><p>{focus.claim}</p>
          <p>{detail.text}</p><p><strong>Measurement.</strong> {detail.method}</p>
          <p><strong>Dependencies.</strong> {detail.dependencies}</p><p>{focus.limit}</p>
          {detail.track && <figure className="ma-prereview ma-context-track">
            <strong>{detail.track.label}</strong>
            <div className="ma-range" aria-hidden="true"><span className="uncertain" style={{
              left: `${100 * (contextScale - detail.track.older) / contextScale}%`,
              width: `${100 * (detail.track.older - detail.track.younger) / contextScale}%`,
            }} /></div>
            <figcaption>{detail.track.unit === 'bce' ? 'Study context · 3,500 BCE to the BCE/CE boundary.' : 'Study context · 16,000 years ago to recent time.'}</figcaption>
          </figure>}
          <div className="ma-source-links"><a href={focus.url}>{focus.locator} ↗</a>{focus.primary && <a href={focus.primary}>Related primary source ↗</a>}
            {detail.links?.map(([title, url]) => <a key={url} href={url}>{title} ↗</a>)}</div>
        </article>
      </div>
    </section>
  );
}
