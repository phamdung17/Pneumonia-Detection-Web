import { Search, Bell, Settings } from "lucide-react";

export default function TopBar() {
  return (
    <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 shadow-sm shadow-slate-200/50">
      <div className="flex items-center gap-8">
        <span className="font-headline font-bold text-primary tracking-tighter text-xl">Aetheris Clinical</span>
        <nav className="hidden md:flex items-center gap-6">
          <a className="text-slate-500 hover:text-primary font-headline text-sm tracking-tight transition-colors" href="#">Tổng quan</a>
          <a className="text-slate-500 hover:text-primary font-headline text-sm tracking-tight transition-colors" href="#">Hồ sơ bệnh nhân</a>
          <a className="text-slate-500 hover:text-primary font-headline text-sm tracking-tight transition-colors" href="#">Báo cáo xét nghiệm</a>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            className="pl-10 pr-4 py-1.5 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-primary w-64 outline-none" 
            placeholder="Tìm mã chẩn đoán..." 
            type="text"
          />
        </div>
        
        <button className="p-2 text-slate-500 hover:bg-slate-50 transition-colors rounded-full relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-tertiary rounded-full"></span>
        </button>
        
        <button className="p-2 text-slate-500 hover:bg-slate-50 transition-colors rounded-full">
          <Settings size={20} />
        </button>

        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="text-right hidden lg:block">
            <p className="text-xs font-bold text-slate-900">Dr. Julian Vane</p>
            <p className="text-[10px] text-slate-500 font-medium">Trưởng nhóm lâm sàng</p>
          </div>
          <img 
            alt="Dr. Julian Vane" 
            className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-container/20" 
            src="https://picsum.photos/seed/doctor/100/100"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
}
