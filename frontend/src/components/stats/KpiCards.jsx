const icons = ['insert_chart', 'emergency', 'check_circle', 'speed'];

export default function KpiCards({ items }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item, i) => (
        <div key={item.label} className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-fixed text-primary">
              <span className="material-symbols-outlined">{icons[i] ?? 'analytics'}</span>
            </div>
            {item.trend ? (
              <span className="flex items-center gap-1 text-xs font-bold text-secondary">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                {item.trend}
              </span>
            ) : null}
          </div>
          <p className="mt-4 text-sm text-slate-500 font-medium">{item.label}</p>
          <p className="mt-1 font-headline text-3xl font-extrabold tracking-tight">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
