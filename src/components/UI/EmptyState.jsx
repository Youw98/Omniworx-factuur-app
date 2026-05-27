export function EmptyState({ icon, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
      {icon && <div className="text-6xl">{icon}</div>}
      <p className="text-xl text-center">{message}</p>
      {action}
    </div>
  )
}
