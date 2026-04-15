import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { User, Mail, Lock, ArrowRight, ShieldCheck, UserCircle, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../stores/authStore";
import { validateEmail, validatePassword } from "../utils/validators";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/login";
  const register = useAuthStore((state) => state.register);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    department: "",
    password: "",
    confirmPassword: "",
    role: "doctor" as "doctor" | "technician",
  });

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/predict", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(formData.email)) {
      setError("Email khong hop le");
      return;
    }

    if (!validatePassword(formData.password)) {
      setError("Mat khau phai co it nhat 8 ky tu, du hoa, thuong, so va ky tu dac biet");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Xac nhan mat khau khong khop");
      return;
    }

    setIsLoading(true);
    try {
      const response = await register({
        full_name: formData.full_name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department || null,
      });
      toast.success(response.message);
      navigate(next, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Dang ky that bai");
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
            Tao tai khoan
            <br />
            <span className="text-primary">cho doi ngu y te</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-md text-lg font-medium text-slate-400"
          >
            Tai khoan moi co the chon vai tro doctor hoac technician va se vao hang cho admin phe duyet.
          </motion.p>
        </div>

        <div className="relative z-10 border-t border-white/10 pt-8 text-sm text-slate-500">
          Admin dau tien se duoc seed tu dong khi backend khoi dong neu he thong chua co tai khoan quan tri.
        </div>
      </div>

      <div className="flex items-center justify-center overflow-y-auto bg-slate-50/30 p-8 lg:p-24">
        <div className="w-full max-w-md space-y-8 py-12">
          <div className="space-y-2">
            <Link to="/" className="mb-8 flex items-center gap-2 text-slate-900 lg:hidden">
              <ShieldCheck className="text-primary" size={28} />
              <span className="font-headline text-xl font-extrabold tracking-tighter">PneumoLens AI</span>
            </Link>
            <h1 className="font-headline text-4xl font-black tracking-tight text-slate-900">Tao tai khoan moi</h1>
            <p className="font-medium text-slate-500">Dang ky de gui yeu cau tao tai khoan va cho admin phe duyet.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ho va ten</label>
                <div className="group relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
                    <UserCircle size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Username</label>
                <div className="group relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Email cong tac</label>
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Khoa / phong</label>
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
                  <Building2 size={18} />
                </div>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Nhap lai mat khau</label>
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Vai tro</label>
              <select
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as "doctor" | "technician" })}
              >
                <option value="doctor">Bac si chan doan</option>
                <option value="technician">Ky thuat vien X-quang</option>
              </select>
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
                  Gui yeu cau dang ky
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">
              Da co tai khoan?{" "}
              <Link to="/login" className="font-bold text-primary hover:underline">
                Dang nhap
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
