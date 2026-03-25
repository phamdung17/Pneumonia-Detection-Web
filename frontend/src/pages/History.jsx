import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import EmptyState from '../components/common/EmptyState';
import FilterBar from '../components/history/FilterBar';
import HistoryTable from '../components/history/HistoryTable';
import { getHistoryApi } from '../api/history';
import { PAGE_SIZE } from '../utils/constants';
import { useAuthStore } from '../stores/authStore';

const EMPTY_FILTERS = { prediction: '', status: '', date_from: '', date_to: '' };
const GUEST_HISTORY = {
  total: 3,
  page: 1,
  items: [
    {
      id: 9001,
      created_at: '2026-03-24T09:10:00',
      stage1: { prediction: 'PNEUMONIA', ensemble_status: 'CONFIRMED', confidence: 0.948 },
      stage2: { disease_type: 'BACTERIAL' },
    },
    {
      id: 9002,
      created_at: '2026-03-24T11:40:00',
      stage1: { prediction: 'NORMAL', ensemble_status: 'CONFIRMED', confidence: 0.991 },
      stage2: { disease_type: 'NONE' },
    },
    {
      id: 9003,
      created_at: '2026-03-24T14:20:00',
      stage1: { prediction: 'PNEUMONIA', ensemble_status: 'SUSPECTED', confidence: 0.761 },
      stage2: { disease_type: 'VIRAL' },
    },
  ],
};

export default function History() {
  const { isAuthenticated } = useAuthStore();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const { data } = useQuery({
    queryKey: ['history', page, filters],
    enabled: isAuthenticated,
    queryFn: () =>
      getHistoryApi({
        page,
        limit: PAGE_SIZE,
        prediction: filters.prediction || undefined,
        status: filters.status || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
      }),
  });

  const displayData = useMemo(() => (isAuthenticated ? data : GUEST_HISTORY), [data, isAuthenticated]);

  if (displayData && displayData.items.length === 0) {
    return (
      <div className="space-y-6">
        <FilterBar filters={filters} setFilters={setFilters} onReset={() => setFilters(EMPTY_FILTERS)} />
        <EmptyState title="Chua co lich su chan doan" description="He thong se luu lai cac ca da xu ly de ban truy vet ve sau." actionLabel="Tai anh dau tien" actionTo="/predict" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isAuthenticated ? (
        <div className="glass-panel rounded-[2rem] p-5 text-sm text-on-surface-variant">
          Ban dang xem lich su demo. Dang nhap de truy cap danh sach ca benh va chi tiet thuc te cua tai khoan.
        </div>
      ) : null}
      <FilterBar filters={filters} setFilters={setFilters} onReset={() => setFilters(EMPTY_FILTERS)} />
      {displayData ? <HistoryTable data={displayData} page={page} onPageChange={setPage} pageSize={PAGE_SIZE} allowDetails={isAuthenticated} /> : null}
    </div>
  );
}
