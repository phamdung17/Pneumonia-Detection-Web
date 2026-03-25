import { getInitials, formatDate, getRoleLabel } from '../../utils/formatters';

export default function UserTable({ users = [], onEdit, onToggle }) {
  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-lowest">
      <table className="w-full border-collapse text-left">
        <thead className="border-b border-outline-variant/10 bg-surface-container-low">
          <tr>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">User</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Role & Dept</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date Created</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
            <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {users.map((user) => (
            <tr key={user.id} className="group transition-colors hover:bg-surface-container-high">
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${user.is_active ? 'bg-primary-fixed-dim text-primary' : 'bg-slate-200 text-slate-500'}`}>
                    {getInitials(user.full_name || user.username)}
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface">{user.full_name || user.username}</p>
                    <p className="text-xs text-slate-500">{user.username}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <p className="text-sm font-medium">{getRoleLabel(user.role)}</p>
                <p className="text-xs text-slate-500">{user.department || '--'}</p>
              </td>
              <td className="px-6 py-5 text-sm">{formatDate(user.created_at)}</td>
              <td className="px-6 py-5">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  user.is_active
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-tertiary-container text-on-tertiary-container'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-secondary' : 'bg-tertiary'}`} />
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-5 text-right">
                <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button className="p-2 text-slate-400 transition-colors hover:text-primary" title="Edit User" onClick={() => onEdit?.(user)}>
                    <span className="material-symbols-outlined text-xl">edit_square</span>
                  </button>
                  <button
                    className={`p-2 transition-colors ${user.is_active ? 'text-slate-400 hover:text-primary' : 'text-tertiary'}`}
                    title={user.is_active ? 'Lock Account' : 'Unlock Account'}
                    onClick={() => onToggle?.(user)}
                  >
                    <span className="material-symbols-outlined text-xl" style={!user.is_active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      {user.is_active ? 'lock_open' : 'lock'}
                    </span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
