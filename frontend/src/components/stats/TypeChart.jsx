import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { TYPE_COLORS } from '../../utils/constants';
import { getTypeLabel } from '../../utils/formatters';

export default function TypeChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
      <h3 className="font-headline text-lg font-bold">Pathogen Type</h3>
      <p className="text-sm text-on-surface-variant">Pneumonia case breakdown</p>
      <div className="mt-6 h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={TYPE_COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [value, getTypeLabel(name)]} />
            <text x="50%" y="46%" textAnchor="middle" className="fill-on-surface font-headline text-2xl font-extrabold">
              {total.toLocaleString()}
            </text>
            <text x="50%" y="56%" textAnchor="middle" className="fill-slate-500 text-[10px] font-bold uppercase tracking-widest">
              Total Pos.
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[item.name] }} />
              <span className="font-medium">{getTypeLabel(item.name)}</span>
            </div>
            <span className="font-medium">{total ? `${Math.round((item.value / total) * 100)}%` : '0%'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
