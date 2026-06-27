/**
 * Dev-only floating toggle button.
 * Switches VisitorPage between "active season" and "off-season awards" views
 * by setting/clearing the ?season=off URL query param.
 *
 * Rendered only when import.meta.env.DEV === true — the entire component
 * is tree-shaken out of the production bundle.
 */

import { useSearchParams } from 'react-router-dom';

export function DevSeasonToggle() {
  // Hard guard: this component must never render in production.
  // Vite replaces import.meta.env.DEV with `false` at build time,
  // so Rollup eliminates the hook call and all JSX below it.
  if (!import.meta.env.DEV) return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [searchParams, setSearchParams] = useSearchParams();
  const isOffSeason = searchParams.get('season') === 'off';

  // const toggle = () => {
  //   setSearchParams((prev) => {
  //     const next = new URLSearchParams(prev);
  //     if (isOffSeason) {
  //       next.delete('season');
  //     } else {
  //       next.set('season', 'off');
  //     }
  //     return next;
  //   });
  // };

  // return (
  //   // <div
  //   //   style={{
  //   //     position: 'fixed',
  //   //     bottom: '20px',
  //   //     right: '20px',
  //   //     zIndex: 9999,
  //   //     display: 'flex',
  //   //     flexDirection: 'column',
  //   //     alignItems: 'flex-end',
  //   //     gap: '4px',
  //   //     fontFamily: 'monospace',
  //   //   }}
  //   // >
  //   //   <span
  //   //     style={{
  //   //       fontSize: '10px',
  //   //       color: '#f97316',
  //   //       fontWeight: 700,
  //   //       letterSpacing: '0.12em',
  //   //       textTransform: 'uppercase',
  //   //     }}
  //   //   >
  //   //     🛠 dev mode
  //   //   </span>
  //   //   <button
  //   //     onClick={toggle}
  //   //     title={isOffSeason ? 'Switch to Active Season view' : 'Switch to Off-Season Awards view'}
  //   //     style={{
  //   //       background: isOffSeason ? '#92400e' : '#1f2937',
  //   //       border: '2px solid #f97316',
  //   //       borderRadius: '8px',
  //   //       color: '#fff',
  //   //       cursor: 'pointer',
  //   //       fontSize: '13px',
  //   //       fontWeight: 700,
  //   //       padding: '8px 14px',
  //   //       transition: 'background 0.15s',
  //   //       whiteSpace: 'nowrap',
  //   //     }}
  //   //   >
  //   //     {isOffSeason ? '🏀 Active Season' : '🏆 Off-Season'}
  //   //   </button>
  //   // </div>
  // );
}
