import { useState } from 'react';
import type reference from '../../../../content/mahabharata-sky.json';
import evidence from '../../../../content/arundhati-evidence.json';
import type { EvidenceBundle } from '../../../../packages/contracts/evidence';
import { sourceUrl } from '../lib/mahabharata';
import SkyPlayer from './SkyPlayer';

type Reference = typeof reference;
type Lesson = 'moon' | 'near' | 'eclipse' | 'precession' | 'transits';
const lessons: { id: Lesson; title: string }[] = [
  { id: 'moon', title: 'Moon, phase & tithi' }, { id: 'near', title: 'Angular separation' },
  { id: 'eclipse', title: 'Eclipse visibility' }, { id: 'precession', title: 'Precession' },
  { id: 'transits', title: 'Which star is ahead?' },
];
const rad = Math.PI / 180;

function angleBetween([firstAlt, firstAz]: number[], [secondAlt, secondAz]: number[]) {
  const dot = Math.sin(firstAlt * rad) * Math.sin(secondAlt * rad)
    + Math.cos(firstAlt * rad) * Math.cos(secondAlt * rad) * Math.cos((firstAz - secondAz) * rad);
  return Math.acos(Math.max(-1, Math.min(1, dot))) / rad;
}

function moonInfo(phase: number) {
  const tithi = Math.floor(phase / 12);
  const lit = Math.round(50 * (1 - Math.cos(phase * rad)));
  return `${lit}% illuminated (approx.) · ${tithi < 15 ? 'Waxing' : 'Waning'} tithi ${tithi % 15 + 1}`;
}

