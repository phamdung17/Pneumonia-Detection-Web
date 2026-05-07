import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
  const [visiblePasswords, setVisiblePasswords] = useState({
    profileCurrent: false,
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const togglePasswordVisibility = (field: keyof typeof visiblePasswords) => {
    setVisiblePasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

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
      toast.error("Số điện thoại không hợp lệ.");
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
      toast.success("Cập nhật hồ sơ thành công.");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail?.message || "Không cập nhật được hồ sơ.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("Xác nhận mật khẩu mới không khớp.");
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
      toast.success("Đổi mật khẩu thành công.");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail?.message || "Không đổi được mật khẩu.");
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
            <h1 className="font-headline text-3xl font-black text-slate-900">Hồ sơ tài khoản</h1>
            <p className="text-sm font-medium text-slate-500">
              Quản lý thông tin cá nhân và cài đặt bảo mật cho tài khoản của bạn.
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1">@{user.username}</span>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-primary">
                {ROLES[user.role as keyof typeof ROLES]}
              </span>
              <span className={`rounded-full px-3 py-1 ${user.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {user.is_active ? "Đang hoạt động" : "Tạm khóa"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.4fr_1fr]">
        <form onSubmit={handleProfileSubmit} className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="font-headline text-2xl font-black text-slate-900">Thông tin cá nhân</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Để thay đổi email, hệ thống yêu cầu nhập lại mật khẩu hiện tại.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Họ và tên</span>
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
              <span className="text-sm font-semibold text-slate-700">Số điện thoại</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-300"
                value={profileForm.phone}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="0xxxxxxxxx hoặc +84xxxxxxxxx"
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
              <span className="text-sm font-semibold text-slate-700">Mật khẩu hiện tại</span>
              <div className="relative">
                <input
                  type={visiblePasswords.profileCurrent ? "text" : "password"}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 outline-none transition focus:border-sky-300"
                  value={profileForm.current_password}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, current_password: event.target.value }))}
                  required
                />
                <button
                  type="button"
                  aria-label={visiblePasswords.profileCurrent ? "Ẩn mật khẩu hiện tại" : "Hiện mật khẩu hiện tại"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-primary"
                  onClick={() => togglePasswordVisibility("profileCurrent")}
                >
                  {visiblePasswords.profileCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white transition disabled:opacity-60"
            >
              {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>

        <form onSubmit={handlePasswordSubmit} className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="font-headline text-2xl font-black text-slate-900">Đổi mật khẩu</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Mật khẩu mới phải có tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
            </p>
          </div>

          <div className="space-y-5">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Mật khẩu hiện tại</span>
              <div className="relative">
                <input
                  type={visiblePasswords.oldPassword ? "text" : "password"}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 outline-none transition focus:border-sky-300"
                  value={passwordForm.old_password}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, old_password: event.target.value }))}
                  required
                />
                <button
                  type="button"
                  aria-label={visiblePasswords.oldPassword ? "Ẩn mật khẩu hiện tại" : "Hiện mật khẩu hiện tại"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-primary"
                  onClick={() => togglePasswordVisibility("oldPassword")}
                >
                  {visiblePasswords.oldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Mật khẩu mới</span>
              <div className="relative">
                <input
                  type={visiblePasswords.newPassword ? "text" : "password"}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 outline-none transition focus:border-sky-300"
                  value={passwordForm.new_password}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, new_password: event.target.value }))}
                  required
                />
                <button
                  type="button"
                  aria-label={visiblePasswords.newPassword ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-primary"
                  onClick={() => togglePasswordVisibility("newPassword")}
                >
                  {visiblePasswords.newPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Xác nhận mật khẩu mới</span>
              <div className="relative">
                <input
                  type={visiblePasswords.confirmPassword ? "text" : "password"}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 outline-none transition focus:border-sky-300"
                  value={passwordForm.confirm_password}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirm_password: event.target.value }))}
                  required
                />
                <button
                  type="button"
                  aria-label={visiblePasswords.confirmPassword ? "Ẩn xác nhận mật khẩu mới" : "Hiện xác nhận mật khẩu mới"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-primary"
                  onClick={() => togglePasswordVisibility("confirmPassword")}
                >
                  {visiblePasswords.confirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={changingPassword}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition disabled:opacity-60"
            >
              {changingPassword ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
