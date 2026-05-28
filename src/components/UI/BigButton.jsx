export function BigButton({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }) {
  const base = 'w-full min-h-[56px] text-xl font-semibold rounded-2xl px-6 py-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-poppins'
  const variants = {
    primary: 'bg-gold-500 text-primary-800 shadow-md hover:bg-gold-400 active:shadow-none',
    secondary: 'bg-gray-100 text-gray-800 border-2 border-gray-300 hover:bg-gray-200',
    danger: 'bg-red-600 text-white shadow-md hover:bg-red-700',
    success: 'bg-green-600 text-white shadow-md hover:bg-green-700',
    outline: 'bg-white text-primary-700 border-2 border-gold-500 hover:bg-gold-50',
    dark: 'bg-primary-700 text-white shadow-md hover:bg-primary-800',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
