import { FormEvent, useState } from "react";
import axios from "axios";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      toast.error("Liên kết đặt lại mật khẩu không hợp lệ.");
      return;
    }
    if (!passwordPattern.test(newPassword)) {
      toast.error("Mật khẩu phải có tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Xác nhận mật khẩu không khớp.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/api/auth/reset-password", {
        token,
        new_password: newPassword,
      });
      toast.success("Đổi mật khẩu thành công");
      navigate("/login", { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.detail?.message || error.response?.data?.message || "Không thể đổi mật khẩu.");
      } else {
        toast.error("Không thể đổi mật khẩu.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <Link to="/" className="mb-8 flex items-center gap-2 text-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <span className="font-headline text-2xl font-extrabold tracking-tighter">PneumoLens AI</span>
        </Link>

        <div className="mb-8 space-y-3">
          <h1 className="font-headline text-4xl font-black tracking-tight text-slate-900">Đặt lại mật khẩu</h1>
          <p className="text-sm font-medium text-slate-500">
            Mật khẩu mới phải có tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="space-y-2">
            <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Mật khẩu mới</span>
            <div className="group relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
                <Lock size={18} />
              </div>
              <input
                type={showNewPassword ? "text" : "password"}
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-12 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <button
                type="button"
                aria-label={showNewPassword ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-primary"
                onClick={() => setShowNewPassword((prev) => !prev)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label className="space-y-2">
            <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Xác nhận mật khẩu</span>
            <div className="group relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
                <Lock size={18} />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-12 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              <button
                type="button"
                aria-label={showConfirmPassword ? "Ẩn xác nhận mật khẩu" : "Hiện xác nhận mật khẩu"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-primary"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={isLoading || !token}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-white shadow-xl shadow-sky-100 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                Đổi mật khẩu
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-primary">
          <ArrowLeft size={16} />
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
