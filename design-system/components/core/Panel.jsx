import React from 'react';
export function Panel({variant='card', wash, children, style}) {
  const base = {borderRadius:0, position:'relative', padding:'18px 20px', boxSizing:'border-box'};
  const variants = {
    card:{background:'var(--surface-card)', border:'var(--border-thin)', boxShadow:'var(--shadow-sprite)'},
    hero:{background:'var(--surface-card)', border:'var(--border-px)', boxShadow:'var(--shadow-sprite)'},
    parchment:{background:'var(--parchment)', border:'2px solid var(--parchment-shade)', boxShadow:'var(--shadow-sprite)'},
    band:{background:'var(--paper-band)', border:'none', boxShadow:'none'},
  };
  const washes = {ink:'var(--dither-wash-ink)', gold:'var(--dither-wash-gold)', arcane:'var(--dither-wash-arcane)'};
  return <div style={{...base, ...(variants[variant]||variants.card), ...style}}>
    {children}
    {wash && <div aria-hidden="true" style={{position:'absolute', left:0, right:0, bottom:0, height:'48px', pointerEvents:'none',
      backgroundImage:washes[wash]||washes.gold, backgroundRepeat:'repeat-x', backgroundSize:'16px 192px', backgroundPosition:'bottom left',
      imageRendering:'pixelated', opacity:0.35}}></div>}
  </div>;
}
