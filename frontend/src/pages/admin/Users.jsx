import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createUserApi, getUsersApi, updateUserApi } from '../../api/admin';
import UserForm from '../../components/admin/UserForm';
import UserTable from '../../components/admin/UserTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function Users() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ search: '', role: '', is_active: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmUser, setConfirmUser] = useState(null);
  const [openForm, setOpenForm] = useState(false);

  const { data } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => getUsersApi({
      search: filters.search || undefined,
      role: filters.role || undefined,
      is_active: filters.is_active === '' ? undefined : filters.is_active,
    }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-users'] });

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      const request = selectedUser
        ? updateUserApi(selectedUser.id, { full_name: payload.full_name, role: payload.role, department: payload.department, is_active: payload.is_active })
        : createUserApi(payload);
      return request;
    },
    onSuccess: () => {
      toast.success(selectedUser ? 'User updated' : 'User created');
      setOpenForm(false);
      setSelectedUser(null);
      refresh();
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? 'Could not save user'),
  });

  const toggleMutation = useMutation({
    mutationFn: (user) => updateUserApi(user.id, { is_active: !user.is_active }),
    onSuccess: (_, user) => {
      toast.success(user.is_active ? 'Account locked' : 'Account unlocked');
      setConfirmUser(null);
      refresh();
    },
  });

  return (
    <div className="space-y-8">
      {/* Add User Button */}
      <div className="flex justify-end">
        <button
          className="flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition-all primary-gradient hover:shadow-primary/20"
          onClick={() => { setSelectedUser(null); setOpenForm(true); }}
        >
          <span className="material-symbols-outlined">person_add</span>
          Add New User
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
        <div className="relative min-w-[300px] flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            className="w-full rounded-xl border-none bg-surface-container pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
            placeholder="Search by name, email or department..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-3">
          <select className="min-w-[140px] rounded-xl border-none bg-surface-container px-4 py-3 text-sm focus:ring-2 focus:ring-primary" value={filters.role} onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}>
            <option value="">All Roles</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
            <option value="technician">Technician</option>
          </select>
          <select className="min-w-[140px] rounded-xl border-none bg-surface-container px-4 py-3 text-sm focus:ring-2 focus:ring-primary" value={filters.is_active} onChange={(e) => setFilters((prev) => ({ ...prev, is_active: e.target.value }))}>
            <option value="">Any Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button className="rounded-xl bg-surface-container-high p-3 text-on-surface transition-colors hover:bg-surface-variant">
            <span className="material-symbols-outlined">tune</span>
          </button>
        </div>
      </div>

      <UserTable users={data?.items ?? []} onEdit={(user) => { setSelectedUser(user); setOpenForm(true); }} onToggle={(user) => setConfirmUser(user)} />
      <UserForm open={openForm} initialValue={selectedUser} onClose={() => { setOpenForm(false); setSelectedUser(null); }} onSubmit={(form) => saveMutation.mutate(form)} />
      <ConfirmDialog
        open={Boolean(confirmUser)}
        title={confirmUser?.is_active ? 'Lock account?' : 'Unlock account?'}
        description={confirmUser ? `You are changing the status of ${confirmUser.username}.` : ''}
        confirmText={confirmUser?.is_active ? 'Lock' : 'Unlock'}
        onCancel={() => setConfirmUser(null)}
        onConfirm={() => toggleMutation.mutate(confirmUser)}
      />
    </div>
  );
}
