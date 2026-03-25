import clsx from 'clsx';

const statusConfig = {
  done: { icon: 'check_circle', fill: true, color: 'text-secondary', label: 'Complete' },
  processing: { icon: 'hourglass_top', fill: false, color: 'text-primary animate-pulse', label: null },
  queued: { icon: 'analytics', fill: false, color: 'text-slate-400', label: 'Waiting' },
  failed: { icon: 'error', fill: true, color: 'text-tertiary', label: 'Failed' },
};

export default function ProgressPipeline({ steps = [], progress = 0 }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-6 space-y-6">
      <h4 className="font-headline text-sm font-bold uppercase tracking-widest text-on-surface-variant">Analysis Progress</h4>
      <div className="space-y-4">
        {steps.map((step) => {
          const cfg = statusConfig[step.status] || statusConfig.queued;
          return (
            <div key={step.key} className={clsx('flex items-center justify-between', step.status === 'queued' && 'opacity-40')}>
              <div className="flex items-center gap-3">
                <span
                  className={clsx('material-symbols-outlined', cfg.color)}
                  style={cfg.fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {cfg.icon}
                </span>
                <span className={clsx('text-sm font-medium', step.status === 'queued' && 'text-slate-400')}>{step.label}</span>
              </div>
              <span className={clsx('text-xs font-bold', cfg.color)}>
                {cfg.label ?? (step.status === 'processing' ? `${progress}%` : '')}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%`, boxShadow: '0 0 10px #0ea5e9' }}
        />
      </div>
    </div>
  );
}
