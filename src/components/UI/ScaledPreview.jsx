import { useRef, useState, useLayoutEffect } from 'react'

const INVOICE_WIDTH = 780

export function ScaledPreview({ children }) {
  const containerRef = useRef(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      setScale(el.clientWidth / INVOICE_WIDTH)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="bg-white shadow-lg rounded-2xl overflow-hidden origin-top-left"
        style={{
          width: INVOICE_WIDTH,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          marginBottom: `calc((${INVOICE_WIDTH}px * ${scale}) - ${INVOICE_WIDTH}px)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
