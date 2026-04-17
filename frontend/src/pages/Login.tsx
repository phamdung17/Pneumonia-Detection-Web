 import React, { useState } from "react";
import axios from "axios";
import { motion } from "motion/react";
import { ArrowRight, Lock, ShieldCheck, User } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await login(formData);
      const nextPath = searchParams.get("next");
      const defaultPath = user.role === "admin" ? "/admin/users" : "/predict";

      toast.success("Đăng nhập thành công");
      navigate(nextPath || defaultPath, { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.detail?.message ||
          error.response?.data?.message ||
          "Đăng nhập thất bại";
        toast.error(message);
      } else {
        toast.error("Đăng nhập thất bại");
      }
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
            Đăng nhập để tiếp tục
            <br />
            <span className="text-primary">phân tích X-quang thông minh</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-md text-lg font-medium text-slate-400"
          >
            Hệ thống hỗ trợ phát hiện viêm phổi, quản lý lịch sử và thống kê trong
            cùng một luồng làm việc.
          </motion.p>
        </div>

        <div className="relative z-10 flex items-center gap-8 border-t border-white/10 pt-8">
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-white">1.2s</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Xử lý trung bình
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-white">24/7</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Sẵn sàng
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-slate-50/30 p-8 lg:p-24">
        <div className="w-full max-w-md space-y-10">
          <div className="space-y-2">
            <Link to="/" className="mb-8 flex items-center gap-2 text-slate-900 lg:hidden">
              <ShieldCheck className="text-primary" size={28} />
              <span className="font-headline text-xl font-extrabold tracking-tighter">PneumoLens AI</span>
            </Link>
            <h1 className="font-headline text-4xl font-black tracking-tight text-slate-900">
              Chào mừng trở lại
            </h1>
            <p className="font-medium text-slate-500">
              Đăng nhập bằng tài khoản đã được cấp quyền trong hệ thống.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Tên đăng nhập
              </label>
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="admin01"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Mật khẩu
              </label>
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-white shadow-xl shadow-sky-100 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Đăng nhập
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </motion.div>
          </form>

          <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-600">
           Hệ thống chỉ hỗ trợ sàng lọc, không thay thế chẩn đoán y khoa chính thức.
          </div>

          <div className="pt-2 text-center">
            <p className="text-sm font-medium text-slate-500">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="font-bold text-primary hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
