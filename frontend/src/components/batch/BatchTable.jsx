import { Link } from 'react-router-dom';

const statusIcons = {
  done: { icon: 'check_circle', cls: 'text-secondary', label: 'Done' },
  processing: { icon: 'cycle', cls: 'text-primary animate-pulse', label: 'Processing' },
  queued: { icon: 'pending', cls: 'text-slate-400', label: 'Pending' },
  failed: { icon: 'warning', cls: 'text-tertiary', label: 'Failed' },
};

export default function BatchTable({ items = [] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-surface-container-lowest shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-50 p-6">
        <h3 className="font-headline text-lg font-bold">Batch Items Listing</h3>
        <div className="flex items-center gap-2">
          <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-50">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
          <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-50">
            <span className="material-symbols-outlined">download</span>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low/50">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Filename / Case ID</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">AI Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Result</th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-on-surface-variant">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item) => {
              const cfg = statusIcons[item.status] || statusIcons.queued;
              return (
                <tr key={item.id} className="transition-colors hover:bg-surface-container-high">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100">
                        <span className="material-symbols-outlined text-sm text-slate-400">image</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">#{item.id}</p>
                        <p className="text-xs text-on-surface-variant">{item.filename}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-sm font-semibold ${cfg.cls}`}>
                      <span className="material-symbols-outlined text-[16px]">{cfg.icon}</span>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {item.status === 'done' ? (
                      <span className="inline-flex items-center rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
                        Done
                      </span>
                    ) : item.status === 'failed' ? (
                      <span className="text-xs text-tertiary underline cursor-pointer">View Error</span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {item.prediction_id ? (
                      <Link to={`/history/${item.prediction_id}`} className="rounded-lg p-2 text-primary transition-colors hover:bg-primary-container/10">
                        <span className="material-symbols-outlined">visibility</span>
                      </Link>
                    ) : item.status === 'failed' ? (
                      <button className="rounded-lg p-2 text-tertiary transition-colors hover:bg-red-50">
                        <span className="material-symbols-outlined">refresh</span>
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
