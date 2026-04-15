import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../stores/authStore";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/predict";
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(next, { replace: true });
    }
  }, [isAuthenticated, navigate, next]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await login(formData);
      toast.success("Dang nhap thanh cong");
      navigate(next, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Dang nhap that bai");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-12 lg:flex">
        <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <ShieldCheck className="text-white" size={24} />
            </div>
            <span className="font-headline text-2xl font-extrabold tracking-tighter">PneumoLens AI</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-headline text-5xl font-black leading-tight tracking-tighter text-white"
          >
            Dang nhap vao he thong
            <br />
            <span className="text-primary">chan doan X-quang</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-md text-lg font-medium text-slate-400"
          >
            Su dung tai khoan da duoc phe duyet de truy cap luong phan tich, lich su va thong ke du lieu that.
          </motion.p>
        </div>

        <div className="relative z-10 border-t border-white/10 pt-8 text-sm text-slate-500">
          Tai khoan moi dang ky se o trang thai cho admin phe duyet truoc khi co the dang nhap.
        </div>
      </div>

      <div className="flex items-center justify-center bg-slate-50/30 p-8 lg:p-24">
        <div className="w-full max-w-md space-y-10">
          <div className="space-y-2">
            <Link to="/" className="mb-8 flex items-center gap-2 text-slate-900 lg:hidden">
              <ShieldCheck className="text-primary" size={28} />
              <span className="font-headline text-xl font-extrabold tracking-tighter">PneumoLens AI</span>
            </Link>
            <h1 className="font-headline text-4xl font-black tracking-tight text-slate-900">Chao mung tro lai</h1>
            <p className="font-medium text-slate-500">Dang nhap bang username hoac email de tiep tuc cong viec chan doan.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Username hoac email</label>
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
                  <Mail size={18} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="doctor_vance hoac vance@hospital.com"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Mat khau</label>
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-white shadow-xl shadow-sky-100 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Dang nhap he thong
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="pt-6 text-center">
            <p className="text-sm font-medium text-slate-500">
              Chua co tai khoan?{" "}
              <Link to={`/register?next=${encodeURIComponent(next)}`} className="font-bold text-primary hover:underline">
                Dang ky ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
