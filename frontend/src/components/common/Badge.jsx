import clsx from 'clsx';

export default function Badge({ children, tone = 'default' }) {
  const tones = {
    success: 'bg-secondary-container text-on-secondary-container',
    danger: 'bg-tertiary-container text-on-tertiary-container',
    warning: 'bg-primary-fixed text-primary',
    info: 'bg-primary-fixed text-primary',
    default: 'bg-surface-container-high text-on-surface-variant',
  };

  const dots = {
    success: 'bg-secondary',
    danger: 'bg-tertiary',
    warning: 'bg-amber-500',
    info: 'bg-primary',
  };

  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold', tones[tone])}>
      {dots[tone] ? <span className={clsx('h-1.5 w-1.5 rounded-full', dots[tone])} /> : null}
      {children}
    </span>
  );
}
