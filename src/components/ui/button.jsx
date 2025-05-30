export function Button({ children, onClick, className = '', variant = 'default' }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded border ${variant === 'outline' ? 'border-gray-400' : 'bg-blue-500 text-white'} ${className}`}
    >
      {children}
    </button>
  );
}
