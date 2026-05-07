import { FormEvent, useState } from "react";
import axios from "axios";
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

interface ForgotPasswordResponse {
  message: string;
  reset_token: string;
  reset_url: string;
  expires_in_minutes: number;
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post<ForgotPasswordResponse>("/api/auth/forgot-password", {
        email: email.trim(),
      });
      toast.success(response.data.message);
      navigate(response.data.reset_url, { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.detail?.message || error.response?.data?.message || "Không thể xác thực email.");
      } else {
        toast.error("Không thể xác thực email.");
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
          <h1 className="font-headline text-4xl font-black tracking-tight text-slate-900">Quên mật khẩu</h1>
          <p className="text-sm font-medium text-slate-500">
            Nhập email đã đăng ký. Nếu email đúng, hệ thống sẽ cho phép bạn đặt lại mật khẩu trong 15 phút.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="space-y-2">
            <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</span>
            <div className="group relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                placeholder="email@example.com"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-white shadow-xl shadow-sky-100 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                Tiếp tục
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
