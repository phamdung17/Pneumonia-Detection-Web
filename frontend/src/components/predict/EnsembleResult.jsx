import { formatConfidence, getPredictionLabel } from '../../utils/formatters';

export default function EnsembleResult({ result }) {
  if (!result) return null;
  const prediction = result.stage1?.prediction;
  const isPneumonia = prediction === 'PNEUMONIA';

  return (
    <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-8 shadow-sm">
      {/* Badge top-right */}
      <div className="absolute right-6 top-6">
        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-inner ${
          isPneumonia
            ? 'bg-tertiary-container text-on-tertiary-container'
            : 'bg-secondary-container text-on-secondary-container'
        }`}>
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
            {isPneumonia ? 'warning' : 'check_circle'}
          </span>
          {isPneumonia ? 'PNEUMONIA DETECTED' : 'NORMAL'}
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="font-headline text-5xl font-extrabold tracking-tight text-on-surface mb-2">
            {formatConfidence(result.stage1?.confidence)}
          </h2>
          <p className="text-on-surface-variant font-medium">Ensemble Confidence Score</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-surface-container-low p-4">
            <p className="text-xs font-bold uppercase tracking-tighter text-slate-500 mb-1">DenseNet-121</p>
            <p className="text-lg font-bold text-primary">{formatConfidence(result.stage1?.prob_dn)}</p>
          </div>
          <div className="rounded-lg bg-surface-container-low p-4">
            <p className="text-xs font-bold uppercase tracking-tighter text-slate-500 mb-1">EfficientNet-B4</p>
            <p className="text-lg font-bold text-primary">{formatConfidence(result.stage1?.prob_eff)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
