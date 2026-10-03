export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="skeleton h-7 w-48" />
      <div className="skeleton mt-3 h-4 w-80 max-w-full" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
