import { useEffect, useState } from 'react';
import records from '../../../../content/swarajya.json';
import land from '../../../../content/swarajya-land.json';

export default function SwarajyaMap() {
  const [selected, setSelected] = useState('raigad');
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const place = records.places.find(({ id }) => id === selected)!;
  const regional = selected !== 'agra';
  const shown = records.places.filter(({ id }) => regional ? id !== 'agra' : id === 'agra' || id === 'raigad');
  const { bounds, outlines } = land.views[regional ? 'regional' : 'overview'];
  const [west, south, east, north] = bounds;
  return <section aria-label="Timeline and map">
    <div className="swarajya-controls" aria-label="Select an event">
      {records.events.map(({ id, date, title, place }) => <button className="beta-button" key={id} type="button" disabled={!ready} aria-pressed={selected === place} onClick={() => setSelected(place)}>
        {date} · {title}
      </button>)}
    </div>
    <figure className="small-map">
      <div className="map-grid" aria-label={regional ? 'Coordinate map of three western forts' : 'Overview of Agra and Raigad'}>
        {outlines.map((outline) => <span className="map-land" key={outline} aria-hidden="true" style={{ clipPath: `polygon(${outline})` }} />)}
        <span className="map-north" aria-hidden="true">↑ N</span>
        {shown.map(({ id, name, latitude, longitude }) => <button className="map-point" key={id} type="button" disabled={!ready}
          aria-pressed={selected === id} onClick={() => setSelected(id)}
          style={{
            left: `${(longitude - west) / (east - west) * 100}%`,
            top: `${(north - latitude) / (north - south) * 100}%`,
          }}>{name}</button>)}
      </div>
      <figcaption>Modern coordinates with <a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth</a> land outlines. The return itinerary remains uncertain.</figcaption>
    </figure>
    <p role="status"><strong>{place.name}</strong> · {place.summary}</p>
    <label htmlFor="fort-place">Choose a map location</label>{' '}
    <select id="fort-place" disabled={!ready} value={selected} onChange={(event) => setSelected(event.currentTarget.value)}>
      {records.places.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
    </select>
  </section>;
}
