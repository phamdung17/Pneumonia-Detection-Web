import { formatPercent, getTypeLabel } from '../../utils/formatters';

const barColors = {
  BACTERIAL: 'bg-tertiary',
  VIRAL: 'bg-outline',
  COVID: 'bg-outline',
};

export default function TypeClassifier({ result }) {
  const items = [
    { key: 'BACTERIAL', value: result?.stage2?.bacterial_prob ?? 0 },
    { key: 'VIRAL', value: result?.stage2?.viral_prob ?? 0 },
    { key: 'COVID', value: result?.stage2?.covid_prob ?? 0 },
  ];

  if (!result || result.stage1?.prediction !== 'PNEUMONIA' || result.stage1?.ensemble_status !== 'CONFIRMED') {
    return null;
  }

  const maxKey = items.reduce((a, b) => (a.value > b.value ? a : b)).key;

  return (
    <div className="rounded-xl bg-surface-container-low p-6">
      <h4 className="font-headline text-sm font-bold mb-6">Pneumonia Sub-type</h4>
      <div className="space-y-5">
        {items.map((item) => {
          const isTop = item.key === maxKey;
          return (
            <div key={item.key} className={isTop ? 'space-y-2' : 'space-y-2 opacity-60'}>
              <div className="flex justify-between text-xs font-bold">
                <span>{getTypeLabel(item.key)}</span>
                <span className={isTop ? 'text-tertiary' : ''}>{formatPercent(item.value * 100, 0)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-container-highest">
                <div
                  className={`h-full rounded-full ${barColors[item.key] || 'bg-outline'}`}
                  style={{ width: `${item.value * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
