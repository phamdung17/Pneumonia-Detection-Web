import { Link } from 'react-router-dom';
import Pagination from '../common/Pagination';
import { formatConfidence, formatDate, getTypeLabel } from '../../utils/formatters';

export default function HistoryTable({ data, page, onPageChange, pageSize, allowDetails = true }) {
  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-lowest border border-outline-variant/15">
      <table className="w-full border-collapse text-left">
        <thead className="bg-surface-container-low border-b border-outline-variant/10">
          <tr>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Case ID</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date Analyzed</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">AI Prediction</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Confidence</th>
            <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.items.map((item) => {
            const isPneumonia = item.stage1?.prediction === 'PNEUMONIA';
            const isConfirmed = item.stage1?.ensemble_status === 'CONFIRMED';
            const conf = item.stage1?.confidence ? Math.round(item.stage1.confidence * 100) : 0;
            return (
              <tr key={item.id} className="transition-colors hover:bg-surface-container-high">
                <td className="px-6 py-5">
                  <span className="font-semibold text-primary">#{item.id}</span>
                </td>
                <td className="px-6 py-5 text-sm">{formatDate(item.created_at)}</td>
                <td className="px-6 py-5">
                  <span className={`flex items-center gap-1.5 text-sm font-semibold ${isPneumonia ? 'text-tertiary' : 'text-secondary'}`}>
                    <span className="material-symbols-outlined text-[16px]">{isPneumonia ? 'error' : 'check_circle'}</span>
                    {isPneumonia ? 'Pneumonia' : 'Normal'}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm">{getTypeLabel(item.stage2?.disease_type)}</td>
                <td className="px-6 py-5">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    isConfirmed
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-primary-fixed text-primary'
                  }`}>
                    {item.stage1?.ensemble_status ?? '--'}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${isPneumonia ? 'bg-tertiary' : 'bg-secondary'}`}
                        style={{ width: `${conf}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold">{formatConfidence(item.stage1?.confidence)}</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  {allowDetails ? (
                    <Link to={`/history/${item.id}`} className="flex items-center justify-end gap-1 text-sm font-semibold text-primary">
                      View Details
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </Link>
                  ) : (
                    <span className="text-sm text-on-surface-variant">Preview</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Pagination page={page} total={data.total} pageSize={pageSize} onPageChange={onPageChange} />
    </div>
  );
}
