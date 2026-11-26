import { useEffect, useRef, useState } from 'react';
import atlas from '../../../../content/mahabharata-atlas.json';
import land from '../../../../content/swarajya-land.json';
import geography from '../../../../content/mahabharata-rivers.json';
import { scenes } from '../lib/mahabharata';

const overview = land.views.overview;
const regional = geography.bounds;

type Place = (typeof atlas.places)[number];

function project(lon: number, lat: number, [west, south, east, north]: number[]) {
  return [100 * (lon - west) / (east - west), 100 * (north - lat) / (north - south)];
}

function marker(place: Place, bounds: number[]) {
  if (place.lon === null || place.lat === null) return null;
  const [x, y] = project(place.lon, place.lat, bounds);
  if (x < 0 || x > 100 || y < 0 || y > 100) return null;
  return { left: `${x}%`, top: `${y}%` };
}

export default function MahabharataMap({
  selected,
  onSelect,
  onScene,
}: {
  selected: string;
  onSelect: (place: string) => void;
  onScene: (id: string) => void;
}) {
  const place = atlas.places.find((item) => item.id === selected);
  const [preference, setPreference] = useState<'auto' | 'wide' | 'regional'>('auto');
  const riverLayer = useRef<HTMLCanvasElement>(null);
  const inKuru = place && marker(place, regional);
  const isRegional = preference === 'regional' || (preference === 'auto' && Boolean(inKuru));
  const bounds = isRegional ? regional : overview.bounds;
  const selectedMarker = place && marker(place, bounds);
  const [west, south, east, north] = bounds;
  const [fullWest, fullSouth, fullEast, fullNorth] = overview.bounds;
  const layer = {
    left: `${100 * (fullWest - west) / (east - west)}%`,
    top: `${100 * (north - fullNorth) / (north - south)}%`,
    width: `${100 * (fullEast - fullWest) / (east - west)}%`,
    height: `${100 * (fullNorth - fullSouth) / (north - south)}%`,
  };

  useEffect(() => {
    if (!isRegional || !riverLayer.current) return;
    const canvas = riverLayer.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#8cbac7';
    context.lineWidth = 4;
    context.lineJoin = 'round';
    for (const river of geography.rivers) {
      for (const segment of river.segments) {
        context.beginPath();
        segment.forEach(([lon, lat], index) => {
          const [x, y] = project(lon, lat, regional);
          const px = x * canvas.width / 100;
          const py = y * canvas.height / 100;
          if (index === 0) context.moveTo(px, py);
          else context.lineTo(px, py);
        });
        context.stroke();
      }
    }
  }, [isRegional]);

  return (
    <section className="ma-map" aria-label="Places in the Mahābhārata">
      <div className="ma-map-bar"><span>Approximate modern locators</span>
        <div className="ma-map-switch" aria-label="Geographic view">
          <button aria-pressed={!isRegional} onClick={() => setPreference('wide')}>Wide view</button>
          <button aria-pressed={isRegional} onClick={() => setPreference('regional')}>Kuru region</button>
        </div>
      </div>
      <div className={`ma-cartography${isRegional ? ' ma-cartography-regional' : ''}`}>
        <div className="ma-land" aria-hidden="true" style={layer}>
          {overview.outlines.map((outline, index) => (
            <span key={index} style={{ clipPath: `polygon(${outline})` }} />
          ))}
        </div>
        <span className="ma-map-north" aria-hidden="true">↑ N</span>
        {isRegional && <>
          <canvas className="ma-river-layer" ref={riverLayer} width="960" height="720" aria-hidden="true" />
          <span className="ma-river-label" style={{left:'58%',top:'28%'}} aria-hidden="true">Gaṅgā</span>
          <span className="ma-river-label" style={{left:'40%',top:'62%'}} aria-hidden="true">Yamunā</span>
          <span className="ma-map-west" aria-hidden="true">76°E</span>
          <span className="ma-map-east" aria-hidden="true">80°E</span>
        </>}
        {!isRegional && <>
          <span className="ma-ocean ma-arabian" aria-hidden="true">ARABIAN SEA</span>
          <span className="ma-ocean ma-bengal" aria-hidden="true">BAY OF BENGAL</span>
          <button className="ma-point ma-point-cluster" style={{left: '39%', top: '19%'}}
            onClick={() => setPreference('regional')} aria-label="Zoom into six Kuru-area locations">6</button>
        </>}
        {atlas.places.filter((item) => isRegional || !marker(item, regional)).map((item) => {
          const style = marker(item, bounds);
          if (!style) return null;
          return (
            <button key={item.id} className="ma-point" style={style}
              aria-label={`Explore ${item.name}`} aria-pressed={item.id === selected}
              onClick={() => onSelect(item.id)}>
              <span />
            </button>
          );
        })}
        {selectedMarker && place && (isRegional || !inKuru) &&
          <span className="ma-point-label" style={selectedMarker} aria-hidden="true">{place.name}</span>}
      </div>
      <div className="ma-map-places" aria-label="Location list">
        {atlas.places.map((item) => (
          <button key={item.id} aria-pressed={selected === item.id} onClick={() => {
            setPreference('auto');
            onSelect(item.id);
          }}>
            {item.name}
          </button>
        ))}
      </div>
      <div className="ma-map-legend">
        {place
          ? <><strong>{place.modern}</strong><span>{place.status} · <a href={place.url}>Location source</a></span></>
          : <strong>The location of this scene is open.</strong>}
        <span>Natural Earth <a href="https://www.naturalearthdata.com/downloads/50m-physical-vectors/50m-land/">land</a> · <a href="https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/">modern rivers</a></span>
      </div>
      {place && <div className="ma-place-scenes">
        <h4>Scenes at {place.name}</h4>
        <ul>{scenes.filter((item) => item.place === place.id).map((item) => <li key={item.id}>
          <button className="ma-text-button" onClick={() => { setPreference('auto'); onScene(item.id); }}>{item.title} →</button>
        </li>)}</ul>
      </div>}
      <details className="ma-itinerary">
        <summary>Follow the exile’s narrative stops</summary>
        <p>Story sequence, with locations and sources available from each stop.</p>
        <ol>
          <li><button className="ma-text-button" onClick={() => { setPreference('auto'); onScene('dice'); }}>Hastināpura · The dice hall</button></li>
          <li><button className="ma-text-button" onClick={() => { setPreference('auto'); onScene('exile-start'); }}>The forest exile · Location open</button></li>
          <li><button className="ma-text-button" onClick={() => { setPreference('auto'); onScene('hidden-year'); }}>Matsya · The year in disguise</button></li>
        </ol>
      </details>
    </section>
  );
}
