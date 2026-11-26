import { useEffect, useState } from 'react';

export default function EclipseCriteria() {
  const [newMoon, setNewMoon] = useState(false);
  const [nearNode, setNearNode] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const satisfied = newMoon && nearNode && visible;
  return <fieldset className="eclipse-criteria" disabled={!ready}>
    <legend>Try an illustrative evidence check</legend>
    <label><input type="checkbox" checked={newMoon} onChange={(event) => setNewMoon(event.currentTarget.checked)} /> The Moon is new</label>
    <label><input type="checkbox" checked={nearNode} onChange={(event) => setNearNode(event.currentTarget.checked)} /> It is near a node of its orbit</label>
    <label><input type="checkbox" checked={visible} onChange={(event) => setVisible(event.currentTarget.checked)} /> The eclipse is visible at the proposed place</label>
    <p role="status">{satisfied ? 'These assumptions pass the geometry screen. A historical claim still needs a dated source and a computed match.' : 'One or more geometry conditions remain unmet.'}</p>
  </fieldset>;
}
