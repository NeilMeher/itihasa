import { createElement, type ComponentProps } from 'react';
import { createRoot } from 'react-dom/client';
import Explorer from '../components/Explorer';
import '../styles/mind-map.css';
import '../styles/mahabharata.css';
import '../styles/explorer.css';

export function mountExplorer(target: HTMLElement, home: NonNullable<ComponentProps<typeof Explorer>['home']>) {
  const root = createRoot(target);
  root.render(createElement(Explorer, { home }));
  return () => root.unmount();
}
