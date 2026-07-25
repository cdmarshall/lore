import React from 'react';
const V = {
  primary:{bg:'var(--ink)',fg:'var(--paper)',bc:'var(--ink)'},
  secondary:{bg:'var(--surface-card)',fg:'var(--ink)',bc:'var(--ink)'},
  gold:{bg:'var(--gold)',fg:'#fff',bc:'var(--gold-deep)'},
  arcane:{bg:'var(--arcane)',fg:'#fff',bc:'var(--arcane)'},
  ghost:{bg:'transparent',fg:'var(--ink-soft)',bc:'var(--rule)'},
};
export function Button({variant='primary', size='md', disabled, children, style, ...rest}) {
  const v = V[variant] || V.primary;
  const [press, setPress] = React.useState(false);
  const pad = size==='sm' ? '6px 12px' : '10px 18px';
  return <button disabled={disabled} onMouseDown={()=>setPress(true)} onMouseUp={()=>setPress(false)} onMouseLeave={()=>setPress(false)}
    style={{fontFamily:'var(--font-pixel)', fontSize:size==='sm'?'14px':'16px', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase',
      background:v.bg, color:v.fg, border:`2px solid ${v.bc}`, borderRadius:0, padding:pad, cursor:disabled?'not-allowed':'pointer',
      boxShadow:press?'var(--shadow-press)':'var(--shadow-sprite-sm)', transform:press?'translate(2px,2px)':'none',
      transition:'transform 0.08s steps(2), box-shadow 0.08s steps(2)', opacity:disabled?0.45:1, ...style}} {...rest}>{children}</button>;
}
