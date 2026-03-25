export default function QueueStatus({ batch }) {
  const percent = batch?.total ? Math.round((batch.completed / batch.total) * 100) : 0;
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-white/50 bg-surface-container-low p-6">
      <div className="space-y-4">
        <h4 className="flex items-center gap-2 font-headline font-bold text-on-surface">
          <span className="material-symbols-outlined text-primary">tune</span>
          Queue Management
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between border-b border-sky-100 py-2 text-sm">
            <span className="text-on-surface-variant">Estimated Time</span>
            <span className="font-bold">~{batch?.total ? Math.ceil(batch.total * 0.3) : 0} mins</span>
          </div>
          <div className="flex justify-between border-b border-sky-100 py-2 text-sm">
            <span className="text-on-surface-variant">Priority Mode</span>
            <span className="font-bold text-secondary">Standard</span>
          </div>
          <div className="flex justify-between py-2 text-sm">
            <span className="text-on-surface-variant">Progress</span>
            <span className="font-mono text-xs rounded border border-sky-50 bg-white px-2 py-0.5">{batch?.completed ?? 0}/{batch?.total ?? 0}</span>
          </div>
        </div>
      </div>
      <div className="mt-6 text-center">
        <span className="font-headline text-4xl font-bold tracking-tighter text-primary">{percent}%</span>
        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Global Progress</p>
      </div>
    </div>
  );
}
