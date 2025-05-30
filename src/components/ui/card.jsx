export function Card({ children, ...props }) {
  return (
    <div className="bg-white shadow rounded" {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
}
