import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function WeeklyChart({ data }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-headline text-lg font-bold">Weekly Trend</h3>
          <p className="text-sm text-on-surface-variant">Comparative analysis of daily scan volume</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Total Scans</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-tertiary" /> Positive</span>
        </div>
      </div>
      <div className="mt-6 h-72">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dce9ff" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#0ea5e9" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
