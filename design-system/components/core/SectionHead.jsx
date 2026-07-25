import React from 'react';
export function SectionHead({title, count, note, style}) {
  return <div style={{...style}}>
    <div style={{display:'flex', alignItems:'baseline', gap:'10px', borderBottom:'1px solid var(--rule)', paddingBottom:'8px'}}>
      <h2 style={{fontFamily:'var(--font-serif)', fontWeight:400, fontSize:'24px', margin:0, letterSpacing:'-0.01em', color:'var(--ink)'}}>{title}</h2>
      {count !== undefined && <span style={{fontFamily:'var(--font-pixel)', fontSize:'15px', fontWeight:600, letterSpacing:'0.1em',
        color:'var(--gold-deep)', background:'var(--gold-soft)', border:'1px solid var(--gold)', padding:'1px 8px'}}>{count}</span>}
    </div>
    {note && <p style={{fontFamily:'var(--font-serif)', fontSize:'14px', color:'var(--ink-faint)', fontStyle:'italic', margin:'6px 0 0'}}>{note}</p>}
  </div>;
}
export function StatTile({value, label, tone='neutral', style}) {
  const fills = {neutral:'var(--ink)', danger:'var(--danger)', warn:'var(--warn)', gold:'var(--gold-deep)', arcane:'var(--arcane)', success:'var(--success)'};
  const c = fills[tone]||fills.neutral;
  return <div style={{background:c, color:'#fff', border:`2px solid ${c}`, boxShadow:'var(--shadow-sprite-sm)', padding:'8px 14px 7px',
    display:'inline-flex', flexDirection:'column', alignItems:'center', gap:'2px', minWidth:'56px', boxSizing:'border-box', ...style}}>
    <span style={{fontFamily:'var(--font-display)', fontSize:'28px', lineHeight:1}}>{value}</span>
    <span style={{fontFamily:'var(--font-pixel)', fontSize:'13px', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase'}}>{label}</span>
  </div>;
}
