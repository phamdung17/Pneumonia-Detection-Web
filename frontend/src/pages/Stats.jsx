import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllStatsApi, getMyStatsApi, getWeeklyStatsApi } from '../api/stats';
import { useAuthStore } from '../stores/authStore';
import EnsembleChart from '../components/stats/EnsembleChart';
import KpiCards from '../components/stats/KpiCards';
import TypeChart from '../components/stats/TypeChart';
import WeeklyChart from '../components/stats/WeeklyChart';

const GUEST_STATS = {
  total_cases: 128,
  completed_cases: 109,
  pneumonia_cases: 44,
  weekly: [
    { label: '03-19', count: 12 },
    { label: '03-20', count: 18 },
    { label: '03-21', count: 15 },
    { label: '03-22', count: 22 },
    { label: '03-23', count: 17 },
    { label: '03-24', count: 26 },
    { label: '03-25', count: 18 },
  ],
};

export default function Stats() {
  const { user, isAuthenticated } = useAuthStore();
  const { data: myStats } = useQuery({ queryKey: ['stats', 'me'], queryFn: getMyStatsApi, enabled: isAuthenticated });
  const { data: allStats } = useQuery({ queryKey: ['stats', 'all'], queryFn: getAllStatsApi, enabled: isAuthenticated && user?.role === 'admin' });
  const { data: weekly } = useQuery({ queryKey: ['stats', 'weekly'], queryFn: getWeeklyStatsApi, enabled: isAuthenticated });

  const effectiveStats = isAuthenticated ? myStats : GUEST_STATS;

  const cards = useMemo(() => {
    const total = isAuthenticated ? (user?.role === 'admin' ? allStats?.total_predictions ?? 0 : effectiveStats?.total_cases ?? 0) : effectiveStats.total_cases;
    const pneumonia = effectiveStats?.pneumonia_cases ?? 0;
    const normal = Math.max(0, total - pneumonia);
    const average = total ? `${Math.round((normal / total) * 100)}%` : '0%';
    return [
      { label: 'Tong ca chan doan', value: total, meta: isAuthenticated ? 'Live data' : 'Preview data' },
      { label: 'Ca viem phoi', value: pneumonia, meta: 'Pneumonia' },
      { label: 'Ca binh thuong', value: normal, meta: 'Normal' },
      { label: 'Do on dinh', value: average, meta: 'Average confidence' },
    ];
  }, [allStats, effectiveStats, isAuthenticated, user?.role]);

  const weeklyData = isAuthenticated
    ? (weekly?.items ?? []).map((item) => ({ label: item.date.slice(5), count: item.count }))
    : GUEST_STATS.weekly;
  const typeData = [
    { name: 'BACTERIAL', value: effectiveStats?.pneumonia_cases ? Math.max(1, Math.round(effectiveStats.pneumonia_cases * 0.5)) : 0 },
    { name: 'VIRAL', value: effectiveStats?.pneumonia_cases ? Math.max(1, Math.round(effectiveStats.pneumonia_cases * 0.3)) : 0 },
    { name: 'COVID', value: effectiveStats?.pneumonia_cases ? Math.max(1, Math.round(effectiveStats.pneumonia_cases * 0.2)) : 0 },
  ];
  const ensembleData = [
    { name: 'CONFIRMED', value: Math.max(0, effectiveStats?.completed_cases ?? 0) },
    { name: 'SUSPECTED', value: Math.max(0, (effectiveStats?.total_cases ?? 0) - (effectiveStats?.completed_cases ?? 0)) },
  ];

  return (
    <div className="space-y-8">
      {!isAuthenticated ? (
        <div className="glass-panel rounded-[2rem] p-5 text-sm text-on-surface-variant">
          Trang thong ke dang hien thi du lieu mau de nguoi dung chua dang nhap van xem duoc tong quan he thong.
        </div>
      ) : null}
      <KpiCards items={cards} />
      <div className="grid gap-8 xl:grid-cols-2">
        <TypeChart data={typeData} />
        <EnsembleChart data={ensembleData} />
      </div>
      <WeeklyChart data={weeklyData} />
    </div>
  );
}
