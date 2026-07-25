import React from 'react';
export function Signet({size=32, label, src='assets/scroll.svg', style}) {
  return <span style={{display:'inline-flex', alignItems:'center', gap:'8px', ...style}}>
    <img src={src} width={size} height={Math.round(size*1.2)} alt="Lore scroll signet" style={{imageRendering:'pixelated'}}/>
    {label && <span style={{fontFamily:'var(--font-pixel)', fontSize:'14px', letterSpacing:'0.08em', color:'var(--ink-faint)'}}>{label}</span>}
  </span>;
}
