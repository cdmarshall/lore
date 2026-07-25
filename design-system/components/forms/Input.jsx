import React from 'react';
export function Input({label, style, ...rest}) {
  const [focus, setFocus] = React.useState(false);
  return <label style={{display:'inline-flex', flexDirection:'column', gap:'6px', ...style}}>
    {label && <span style={{fontFamily:'var(--font-pixel)', fontSize:'14px', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-faint)'}}>{label}</span>}
    <input onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
      style={{fontFamily:'var(--font-serif)', fontSize:'15px', color:'var(--ink)', background:'var(--surface-card)',
      border:focus?'2px solid var(--ink)':'2px solid var(--rule)', borderRadius:0, padding:'8px 10px', outline:'none',
      boxShadow:focus?'var(--shadow-sprite-sm)':'none'}} {...rest}/>
  </label>;
}
export function Checkbox({label, checked, onChange, style}) {
  return <label style={{display:'inline-flex', alignItems:'center', gap:'9px', cursor:'pointer', fontFamily:'var(--font-serif)', fontSize:'15px', color:'var(--ink)', ...style}}>
    <span onClick={()=>onChange && onChange(!checked)} style={{width:'16px', height:'16px', border:'2px solid var(--ink)', background:checked?'var(--ink)':'var(--surface-card)',
      display:'inline-flex', alignItems:'center', justifyContent:'center', color:'var(--paper)', fontFamily:'var(--font-pixel)', fontSize:'12px', lineHeight:1, userSelect:'none'}}>{checked?'\u2713':''}</span>
    <span onClick={()=>onChange && onChange(!checked)}>{label}</span>
  </label>;
}
export function ProgressBar({value=0, tone='gold', style}) {
  const tiles = {gold:'var(--dither-gold-50)', ink:'var(--dither-ink-50)', arcane:'var(--dither-arcane-25)'};
  const solid = {gold:'var(--gold)', ink:'var(--ink)', arcane:'var(--arcane)'};
  const pct = Math.max(0, Math.min(100, value));
  return <div style={{border:'2px solid var(--ink)', background:'var(--surface-card)', height:'18px', position:'relative', overflow:'hidden', ...style}}>
    <div style={{position:'absolute', inset:0, width:pct+'%', background:solid[tone]||solid.gold}}></div>
    <div style={{position:'absolute', inset:0, left:pct+'%', width:'12px', backgroundImage:tiles[tone]||tiles.gold, backgroundSize:'16px 16px', imageRendering:'pixelated'}}></div>
  </div>;
}
