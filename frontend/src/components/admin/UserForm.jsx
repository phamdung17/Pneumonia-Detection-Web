import { useEffect, useState } from 'react';

const EMPTY_FORM = { username: '', password: '', full_name: '', role: 'doctor', department: '', is_active: true };

export default function UserForm({ open, initialValue, onSubmit, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    setForm(initialValue ? { ...EMPTY_FORM, ...initialValue, password: '' } : EMPTY_FORM);
  }, [initialValue]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm">
      <div className="panel w-full max-w-2xl p-6">
        <h3 className="font-headline text-2xl font-bold">{initialValue ? 'Cap nhat user' : 'Tao user moi'}</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input className="field" placeholder="Username" value={form.username} disabled={Boolean(initialValue)} onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))} />
          <input className="field" placeholder="Ho va ten" value={form.full_name} onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))} />
          <input className="field" placeholder="Mat khau" type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} />
          <input className="field" placeholder="Khoa phong" value={form.department} onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))} />
          <select className="field" value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
            <option value="technician">Technician</option>
          </select>
          <select className="field" value={String(form.is_active)} onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value === 'true' }))}>
            <option value="true">Dang hoat dong</option>
            <option value="false">Tam khoa</option>
          </select>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-secondary" onClick={onClose}>Huy</button>
          <button className="btn-primary" onClick={() => onSubmit?.(form)}>{initialValue ? 'Luu thay doi' : 'Tao tai khoan'}</button>
        </div>
      </div>
    </div>
  );
}
