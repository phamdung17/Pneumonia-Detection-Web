import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function EnsembleChart({ data }) {
  return (
    <div className="rounded-xl bg-surface-container-low/50 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-headline text-2xl font-extrabold">Confirmed vs Suspected</h3>
          <p className="mt-2 max-w-sm text-sm text-on-surface-variant leading-relaxed">
            Analysis of AI-flagged &apos;Suspected&apos; cases versus manual human &apos;Confirmed&apos; outcomes. A narrow gap indicates high AI reliability.
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {data.map((item) => (
          <div key={item.name}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-semibold">{item.name === 'CONFIRMED' ? 'Clinically Confirmed' : 'AI Suspected (Flags)'}</span>
              <span className="font-bold text-primary">{item.value.toLocaleString()} {item.name === 'CONFIRMED' ? 'Cases' : 'Flags'}</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-primary-gradient" style={{ width: `${Math.min(100, (item.value / Math.max(...data.map(d => d.value))) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
