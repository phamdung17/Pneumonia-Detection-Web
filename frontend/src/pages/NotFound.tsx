import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative inline-block"
        >
          <div className="text-[180px] font-black text-slate-200 leading-none tracking-tighter">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center text-primary transform rotate-12">
              <Search size={48} />
            </div>
          </div>
        </motion.div>

        <div className="space-y-3">
          <h1 className="font-headline text-3xl font-black text-slate-900 tracking-tight">Trang không tồn tại</h1>
          <p className="text-slate-500 font-medium">
            Có vẻ như đường dẫn bạn đang truy cập đã bị xóa hoặc không còn tồn tại trong hệ thống.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-sky-100 hover:bg-primary/90 transition-all active:scale-95"
          >
            <Home size={18} />
            Về trang chủ
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-8 py-3 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
