import { Link } from 'react-router-dom';

export default function EmptyState({ title, description, actionLabel, actionTo }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-xl bg-surface-container-lowest px-6 py-12 text-center shadow-sm">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-low">
        <span className="material-symbols-outlined text-4xl text-slate-400">medical_information</span>
      </div>
      <div className="space-y-2">
        <h3 className="font-headline text-xl font-bold">{title}</h3>
        <p className="max-w-md text-sm text-on-surface-variant">{description}</p>
      </div>
      {actionLabel && actionTo ? (
        <Link className="btn-primary" to={actionTo}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
