import React, { useState } from "react";
import axios from "axios";
import { motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, User, UserCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordPattern.test(formData.password)) {
      toast.error("Mật khẩu phải có tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Xác nhận mật khẩu không khớp");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/api/auth/register", {
        full_name: formData.fullName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      toast.success("Đăng ký thành công, vui lòng đăng nhập");
      navigate("/login", { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.detail?.message ||
          error.response?.data?.message ||
          "Đăng ký thất bại";
        toast.error(message);
      } else {
        toast.error("Đăng ký thất bại");
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
            Tạo tài khoản
            <br />
            <span className="text-primary">để bắt đầu sử dụng hệ thống</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-md text-lg font-medium text-slate-400"
          >
            Hệ thống chỉ hỗ trợ sàng lọc, không thay thế chẩn đoán y khoa chính thức.
          </motion.p>
        </div>

        <div className="relative z-10 flex items-center gap-8 border-t border-white/10 pt-8">
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-white">JWT</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Đăng nhập an toàn
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-white">MySQL</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Lưu trữ tập trung
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center overflow-y-auto bg-slate-50/30 p-8 lg:p-24">
        <div className="w-full max-w-md space-y-8 py-12">
          <div className="space-y-2">
            <Link to="/" className="mb-8 flex items-center gap-2 text-slate-900 lg:hidden">
              <ShieldCheck className="text-primary" size={28} />
              <span className="font-headline text-xl font-extrabold tracking-tighter">PneumoLens AI</span>
            </Link>
            <h1 className="font-headline text-4xl font-black tracking-tight text-slate-900">
              Tạo tài khoản mới
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Họ và tên
                </label>
                <div className="group relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
                    <UserCircle size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
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
                    placeholder="nguyenvana"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Email
              </label>
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="nguyenvana@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Mật khẩu
              </label>
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-12 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-primary"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="ml-1 text-xs font-medium text-slate-400">
                Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
              </p>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Xác nhận mật khẩu
              </label>
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
                  <Lock size={18} />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-12 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-white shadow-xl shadow-sky-100 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Đăng ký tài khoản
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">
              Đã có tài khoản?{" "}
              <Link to="/login" className="font-bold text-primary hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
