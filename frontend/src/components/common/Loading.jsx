export default function Loading({ className = '', lines = 3 }) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 rounded-full bg-surface-container-high"
          style={{ width: `${100 - index * 12}%` }}
        />
      ))}
    </div>
  );
}
