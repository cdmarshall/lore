import React from 'react';
const TONES = {
  danger:{fg:'var(--danger)',bg:'var(--danger-soft)'},
  warn:{fg:'var(--warn)',bg:'var(--warn-soft)'},
  success:{fg:'var(--success)',bg:'var(--success-soft)'},
  info:{fg:'var(--info)',bg:'var(--info-soft)'},
  gold:{fg:'var(--gold-deep)',bg:'var(--gold-soft)'},
  arcane:{fg:'var(--arcane)',bg:'var(--arcane-soft)'},
  neutral:{fg:'var(--ink-soft)',bg:'var(--paper-band)'},
};
export function Badge({tone='neutral', children, style}) {
  const t = TONES[tone] || TONES.neutral;
  return <span style={{fontFamily:'var(--font-pixel)', fontSize:'14px', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase',
    color:t.fg, background:t.bg, border:`1px solid ${t.fg}`, borderRadius:0, padding:'2px 7px', whiteSpace:'nowrap', display:'inline-block', ...style}}>{children}</span>;
}
export function Chip({tone='arcane', on=false, children, onClick, style}) {
  const t = TONES[tone] || TONES.arcane;
  return <button onClick={onClick} style={{fontFamily:'var(--font-pixel)', fontSize:'14px', fontWeight:600, letterSpacing:'0.06em',
    color:on?'#fff':t.fg, background:on?t.fg:t.bg, border:`1px solid ${t.fg}`, borderRadius:0, padding:'3px 9px', cursor:onClick?'pointer':'default',
    display:'inline-flex', alignItems:'center', gap:'6px', ...style}}>
    <span style={{width:'6px', height:'6px', background:on?'#fff':t.fg, display:'inline-block'}}></span>{children}</button>;
}
