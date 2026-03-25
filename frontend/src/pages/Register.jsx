import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Navigate, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { validatePassword } from '../utils/validators';

export default function Register() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/predict';
  const { isAuthenticated, register } = useAuthStore();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    password: '',
    confirm_password: '',
    role: 'doctor',
    department: '',
  });

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      toast.success('Dang ky thanh cong');
      navigate(next, { replace: true });
    },
    onError: (err) => {
      setError(err?.response?.data?.message ?? 'Dang ky that bai');
    },
  });

  if (isAuthenticated) {
    return <Navigate to={next} replace />;
  }

  return (
    <div className="flex items-center justify-center py-8 lg:py-16">
      <div className="panel w-full max-w-2xl p-8 md:p-10">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
            <UserPlus className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Tao tai khoan moi</p>
            <h2 className="mt-2 font-headline text-4xl font-extrabold tracking-tight">Dang ky nguoi dung</h2>
            <p className="mt-2 text-sm text-on-surface-variant">Tao tai khoan doctor hoac technician de su dung day du pipeline chan doan, luu lich su va quan ly ho so ca nhan.</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <input className="field" placeholder="Ho va ten" value={form.full_name} onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))} />
          <input className="field" placeholder="Username" value={form.username} onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))} />
          <select className="field" value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}>
            <option value="doctor">Doctor</option>
            <option value="technician">Technician</option>
          </select>
          <input className="field" placeholder="Khoa phong" value={form.department} onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))} />
          <input className="field" type="password" placeholder="Mat khau" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} />
          <input className="field" type="password" placeholder="Nhap lai mat khau" value={form.confirm_password} onChange={(e) => setForm((prev) => ({ ...prev, confirm_password: e.target.value }))} />
        </div>
        {error ? <p className="mt-4 rounded-2xl bg-error-container px-4 py-3 text-sm font-medium text-error">{error}</p> : null}
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button
            className="btn-primary flex-1"
            disabled={mutation.isPending}
            onClick={() => {
              if (!form.full_name || !form.username || !form.password || !form.confirm_password) {
                setError('Vui long nhap day du thong tin');
                return;
              }
              if (!validatePassword(form.password)) {
                setError('Mat khau phai co it nhat 8 ky tu, du hoa, thuong, so va ky tu dac biet');
                return;
              }
              if (form.password !== form.confirm_password) {
                setError('Xac nhan mat khau khong khop');
                return;
              }
              setError('');
              mutation.mutate({
                full_name: form.full_name,
                username: form.username,
                password: form.password,
                role: form.role,
                department: form.department || null,
              });
            }}
          >
            {mutation.isPending ? 'Dang tao tai khoan...' : 'Dang ky'}
          </button>
          <button className="btn-secondary flex-1" onClick={() => navigate('/predict')}>
            Tiep tuc khong dang nhap
          </button>
        </div>
        <p className="mt-4 text-sm text-on-surface-variant">
          Da co tai khoan? <Link className="font-semibold text-primary" to={`/login?next=${encodeURIComponent(next)}`}>Quay lai dang nhap</Link>
        </p>
      </div>
    </div>
  );
}
