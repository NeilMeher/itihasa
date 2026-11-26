import land from '../../../../content/swarajya-land.json';
import type { ExplorerPlace } from '../lib/explorer-content';

const [west, south, east, north] = land.views.overview.bounds;

export default function ExplorerGeography({ places, selected, onSelect }: {
  places: ExplorerPlace[]; selected: string; onSelect: (id: string) => void;
}) {
  return <figure className="explorer-geography">
    <div className="explorer-map-frame" aria-label="Modern geographic reference points">
      {land.views.overview.outlines.map((shape, index) =>
        <span key={index} aria-hidden="true" style={{ clipPath: 'polygon(' + shape + ')' }} />)}
      {places.filter((place) => place.lat !== null && place.lon !== null).map((place) =>
        <button key={place.id} type="button" aria-label={'Inspect ' + place.name + ' on the map'} aria-pressed={selected === place.id}
          style={{ left: (place.lon! - west) / (east - west) * 100 + '%', top: (north - place.lat!) / (north - south) * 100 + '%' }}
          onClick={() => onSelect(place.id)}><span aria-hidden="true">●</span></button>)}
    </div>
    <figcaption>Modern reference geography. Text-only and unresolved locations are listed below. <a href="https://www.naturalearthdata.com/downloads/50m-physical-vectors/50m-land/">Natural Earth land outline</a></figcaption>
  </figure>;
}
