import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getMyStatsApi } from '../api/stats';
import { useAuthStore } from '../stores/authStore';
import { validatePassword } from '../utils/validators';

export default function Profile() {
  const { user, changePassword } = useAuthStore();
  const { data } = useQuery({ queryKey: ['my-stats'], queryFn: getMyStatsApi, enabled: ['doctor', 'admin'].includes(user?.role) });
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '' });

  const stats = useMemo(
    () => [
      { label: 'Tong ca', value: data?.total_cases ?? 0 },
      { label: 'Da hoan tat', value: data?.completed_cases ?? 0 },
      { label: 'Viem phoi', value: data?.pneumonia_cases ?? 0 },
    ],
    [data],
  );

  return (
    <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="panel p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-primary">Ho so</p>
        <h2 className="mt-4 font-headline text-3xl font-extrabold">{user?.full_name}</h2>
        <div className="mt-6 space-y-3 text-sm">
          <p><span className="font-semibold">Username:</span> {user?.username}</p>
          <p><span className="font-semibold">Role:</span> {user?.role}</p>
          <p><span className="font-semibold">Khoa phong:</span> {user?.department || '--'}</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {stats.map((item) => (
            <div key={item.label} className="rounded-2xl bg-surface-container-low p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">{item.label}</p>
              <p className="mt-3 font-headline text-3xl font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="panel p-8">
        <h3 className="font-headline text-2xl font-bold">Doi mat khau</h3>
        <div className="mt-6 space-y-4">
          <input className="field" type="password" placeholder="Mat khau cu" value={form.old_password} onChange={(e) => setForm((prev) => ({ ...prev, old_password: e.target.value }))} />
          <input className="field" type="password" placeholder="Mat khau moi" value={form.new_password} onChange={(e) => setForm((prev) => ({ ...prev, new_password: e.target.value }))} />
          <input className="field" type="password" placeholder="Nhap lai mat khau moi" value={form.confirm_password} onChange={(e) => setForm((prev) => ({ ...prev, confirm_password: e.target.value }))} />
          <button
            className="btn-primary"
            onClick={async () => {
              if (!validatePassword(form.new_password)) {
                toast.error('Mat khau moi phai co it nhat 8 ky tu, du hoa, thuong, so va ky tu dac biet');
                return;
              }
              if (form.new_password !== form.confirm_password) {
                toast.error('Xac nhan mat khau khong khop');
                return;
              }
              await changePassword({ old_password: form.old_password, new_password: form.new_password });
              setForm({ old_password: '', new_password: '', confirm_password: '' });
            }}
          >
            Cap nhat mat khau
          </button>
        </div>
      </div>
    </div>
  );
}