export default function MahabharataSkyLessons({ data, site, objects, selected, clue }: {
  data: Reference; site: keyof Reference['samples']; objects: number[][]; selected: number; clue: string;
}) {
  const [lesson, setLesson] = useState<Lesson>(clue === 'stars' ? 'transits' : clue === 'eclipse' ? 'eclipse' : clue === 'season' ? 'precession' : 'moon');
  const [comparison, setComparison] = useState(1);
  const [secondObject, setSecondObject] = useState(0);
  const [offset, setOffset] = useState(0.25);
  const [altitude, setAltitude] = useState(5);
  const [pole, setPole] = useState(0);
  const model = data.poles[pole];
  const radius = model.offset * 1.35;
  const canSee = offset < 0.5 && altitude > 0;
  const sceneBase = '/mahabharata/?scene=';

  return (
    <section className="ma-lessons" aria-labelledby="ma-lessons-title">
      <h3 id="ma-lessons-title">Sky lessons</h3>
      <div className="ma-lesson-tabs" aria-label="Choose a sky lesson">
        {lessons.map((item) => <button key={item.id} className="ma-flat" aria-pressed={lesson === item.id}
          onClick={() => setLesson(item.id)}>{item.title}</button>)}
      </div>
      {lesson === 'moon' && <div className="ma-lesson-card">
        <p className="ma-kicker">Calculated modern example</p>
        <h4>Same site, two evenings</h4>
        <p>Both rows use 19:30 IST. Tithi advances every 12° of geocentric Moon–Sun longitude. The lit fraction shown here is estimated from that angle.</p>
        <label>Compare the first evening with <select value={comparison} onChange={(event) => setComparison(Number(event.target.value))}>
          {data.days.slice(1).map((day, i) => <option key={day} value={i + 1}>{day}</option>)}
        </select></label>
        <table><thead><tr><th>Evening</th><th>Moon altitude</th><th>Phase &amp; tithi</th></tr></thead><tbody>
          {[0, comparison].map((day) => <tr key={day}>
            <th>{data.days[day]}</th><td>{data.samples[site][day][39][1][0].toFixed(1)}°</td>
            <td>{moonInfo(data.moonPhase[day][39])}</td>
          </tr>)}
        </tbody></table>
        <a href="/mahabharata/?scene=omens&view=evidence&clue=moon">Read about Oak’s war-month clue →</a>
      </div>}
      {lesson === 'near' && <div className="ma-lesson-card">
        <p className="ma-kicker">Calculated modern example</p>
        <h4>How far apart in the sky?</h4>
        <p>The distance is the smaller angle between two sightlines. Change the object selected above, the second object below, or the time slider.</p>
        <label>Compare {data.objects[selected]} with <select value={secondObject} onChange={(event) => setSecondObject(Number(event.target.value))}>
          {data.objects.map((item, i) => <option key={item} value={i}>{item}</option>)}
        </select></label>
        <p><output>{data.objects[selected]} and {data.objects[secondObject]} are {angleBetween(objects[selected], objects[secondObject]).toFixed(2)}° apart.</output></p>
        <a href={sourceUrl('06043054a')}>Read the Venus and Mars comparison at BORI 6.43.54 ↗</a>
      </div>}
      {lesson === 'eclipse' && <div className="ma-lesson-card">
        <p className="ma-kicker">Teaching schematic</p>
        <h4>Would an eclipse be visible here?</h4>
        <p>Assume a new Moon. Use the Moon’s offset as a simple proxy for node alignment, then move the Sun above or below the local horizon. The diagram enlarges both discs.</p>
        <div className="ma-eclipse-schematic" aria-hidden="true">
          <span className="ma-horizon">Local horizon</span>
          <span className="ma-eclipse-sun" style={{ top: `${50 - altitude * 3}%` }} />
          <span className="ma-eclipse-moon" style={{ top: `${50 - altitude * 3}%`, left: `${50 + offset * 26}%` }} />
        </div>
        <label htmlFor="eclipse-separation">Moon–Sun centre separation <span>{offset.toFixed(2)}°</span></label>
        <input id="eclipse-separation" type="range" min="0" max="1" step=".05" value={offset} onChange={(event) => setOffset(Number(event.target.value))} />
        <label htmlFor="eclipse-altitude">Sun altitude <span>{altitude}°</span></label>
        <input id="eclipse-altitude" type="range" min="-10" max="10" step="1" value={altitude} onChange={(event) => setAltitude(Number(event.target.value))} />
        <p role="status">{offset >= 0.5 ? 'The discs miss each other in this schematic.' : canSee ? 'The discs overlap and the Sun’s centre is above the local horizon.' : 'The discs overlap, but the Sun’s centre is at or below the local horizon.'}</p>
        <a href={`${sceneBase}jayadratha`}>Read the story of Jayadratha →</a>
      </div>}
      {lesson === 'precession' && <div className="ma-lesson-card">
        <p className="ma-kicker">Calculated teaching example</p>
        <h4>Where does the mean north pole point?</h4>
        <p>ERFA’s long-term precession model rotates the mean equator of date. The diagram looks down on the J2000 pole, with radial distance in degrees. Julian epochs use astronomical year numbering.</p>
        <div className="ma-pole-schematic" aria-hidden="true">
          <i /><b style={{ left: `${50 + radius * Math.cos(model.direction * rad)}%`, top: `${50 - radius * Math.sin(model.direction * rad)}%` }} />
        </div>
        <label>Julian epoch (TT) <select value={pole} onChange={(event) => setPole(Number(event.target.value))}>
          {data.poles.map((item, i) => <option key={item.epoch} value={i}>{item.epoch}</option>)}
        </select></label>
        <p><output>{model.offset.toFixed(3)}° from the ICRS north pole</output></p>
        <a href="/research/">Read the historical precession method →</a>
      </div>}
      {lesson === 'transits' && <div className="ma-lesson-card ma-star-lesson">
        <p>The north–south meridian is marked in the diagram. Step through the offsets and see which star reaches it first under the illustrated geometry.</p>
        <SkyPlayer fixture={(evidence as EvidenceBundle).sky} />
        <p><a href="/arundhati/#verse">Open BORI Bhīṣmaparvan 6.2.31 and Oak’s original figures →</a></p>
      </div>}
    </section>
  );
}
