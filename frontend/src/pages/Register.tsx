import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  User,
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  UserCircle
} from "lucide-react";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    role: "doctor"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigate("/login");
    }, 1500);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Left Side: Branding & Visuals (Same as Login for consistency) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 relative overflow-hidden">
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
            Gia nhập Đội ngũ <br />
            <span className="text-primary">Chuyên gia Y tế Số</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-slate-400 text-lg max-w-md font-medium"
          >
            Đăng ký tài khoản để bắt đầu sử dụng các công cụ phân tích X-quang tiên tiến nhất hiện nay.
          </motion.p>
        </div>

        <div className="relative z-10 flex items-center gap-8 border-t border-white/10 pt-8">
          <div className="flex flex-col">
            <span className="text-white font-black text-2xl tracking-tight">150+</span>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Bệnh viện</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-black text-2xl tracking-tight">5000+</span>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Bác sĩ tin dùng</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-black text-2xl tracking-tight">24/7</span>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Hỗ trợ kỹ thuật</span>
          </div>
        </div>
      </div>

      {/* Right Side: Register Form */}
      <div className="flex items-center justify-center p-8 lg:p-24 bg-slate-50/30 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 py-12">
          <div className="space-y-2">
            <Link to="/" className="lg:hidden flex items-center gap-2 text-slate-900 mb-8">
              <ShieldCheck className="text-primary" size={28} />
              <span className="font-headline font-extrabold text-xl tracking-tighter">PneumoLens AI</span>
            </Link>
            <h1 className="font-headline text-4xl font-black text-slate-900 tracking-tight">Tạo tài khoản mới</h1>
            <p className="text-slate-500 font-medium">Bắt đầu hành trình chẩn đoán thông minh cùng chúng tôi.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <UserCircle size={18} />
                  </div>
                  <input 
                    type="text" 
                    required
                    placeholder="Julian Vance"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tên đăng nhập</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    required
                    placeholder="doctor_vance"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email công tác</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  required
                  placeholder="vance@hospital.com"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Vai trò chuyên môn</label>
              <select 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all appearance-none"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="doctor">Bác sĩ Chẩn đoán</option>
                <option value="technician">Kỹ thuật viên X-quang</option>
                <option value="admin">Quản trị viên Hệ thống</option>
              </select>
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-4 rounded-2xl font-headline font-bold text-sm shadow-xl shadow-sky-100 flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
            <p className="text-sm text-slate-500 font-medium">
              Đã có tài khoản?{" "}
              <Link to="/login" className="text-primary font-bold hover:underline">Đăng nhập</Link>
            </p>
          </div>

          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            Bằng cách đăng ký, bạn đồng ý với <Link to="#" className="underline">Điều khoản dịch vụ</Link> và <Link to="#" className="underline">Chính sách bảo mật</Link> của PneumoLens AI.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
