import { useQuery } from '@tanstack/react-query';
import { getAuditApi } from '../../api/admin';
import { formatDate } from '../../utils/formatters';

export default function Audit() {
  const { data } = useQuery({ queryKey: ['admin-audit'], queryFn: () => getAuditApi({ page: 1, limit: 20 }) });

  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-surface-container-low">
          <tr>
            <th className="px-6 py-4 text-xs uppercase tracking-[0.24em] text-on-surface-variant">Action</th>
            <th className="px-6 py-4 text-xs uppercase tracking-[0.24em] text-on-surface-variant">User ID</th>
            <th className="px-6 py-4 text-xs uppercase tracking-[0.24em] text-on-surface-variant">Target</th>
            <th className="px-6 py-4 text-xs uppercase tracking-[0.24em] text-on-surface-variant">IP</th>
            <th className="px-6 py-4 text-xs uppercase tracking-[0.24em] text-on-surface-variant">Thoi gian</th>
          </tr>
        </thead>
        <tbody>
          {(data?.items ?? []).map((item) => (
            <tr key={item.id} className="border-t border-surface-container hover:bg-surface-container-low/50">
              <td className="px-6 py-4 font-semibold text-primary">{item.action}</td>
              <td className="px-6 py-4">{item.user_id ?? '--'}</td>
              <td className="px-6 py-4">{item.target_type} #{item.target_id ?? '--'}</td>
              <td className="px-6 py-4">{item.ip_address ?? '--'}</td>
              <td className="px-6 py-4 text-sm">{formatDate(item.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
