import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuthStore } from "../stores/authStore";
import { DEFAULT_AVATAR, ROLES } from "../utils/constants";

interface ProfileFormState {
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  current_password: string;
}

interface PasswordFormState {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

const phonePattern = /^(0|\+84)\d{9,10}$/;

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    full_name: "",
    email: "",
    phone: "",
    avatar_url: "",
    current_password: "",
  });
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }
    setProfileForm({
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      avatar_url: user.avatar_url || "",
      current_password: "",
    });
  }, [user]);

  if (!user) {
    return null;
  }

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (profileForm.phone && !phonePattern.test(profileForm.phone.trim())) {
      toast.error("So dien thoai khong hop le.");
      return;
    }

    setSavingProfile(true);
    try {
      const response = await api.put("/api/auth/me", {
        full_name: profileForm.full_name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim() || null,
        avatar_url: profileForm.avatar_url.trim() || null,
        current_password: profileForm.current_password,
      });
      setUser(response.data);
      setProfileForm((prev) => ({ ...prev, current_password: "" }));
      toast.success("Cap nhat ho so thanh cong.");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail?.message || "Khong cap nhat duoc ho so.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("Xac nhan mat khau moi khong khop.");
      return;
    }

    setChangingPassword(true);
    try {
      await api.put("/api/auth/me/password", {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
      toast.success("Doi mat khau thanh cong.");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail?.message || "Khong doi duoc mat khau.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <img
            src={profileForm.avatar_url || DEFAULT_AVATAR}
            alt={user.full_name}
            className="h-24 w-24 rounded-3xl object-cover ring-4 ring-sky-50"
            referrerPolicy="no-referrer"
          />
          <div className="space-y-2">
            <h1 className="font-headline text-3xl font-black text-slate-900">Ho so tai khoan</h1>
            <p className="text-sm font-medium text-slate-500">
              Quan ly thong tin ca nhan va cai dat bao mat cho tai khoan cua ban.
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1">@{user.username}</span>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-primary">
                {ROLES[user.role as keyof typeof ROLES]}
              </span>
              <span className={`rounded-full px-3 py-1 ${user.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {user.is_active ? "Dang hoat dong" : "Tam khoa"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.4fr_1fr]">
        <form onSubmit={handleProfileSubmit} className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="font-headline text-2xl font-black text-slate-900">Thong tin ca nhan</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              De thay doi email, he thong yeu cau nhap lai mat khau hien tai.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Ho va ten</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-300"
                value={profileForm.full_name}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, full_name: event.target.value }))}
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input
                type="email"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-300"
                value={profileForm.email}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">So dien thoai</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-300"
                value={profileForm.phone}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="0xxxxxxxxx hoac +84xxxxxxxxx"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Avatar URL</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-300"
                value={profileForm.avatar_url}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, avatar_url: event.target.value }))}
                placeholder="https://..."
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Mat khau hien tai</span>
              <input
                type="password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-300"
                value={profileForm.current_password}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, current_password: event.target.value }))}
                required
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white transition disabled:opacity-60"
            >
              {savingProfile ? "Dang luu..." : "Luu thay doi"}
            </button>
          </div>
        </form>

        <form onSubmit={handlePasswordSubmit} className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="font-headline text-2xl font-black text-slate-900">Doi mat khau</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Mat khau moi phai co toi thieu 8 ky tu, gom chu hoa, chu thuong, so va ky tu dac biet.
            </p>
          </div>

          <div className="space-y-5">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Mat khau hien tai</span>
              <input
                type="password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-300"
                value={passwordForm.old_password}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, old_password: event.target.value }))}
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Mat khau moi</span>
              <input
                type="password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-300"
                value={passwordForm.new_password}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, new_password: event.target.value }))}
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Xac nhan mat khau moi</span>
              <input
                type="password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-300"
                value={passwordForm.confirm_password}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirm_password: event.target.value }))}
                required
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={changingPassword}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition disabled:opacity-60"
            >
              {changingPassword ? "Dang cap nhat..." : "Cap nhat mat khau"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
