export function OmniworxMonogram({ size = 56, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Omniworx logo"
    >
      <rect width="100" height="100" rx="12" fill="#0C3C3A" />
      {/* C (O) shape */}
      <path
        d="M52 22 C30 22 18 34 18 50 C18 66 30 78 52 78 C58 78 64 76.5 69 73.5 L62 65 C59 67 55.5 68 52 68 C36 68 28 60 28 50 C28 40 36 32 52 32 C55.5 32 59 33 62 35 L69 26.5 C64 23.5 58 22 52 22 Z"
        fill="#E7B260"
      />
      {/* W shape */}
      <path
        d="M56 32 L62 58 L70 40 L78 58 L84 32 L79 32 L73.5 50 L68 37 L63 50 L57.5 32 Z"
        fill="#E7B260"
      />
    </svg>
  )
}

export function OmniworxWordmark({ dark = false, className = '' }) {
  const textColor = dark ? '#0C3C3A' : '#FFFFFF'
  const goldColor = '#E7B260'
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <OmniworxMonogram size={44} />
      <div className="flex flex-col leading-none">
        <span
          style={{ fontFamily: 'Poppins, sans-serif', color: dark ? '#0C3C3A' : goldColor, fontWeight: 800, fontSize: 20, letterSpacing: 2 }}
        >
          OMNIWORX
        </span>
        <span
          style={{ fontFamily: 'Poppins, sans-serif', color: dark ? '#555' : 'rgba(231,178,96,0.75)', fontWeight: 400, fontSize: 9, letterSpacing: 3, marginTop: 1 }}
        >
          ONDERHOUD EN RENOVATIES
        </span>
      </div>
    </div>
  )
}
