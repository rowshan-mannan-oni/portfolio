export default function Loading() {
  return (
    <div className="container-page section-y" aria-busy="true" aria-label="Loading article">
      <div className="mx-auto max-w-[var(--container-prose)] space-y-4">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-10 w-full" />
        <div className="skeleton h-10 w-3/4" />
        <div className="skeleton mt-8 h-4 w-full" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
      </div>
    </div>
  );
}
