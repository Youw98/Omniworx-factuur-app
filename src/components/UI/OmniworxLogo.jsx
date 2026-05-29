// dark: true = dark green background (for dark headers/splash), false = white/transparent (for light backgrounds)
export function OWMonogram({ size = 56, dark = true, className = '' }) {
  const src = dark ? '/monogram-green.jpg' : '/monogram.webp'
  return (
    <img
      src={src}
      alt="Omniworx monogram"
      width={size}
      height={size}
      style={{ width: size, height: size, display: 'block', borderRadius: Math.round(size * 0.18) }}
      className={className}
    />
  )
}

// variant: 'horizontal' (default, for headers) | 'stacked' (for centered screens)
// dark: true uses the green-bg JPG, false uses transparent WebP (shows on any bg)
export function OmniworxWordmark({ dark = false, variant = 'horizontal', height = 48, className = '' }) {
  if (variant === 'stacked') {
    const src = dark ? '/logo-stacked-green.jpg' : '/logo-stacked.webp'
    return (
      <img
        src={src}
        alt="Omniworx logo"
        height={height}
        style={{ height, width: 'auto', display: 'block' }}
        className={className}
      />
    )
  }
  const src = dark ? '/logo-horizontal-green.jpg' : '/logo-horizontal.webp'
  return (
    <img
      src={src}
      alt="Omniworx logo"
      height={height}
      style={{ height, width: 'auto', display: 'block' }}
      className={className}
    />
  )
}

// Brand icon components (gold outline style, viewBox 0 0 100 100)
export function PaintRollerIcon({ size = 24, color = '#E7B260', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M 22 37 L 64 37 Q 77 37 77 50 Q 77 63 64 63 L 22 63" stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="12" y1="37" x2="24" y2="37" stroke={color} strokeWidth="7" strokeLinecap="round"/>
      <line x1="12" y1="63" x2="24" y2="63" stroke={color} strokeWidth="7" strokeLinecap="round"/>
      <path d="M 73 60 L 80 60 Q 88 60 88 68 L 88 74 Q 88 82 80 82 L 66 82 Q 58 82 58 74 L 58 66 Q 58 58 66 58 L 74 58" stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function HardHatIcon({ size = 24, color = '#E7B260', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="16" y="68" width="68" height="14" rx="7" stroke={color} strokeWidth="6"/>
      <path d="M 22 70 Q 22 28 50 28 Q 78 28 78 70" stroke={color} strokeWidth="6" strokeLinecap="round"/>
      <path d="M 44 28 L 44 18 Q 44 13 50 13 Q 56 13 56 18 L 56 28" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="68" y1="48" x2="76" y2="42" stroke={color} strokeWidth="5" strokeLinecap="round"/>
      <line x1="64" y1="57" x2="72" y2="51" stroke={color} strokeWidth="5" strokeLinecap="round"/>
    </svg>
  )
}

export function WorkerIcon({ size = 24, color = '#E7B260', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="50" cy="28" r="12" stroke={color} strokeWidth="6"/>
      <path d="M 38 25 Q 38 14 50 14 Q 62 14 62 25" stroke={color} strokeWidth="5" strokeLinecap="round"/>
      <rect x="42" y="20" width="16" height="5" rx="2" stroke={color} strokeWidth="4"/>
      <path d="M 20 100 Q 20 72 36 66 Q 42 64 50 64 Q 58 64 64 66 Q 80 72 80 100" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 36 66 Q 36 76 50 76 Q 64 76 64 66" stroke={color} strokeWidth="5" strokeLinecap="round"/>
      <line x1="50" y1="76" x2="50" y2="90" stroke={color} strokeWidth="5" strokeLinecap="round"/>
      <line x1="36" y1="90" x2="64" y2="90" stroke={color} strokeWidth="5" strokeLinecap="round"/>
    </svg>
  )
}

export function BuildingsIcon({ size = 24, color = '#E7B260', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M 12 85 L 12 48 L 36 38 L 36 85" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 36 85 L 36 18 L 64 12 L 64 85" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 64 85 L 64 32 L 88 26 L 88 85" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="10" y1="85" x2="90" y2="85" stroke={color} strokeWidth="5" strokeLinecap="round"/>
      <rect x="18" y="55" width="8" height="8" rx="1" fill={color}/>
      <rect x="18" y="68" width="8" height="8" rx="1" fill={color}/>
      <rect x="42" y="28" width="8" height="8" rx="1" fill={color}/>
      <rect x="42" y="42" width="8" height="8" rx="1" fill={color}/>
      <rect x="42" y="56" width="8" height="8" rx="1" fill={color}/>
      <rect x="42" y="70" width="8" height="8" rx="1" fill={color}/>
      <rect x="72" y="38" width="8" height="8" rx="1" fill={color}/>
      <rect x="72" y="52" width="8" height="8" rx="1" fill={color}/>
      <rect x="72" y="66" width="8" height="8" rx="1" fill={color}/>
    </svg>
  )
}

export function FaucetIcon({ size = 24, color = '#E7B260', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="36" y="10" width="28" height="10" rx="5" stroke={color} strokeWidth="6"/>
      <line x1="50" y1="20" x2="50" y2="30" stroke={color} strokeWidth="6" strokeLinecap="round"/>
      <path d="M 22 30 L 70 30 L 70 30" stroke={color} strokeWidth="6" strokeLinecap="round"/>
      <path d="M 22 30 Q 14 30 14 38 L 14 52" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 22 36 L 68 36 Q 78 36 78 46 L 78 58 Q 78 66 70 66" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="62" y="62" width="18" height="10" rx="5" stroke={color} strokeWidth="6"/>
      <path d="M 71 72 Q 71 82 66 86 Q 61 90 66 95" stroke={color} strokeWidth="5" strokeLinecap="round"/>
    </svg>
  )
}
