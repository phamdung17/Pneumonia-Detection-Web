import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Stethoscope
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import toast from "react-hot-toast";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(formData);
      toast.success("Đăng nhập thành công");
      setIsLoading(false);
      navigate("/predict");
    } catch {
      setIsLoading(false);
      toast.error("Đăng nhập thất bại");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Left Side: Branding & Visuals */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 text-white">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="text-white" size={24} />
            </div>
            <span className="font-headline font-extrabold text-2xl tracking-tighter">PneumoLens AI</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-headline text-5xl font-black text-white leading-tight tracking-tighter"
          >
            Nâng tầm Chẩn đoán <br />
            <span className="text-primary">Y tế với Trí tuệ Nhân tạo</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-slate-400 text-lg max-w-md font-medium"
          >
            Hệ thống hỗ trợ bác sĩ phát hiện viêm phổi qua ảnh X-quang với độ chính xác vượt trội và tốc độ xử lý tức thì.
          </motion.p>
        </div>

        <div className="relative z-10 flex items-center gap-8 border-t border-white/10 pt-8">
          <div className="flex flex-col">
            <span className="text-white font-black text-2xl tracking-tight">98.4%</span>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Độ chính xác</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-black text-2xl tracking-tight">1.2s</span>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Thời gian xử lý</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-black text-2xl tracking-tight">FDA</span>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Chứng nhận</span>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex items-center justify-center p-8 lg:p-24 bg-slate-50/30">
        <div className="w-full max-w-md space-y-10">
          <div className="space-y-2">
            <Link to="/" className="lg:hidden flex items-center gap-2 text-slate-900 mb-8">
              <ShieldCheck className="text-primary" size={28} />
              <span className="font-headline font-extrabold text-xl tracking-tighter">PneumoLens AI</span>
            </Link>
            <h1 className="font-headline text-4xl font-black text-slate-900 tracking-tight">Chào mừng trở lại</h1>
            <p className="text-slate-500 font-medium">Vui lòng đăng nhập để tiếp tục công việc chẩn đoán.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tên đăng nhập</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <Mail size={18} />
                </div>
                <input 
                  type="text" 
                  required
                  placeholder="doctor_vance"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mật khẩu</label>
                <Link to="#" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">Quên mật khẩu?</Link>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
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
                className="w-full bg-primary text-white py-4 rounded-2xl font-headline font-bold text-sm shadow-xl shadow-sky-100 flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Đăng nhập hệ thống
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </motion.div>
          </form>

          <div className="pt-6 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="text-primary font-bold hover:underline">Đăng ký ngay</Link>
            </p>
          </div>

          <div className="pt-10 flex items-center justify-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" alt="IBM" className="h-4" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" className="h-4" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" className="h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
