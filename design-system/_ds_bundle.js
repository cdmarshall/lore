/* @ds-bundle: {"format":4,"namespace":"LoreDesignSystem_00384f","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Chip","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Panel","sourcePath":"components/core/Panel.jsx"},{"name":"SectionHead","sourcePath":"components/core/SectionHead.jsx"},{"name":"StatTile","sourcePath":"components/core/SectionHead.jsx"},{"name":"Signet","sourcePath":"components/core/Signet.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Input.jsx"},{"name":"ProgressBar","sourcePath":"components/forms/Input.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"d622fd2245c6","components/core/Button.jsx":"5699e5ed5f7f","components/core/Panel.jsx":"2bb1fc8fc443","components/core/SectionHead.jsx":"77fbfbf205a5","components/core/Signet.jsx":"5ffa50cefca2","components/forms/Input.jsx":"f51e73f75676"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.LoreDesignSystem_00384f = window.LoreDesignSystem_00384f || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
const TONES = {
  danger: {
    fg: 'var(--danger)',
    bg: 'var(--danger-soft)'
  },
  warn: {
    fg: 'var(--warn)',
    bg: 'var(--warn-soft)'
  },
  success: {
    fg: 'var(--success)',
    bg: 'var(--success-soft)'
  },
  info: {
    fg: 'var(--info)',
    bg: 'var(--info-soft)'
  },
  gold: {
    fg: 'var(--gold-deep)',
    bg: 'var(--gold-soft)'
  },
  arcane: {
    fg: 'var(--arcane)',
    bg: 'var(--arcane-soft)'
  },
  neutral: {
    fg: 'var(--ink-soft)',
    bg: 'var(--paper-band)'
  }
};
function Badge({
  tone = 'neutral',
  children,
  style
}) {
  const t = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-pixel)',
      fontSize: '14px',
      fontWeight: 600,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: t.fg,
      background: t.bg,
      border: `1px solid ${t.fg}`,
      borderRadius: 0,
      padding: '2px 7px',
      whiteSpace: 'nowrap',
      display: 'inline-block',
      ...style
    }
  }, children);
}
function Chip({
  tone = 'arcane',
  on = false,
  children,
  onClick,
  style
}) {
  const t = TONES[tone] || TONES.arcane;
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      fontFamily: 'var(--font-pixel)',
      fontSize: '14px',
      fontWeight: 600,
      letterSpacing: '0.06em',
      color: on ? '#fff' : t.fg,
      background: on ? t.fg : t.bg,
      border: `1px solid ${t.fg}`,
      borderRadius: 0,
      padding: '3px 9px',
      cursor: onClick ? 'pointer' : 'default',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '6px',
      height: '6px',
      background: on ? '#fff' : t.fg,
      display: 'inline-block'
    }
  }), children);
}
Object.assign(__ds_scope, { Badge, Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const V = {
  primary: {
    bg: 'var(--ink)',
    fg: 'var(--paper)',
    bc: 'var(--ink)'
  },
  secondary: {
    bg: 'var(--surface-card)',
    fg: 'var(--ink)',
    bc: 'var(--ink)'
  },
  gold: {
    bg: 'var(--gold)',
    fg: '#fff',
    bc: 'var(--gold-deep)'
  },
  arcane: {
    bg: 'var(--arcane)',
    fg: '#fff',
    bc: 'var(--arcane)'
  },
  ghost: {
    bg: 'transparent',
    fg: 'var(--ink-soft)',
    bc: 'var(--rule)'
  }
};
function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  children,
  style,
  ...rest
}) {
  const v = V[variant] || V.primary;
  const [press, setPress] = React.useState(false);
  const pad = size === 'sm' ? '6px 12px' : '10px 18px';
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled,
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    onMouseLeave: () => setPress(false),
    style: {
      fontFamily: 'var(--font-pixel)',
      fontSize: size === 'sm' ? '14px' : '16px',
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      background: v.bg,
      color: v.fg,
      border: `2px solid ${v.bc}`,
      borderRadius: 0,
      padding: pad,
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: press ? 'var(--shadow-press)' : 'var(--shadow-sprite-sm)',
      transform: press ? 'translate(2px,2px)' : 'none',
      transition: 'transform 0.08s steps(2), box-shadow 0.08s steps(2)',
      opacity: disabled ? 0.45 : 1,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Panel.jsx
try { (() => {
function Panel({
  variant = 'card',
  wash,
  children,
  style
}) {
  const base = {
    borderRadius: 0,
    position: 'relative',
    padding: '18px 20px',
    boxSizing: 'border-box'
  };
  const variants = {
    card: {
      background: 'var(--surface-card)',
      border: 'var(--border-thin)',
      boxShadow: 'var(--shadow-sprite)'
    },
    hero: {
      background: 'var(--surface-card)',
      border: 'var(--border-px)',
      boxShadow: 'var(--shadow-sprite)'
    },
    parchment: {
      background: 'var(--parchment)',
      border: '2px solid var(--parchment-shade)',
      boxShadow: 'var(--shadow-sprite)'
    },
    band: {
      background: 'var(--paper-band)',
      border: 'none',
      boxShadow: 'none'
    }
  };
  const washes = {
    ink: 'var(--dither-wash-ink)',
    gold: 'var(--dither-wash-gold)',
    arcane: 'var(--dither-wash-arcane)'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...base,
      ...(variants[variant] || variants.card),
      ...style
    }
  }, children, wash && /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '48px',
      pointerEvents: 'none',
      backgroundImage: washes[wash] || washes.gold,
      backgroundRepeat: 'repeat-x',
      backgroundSize: '16px 192px',
      backgroundPosition: 'bottom left',
      imageRendering: 'pixelated',
      opacity: 0.35
    }
  }));
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Panel.jsx", error: String((e && e.message) || e) }); }

// components/core/SectionHead.jsx
try { (() => {
function SectionHead({
  title,
  count,
  note,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '10px',
      borderBottom: '1px solid var(--rule)',
      paddingBottom: '8px'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: '24px',
      margin: 0,
      letterSpacing: '-0.01em',
      color: 'var(--ink)'
    }
  }, title), count !== undefined && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-pixel)',
      fontSize: '15px',
      fontWeight: 600,
      letterSpacing: '0.1em',
      color: 'var(--gold-deep)',
      background: 'var(--gold-soft)',
      border: '1px solid var(--gold)',
      padding: '1px 8px'
    }
  }, count)), note && /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: '14px',
      color: 'var(--ink-faint)',
      fontStyle: 'italic',
      margin: '6px 0 0'
    }
  }, note));
}
function StatTile({
  value,
  label,
  tone = 'neutral',
  style
}) {
  const fills = {
    neutral: 'var(--ink)',
    danger: 'var(--danger)',
    warn: 'var(--warn)',
    gold: 'var(--gold-deep)',
    arcane: 'var(--arcane)',
    success: 'var(--success)'
  };
  const c = fills[tone] || fills.neutral;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: c,
      color: '#fff',
      border: `2px solid ${c}`,
      boxShadow: 'var(--shadow-sprite-sm)',
      padding: '8px 14px 7px',
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px',
      minWidth: '56px',
      boxSizing: 'border-box',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: '28px',
      lineHeight: 1
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-pixel)',
      fontSize: '13px',
      fontWeight: 600,
      letterSpacing: '0.12em',
      textTransform: 'uppercase'
    }
  }, label));
}
Object.assign(__ds_scope, { SectionHead, StatTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SectionHead.jsx", error: String((e && e.message) || e) }); }

// components/core/Signet.jsx
try { (() => {
function Signet({
  size = 32,
  label,
  src = 'assets/scroll.svg',
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      ...style
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: src,
    width: size,
    height: Math.round(size * 1.2),
    alt: "Lore scroll signet",
    style: {
      imageRendering: 'pixelated'
    }
  }), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-pixel)',
      fontSize: '14px',
      letterSpacing: '0.08em',
      color: 'var(--ink-faint)'
    }
  }, label));
}
Object.assign(__ds_scope, { Signet });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Signet.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  label,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      flexDirection: 'column',
      gap: '6px',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-pixel)',
      fontSize: '14px',
      fontWeight: 600,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--ink-faint)'
    }
  }, label), /*#__PURE__*/React.createElement("input", _extends({
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: '15px',
      color: 'var(--ink)',
      background: 'var(--surface-card)',
      border: focus ? '2px solid var(--ink)' : '2px solid var(--rule)',
      borderRadius: 0,
      padding: '8px 10px',
      outline: 'none',
      boxShadow: focus ? 'var(--shadow-sprite-sm)' : 'none'
    }
  }, rest)));
}
function Checkbox({
  label,
  checked,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '9px',
      cursor: 'pointer',
      fontFamily: 'var(--font-serif)',
      fontSize: '15px',
      color: 'var(--ink)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => onChange && onChange(!checked),
    style: {
      width: '16px',
      height: '16px',
      border: '2px solid var(--ink)',
      background: checked ? 'var(--ink)' : 'var(--surface-card)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--paper)',
      fontFamily: 'var(--font-pixel)',
      fontSize: '12px',
      lineHeight: 1,
      userSelect: 'none'
    }
  }, checked ? '\u2713' : ''), /*#__PURE__*/React.createElement("span", {
    onClick: () => onChange && onChange(!checked)
  }, label));
}
function ProgressBar({
  value = 0,
  tone = 'gold',
  style
}) {
  const tiles = {
    gold: 'var(--dither-gold-50)',
    ink: 'var(--dither-ink-50)',
    arcane: 'var(--dither-arcane-25)'
  };
  const solid = {
    gold: 'var(--gold)',
    ink: 'var(--ink)',
    arcane: 'var(--arcane)'
  };
  const pct = Math.max(0, Math.min(100, value));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      border: '2px solid var(--ink)',
      background: 'var(--surface-card)',
      height: '18px',
      position: 'relative',
      overflow: 'hidden',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      width: pct + '%',
      background: solid[tone] || solid.gold
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      left: pct + '%',
      width: '12px',
      backgroundImage: tiles[tone] || tiles.gold,
      backgroundSize: '16px 16px',
      imageRendering: 'pixelated'
    }
  }));
}
Object.assign(__ds_scope, { Input, Checkbox, ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.SectionHead = __ds_scope.SectionHead;

__ds_ns.StatTile = __ds_scope.StatTile;

__ds_ns.Signet = __ds_scope.Signet;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

})();
