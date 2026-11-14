import React from 'react';
// Small UI pieces shared by the task pane panels.
import { ReactNode } from 'react';

const P = (d: string) => <svg viewBox="0 0 24 24" className="ic" aria-hidden="true"><path d={d} /></svg>;
export const Icon = {
  import: P('M12 4v11M7 10l5 5 5-5M5 20h14'),
  clean: P('M4 20l6-6M14 4l6 6-8 8H8v-4z'),
  fx: P('M8 20c3 0 3-16 6-16M6 10h7M14 12l6 6M20 12l-6 6'),
  pdf: P('M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20zM14 3.5V8h4M10 13h5M10 16.5h3'),
  sync: P('M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5'),
  gear: P('M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6'),
  check: P('m5 12.5 4.5 4.5L19 7.5'),
  x: P('M6 6l12 12M18 6 6 18'),
  arrow: P('M5 12h14M13 6l6 6-6 6'),
  undo: P('M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3'),
  plus: P('M12 5v14M5 12h14'),
  cell: P('M4 4h16v16H4zM4 10h16M10 4v16')
};

export const Card = ({ title, sub, children, right }: { title?: string; sub?: string; children: ReactNode; right?: ReactNode }) => (
  <section className="card">
    {title && <div className="card-h"><div><h3>{title}</h3>{sub && <p>{sub}</p>}</div>{right}</div>}
    {children}
  </section>
);

export const Btn = ({ children, onClick, kind = 'primary', busy, disabled, wide = true }: { children: ReactNode; onClick?: () => void; kind?: 'primary' | 'ghost' | 'soft'; busy?: boolean; disabled?: boolean; wide?: boolean }) => (
  <button className={`btn ${kind}${wide ? ' wide' : ''}${busy ? ' busy' : ''}`} onClick={onClick} disabled={disabled || busy}>
    {busy && <span className="spin" />}{children}
  </button>
);

export const Chip = ({ on, children, onClick }: { on: boolean; children: ReactNode; onClick: () => void }) => (
  <button className={`chip${on ? ' on' : ''}`} onClick={onClick} aria-pressed={on}>{on && Icon.check}{children}</button>
);

export const Empty = ({ icon, title, text }: { icon: ReactNode; title: string; text: string }) => (
  <div className="empty"><span className="empty-i">{icon}</span><b>{title}</b><p>{text}</p></div>
);
