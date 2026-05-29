export function BigSelect({ label, id, error, required = false, children, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-lg font-semibold text-gray-700 font-poppins">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={id}
        className={`w-full min-h-[56px] text-xl px-4 py-3 rounded-xl border-2 ${
          error ? 'border-red-500' : 'border-gray-300'
        } focus:outline-none focus:border-primary-700 bg-white`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-red-600 text-lg font-medium">{error}</p>}
    </div>
  )
}
